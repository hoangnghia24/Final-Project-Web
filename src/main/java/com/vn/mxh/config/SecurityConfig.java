package com.vn.mxh.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // 1. Cho phép truy cập các API quan trọng
                        .requestMatchers("/api/auth/**", "/graphql/**", "/graphiql/**").permitAll()

                        // 2. Cho phép truy cập các trang VIEW (HTML) dành cho khách
                        .requestMatchers("/login", "/register").permitAll()

                        // 3. Cho phép truy cập các file tĩnh (CSS, JS, Ảnh)
                        // Lưu ý: "/client/**" là vì trong file register.html bạn dùng
                        // th:href="@{client/css/...}"
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/client/**", "/auth/**").permitAll()

                        // 4. Tất cả các request còn lại đều phải đăng nhập mới được vào
                        .anyRequest().authenticated());

        // Có thể thêm cấu hình này nếu bạn muốn Spring tự chuyển hướng về trang login
        // của bạn khi gặp lỗi 403
        // .formLogin(form -> form
        // .loginPage("/login")
        // .permitAll()
        // )

        return http.build();
    }
}