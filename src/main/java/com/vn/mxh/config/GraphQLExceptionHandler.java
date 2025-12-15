package com.vn.mxh.config;

import com.vn.mxh.exception.DuplicateRecordException;
import graphql.GraphQLError;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.web.bind.annotation.ControllerAdvice;

@ControllerAdvice
public class GraphQLExceptionHandler {

    // 1. Bắt lỗi do bạn tự định nghĩa (Ví dụ: logic check trùng)
    @GraphQlExceptionHandler
    public GraphQLError handleDuplicateRecord(DuplicateRecordException ex, DataFetchingEnvironment env) {
        return GraphQLError.newError()
                .errorType(ErrorType.BAD_REQUEST) // Đánh dấu là lỗi do client gửi dữ liệu sai
                .message(ex.getMessage()) // Lấy message bạn truyền vào
                .path(env.getExecutionStepInfo().getPath())
                .location(env.getField().getSourceLocation())
                .build();
    }

    // 2. Bắt lỗi từ Database (Ví dụ: Unique constraint khi insert trùng
    // username/email)
    @GraphQlExceptionHandler
    public GraphQLError handleDbError(DataIntegrityViolationException ex, DataFetchingEnvironment env) {
        return GraphQLError.newError()
                .errorType(ErrorType.BAD_REQUEST)
                .message("Tài khoản hoặc Email đã tồn tại trong hệ thống!") // Custom message cho user
                .path(env.getExecutionStepInfo().getPath())
                .location(env.getField().getSourceLocation())
                .build();
    }

    // 3. Bắt các lỗi không xác định khác (Để tránh hiện UUID xấu xí)
    @GraphQlExceptionHandler
    public GraphQLError handleGenericException(Exception ex, DataFetchingEnvironment env) {
        return GraphQLError.newError()
                .errorType(ErrorType.INTERNAL_ERROR)
                .message("Lỗi hệ thống: " + ex.getMessage()) // Hoặc ẩn message nếu muốn bảo mật
                .path(env.getExecutionStepInfo().getPath())
                .location(env.getField().getSourceLocation())
                .build();
    }
}