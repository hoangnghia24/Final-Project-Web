package com.vn.mxh.repository;

import com.vn.mxh.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    // Lấy bài viết mới nhất lên đầu
    List<Post> findAllByOrderByCreatedAtDesc();
}