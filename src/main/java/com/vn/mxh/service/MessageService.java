package com.vn.mxh.service;

import com.vn.mxh.domain.Message;
import com.vn.mxh.domain.User;
import com.vn.mxh.repository.MessageRepository;
import com.vn.mxh.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    /**
     * Lưu tin nhắn mới
     */
    @Transactional
    public Message saveMessage(Long senderId, Long receiverId, String content) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .isRead(false)
                .build();

        return messageRepository.save(message);
    }

    /**
     * Lấy toàn bộ tin nhắn giữa 2 user
     */
    public List<Message> getConversation(Long userId1, Long userId2) {
        return messageRepository.findConversationBetweenUsers(userId1, userId2);
    }

    /**
     * Lấy danh sách người đã chat với user
     */
    public List<User> getConversationPartners(Long userId) {
        return messageRepository.findConversationPartners(userId);
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    @Transactional
    public void markAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message != null) {
            message.setIsRead(true);
            messageRepository.save(message);
        }
    }

    /**
     * Đếm số tin nhắn chưa đọc
     */
    public long countUnreadMessages(Long userId) {
        return messageRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    @Transactional
    public Message retractMessage(Long messageId, Long currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Tin nhắn không tồn tại"));

        if (!message.getSender().getId().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền thu hồi tin nhắn này!");
        }

        message.setIsRetracted(true);
        return messageRepository.save(message);
    }
}
