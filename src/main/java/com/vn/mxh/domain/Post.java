package com.vn.mxh.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import com.vn.mxh.domain.enums.PrivacyLevel;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String imageUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Quan hệ N-1: Bài viết thuộc về 1 User
    // FetchType.LAZY là bắt buộc để GraphQL Resolver xử lý hiệu quả
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Comment> comments;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Like> likes;

    @Builder.Default()
    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_level")
    private PrivacyLevel privacyLevel = PrivacyLevel.PUBLIC; // Mặc định là công khai
}