package com.vn.mxh.repository;

import com.vn.mxh.domain.User;
import com.vn.mxh.domain.enums.Role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
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

    List<User> findAllByRoleNotAndIdNot(Role role, Long id);

    @Modifying
    @Query("UPDATE User u SET u.isDeleted = true WHERE u.id = :id")
    void softDeleteUser(Long id);
}