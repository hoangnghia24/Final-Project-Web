package com.vn.mxh.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthController {

    // Khi người dùng gõ /register, hàm này chạy và mở file register.html
    @GetMapping("/register")
    public String showRegisterPage() {
        return "auth/register"; // Trỏ đến file src/main/resources/templates/register.html
    }

    // Tương tự cho trang login
    @GetMapping("/login")
    public String showLoginPage() {
        return "auth/login";
    }
}