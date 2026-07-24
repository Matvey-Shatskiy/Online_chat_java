package com.messenger.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.messenger.model.Message;
import com.messenger.model.User;
import com.messenger.repository.MessageRepository;
import com.messenger.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
        String query = session.getUri().getQuery();
        String userUuid = null;
        if (query != null) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=");
                if (pair.length == 2 && pair[0].equals("user_uuid")) {
                    userUuid = pair[1];
                    break;
                }
            }
        }
        if (userUuid != null && !userUuid.isEmpty()) {
            activeConnections.put(userUuid, session);
            userRepository.findById(userUuid).ifPresent(user -> {
                user.setLastSeenAt(LocalDateTime.now());
                userRepository.save(user);
            });
            System.out.println("Новое подключение: " + userUuid + ". Всего: " + activeConnections.size());
        } else {
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage textMessage) throws Exception {
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
        if (senderSession != null && senderSession.isOpen()) {
            senderSession.sendMessage(new TextMessage(responseJson));
        }

        System.out.println("Сообщение от " + sender.getUsername() + " к " + receiver.getUsername());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        activeConnections.entrySet().removeIf(entry -> entry.getValue().equals(session));
        System.out.println("Отключился. Осталось: " + activeConnections.size());
    }
}