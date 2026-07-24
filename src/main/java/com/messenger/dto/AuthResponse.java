package com.messenger.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String uuid;
    private String username;

    public AuthResponse(String token, String uuid, String username) {
        this.token = token;
        this.uuid = uuid;
        this.username = username;
    }
}