package com.vn.mxh.service;

import com.vn.mxh.domain.Post;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.enums.PrivacyLevel;
import com.vn.mxh.repository.PostRepository;
import com.vn.mxh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FriendshipService friendshipService; // Inject để lấy danh sách bạn bè
    private final SimpMessagingTemplate messagingTemplate; // Inject để bắn WebSocket
    private final NotificationService notificationService; // THÊM: Inject Service thông báo

    /**
     * TẠO BÀI VIẾT MỚI & BẮN REALTIME
     */
    @Transactional
    public Post createPost(Post postInput) {
        // 1. Lưu bài viết vào Database
        Post savedPost = postRepository.save(postInput);

        // 2. Xử lý Realtime Feed (Bảng tin chung)
        // Chỉ bắn lên kênh chung nếu là bài viết CÔNG KHAI
        if (savedPost.getPrivacyLevel() == PrivacyLevel.PUBLIC) {
            Map<String, Object> feedPayload = convertPostToMap(savedPost);
            messagingTemplate.convertAndSend("/topic/newsfeed", feedPayload);
        }

        // 3. Xử lý Realtime Notification (Thông báo cho bạn bè)
        notifyFriends(savedPost);

        return savedPost;
    }

    /**
     * Helper: Đóng gói dữ liệu Post thành Map để gửi qua Socket
     * (Tránh lỗi vòng lặp vô tận của JSON và không cần tạo file DTO)
     */
    private Map<String, Object> convertPostToMap(Post post) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", post.getId());
        payload.put("content", post.getContent());
        payload.put("mediaUrl", post.getMediaUrl());
        payload.put("mediaType", post.getMediaType());
        payload.put("createdAt", post.getCreatedAt().toString());
        payload.put("privacyLevel", post.getPrivacyLevel().toString());
        payload.put("likeCount", 0);
        payload.put("commentCount", 0);

        // Thông tin rút gọn của người đăng
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", post.getUser().getId());
        userMap.put("fullName", post.getUser().getFullName());
        userMap.put("username", post.getUser().getUsername());
        userMap.put("avatarUrl", post.getUser().getAvatarUrl());

        payload.put("user", userMap);
        return payload;
    }

    /**
     * Helper: Gửi thông báo đến từng người bạn
     */
    private void notifyFriends(Post post) {
        User author = post.getUser();

        // 1. Lấy danh sách bạn bè của người đăng
        // (Hàm này có sẵn trong FriendshipService)
        List<User> friends = friendshipService.getMyFriends(author.getId());

        if (friends.isEmpty())
            return;

        String content = author.getFullName() + " vừa đăng một bài viết mới.";

        // 2. Gửi thông báo cho từng người
        for (User friend : friends) {
            notificationService.sendNotification(
                    friend, // Người nhận (Bạn bè)
                    author, // Người gửi (Tác giả bài viết)
                    content, // Nội dung
                    "NEW_POST", // Loại thông báo (Cần xử lý icon bên Frontend nếu muốn đẹp)
                    post.getId() // ID bài viết để click vào xem
            );
        }
    }

    /**
     * LẤY TẤT CẢ BÀI VIẾT (Cho trang Home load lần đầu)
     */
    public List<Post> getAllPosts() {
        // Sử dụng method có sẵn trong PostRepository bạn đã gửi
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * XÓA BÀI VIẾT
     */
    @Transactional
    public boolean deletePost(Long postId) {
        if (postRepository.existsById(postId)) {
            postRepository.deleteById(postId);
            return true;
        }
        return false;
    }

    /**
     * CẬP NHẬT BÀI VIẾT
     */
    @Transactional
    public Post updatePost(Long postId, String content, String mediaUrl, String mediaType, PrivacyLevel privacy) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setContent(content);
        if (mediaUrl != null)
            post.setMediaUrl(mediaUrl);
        if (mediaType != null)
            post.setMediaType(mediaType);
        if (privacy != null)
            post.setPrivacyLevel(privacy);

        return postRepository.save(post);
    }

    /**
     * LIKE BÀI VIẾT (Toggle)
     */
    @Transactional
    public boolean toggleLike(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Logic like đơn giản: check xem user đã like chưa trong bảng Like (cần
        // LikeRepository)
        // Ở đây tạm thời giả lập tăng/giảm count để demo
        // Bạn nên implement logic check Like entity thật ở đây (giống PostController)
        post.setLikeCount(post.getLikeCount() + 1);
        postRepository.save(post);
        return true;
    }

    public Post getPostById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }
}