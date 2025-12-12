package com.vn.mxh.service;

import com.vn.mxh.domain.User;
import com.vn.mxh.domain.enums.Role;
import com.vn.mxh.domain.dto.RegisterRequest;
import com.vn.mxh.domain.dto.UserResponse;
import com.vn.mxh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor // Lombok tự tạo Constructor cho các biến final (Dependency Injection)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse register(RegisterRequest request) {
        // 1. Kiểm tra trùng lặp
        if (userRepository.existsByUsername(request.username())) {
            throw new RuntimeException("Username đã tồn tại!");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email đã tồn tại!");
        }

        // 2. Tạo Entity từ Request (Mapping)
        User newUser = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password())) // Mã hóa pass
                .fullName(request.fullName())
                .role(Role.USER) // Mặc định là USER thường
                .build();

        // 3. Lưu xuống Database
        User savedUser = userRepository.save(newUser);

        // 4. Trả về DTO (UserResponse)
        return new UserResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getAvatarUrl(),
                savedUser.getRole());
    }
}