package com.vn.mxh.controller;

import com.vn.mxh.domain.User;
import com.vn.mxh.domain.dto.AuthPayload; // Import class AuthPayload bạn vừa tạo
import com.vn.mxh.domain.dto.ForgotPasswordRequest;
import com.vn.mxh.domain.dto.RegisterInput;
import com.vn.mxh.domain.dto.ResetPasswordRequest;
import com.vn.mxh.domain.enums.Role;
import com.vn.mxh.exception.DuplicateRecordException;
import com.vn.mxh.repository.UserRepository;
import com.vn.mxh.security.JwtService; // Import JwtService
import com.vn.mxh.service.UserService;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@Controller
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    // 1. THÊM 2 BIẾN NÀY
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // 2. CẬP NHẬT CONSTRUCTOR
    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            UserService userService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userService = userService;
    }

    // Các đường dẫn View MVC (Giữ nguyên nếu bạn vẫn dùng Thymeleaf)
    @GetMapping("/login")
    public String login() {
        return "/auth/Login";
    }

    @GetMapping("/register")
    public String register() {
        return "/auth/Register";
    }

    @GetMapping("/logout")
    public String logout() {
        return "redirect:/login";
    }

    // ================== PHẦN CHỈNH SỬA CHO JWT & GRAPHQL ==================

    // 3. ĐỔI TỪ QUERY SANG MUTATION & ĐỔI TÊN HÀM THÀNH 'login'
    @MutationMapping
    public AuthPayload login(@Argument String username, @Argument String password) {
        // Bước A: Xác thực qua Spring Security (Tự động check username & pass hash)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        // Bước B: Lưu thông tin vào Context (Optional)
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Bước C: Lấy thông tin User từ kết quả xác thực
        // (Lưu ý: User này là object implement UserDetails của bạn)
        User userDetails = (User) authentication.getPrincipal();

        // Bước D: Tạo Token
        String token = jwtService.generateToken(userDetails);

        // Bước E: Trả về AuthPayload (Token + User)
        return new AuthPayload(token, userDetails);
    }

    // 4. SỬA HÀM ĐĂNG KÝ (Trả về AuthPayload thay vì User)
    @MutationMapping // Đổi tên mapping thành 'register' cho khớp schema (hoặc giữ createRegister nếu
                     // schema để vậy)
    public AuthPayload register(@Argument("input") RegisterInput input) {

        // Validate (Giữ nguyên)
        if (userRepository.existsByUsername(input.username())) {
            throw new DuplicateRecordException("Tên đăng nhập '" + input.username() + "' đã được sử dụng.");
        }
        if (userRepository.existsByEmail(input.email())) {
            throw new DuplicateRecordException("Email '" + input.email() + "' đã được đăng ký.");
        }

        // Tạo User (Giữ nguyên logic)
        User newUser = User.builder()
                .username(input.username())
                .passwordHash(passwordEncoder.encode(input.password()))
                .email(input.email())
                .fullName(input.fullName())
                .role(Role.USER)
                .build();

        // Lưu User
        User savedUser = userRepository.save(newUser);

        // THÊM: Tạo token ngay lập tức cho user mới
        String token = jwtService.generateToken(savedUser);

        // Trả về AuthPayload
        return new AuthPayload(token, savedUser);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            userService.sendForgotPasswordEmail(request.getEmail());
            return ResponseEntity.ok()
                    .header("Content-Type", "text/plain; charset=UTF-8")
                    .body("Mã xác nhận đã được gửi đến email của bạn.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .header("Content-Type", "text/plain; charset=UTF-8")
                    .body(e.getMessage());
        }
    }

    // API 2: Đổi mật khẩu mới (Kèm mã OTP)
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            userService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}