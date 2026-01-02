package com.vn.mxh.config;

import com.vn.mxh.security.JwtAuthenticationFilter; // Nhớ import đúng package
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true)
@RequiredArgsConstructor // Tự động inject các biến final (filter, provider)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // Tắt CSRF vì dùng JWT
                .authorizeHttpRequests(auth -> auth
                        // --------------------------------------------------------
                        // 1. CÁC API PUBLIC (KHÔNG CẦN LOGIN)
                        // --------------------------------------------------------

                        // Cho phép API đăng nhập/đăng ký (Cần cụ thể hơn /api/**)
                        // Ví dụ: /api/v1/auth/login, /api/v1/auth/register
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // Cho phép trang Login/Register (View) hiển thị để người dùng nhập liệu
                        .requestMatchers("/login", "/register").permitAll()

                        // Cho phép GraphQL và WebSocket
                        .requestMatchers("/graphql/**", "/graphiql/**", "/ws/**").permitAll()

                        // Cho phép file tĩnh (CSS, JS, Ảnh...)
                        .requestMatchers(
                                "/css/**", "/js/**", "/images/**",
                                "/client/**", "/auth/**", "/admin/**", // Lưu ý: folder auth/** trong static resources
                                "/resources/**", "/uploads/**",
                                "/*.html", "/chat-test-to-admin.html", "/websocket-test.html")
                        .permitAll()

                        // --------------------------------------------------------
                        // 2. CÁC API CẦN BẢO MẬT (PHẢI CÓ TOKEN)
                        // --------------------------------------------------------

                        // Các trang View người dùng sau khi login
                        .requestMatchers(
                                "/", "/home", "/profile/**", "/u/**", "/messages",
                                "/edit-avatar", "/update-avatar", "/chat-test-to-admin",
                                "/trending", "/explore", "/all", "/saved", "/settings")
                        .authenticated()

                        // Bảo vệ tất cả các API còn lại (trừ auth ở trên)
                        .requestMatchers("/api/**").authenticated()

                        // Các request khác mặc định phải xác thực
                        .anyRequest().authenticated())

                // --------------------------------------------------------
                // 3. CẤU HÌNH SESSION & FILTER
                // --------------------------------------------------------

                // Chuyển session sang STATELESS (Server không nhớ User, User tự gửi Token)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Khai báo Provider xác thực (chứa logic check pass)
                .authenticationProvider(authenticationProvider)

                // Chèn Filter JWT vào trước Filter mặc định
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Lưu ý: Đã xóa Bean passwordEncoder() ở đây vì nên để nó bên file
    // ApplicationConfig
    // để tránh lỗi Circular Dependency (phụ thuộc vòng).
}