package com.vn.mxh.controller;

import com.vn.mxh.domain.Friendship;
import com.vn.mxh.domain.User;
import com.vn.mxh.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.security.Principal;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    @MutationMapping
    public Friendship sendFriendRequest(@Argument Long targetUserId, Principal principal) {
        return friendshipService.sendFriendRequest(principal.getName(), targetUserId);
    }

    @MutationMapping
    public Friendship acceptFriendRequest(@Argument Long requestId, Principal principal) {
        return friendshipService.acceptFriendRequest(requestId, principal.getName());
    }

    @QueryMapping
    public List<Friendship> getMyFriendRequests() {
        // 1. Lấy thông tin xác thực hiện tại từ SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 2. Kiểm tra nếu chưa đăng nhập hoặc lỗi (Optional, nhưng nên có)
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Bạn chưa đăng nhập!");
        }

        // 3. Ép kiểu Principal về đối tượng User của bạn để lấy ID
        // (Vì trong JwtAuthenticationFilter ta đã lưu userDetails vào đây)
        User currentUser = (User) auth.getPrincipal();

        // 4. Gọi Service với ID (Long) thay vì Username (String)
        return friendshipService.getMyFriendRequests(currentUser.getId());
    }

    @QueryMapping
    public List<User> getFriendSuggestions() {
        // 1. Lấy thông tin xác thực hiện tại
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 2. Kiểm tra xem đã đăng nhập chưa
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Bạn chưa đăng nhập hoặc Token không hợp lệ!");
        }

        // 3. Lấy User object trực tiếp từ Session (ép kiểu về User entity của bạn)
        User currentUser = (User) auth.getPrincipal();

        // 4. Gọi Service với ID
        return friendshipService.getFriendSuggestions(currentUser.getId());
    }

    @QueryMapping
    public List<User> getMyFriends() {
        // Lấy User từ Token (Logic y hệt hàm getMyFriendRequests)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) auth.getPrincipal();
        return friendshipService.getMyFriends(currentUser.getId());
    }

    @MutationMapping
    public String rejectFriendRequest(@Argument Long requestId, Principal principal) {
        // Gọi service để xóa record trong database
        friendshipService.rejectFriendRequest(requestId, principal.getName());
        return "Đã từ chối lời mời";
    }
    // Trong FriendshipController.java

    @MutationMapping
    public String unfriend(@Argument Long targetUserId, Principal principal) {
        friendshipService.unfriend(targetUserId, principal.getName());
        return "Đã hủy kết bạn thành công";
    }

    // Trong FriendshipController.java
    @QueryMapping
    public List<Friendship> getSentFriendRequests() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) auth.getPrincipal();
        return friendshipService.getSentFriendRequests(currentUser.getId());
    }
}