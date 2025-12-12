package com.vn.mxh.domain.dto;

import com.vn.mxh.domain.enums.Role;

public record UserResponse(
                Long id,
                String username,
                String email,
                String fullName,
                String avatarUrl,
                Role role // Để frontend biết user này là ADMIN hay USER
) {
}