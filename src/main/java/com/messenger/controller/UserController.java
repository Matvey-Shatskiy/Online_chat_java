package com.messenger.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.messenger.model.User;
import com.messenger.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<UserDto>> getAllUsers(
            @RequestParam(value = "currentUuid", required = false) String currentUuid,
            @PageableDefault(size = 20, sort = "username") Pageable pageable) {

        Page<User> usersPage;

        if (currentUuid != null && !currentUuid.isBlank()) {
            usersPage = userRepository.findByUuidNot(currentUuid, pageable);
        } else {
            usersPage = userRepository.findAll(pageable);
        }
        Page<UserDto> dtosPage = usersPage.map(this::mapToDto);

        return ResponseEntity.ok(dtosPage);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserDto>> searchUsers(
            @RequestParam("query") String query,
            @PageableDefault(size = 20, sort = "username") Pageable pageable) {

        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(Page.empty());
        }

        Page<User> usersPage = userRepository.findByUsernameContainingIgnoreCase(query.trim(), pageable);
        Page<UserDto> dtosPage = usersPage.map(this::mapToDto);

        return ResponseEntity.ok(dtosPage);
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