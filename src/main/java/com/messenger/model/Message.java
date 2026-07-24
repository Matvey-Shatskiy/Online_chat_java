package com.messenger.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "history")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "TEXT")
    private String uuid;

    @Column(nullable = false)
    private String text;

    @ManyToOne
    @JoinColumn(name = "sender_uuid", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_uuid", nullable = false)
    private User receiver;

    private LocalDateTime timestamp = LocalDateTime.now();
}