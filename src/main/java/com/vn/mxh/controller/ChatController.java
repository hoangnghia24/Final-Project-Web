package com.vn.mxh.controller;

import com.vn.mxh.domain.Message;
import com.vn.mxh.domain.User;
import com.vn.mxh.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.io.File;
import java.io.IOException;
import java.util.stream.Collectors;

@Controller
public class ChatController {
    
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    
    public ChatController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * WebSocket: Nhận tin nhắn từ client và gửi đến người nhận
     * Client sẽ gửi đến: /app/chat
     */
    @MessageMapping("/chat")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        try {
            // Lưu tin nhắn vào database
            Message savedMessage = messageService.saveMessage(
                chatMessage.getSenderId(), 
                chatMessage.getReceiverId(), 
                chatMessage.getContent()
            );
            
            // Tạo response message
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedMessage.getId());
            response.put("senderId", savedMessage.getSender().getId());
            response.put("senderName", savedMessage.getSender().getFullName());
            response.put("senderAvatar", savedMessage.getSender().getAvatarUrl());
            response.put("receiverId", savedMessage.getReceiver().getId());
            response.put("content", savedMessage.getContent());
            response.put("sentAt", savedMessage.getSentAt().toString());
            response.put("isRead", savedMessage.getIsRead());
            
            // Gửi tin nhắn đến người nhận qua WebSocket
            // Sẽ được gửi đến: /user/{receiverId}/queue/messages
            messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessage.getReceiverId()),
                "/queue/messages",
                response
            );
            
            // Gửi lại cho người gửi để confirm
            messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessage.getSenderId()),
                "/queue/messages",
                response
            );
            
        } catch (Exception e) {
            System.err.println("Error sending message: " + e.getMessage());
        }
    }
    
    /**
     * REST API: Lấy lịch sử chat giữa 2 user
     */
    @GetMapping("/api/messages/conversation")
    @ResponseBody
    public List<Map<String, Object>> getConversation(
            @RequestParam Long userId1,
            @RequestParam Long userId2) {
        
        List<Message> messages = messageService.getConversation(userId1, userId2);
        
        return messages.stream().map(msg -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", msg.getId());
            map.put("senderId", msg.getSender().getId());
            map.put("senderName", msg.getSender().getFullName());
            map.put("senderAvatar", msg.getSender().getAvatarUrl());
            map.put("receiverId", msg.getReceiver().getId());
            map.put("content", msg.getContent());
            map.put("sentAt", msg.getSentAt().toString());
            map.put("isRead", msg.getIsRead());
            return map;
        }).collect(Collectors.toList());
    }
    
    /**
     * REST API: Lấy danh sách người đã chat
     */
    @GetMapping("/api/messages/conversations")
    @ResponseBody
    public List<Map<String, Object>> getConversations(@RequestParam Long userId) {
        List<User> partners = messageService.getConversationPartners(userId);
        
        return partners.stream().map(user -> {
            // Lấy tin nhắn cuối cùng giữa 2 người
            List<Message> conversation = messageService.getConversation(userId, user.getId());
            Message lastMessage = conversation.isEmpty() ? null : conversation.get(conversation.size() - 1);
            
            // Đếm tin nhắn chưa đọc từ user này
            long unreadCount = conversation.stream()
                .filter(m -> m.getSender().getId().equals(user.getId()) && !m.getIsRead())
                .count();
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("fullName", user.getFullName());
            map.put("avatarUrl", user.getAvatarUrl());
            map.put("bio", user.getBio());
            map.put("lastMessage", lastMessage != null ? lastMessage.getContent() : null);
            map.put("lastMessageTime", lastMessage != null ? lastMessage.getSentAt() : null);
            map.put("lastMessageSenderId", lastMessage != null ? lastMessage.getSender().getId() : null);
            map.put("unreadCount", unreadCount);
            return map;
        }).collect(Collectors.toList());
    }
    
    /**
     * REST API: Đánh dấu tin nhắn đã đọc
     */
    @PostMapping("/api/messages/read")
    @ResponseBody
    public Map<String, Boolean> markAsRead(@RequestParam Long messageId) {
        messageService.markAsRead(messageId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("success", true);
        return response;
    }

    /**
     * REST API: Upload ảnh cho tin nhắn, trả về URL ảnh
     */
    @PostMapping("/api/messages/upload-image")
    @ResponseBody
    public Map<String, Object> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> resp = new HashMap<>();
        if (file == null || file.isEmpty()) {
            resp.put("success", false);
            resp.put("error", "File rỗng");
            return resp;
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            resp.put("success", false);
            resp.put("error", "Chỉ hỗ trợ định dạng ảnh");
            return resp;
        }

        // Tạo thư mục lưu ảnh: uploads/chat-images
        File dir = new File("uploads/chat-images");
        if (!dir.exists()) dir.mkdirs();

        // Tạo tên file duy nhất
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String filename = UUID.randomUUID().toString().replaceAll("-", "") + ext;
        File dest = new File(dir, filename);
        file.transferTo(dest);

        String url = "/uploads/chat-images/" + filename;
        resp.put("success", true);
        resp.put("url", url);
        return resp;
    }
    
    /**
     * DTO cho tin nhắn từ client
     */
    public static class ChatMessage {
        private Long senderId;
        private Long receiverId;
        private String content;
        
        public Long getSenderId() { return senderId; }
        public void setSenderId(Long senderId) { this.senderId = senderId; }
        
        public Long getReceiverId() { return receiverId; }
        public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
