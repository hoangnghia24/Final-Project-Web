package com.vn.mxh.domain.dto;

public record CreateCommentInput(
        String postId,
        String content) {
}