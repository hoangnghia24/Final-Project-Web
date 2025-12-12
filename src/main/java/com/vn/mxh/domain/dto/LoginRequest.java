package com.vn.mxh.domain.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
                @NotBlank(message = "Vui lòng nhập username hoặc email") String username,

                @NotBlank(message = "Vui lòng nhập mật khẩu") String password) {
}