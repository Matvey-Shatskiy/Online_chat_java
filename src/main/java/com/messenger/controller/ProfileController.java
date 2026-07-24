package com.messenger.controller;

import com.messenger.model.User;
import com.messenger.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;

    private static final String UPLOAD_DIR = "uploads/";

    @GetMapping("/{uuid}")
    public ResponseEntity<User> getProfile(@PathVariable String uuid) {
        return userRepository.findById(uuid)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<?> updateProfile(@PathVariable String uuid,
                                           @RequestBody User updatedUser) {
        Optional<User> userOpt = userRepository.findById(uuid);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        if (updatedUser.getUsername() != null && !updatedUser.getUsername().isBlank()) {
            user.setUsername(updatedUser.getUsername());
        }
        if (updatedUser.getBio() != null) {
            user.setBio(updatedUser.getBio());
        }

        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/{uuid}/upload-image")
    public ResponseEntity<?> uploadImage(@PathVariable String uuid,
                                         @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Файл пустой");
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = uuid + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(
                    file.getInputStream(),
                    filePath,
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING
            );

            Optional<User> userOpt = userRepository.findById(uuid);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setUserImage("/uploads/" + fileName);
                userRepository.save(user);

                return ResponseEntity.ok()
                        .body("Изображение успешно загружено: " + user.getUserImage());
            }

            return ResponseEntity.notFound().build();

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("Ошибка при загрузке файла: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userRepository.findByUsernameContainingIgnoreCase(query));
    }
}