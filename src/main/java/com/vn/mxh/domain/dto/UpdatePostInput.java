package com.vn.mxh.domain.dto;

import com.vn.mxh.domain.enums.PrivacyLevel;

public record UpdatePostInput(
        String id,
        String content,
        String mediaUrl,
        String mediaType,
        String feeling,
        PrivacyLevel privacyLevel) {
}