package com.messenger;

import com.messenger.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MessengerApplication {

    public static void main(String[] args) {
        SpringApplication.run(MessengerApplication.class, args);
        System.out.println(" Messenger Application started successfully!");
    }

    // При старте приложения сбрасываем у всех статус online в false
    @Bean
    public CommandLineRunner resetUserStatuses(UserRepository userRepository) {
        return args -> {
            userRepository.findAll().forEach(user -> {
                user.setOnline(false);
                userRepository.save(user);
            });
        };
    }
}