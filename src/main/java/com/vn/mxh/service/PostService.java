// src/main/java/com/vn/mxh/service/PostService.java
package com.vn.mxh.service;

import com.vn.mxh.domain.Post;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.enums.PrivacyLevel;
import com.vn.mxh.repository.PostRepository;
import com.vn.mxh.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PostService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    public Post createPost(String content, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + username));

        Post post = Post.builder()
                .content(content)
                .user(user)
                .privacyLevel(PrivacyLevel.PUBLIC)
                .build();

        return postRepository.save(post);
    }
}