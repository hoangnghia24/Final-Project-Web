package com.vn.mxh.domain.dto;

public record RegisterInput(
        String username,
        String password,
        String email,
        String fullName) {

}
