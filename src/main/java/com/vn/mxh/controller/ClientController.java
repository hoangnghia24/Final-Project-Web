package com.vn.mxh.controller;

import com.vn.mxh.domain.User;
import com.vn.mxh.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ClientController {
    @Autowired
    private UserService userService;
    // Tạm thời bỏ qua Repository để test giao diện trước
    // private final UserRepository userRepository;

    @GetMapping("/profile")
    public String myProfile(Model model) {

        // Trả về file: src/main/webapp/WEB-INF/view/client/profile.html
        return "client/Profile";
    }

    // Tên hàm phải khớp với tên Query trong schema.graphqls: getUserByUsername
    @QueryMapping
    public User getUserByUsername(@Argument String username) {
        // Tìm user trong DB bằng JPA Repository
        // Giả sử Repository có hàm findByUsername
        User user = this.userService.getUserByUsername(username);

        return user; // Trả về null nếu không tìm thấy
    }

    @GetMapping("/home")
    public String getHome() {
        return "client/Home";
    }
}