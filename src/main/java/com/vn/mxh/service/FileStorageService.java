package com.vn.mxh.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {
    // Thư mục lưu file: nằm ngay tại thư mục gốc của project
    private final Path fileStorageLocation = Paths.get("uploads");

    public FileStorageService() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Không thể tạo thư mục uploads.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Làm sạch tên file
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        if (originalFileName.contains("..")) {
            throw new RuntimeException("Tên file không hợp lệ: " + originalFileName);
        }

        // Tạo tên file duy nhất (UUID) để tránh trùng lặp
        // Ví dụ: avatar.jpg -> 550e8400-e29b..._avatar.jpg
        String fileName = UUID.randomUUID().toString() + "_" + originalFileName;

        try {
            // Copy file vào thư mục uploads
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu file " + fileName, ex);
        }
    }

    // Hàm xác định loại file (IMAGE hay VIDEO)
    public String detectMediaType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".avi") || lower.endsWith(".mkv")) {
            return "VIDEO";
        }
        return "IMAGE";
    }
}