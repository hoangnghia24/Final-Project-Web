package com.vn.mxh.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
