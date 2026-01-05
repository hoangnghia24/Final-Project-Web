package com.vn.mxh.service;

import java.util.List;

import org.springframework.stereotype.Service;
import java.util.stream.Collectors;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.dto.InfoUserForAdmin;
import com.vn.mxh.domain.dto.UpdateProfileInput;
import com.vn.mxh.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean isUsernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean isEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User getUserByUsername(String username) {
        return this.userRepository.findByUsername(username).orElse(null);
    }

    // public List<InfoUserForAdmin> getAllUsers() {
    // List<InfoUserForAdmin> infoUserForAdmins = this.getAllUsers().stream()
    // .map(user -> new InfoUserForAdmin(
    // user.id(),
    // user.fullName(),
    // user.email(),
    // user.fullName(),
    // user.role()))
    // .toList();
    // return infoUserForAdmins;
    // }

    public List<InfoUserForAdmin> getAllUsers() {
        List<User> users = this.userRepository.findAll();

        return users.stream().map(user -> new InfoUserForAdmin(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().toString(),
                user.getAvatarUrl(),
                user.getBio(),
                (user.getCreatedAt() != null) ? user.getCreatedAt().toString() : "")).collect(Collectors.toList());
    }

    public User updateUserAvatar(String username, String avatarUrl) {
        User user = this.userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            user.setAvatarUrl(avatarUrl);
            return this.userRepository.save(user);
        }
        return null;
    }

    // Trong file UserService.java

    public User updateUserProfile(String username, UpdateProfileInput input) {
        User user = getUserByUsername(username);
        if (user == null) {
            throw new RuntimeException("Người dùng không tồn tại!");
        }

        // --- SỬA CÁC DÒNG NÀY (Bỏ chữ 'get') ---

        if (input.fullName() != null && !input.fullName().isEmpty()) {
            user.setFullName(input.fullName());
        }

        if (input.bio() != null) {
            user.setBio(input.bio());
        }

        if (input.avatarUrl() != null && !input.avatarUrl().isEmpty()) {
            user.setAvatarUrl(input.avatarUrl());
        }
        // ----------------------------------------

        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        // Tìm trong DB, nếu không thấy thì trả về null (để Frontend xử lý lỗi)
        return userRepository.findById(id).orElse(null);
    }
}
