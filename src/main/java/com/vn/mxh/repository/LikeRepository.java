package com.vn.mxh.repository;

import com.vn.mxh.domain.Like;
import com.vn.mxh.domain.Post;
import com.vn.mxh.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    // Kiểm tra xem User đã like Post chưa
    Optional<Like> findByUserAndPost(User user, Post post);

    boolean existsByUserAndPost(User user, Post post);
}