package com.vn.mxh.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Username không được để trống") @Size(min = 3, max = 50, message = "Username phải từ 3 đến 50 ký tự") String username,

        @NotBlank(message = "Email không được để trống") @Email(message = "Email không đúng định dạng") String email,

        @NotBlank(message = "Mật khẩu không được để trống") @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự") String password,

        String fullName) {
}