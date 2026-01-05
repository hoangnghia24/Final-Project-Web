package com.vn.mxh.controller;

import com.vn.mxh.domain.Friendship;
import com.vn.mxh.domain.Message;
import com.vn.mxh.domain.User;
import com.vn.mxh.service.MessageService;

import com.vn.mxh.service.UserService;
import com.vn.mxh.repository.FriendshipRepository;
import com.vn.mxh.domain.Friendship;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.stream.Collectors;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Controller
public class ChatController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;
    private final FriendshipRepository friendshipRepository;

    public ChatController(MessageService messageService,
            SimpMessagingTemplate messagingTemplate,
            UserService userService,
            FriendshipRepository friendshipRepository) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
        this.userService = userService;
        this.friendshipRepository = friendshipRepository;
    }

    /**
     * WebSocket: Nhận tin nhắn từ client và gửi đến người nhận
     * Client sẽ gửi đến: /app/chat
     */
    @MessageMapping("/chat")
    @Transactional
    public void sendMessage(@Payload ChatMessage chatMessage) {
        try {
            // 1. Lưu tin nhắn vào Database (Giữ nguyên)
            Message savedMessage = messageService.saveMessage(
                    chatMessage.getSenderId(),
                    chatMessage.getReceiverId(),
                    chatMessage.getContent());

            // 2. Chuẩn bị dữ liệu trả về (Giữ nguyên)
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedMessage.getId());
            response.put("senderId", savedMessage.getSender().getId());
            response.put("senderName", savedMessage.getSender().getFullName());
            String avatar = savedMessage.getSender().getAvatarUrl();
            if (avatar == null || avatar.isEmpty()) {
                avatar = "https://api.dicebear.com/9.x/avataaars/svg?seed=" + savedMessage.getSender().getUsername();
            }
            response.put("senderAvatar", avatar);
            response.put("receiverId", savedMessage.getReceiver().getId());
            response.put("content", savedMessage.getContent());
            response.put("sentAt", savedMessage.getSentAt().toString());
            response.put("isRead", savedMessage.getIsRead());

            // --- ĐOẠN SỬA ĐỔI QUAN TRỌNG ---

            // 3. Tìm thông tin người nhận để lấy Username
            User receiver = userService.getUserById(chatMessage.getReceiverId());

            if (receiver != null) {
                // 4. Gửi tin nhắn tới Username (Thay vì ID)
                // Spring Security quản lý session theo Username
                messagingTemplate.convertAndSendToUser(
                        receiver.getUsername(), // <--- Dùng Username
                        "/queue/messages", // <--- Kênh chuẩn
                        response);
                System.out.println("✅ Đã gửi socket tới user: " + receiver.getUsername());
            } else {
                System.err.println("❌ Không tìm thấy người nhận với ID: " + chatMessage.getReceiverId());
            }

            // -------------------------------

        } catch (Exception e) {
            System.err.println("Lỗi gửi tin nhắn: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * REST API: Lấy lịch sử chat giữa 2 user
     */
    @GetMapping("/api/messages/conversation")
    @ResponseBody
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
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
    public Map<String, Object> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> resp = new HashMap<>();
        try {
            if (file == null || file.isEmpty()) {
                resp.put("success", false);
                resp.put("error", "File rỗng");
                return resp;
            }

            // 1. Tạo tên file
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

            // 2. Định nghĩa thư mục lưu (Sử dụng Path của Java NIO để an toàn hơn)
            // Thư mục này sẽ nằm ngay tại root của project
            Path uploadDir = Paths.get("uploads", "chat-images");

            // 3. Tạo thư mục nếu chưa tồn tại
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // 4. Tạo đường dẫn TUYỆT ĐỐI đến file đích
            // .toAbsolutePath() là chìa khóa để sửa lỗi "Temp folder"
            File dest = uploadDir.resolve(fileName).toAbsolutePath().toFile();

            // 5. Lưu file
            System.out.println(">>> Đang lưu file vào: " + dest.getAbsolutePath()); // In ra để kiểm tra
            file.transferTo(dest);

            // 6. Trả về URL để hiển thị
            resp.put("success", true);
            resp.put("url", "/uploads/chat-images/" + fileName);
            return resp;

        } catch (Exception e) {
            e.printStackTrace(); // In lỗi đầy đủ ra console server
            resp.put("success", false);
            resp.put("error", "Lỗi Server: " + e.getMessage());
            return resp;
        }
    }

    /**
     * DTO cho tin nhắn từ client
     */
    public static class ChatMessage {
        private Long senderId;
        private Long receiverId;
        private String content;

        public Long getSenderId() {
            return senderId;
        }

        public void setSenderId(Long senderId) {
            this.senderId = senderId;
        }

        public Long getReceiverId() {
            return receiverId;
        }

        public void setReceiverId(Long receiverId) {
            this.receiverId = receiverId;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    // Thêm vào ChatController
    @GetMapping("/api/messages/search-friends")
    @ResponseBody
    public List<Map<String, Object>> searchFriendsForChat(@RequestParam String query) {
        // 1. Kiểm tra đầu vào
        if (query == null || query.trim().isEmpty()) {
            return new ArrayList<>();
        }

        String keyword = query.toLowerCase().trim();

        // 2. Lấy User hiện tại
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userService.getUserByUsername(currentUsername);

        // 3. Lấy TOÀN BỘ danh sách bạn bè (Status = ACCEPTED)
        // Hàm này đã có sẵn trong FriendshipRepository gốc của bạn
        List<Friendship> allFriends = friendshipRepository.findAllAcceptedFriendships(currentUser.getId());

        // 4. Lọc bằng Java (An toàn hơn SQL)
        return allFriends.stream()
                // Lấy ra đối tượng User bạn bè (không phải mình)
                .map(f -> f.getRequester().getId().equals(currentUser.getId()) ? f.getAddressee() : f.getRequester())
                // Kiểm tra điều kiện tìm kiếm
                .filter(friend -> {
                    String name = friend.getFullName() != null ? friend.getFullName().toLowerCase() : "";
                    String username = friend.getUsername() != null ? friend.getUsername().toLowerCase() : "";
                    // Tìm trong cả tên hiển thị VÀ tên đăng nhập
                    return name.contains(keyword) || username.contains(keyword);
                })
                // Chuyển đổi sang Map để trả về JSON
                .map(friend -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", friend.getId());
                    map.put("fullName", friend.getFullName() != null ? friend.getFullName() : friend.getUsername()); // Nếu
                                                                                                                     // không
                                                                                                                     // có
                                                                                                                     // tên
                                                                                                                     // thật
                                                                                                                     // thì
                                                                                                                     // hiện
                                                                                                                     // username
                    map.put("username", friend.getUsername());

                    // Xử lý avatar rỗng
                    String avatar = friend.getAvatarUrl();
                    if (avatar == null || avatar.isEmpty()) {
                        avatar = "https://api.dicebear.com/9.x/avataaars/svg?seed=" + friend.getUsername();
                    }
                    map.put("avatarUrl", avatar);

                    return map;
                })
                .collect(Collectors.toList());
    }
}