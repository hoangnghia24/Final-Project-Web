package com.vn.mxh.controller;

import java.util.List;
import com.vn.mxh.service.UserService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.vn.mxh.domain.User;
import com.vn.mxh.domain.dto.RegisterInput;
import com.vn.mxh.domain.enums.Role;
import com.vn.mxh.exception.DuplicateRecordException;
import com.vn.mxh.repository.UserRepository;

@Controller
public class AuthController {

    private final UserService userService;

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, UserService userService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
    }

    @GetMapping("/login")
    public String login() {
        return "/auth/login";
    }

    @GetMapping("/register")
    public String register() {
        return "/auth/register";
    }

    @QueryMapping
    public User getUserLogin(@Argument String username, @Argument String password) {
        User userLogin = this.userService.getUserByUsername(username);
        if (userLogin == null || !this.passwordEncoder.matches(password, userLogin.getPasswordHash())) {
            throw new DuplicateRecordException("Tên đăng nhập hoặc mật khẩu không đúng.");
        }
        return userLogin;
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
        String hashPassword = this.passwordEncoder.encode(input.password());
        newUser.setPasswordHash(hashPassword);
        newUser.setEmail(input.email());
        newUser.setFullName(input.fullName());
        newUser.setRole(Role.USER);
        return userRepository.save(newUser);
    }
}
