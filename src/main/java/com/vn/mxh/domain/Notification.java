package com.vn.mxh.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("is_deleted = false")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // Người nhận thông báo

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender; // Người thực hiện hành động (ví dụ: người like)

    private String content; // Nội dung hiển thị (ví dụ: "đã thích bài viết của bạn")
    private String type; // LIKE, COMMENT, FRIEND_REQUEST
    private Long targetId; // ID của bài viết hoặc comment để khi click thì nhảy đến đó
    private LocalDateTime createdAt;

    @Builder.Default // Lombok cần cái này nếu bạn set giá trị mặc định
    private boolean isRead = false;

    @Column(name = "is_deleted")
    @Builder.Default
    private boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}