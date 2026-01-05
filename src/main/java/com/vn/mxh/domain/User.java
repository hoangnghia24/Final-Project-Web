package com.vn.mxh.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails; // PHẢI IMPORT CÁI NÀY

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vn.mxh.domain.enums.Role;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.hibernate.annotations.Formula;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails { // THÊM implements UserDetails

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String fullName;

    @Column(columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Formula("(SELECT count(*) FROM friendships f WHERE (f.requester_id = id OR f.addressee_id = id) AND f.status = 'ACCEPTED')")
    private Integer friendCount;

    @JsonIgnore
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Post> posts;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    // ============================================================
    // CÁC HÀM BẮT BUỘC TỪ USERDETAILS
    // ============================================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Trả về quyền hạn của user (ví dụ: ROLE_USER hoặc ROLE_ADMIN)
        // Spring Security yêu cầu quyền hạn thường có tiền tố "ROLE_"
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return this.passwordHash; // Trả về mật khẩu đã mã hóa
    }

    @Override
    public String getUsername() {
        return this.username; // Hoặc trả về email nếu bạn dùng email để đăng nhập
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // Tài khoản không bị hết hạn
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // Tài khoản không bị khóa
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Mật khẩu không bị hết hạn
    }

    @Override
    public boolean isEnabled() {
        return true; // Tài khoản đang hoạt động
    }
}