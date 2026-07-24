package com.messenger.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WsMessage {
    private String type;
    private String senderUuid;
    private String senderUsername;
    private String receiverUuid;
    private String text;
    private LocalDateTime timestamp;
}