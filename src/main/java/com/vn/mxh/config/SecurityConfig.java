package com.vn.mxh.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true)
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
                        // 1. Cho phép các API endpoints - ĐẶT TRƯỚC TIÊN
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers("/graphql/**", "/graphiql/**").permitAll()
                        
                        // 2. Cho phép WebSocket endpoints
                        .requestMatchers("/ws/**").permitAll()
                        
                        // 3. Cho phép truy cập các file tĩnh (CSS, JS, Ảnh)
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/client/**", "/auth/**", "/admin/**", "/resources/**", "/uploads/**").permitAll()
                        
                        // 4. Cho phép truy cập các trang VIEW (HTML) và POST endpoints
                        .requestMatchers("/", "/home", "/login", "/register", "/profile/**", "/u/**", "/messages", "/edit-avatar", "/update-avatar", "/chat-test-to-admin", "/trending", "/explore", "/all", "/saved", "/settings").permitAll()
                        
                        // 5. Cho phép truy cập các file test và HTML trong resources
                        .requestMatchers("/*.html", "/chat-test-to-admin.html", "/websocket-test.html").permitAll()
                        
                        // 6. Các request còn lại có thể truy cập (tạm thời)
                        .anyRequest().permitAll());

        return http.build();
    }
}