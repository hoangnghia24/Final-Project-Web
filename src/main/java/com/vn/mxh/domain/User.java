package com.vn.mxh.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import com.vn.mxh.domain.enums.Role;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    // Password không expose ra GraphQL Schema
    @Column(nullable = false)
    private String passwordHash;

    private String fullName;
    
    @Column(columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Quan hệ 1-N: Một user có nhiều bài viết
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Post> posts;

    @Builder.Default()
    @Enumerated(EnumType.STRING) // Lưu chữ "USER", "ADMIN" vào database
    @Column(nullable = false)
    private Role role = Role.USER; // Mặc định khi tạo mới sẽ là USER
}