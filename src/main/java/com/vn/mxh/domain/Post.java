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

    // --- CẬP NHẬT MỚI: Hỗ trợ Media & Cảm xúc ---
    @Column(columnDefinition = "TEXT")
    private String mediaUrl; // URL file ảnh/video

    private String mediaType; // "IMAGE" hoặc "VIDEO" hoặc "NONE"

    private String feeling; // "đang cảm thấy vui", "đang chúc mừng"...
    // ---------------------------------------------

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Builder.Default
    private int likeCount = 0;

    @Builder.Default
    private int commentCount = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_level")
    private PrivacyLevel privacyLevel = PrivacyLevel.PUBLIC;

    @ManyToOne(fetch = FetchType.EAGER) // Để EAGER cho tiện lấy avatar user
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Comment> comments;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Like> likes;
}