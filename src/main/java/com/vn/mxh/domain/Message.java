package com.vn.mxh.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("is_deleted = false")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender; // Người gửi

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver; // Người nhận

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // Nội dung tin nhắn

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime sentAt; // Thời gian gửi

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRead = false; // Đã đọc chưa

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRetracted = false; // Mặc định là false (chưa thu hồi)

    @Column(name = "is_deleted")
    @Builder.Default
    private boolean isDeleted = false;
}
