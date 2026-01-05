package com.vn.mxh.repository;

import com.vn.mxh.domain.Friendship;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.enums.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // Tìm mối quan hệ giữa 2 người (bất kể ai gửi)
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :u1 AND f.addressee = :u2) OR (f.requester = :u2 AND f.addressee = :u1)")
    Optional<Friendship> findFriendshipBetween(User u1, User u2);

    // Lấy danh sách lời mời kết bạn ĐANG CHỜ (User là người nhận)
    List<Friendship> findByAddresseeAndStatus(User addressee, FriendshipStatus status);

    // Lấy danh sách bạn bè (Cả 2 chiều)
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user OR f.addressee = :user) AND f.status = 'ACCEPTED'")
    List<Friendship> findAllFriends(User user);

    List<Friendship> findAllByRequesterIdOrAddresseeId(Long requesterId, Long addresseeId);

    List<Friendship> findAllByAddresseeIdAndStatus(Long addresseeId, FriendshipStatus status);

    @Query("SELECT f FROM Friendship f WHERE (f.requester.id = :userId OR f.addressee.id = :userId) AND f.status = 'ACCEPTED'")
    List<Friendship> findAllAcceptedFriendships(@Param("userId") Long userId);

    // Trong FriendshipRepository.java

    // Tìm danh sách lời mời mình đã gửi đi (Status = PENDING)
    @Query("SELECT f FROM Friendship f WHERE f.requester.id = :userId AND f.status = 'PENDING'")
    List<Friendship> findSentRequests(@Param("userId") Long userId);

    // Tìm kiếm bạn bè theo Tên hiển thị (fullName) HOẶC Tên đăng nhập (username)
    @Query("SELECT f FROM Friendship f " +
            "WHERE (f.requester.id = :userId OR f.addressee.id = :userId) " +
            "AND f.status = 'ACCEPTED' " +
            "AND ( " +
            "   (f.requester.id = :userId AND (LOWER(f.addressee.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(f.addressee.username) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR "
            +
            "   (f.addressee.id = :userId AND (LOWER(f.requester.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(f.requester.username) LIKE LOWER(CONCAT('%', :keyword, '%')))) "
            +
            ")")
    List<Friendship> searchFriends(@Param("userId") Long userId, @Param("keyword") String keyword);
}