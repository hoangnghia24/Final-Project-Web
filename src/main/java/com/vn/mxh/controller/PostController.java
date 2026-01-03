package com.vn.mxh.controller;

import com.vn.mxh.domain.Post;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.dto.CreatePostInput;
import com.vn.mxh.domain.enums.PrivacyLevel;
import com.vn.mxh.repository.PostRepository;
import com.vn.mxh.repository.UserRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate; // Import WS
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate; // Dùng để gửi Socket

    public PostController(PostRepository postRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // ==========================================
    // 1. TẠO BÀI VIẾT + REALTIME SOCKET
    // ==========================================
    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Post createPost(@Argument("input") CreatePostInput input) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PrivacyLevel privacy = input.privacyLevel() != null ? input.privacyLevel() : PrivacyLevel.PUBLIC;

        Post newPost = Post.builder()
                .content(input.content())
                .mediaUrl(input.mediaUrl()) // URL file
                .mediaType(input.mediaType()) // IMAGE hoặc VIDEO
                .feeling(input.feeling()) // Cảm xúc
                .privacyLevel(privacy)
                .user(currentUser)
                .likeCount(0)
                .commentCount(0)
                .build();

        Post savedPost = postRepository.save(newPost);

        // Gửi bài viết mới đến tất cả client đang nghe topic này
        messagingTemplate.convertAndSend("/topic/new-posts", savedPost);

        return savedPost;
    }

    @QueryMapping
    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }
}