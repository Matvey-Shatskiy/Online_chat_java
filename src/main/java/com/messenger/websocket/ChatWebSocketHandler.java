package com.messenger.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.messenger.model.Message;
import com.messenger.model.User;
import com.messenger.repository.MessageRepository;
import com.messenger.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Map<String, WebSocketSession> activeConnections = new ConcurrentHashMap<>();

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userUuid = getUserUuidFromSession(session);
        if (userUuid != null && !userUuid.isEmpty()) {
            activeConnections.put(userUuid, session);

            updateUserStatus(userUuid, true);

            broadcastStatusUpdate(userUuid, true);

            System.out.println("Новое подключение: " + userUuid + ". Всего: " + activeConnections.size());
        } else {
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userUuid = getUserUuidFromSession(session);
        if (userUuid != null) {
            boolean removed = activeConnections.remove(userUuid, session);

            if (removed) {
                updateUserStatus(userUuid, false);

                broadcastStatusUpdate(userUuid, false);
            }
        }
        System.out.println("Отключился: " + userUuid + ". Осталось: " + activeConnections.size());
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, TextMessage textMessage) throws Exception {
        Map<String, String> data = objectMapper.readValue(textMessage.getPayload(), Map.class);

        String senderUuid = data.get("senderUuid");
        String receiverUuid = data.get("receiverUuid");
        String text = data.get("text");

        if (senderUuid == null || receiverUuid == null || text == null || text.isBlank()) {
            return;
        }

        User sender = userRepository.findById(senderUuid).orElseThrow();
        User receiver = userRepository.findById(receiverUuid).orElseThrow();

        Message msg = new Message();
        msg.setText(text);
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setTimestamp(LocalDateTime.now());

        messageRepository.save(msg);

        Map<String, Object> response = new ConcurrentHashMap<>();
        response.put("type", "CHAT_MESSAGE");
        response.put("senderUuid", sender.getUuid());
        response.put("senderUsername", sender.getUsername());
        response.put("receiverUuid", receiver.getUuid());
        response.put("text", msg.getText());
        response.put("timestamp", msg.getTimestamp());

        String responseJson = objectMapper.writeValueAsString(response);

        WebSocketSession receiverSession = activeConnections.get(receiverUuid);
        WebSocketSession senderSession = activeConnections.get(senderUuid);

        if (receiverSession != null && receiverSession.isOpen()) {
            receiverSession.sendMessage(new TextMessage(responseJson));
        }
        if (senderSession != null && senderSession.isOpen() && !senderUuid.equals(receiverUuid)) {
            senderSession.sendMessage(new TextMessage(responseJson));
        }
    }

    private void updateUserStatus(String userUuid, boolean isOnline) {
        userRepository.findById(userUuid).ifPresent(user -> {
            user.setOnline(isOnline);
            user.setLastSeenAt(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    private void broadcastStatusUpdate(String userUuid, boolean isOnline) {
        try {
            Map<String, Object> statusMsg = Map.of(
                    "type", "USER_STATUS",
                    "uuid", userUuid,
                    "isOnline", isOnline,
                    "lastSeenAt", LocalDateTime.now().toString()
            );
            String json = objectMapper.writeValueAsString(statusMsg);

            for (WebSocketSession s : activeConnections.values()) {
                if (s.isOpen()) {
                    s.sendMessage(new TextMessage(json));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String getUserUuidFromSession(WebSocketSession session) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query != null) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=");
                if (pair.length == 2 && "user_uuid".equals(pair[0])) {
                    return pair[1];
                }
            }
        }
        return null;
    }
}