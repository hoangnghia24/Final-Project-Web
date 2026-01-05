package com.vn.mxh.domain.dto;

public record UpdateProfileInput(
        String fullName,
        String bio,
        String avatarUrl) {
}