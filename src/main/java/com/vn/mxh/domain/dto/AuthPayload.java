package com.vn.mxh.domain.dto;

import com.vn.mxh.domain.User;

public record AuthPayload(
        String token,
        User user) {
}