package com.vn.mxh.controller.auth;

import com.vn.mxh.model.dto.LoginDto;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class LoginController {

    @GetMapping("/login")
    public String showLoginForm(Model model) {
        // QUAN TRỌNG: Phải gửi object này sang thì th:object bên kia mới hiểu
        model.addAttribute("loginDto", new com.vn.mxh.model.dto.LoginDto());
        return "auth/login";
    }

    // Ví dụ hàm xử lý khi bấm nút Submit (nếu bạn tự xử lý logic, không dùng Spring
    // Security mặc định)
    @PostMapping("/login")
    public String processLogin(@ModelAttribute("loginDto") LoginDto loginDto, Model model) {
        System.out.println("User: " + loginDto.getUsername());
        System.out.println("Pass: " + loginDto.getPassword());

        // Giả lập logic check (sau này thay bằng Service/Database)
        if ("admin".equals(loginDto.getUsername()) && "123".equals(loginDto.getPassword())) {
            return "redirect:/home"; // Đăng nhập đúng thì chuyển trang
        } else {
            model.addAttribute("error", "Sai tài khoản hoặc mật khẩu!");
            return "auth/login"; // Sai thì ở lại trang login
        }
    }
}