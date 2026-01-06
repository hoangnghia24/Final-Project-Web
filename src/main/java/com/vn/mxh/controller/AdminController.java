package com.vn.mxh.controller;

import java.util.List;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import com.vn.mxh.domain.dto.InfoUserForAdmin;
import com.vn.mxh.service.UserService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class AdminController {
    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @QueryMapping
    public List<InfoUserForAdmin> getAllUsers() {
        return this.userService.getAllUsers();
    }

    @GetMapping("/admin")
    public String getMethodName() {
        return "admin/Dashboard";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @MutationMapping
    public String deleteUserByAdmin(@Argument Long userId) {
        // Hàm này sẽ trả về chuỗi thông báo nếu thành công
        // Nếu thất bại (User không tồn tại), UserService sẽ ném Exception,
        // GraphQL sẽ tự trả về lỗi cho Client.
        this.userService.deleteAccount(userId);
        return "Đã xóa người dùng thành công.";
    }

}
