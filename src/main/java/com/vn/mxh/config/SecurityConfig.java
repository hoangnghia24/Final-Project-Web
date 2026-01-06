package com.vn.mxh.config;

import com.vn.mxh.security.JwtAuthenticationFilter;
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
import org.springframework.security.config.Customizer;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true) // Quan trọng: Cho phép dùng @PreAuthorize trong Controller
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthFilter;
        private final AuthenticationProvider authenticationProvider;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                // 1. Tắt CSRF (Do dùng Token, không dùng Session/Cookie nên không sợ lỗi này)
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(Customizer.withDefaults())
                                // 2. Cấu hình quyền truy cập (Authorize)
                                .authorizeHttpRequests(auth -> auth
                                                // ============================================================
                                                // NHÓM 1: CÁC TÀI NGUYÊN TĨNH (STATIC RESOURCES) -> MỞ HẾT
                                                // ============================================================
                                                .requestMatchers(
                                                                "/css/**", "/js/**", "/images/**",
                                                                "/webjars/**", "/favicon.ico",
                                                                "/auth/**", "/client/**", "/admin/**", // Folder chứa
                                                                                                       // file static
                                                                                                       // của giao diện
                                                                "/uploads/**")
                                                .permitAll()

                                                // ============================================================
                                                // NHÓM 2: CÁC TRANG VIEW (HTML) -> PHẢI MỞ (PERMIT ALL)
                                                // ============================================================
                                                // Lý do: Trình duyệt tải trang HTML không kèm Token.
                                                // Việc kiểm tra đăng nhập sẽ do file Javascript của trang đó đảm nhiệm.
                                                .requestMatchers(
                                                                "/", "/login", "/register", // Trang public
                                                                "/home", // Trang chủ
                                                                "/profile/**", "/u/**", // Trang cá nhân
                                                                "/admin", "/admin/**", // Trang quản trị (JS sẽ chặn nếu
                                                                                       // không phải admin)
                                                                "/messages/**", // Trang tin nhắn
                                                                "/settings", // Trang cài đặt
                                                                "/search/**", // Trang tìm kiếm
                                                                "/*.html", // Các file html lẻ
                                                                "/friends",
                                                                "/edit-avatar",
                                                                "/user-profile")
                                                .permitAll()
                                                .requestMatchers("/forgot-password", "/reset-password").permitAll()
                                                // ============================================================
                                                // NHÓM 3: API AUTH & GRAPHQL -> MỞ ĐỂ CLIENT GỌI VÀO
                                                // ============================================================
                                                // API Login/Register REST (nếu có dùng)
                                                .requestMatchers("/api/v1/auth/**").permitAll()
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                // GraphQL Endpoint: Phải mở để Client gửi Request (Token nằm trong
                                                // Header)
                                                // Việc chặn quyền cụ thể sẽ dùng @PreAuthorize trong Controller.
                                                .requestMatchers("/graphql/**", "/graphiql/**").permitAll()

                                                // WebSocket (Nếu có)
                                                .requestMatchers("/ws/**").permitAll()

                                                // ============================================================
                                                // NHÓM 4: CÁC API REST KHÁC (NẾU CÓ) -> KHÓA CHẶT
                                                // ============================================================
                                                // Bất kỳ API nào bắt đầu bằng /api/ (trừ auth ở trên) đều phải có Token
                                                .requestMatchers("/api/**").authenticated()

                                                // Chốt chặn cuối cùng: Mọi request lạ khác đều phải đăng nhập
                                                .anyRequest().authenticated())

                                // 3. Quản lý Session: STATELESS (Server không lưu trạng thái đăng nhập)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // 4. Cấu hình Provider xác thực (Logic kiểm tra User/Pass từ DB)
                                .authenticationProvider(authenticationProvider)

                                // 5. Thêm Filter JWT vào trước Filter mặc định của Spring Security
                                // (Để hứng Token, giải mã và nạp User vào Context trước khi Request đi tiếp)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
                http.exceptionHandling(exception -> exception
                                // 1. Xử lý lỗi 403 (Access Denied): Đã đăng nhập nhưng vào trang không được
                                // phép (hoặc trang lạ bị chặn)
                                .accessDeniedHandler((request, response, accessDeniedException) -> {
                                        response.sendRedirect("/home"); // Đá về trang chủ
                                })

                                // 2. Xử lý lỗi 401 (Unauthenticated): Chưa đăng nhập mà vào trang lạ
                                // (Lưu ý: Thường thì cái này nên về /login, nhưng nếu bạn muốn về /home thì sửa
                                // ở đây)
                                .authenticationEntryPoint((request, response, authException) -> {
                                        response.sendRedirect("/home"); // Đá về trang chủ (hoặc /login)
                                }));
                return http.build();
        }
}