package com.vn.mxh.repository;

import com.vn.mxh.domain.Comment;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Lấy danh sách comment của 1 bài viết (sắp xếp cũ nhất trước)
    @EntityGraph(attributePaths = { "user" })
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
}