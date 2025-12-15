package com.vn.mxh.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.annotation.Secured;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.vn.mxh.domain.User;
import com.vn.mxh.domain.dto.RegisterInput;
import com.vn.mxh.domain.enums.Role;
import com.vn.mxh.exception.DuplicateRecordException;
import com.vn.mxh.repository.UserRepository;

@Controller
public class AuthController {
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/login")
    public String login() {
        return "/auth/login";
    }

    @GetMapping("/register")
    public String register() {
        return "/auth/register";
    }

    @QueryMapping
    public List<User> getAllUser() {
        return userRepository.findAll();
    }

    @MutationMapping
    public User createRegister(@Argument("input") RegisterInput input) {

        // 1. Kiểm tra Username tồn tại
        if (userRepository.existsByUsername(input.username())) {
            throw new DuplicateRecordException("Tên đăng nhập '" + input.username() + "' đã được sử dụng.");
        }

        // 2. Kiểm tra Email tồn tại
        if (userRepository.existsByEmail(input.email())) {
            throw new DuplicateRecordException("Email '" + input.email() + "' đã được đăng ký.");
        }

        // 3. Nếu không trùng thì lưu
        User newUser = new User();
        newUser.setUsername(input.username());
        newUser.setPasswordHash(input.password());
        newUser.setEmail(input.email());
        newUser.setFullName(input.fullName());
        newUser.setRole(Role.USER); // Đã thêm import Role

        return userRepository.save(newUser);
    }
}
