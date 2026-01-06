package com.vn.mxh.repository;

import com.vn.mxh.domain.Notification;
import com.vn.mxh.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isDeleted = true WHERE n.user.id = :userId OR n.sender.id = :userId")
    void softDeleteNotificationsByUserId(Long userId);
}