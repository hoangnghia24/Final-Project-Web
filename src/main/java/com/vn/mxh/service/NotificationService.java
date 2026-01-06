package com.vn.mxh.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.vn.mxh.domain.Notification;
import com.vn.mxh.domain.User;
import com.vn.mxh.repository.NotificationRepository;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendNotification(User receiver, User sender, String content, String type, Long targetId) {
        if (receiver.getId().equals(sender.getId()))
            return; // Không thông báo khi tự mình làm

        Notification notif = Notification.builder()
                .user(receiver)
                .sender(sender)
                .content(content)
                .type(type)
                .targetId(targetId)
                .isRead(false)
                .build();

        notificationRepository.save(notif);

        // Gửi real-time qua WebSocket (đường dẫn cá nhân của mỗi user)
        messagingTemplate.convertAndSend("/topic/notifications/" + receiver.getId(), notif);
    }
}
