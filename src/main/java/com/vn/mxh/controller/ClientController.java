// package com.vn.mxh.controller;

// import com.vn.mxh.domain.User;
// import com.vn.mxh.repository.UserRepository;
// import org.springframework.stereotype.Controller;
// import org.springframework.ui.Model;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PathVariable;

// @Controller
// public class ProfileController {

//     private final UserRepository userRepository;

//     public ProfileController(UserRepository userRepository) {
//         this.userRepository = userRepository;
//     }

//     @GetMapping("/profile")
//     public String myProfile(Model model) {

//         Long currentUserId = 1L; 
        
//         User user = userRepository.findById(currentUserId).orElse(null);
//         model.addAttribute("user", user);
        
//         return "client/profile";
//     }

//     @GetMapping("/u/{username}")
//     public String userProfile(@PathVariable String username, Model model) {
//         User user = userRepository.findByUsername(username)
//                 .orElseThrow(() -> new RuntimeException("User not found"));
        
//         model.addAttribute("user", user);
        
//         return "client/profile"; 
//     }
// }

package com.vn.mxh.controller;

import com.vn.mxh.domain.User;
import com.vn.mxh.domain.enums.Role;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDateTime;

@Controller
public class ClientController {

    // Tạm thời bỏ qua Repository để test giao diện trước
    // private final UserRepository userRepository;

    @GetMapping("/profile")
    public String myProfile(Model model) {
        // TẠO DỮ LIỆU GIẢ (MOCK DATA)
        User mockUser = User.builder()
                .id(1L)
                .username("admin_test")
                .fullName("Admin Test Giao Diện")
                .email("admin@tft.com")
                .bio("Đây là dữ liệu giả để test giao diện Profile Reddit.")
                .role(Role.ADMIN)
                .avatarUrl("https://i.pravatar.cc/150?img=11") // Ảnh mẫu trên mạng
                .createdAt(LocalDateTime.now())
                .build();
        
        model.addAttribute("user", mockUser);
        
        // Trả về file: src/main/webapp/WEB-INF/view/client/profile.html
        return "client/profile"; 
    }
}