package com.messenger.controller;

import com.messenger.model.Message;
import com.messenger.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository repository;

    @GetMapping("/{user1}/{user2}")
    public List<Message> getHistory(
            @PathVariable String user1,
            @PathVariable String user2) {

        return repository.getChat(user1, user2);
    }
}