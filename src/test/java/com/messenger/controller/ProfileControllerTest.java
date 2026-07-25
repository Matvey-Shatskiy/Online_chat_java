package com.messenger.controller;

import com.messenger.model.User;
import com.messenger.repository.UserRepository;
import com.messenger.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    @DisplayName("Доступ к /profile/me без токена запрещен")
    void shouldBlockAccessWithoutToken() throws Exception {
        mockMvc.perform(get("/profile/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Успешное получение профиля с валидным JWT токеном")
    void shouldReturnProfileWithValidToken() throws Exception {
        User user = new User();
        user.setEmail("profiletest@example.com");
        user.setUsername("profiletest");
        user.setPasswordHash("hashed_password");
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUuid());

        mockMvc.perform(get("/profile/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uuid").value(user.getUuid()))
                .andExpect(jsonPath("$.email").value("profiletest@example.com"))
                .andExpect(jsonPath("$.username").value("profiletest"));
    }
}