package com.messenger.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.messenger.model.User;
import com.messenger.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers(@RequestParam(value = "currentUuid", required = false) String currentUuid) {
        List<User> users = userRepository.findAll();

        List<UserDto> dtos = users.stream()
                .filter(u -> currentUuid == null || !u.getUuid().equals(currentUuid))
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam("query") String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<User> users = userRepository.findByUsernameContainingIgnoreCase(query.trim());
        List<UserDto> dtos = users.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserDto> getUserProfile(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(user -> ResponseEntity.ok(mapToDto(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    private UserDto mapToDto(User user) {
        return new UserDto(
                user.getUuid(),
                user.getUsername(),
                user.getEmail(),
                user.getUserImage(),
                user.getBio(),
                user.isOnline(),
                user.getLastSeenAt()
        );
    }

    @Data
    @AllArgsConstructor
    public static class UserDto {
        private String uuid;
        private String username;
        private String email;
        private String userImage;
        private String bio;

        @JsonProperty("isOnline")
        private boolean isOnline;

        private LocalDateTime lastSeenAt;
    }
}