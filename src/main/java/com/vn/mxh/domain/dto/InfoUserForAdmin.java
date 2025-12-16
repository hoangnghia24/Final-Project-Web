package com.vn.mxh.domain.dto;

public record InfoUserForAdmin(
        Long id,
        String username,
        String email,
        String fullName,
        String role) {
}
