package com.vn.mxh.controller;

import com.vn.mxh.domain.Notification;
import com.vn.mxh.domain.User;
import com.vn.mxh.repository.NotificationRepository;
import com.vn.mxh.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List; // QUAN TRỌNG: Phải có dòng này để hết lỗi ClassNotFound List

@Controller
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // Lấy danh sách thông báo của người đang đăng nhập
    @QueryMapping
    public List<Notification> getMyNotifications(Principal principal) {
        if (principal == null)
            return null;
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // Đánh dấu 1 thông báo là đã đọc
    @MutationMapping
    public Boolean markAsRead(@Argument Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true); // Đảm bảo trong Notification Entity bạn đặt tên là setRead hoặc setIsRead
            notificationRepository.save(n);
        });
        return true;
    }
}