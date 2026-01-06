package com.vn.mxh.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import com.vn.mxh.domain.enums.FriendshipStatus;
import org.hibernate.annotations.SQLRestriction;
import java.time.LocalDateTime;

@Entity
@Table(name = "friendships", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "requester_id", "addressee_id" }) // Chặn gửi lời mời nhiều lần
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("is_deleted = false")
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default()
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendshipStatus status = FriendshipStatus.PENDING; // Mặc định là đang chờ

    @CreationTimestamp
    private LocalDateTime createdAt;

    // --- QUAN HỆ ---

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester; // Người gửi lời mời

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "addressee_id", nullable = false)
    private User addressee; // Người nhận lời mời

    @Column(name = "is_deleted")
    @Builder.Default
    private boolean isDeleted = false;
}