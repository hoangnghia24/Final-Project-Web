package com.vn.mxh.service;

import java.util.List;

import org.springframework.stereotype.Service;
import java.util.stream.Collectors;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.dto.InfoUserForAdmin;
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
    //     List<InfoUserForAdmin> infoUserForAdmins = this.getAllUsers().stream()
    //             .map(user -> new InfoUserForAdmin(
    //                     user.id(),
    //                     user.fullName(),
    //                     user.email(),
    //                     user.fullName(),
    //                     user.role()))
    //             .toList();
    //     return infoUserForAdmins;
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
                (user.getCreatedAt() != null) ? user.getCreatedAt().toString() : ""
        )).collect(Collectors.toList());
    }

    public User updateUserAvatar(String username, String avatarUrl) {
        User user = this.userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            user.setAvatarUrl(avatarUrl);
            return this.userRepository.save(user);
        }
        return null;
    }

}
