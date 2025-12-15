package com.vn.mxh.repository;

import com.vn.mxh.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Kiểm tra tồn tại
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    // Dùng cho đăng nhập sau này
    Optional<User> findByUsername(String username);

    User save(User user);

    Optional<User> findByEmail(String email);

    List<User> findAll();
}