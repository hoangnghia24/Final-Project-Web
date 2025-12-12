package com.vn.mxh.controller;

import com.vn.mxh.domain.dto.RegisterRequest;
import com.vn.mxh.domain.dto.UserResponse;
import com.vn.mxh.service.AuthService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller // Lưu ý: Không dùng @RestController
public class UserGraphQLController {

    private final AuthService authService;

    public UserGraphQLController(AuthService authService) {
        this.authService = authService;
    }

    // Tên method phải trùng với tên trong 'type Mutation' ở schema.graphqls
    @MutationMapping
    public UserResponse register(@Argument("input") RegisterRequest request) {
        // Spring for GraphQL sẽ tự động map các trường từ 'input' trong GraphQL
        // vào record 'RegisterRequest' của Java.

        return authService.register(request);
    }

    @QueryMapping
    public String hello() {
        return "Hello World! GraphQL is running.";
    }
}