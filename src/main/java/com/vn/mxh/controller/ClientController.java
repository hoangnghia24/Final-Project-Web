package com.vn.mxh.controller;

import com.vn.mxh.domain.Post;
import com.vn.mxh.domain.User;
import com.vn.mxh.service.PostService;
import com.vn.mxh.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
public class ClientController {

    @Autowired
    private UserService userService;

    @Autowired
    private PostService postService;

    @GetMapping("/home")
    public String getHome() {
        return "client/Home";
    }

    @GetMapping("/profile")
    public String myProfile(Model model) {
        return "client/Profile";
    }

    @QueryMapping
    public User getUserByUsername(@Argument String username) {
        return this.userService.getUserByUsername(username);
    }

    @QueryMapping
    public List<Post> getAllPublicPosts() {
        return postService.getAllPosts();
    }

    @MutationMapping
    public Post createPost(@Argument String content, @Argument String username) {
        return postService.createPost(content, username);
    }
}