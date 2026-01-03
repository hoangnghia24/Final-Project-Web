package com.vn.mxh.config;

import com.vn.mxh.domain.User;
import com.vn.mxh.domain.enums.Role;
import com.vn.mxh.repository.UserRepository; // Nhớ import Repository của bạn
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Kiểm tra xem đã có user "admin" chưa, nếu chưa thì mới tạo
            if (!userRepository.existsByUsername("admin")) {

                User admin = User.builder()
                        .username("admin")
                        .email("admin@mxh.vn")
                        .fullName("Admin")
                        // Mật khẩu là "admin123", nhưng phải mã hóa trước khi lưu
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .role(Role.ADMIN) // Quan trọng nhất: Set quyền ADMIN
                        .bio("Tài khoản quản trị hệ thống")
                        .avatarUrl("")
                        .build();

                userRepository.save(admin);
                System.out.println(">>> Đã khởi tạo tài khoản ADMIN thành công: admin / admin123");
            }
        };
    }
}