package com.vn.mxh.repository;

import com.vn.mxh.domain.Message;
import com.vn.mxh.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Lấy tất cả tin nhắn giữa 2 user
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.sentAt ASC")
    List<Message> findConversationBetweenUsers(@Param("userId1") Long userId1, 
                                                @Param("userId2") Long userId2);
    
    // Lấy danh sách các cuộc hội thoại (distinct users đã chat với user hiện tại)
    @Query("SELECT DISTINCT u FROM User u WHERE u.id IN " +
           "(SELECT m.sender.id FROM Message m WHERE m.receiver.id = :userId) " +
           "OR u.id IN " +
           "(SELECT m.receiver.id FROM Message m WHERE m.sender.id = :userId)")
    List<User> findConversationPartners(@Param("userId") Long userId);
    
    // Đếm số tin nhắn chưa đọc
    long countByReceiverIdAndIsReadFalse(Long receiverId);
}
