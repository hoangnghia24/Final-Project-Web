package com.vn.mxh.service;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.util.stream.Collectors;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.dto.InfoUserForAdmin;
import com.vn.mxh.domain.dto.UpdateProfileInput;
import com.vn.mxh.repository.CommentRepository;
import com.vn.mxh.repository.FriendshipRepository;
import com.vn.mxh.repository.LikeRepository;
import com.vn.mxh.repository.MessageRepository;
import com.vn.mxh.repository.NotificationRepository;
import com.vn.mxh.repository.PostRepository;
import com.vn.mxh.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PostRepository postRepository; // Thêm
    private final MessageRepository messageRepository;
    private final LikeRepository likeRepository; // Mới
    private final CommentRepository commentRepository; // Mới
    private final FriendshipRepository friendshipRepository;
    private final NotificationRepository notificationRepository; // Mới

    public UserService(UserRepository userRepository,
            PostRepository postRepository,
            MessageRepository messageRepository,
            LikeRepository likeRepository,
            CommentRepository commentRepository,
            FriendshipRepository friendshipRepository,
            NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.messageRepository = messageRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.friendshipRepository = friendshipRepository;
        this.notificationRepository = notificationRepository;
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

    @Transactional
    public void deleteAccount(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("Người dùng không tồn tại");
        }

        // 1. Ẩn Like & Comment trước (Dữ liệu phụ)
        likeRepository.softDeleteLikesByUserId(userId);
        commentRepository.softDeleteCommentsByUserId(userId);

        // 2. Ẩn Bạn bè & Thông báo
        friendshipRepository.softDeleteFriendshipsByUserId(userId);
        notificationRepository.softDeleteNotificationsByUserId(userId);

        // 3. Ẩn Bài viết & Tin nhắn (Dữ liệu chính)
        postRepository.softDeletePostsByUserId(userId);
        messageRepository.softDeleteMessagesBySenderId(userId);

        // 4. Cuối cùng: Ẩn User
        userRepository.softDeleteUser(userId);
    }
}
