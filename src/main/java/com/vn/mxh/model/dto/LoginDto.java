package com.vn.mxh.model.dto;

public class LoginDto {
    private String username;
    private String password;

    // Bắt buộc phải có Getter và Setter
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}