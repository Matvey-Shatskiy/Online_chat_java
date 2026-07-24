package com.messenger.repository;

import com.messenger.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {

    @Query("""
            SELECT m
            FROM Message m
            WHERE
            (m.sender.uuid = :user1 AND m.receiver.uuid = :user2)
            OR
            (m.sender.uuid = :user2 AND m.receiver.uuid = :user1)
            ORDER BY m.timestamp
            """)
    List<Message> getChat(String user1, String user2);
}