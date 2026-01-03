package com.vn.mxh.controller;

import com.vn.mxh.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class MediaController {

    private final FileStorageService fileStorageService;

    public MediaController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/media")
    public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file) {
        try {
            // 1. Lưu file
            String fileName = fileStorageService.storeFile(file);

            // 2. Tạo đường dẫn truy cập (map với cấu hình ResourceHandler)
            String fileUrl = "/uploads/" + fileName;
            String fileType = fileStorageService.detectMediaType(fileName);

            // 3. Trả về JSON
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("type", fileType); // "IMAGE" hoặc "VIDEO"

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }
}