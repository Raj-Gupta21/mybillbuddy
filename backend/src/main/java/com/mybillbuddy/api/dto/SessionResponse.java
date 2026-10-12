package com.mybillbuddy.api.dto;

public record SessionResponse(String username, String businessName, long expiresIn, String csrfToken) { }
