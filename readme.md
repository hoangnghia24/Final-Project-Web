# 📱 Social Media Platform (Mạng Xã Hội)

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.0-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![GraphQL](https://img.shields.io/badge/GraphQL-Enabled-pink)
![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-red)

> Đồ án xây dựng website Mạng xã hội với đầy đủ tính năng kết nối, tương tác và nhắn tin thời gian thực.

## 📖 Giới thiệu
Dự án là một hệ thống mạng xã hội hoàn chỉnh được xây dựng theo kiến trúc **Layered Architecture**. Hệ thống cho phép người dùng đăng ký, kết bạn, chia sẻ khoảnh khắc (ảnh/video), tương tác qua Like/Comment và đặc biệt là nhắn tin trò chuyện trực tiếp (Real-time Chat).

## 🚀 Tính năng nổi bật

### 1. Phân hệ Người dùng (Client)
- **Xác thực & Bảo mật:**
  - Đăng ký/Đăng nhập (Sử dụng JWT - JSON Web Token).
  - Quên mật khẩu (Gửi mã OTP qua Email).
  - Bảo mật mật khẩu với BCrypt.
- **Trang cá nhân (Profile):**
  - Cập nhật Avatar, Ảnh bìa, Tiểu sử (Bio).
  - Xem trang cá nhân của bạn bè và người lạ.
- **Bảng tin (Newsfeed):**
  - Đăng bài viết mới (Hỗ trợ upload Ảnh/Video).
  - Chế độ quyền riêng tư (Công khai/Bạn bè/Riêng tư).
  - Sử dụng **GraphQL** để tối ưu hóa việc tải dữ liệu bài viết.
- **Tương tác xã hội:**
  - Thả tim (Like) và Bình luận (Comment).
  - Tìm kiếm bạn bè.
  - Gửi/Nhận/Hủy lời mời kết bạn.
- **Hệ thống Real-time (WebSocket):**
  - **Chat 1-1:** Nhắn tin tức thời, hỗ trợ **Thu hồi tin nhắn**.
  - **Thông báo (Notification):** Nhận thông báo ngay lập tức khi có người Like, Comment hoặc gửi lời mời kết bạn.

### 2. Phân hệ Quản trị (Admin Dashboard)
- Thống kê tổng quan hệ thống.
- Quản lý danh sách người dùng.
- Xóa (Khóa) tài khoản người dùng vi phạm.

## 🛠️ Công nghệ sử dụng

### Backend
- **Core:** Java 17, Spring Boot 3.x
- **Database:** MySQL, Hibernate/JPA
- **Security:** Spring Security, JWT Authentication
- **Real-time:** WebSocket (STOMP Protocol)
- **API:** RESTful API & GraphQL
- **Utilities:** JavaMailSender (Email), Lombok

### Frontend
- **Template Engine:** Thymeleaf
- **Core:** HTML5, CSS3, JavaScript (ES6)
- **Libraries:** StompJS & SockJS (cho WebSocket), Bootstrap/Tailwind (tùy chỉnh), SweetAlert2.

## ⚙️ Cài đặt và Triển khai

### Yêu cầu tiên quyết
- JDK 17 trở lên.
- Maven 3.6+.
- MySQL Server 8.0+.
- IDE: IntelliJ IDEA hoặc VS Code.

### Các bước cài đặt

1. Clone dự án:
   ```bash
   git clone [https://github.com/username/social-media-project.git](https://github.com/username/social-media-project.git)
   cd social-media-project

2. Cấu hình cơ sở dữ liệu:
- Tạo database trống trong MySQL tên là mxh.
- Mở file src/main/resources/application.properties và cập nhật thông tin:  
    spring.datasource.url=jdbc:mysql://localhost:3306/mxh
    spring.datasource.username=root
    spring.datasource.password=YOUR_PASSWORD

3. Cấu hình Email (Để test chức năng Quên mật khẩu):
- Vẫn trong application.properties, điền App Password của Gmail:
    spring.mail.username=your_email@gmail.com
    spring.mail.password=your_app_password

4. Cấu hình lưu trữ file:
- Tạo một thư mục uploads trên máy và cấu hình đường dẫn:
    application.file.upload-dir=C:/Users/YourName/uploads/

5. Chạy ứng dụng:
- Mở terminal tại thư mục gốc dự án:
    mvn spring-boot:run
- Hoặc chạy file MxhApplication.java trong IDE.

6. Truy cập ứng dụng:
- Mở trình duyệt và truy cập: http://localhost:8080
