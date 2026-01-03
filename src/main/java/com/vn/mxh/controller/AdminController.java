package com.vn.mxh.controller;

import java.util.List;

import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import com.vn.mxh.domain.dto.InfoUserForAdmin;
import com.vn.mxh.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;

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

    // @GetMapping("/admin") // Hoặc /admin/dashboard
    // public String dashboard(Model model) {
    // model.addAttribute("currentPage", "dashboard");
    // return "admin/dashboard"; // Trỏ đến file html vừa tạo
    // }

}
