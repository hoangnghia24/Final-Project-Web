package com.vn.mxh.controller;

import com.vn.mxh.domain.User;
import com.vn.mxh.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import java.util.HashMap;
import java.util.Map;

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

    @GetMapping("/edit-avatar")
    public String editAvatar() {
        return "client/EditAvatar";
    }

    @GetMapping("/messages")
    public String getMessages() {
        return "client/Messages";
    }

    @GetMapping("/saved")
    public String getSaved() {
        // TODO: Implement saved posts page
        return "client/Home"; // Tạm thời redirect về home
    }

    @GetMapping("/settings")
    public String getSettings() {
        // TODO: Implement settings page
        return "client/Home"; // Tạm thời redirect về home
    }

    @PostMapping("/update-avatar")
    @ResponseBody
    public Map<String, Object> updateAvatar(@RequestParam String username, @RequestParam String avatarUrl) {
        Map<String, Object> response = new HashMap<>();
        try {
            User updatedUser = userService.updateUserAvatar(username, avatarUrl);
            if (updatedUser != null) {
                response.put("success", true);
                response.put("message", "Avatar đã được cập nhật!");
                response.put("avatarUrl", updatedUser.getAvatarUrl());
            } else {
                response.put("success", false);
                response.put("message", "Không tìm thấy user!");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
        }
        return response;
    }
}