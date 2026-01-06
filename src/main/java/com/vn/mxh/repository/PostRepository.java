package com.vn.mxh.repository;

import com.vn.mxh.domain.Post;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = { "user" })
    List<Post> findAllByOrderByCreatedAtDesc();

    // Sau này bạn có thể thêm:
    List<Post> findByUserUsernameOrderByCreatedAtDesc(String username);

    @Modifying
    @Query("UPDATE Post p SET p.isDeleted = true WHERE p.user.id = :userId")
    void softDeletePostsByUserId(Long userId);
}