package com.messenger.controller;

import com.messenger.dto.AuthRequest;
import com.messenger.dto.AuthResponse;
import com.messenger.model.User;
import com.messenger.repository.UserRepository;
import com.messenger.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public String register(@RequestBody AuthRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email уже зарегистрирован");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Имя пользователя уже занято");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
        return "Регистрация успешна";
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        Optional<User> userOpt = Optional.empty();

        // Поиск по Email или по Username (гибкий вход)
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            userOpt = userRepository.findByEmail(request.getEmail());
        } else if (request.getUsername() != null && !request.getUsername().isBlank()) {
            userOpt = userRepository.findByUsername(request.getUsername());
        }

        if (userOpt.isPresent() && passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash())) {
            User user = userOpt.get();
            String token = jwtUtil.generateToken(user.getEmail());
            AuthResponse response = new AuthResponse(token, user.getUuid(), user.getUsername());
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Неверный логин/email или пароль"));
    }
}