package com.vn.mxh.domain.dto;

import com.vn.mxh.domain.enums.PrivacyLevel;

public record CreatePostInput(
                String content,
                String mediaUrl,
                String mediaType, // Bên GraphQL là Enum, bên Java nhận String là ổn
                String feeling,
                PrivacyLevel privacyLevel) {
}