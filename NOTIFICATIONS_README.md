# 🔔 HỆ THỐNG THÔNG BÁO - TFT SOCIAL NETWORK

## 📋 Tổng quan

Hệ thống thông báo real-time với giao diện đẹp mắt, animations mượt mà và đầy đủ tính năng cho mạng xã hội TFT.

## ✨ Tính năng đã hoàn thành

### 🎨 Giao diện
- ✅ Dropdown thông báo responsive (giống Facebook)
- ✅ Badge đếm số thông báo chưa đọc với animation
- ✅ Dark mode support hoàn chỉnh
- ✅ Animations mượt mà (slide, fade, pulse)
- ✅ Skeleton loading states
- ✅ Empty states đẹp mắt

### 🚀 Chức năng
- ✅ Hiển thị các loại thông báo:
  - ❤️ Like (bài viết/comment)
  - 💬 Comment
  - 👥 Friend request
  - 📨 Message
- ✅ Filter: Tất cả / Chưa đọc
- ✅ Mark as read (từng thông báo)
- ✅ Mark all as read
- ✅ Click vào thông báo để navigate
- ✅ Friend request với Accept/Decline buttons
- ✅ Relative time (5 phút trước, 1 giờ trước...)
- ✅ Auto-update time mỗi phút

### 🔌 Real-time
- ✅ WebSocket connection với auto-reconnect
- ✅ Nhận thông báo real-time
- ✅ Browser notifications (nếu được phép)
- ✅ Notification sound
- ✅ Toast messages

## 📁 Files đã tạo

```
src/main/webapp/resources/client/
├── css/
│   └── Notifications.css       # CSS đầy đủ với animations
└── js/
    └── Notifications.js        # JavaScript với WebSocket

src/main/webapp/WEB-INF/view/
├── fragments/
│   └── Header.html            # Updated với notification HTML
└── client/
    ├── Home.html             # Added CSS & JS
    ├── Messages.html         # Added CSS & JS
    ├── Profile.html          # Added CSS & JS
    └── Explore.html          # Added CSS & JS
```

## 🎯 Cách sử dụng

### 1. HTML Structure (Đã có trong Header.html)

```html
<div class="notification-menu">
    <div class="header-icon" id="notification-icon" title="Thông báo">
        <svg>...</svg>
        <span class="notification-badge" id="notification-badge"></span>
    </div>
    <div class="notification-popup" id="notification-popup">
        <!-- Notification content -->
    </div>
</div>
```

### 2. Load notifications (Mock data)

File `Notifications.js` đã có sẵn mock data để demo. Khi có backend:

```javascript
// Trong Notifications.js, function loadNotifications()
$.ajax({
    url: '/api/notifications',
    method: 'GET',
    success: function(notifications) {
        // Process notifications
    }
});
```

### 3. Nhận thông báo real-time

WebSocket đã được setup. Backend cần gửi tin theo format:

```json
{
    "id": 1,
    "type": "like|comment|friend|message",
    "actorName": "Nguyễn Văn A",
    "actorAvatar": "https://...",
    "action": "đã thích bài viết của bạn",
    "content": "Optional comment content",
    "targetId": 123,
    "targetType": "post|comment|friendship",
    "timestamp": "2025-12-27T20:30:00",
    "isRead": false
}
```

Gửi đến: `/user/{userId}/queue/notifications`

### 4. Test ngay

1. **Mở trang bất kỳ** (Home, Messages, Profile...)
2. **Click vào icon chuông** ở header
3. **Xem notifications** với mock data
4. **Click vào notification** để xem logs
5. **Click "Đánh dấu đã đọc"** để mark all
6. **Switch giữa tab** "Tất cả" và "Chưa đọc"

## 🎨 Customization

### Thay đổi màu sắc

Trong `Notifications.css`:

```css
/* Primary color */
.notification-badge {
    background: #ff4444; /* Đổi màu badge */
}

.notification-tab.active {
    background: #e8f0fe;  /* Đổi màu tab active */
    color: #1a73e8;
}
```

### Thay đổi animations

```css
@keyframes notificationSlideIn {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
```

### Thêm notification type mới

Trong `Notifications.js`:

```javascript
const icons = {
    like: '❤️',
    comment: '💬',
    friend: '👥',
    message: '📨',
    share: '🔄',  // Thêm type mới
    follow: '➕'
};
```

## 🐛 Debug

Mở console (F12) để xem logs:

```
🔔 Initializing Notification System...
✅ Notification WebSocket connected: 1
📥 Loading notifications...
🔢 Unread count updated: 3
🔔 New notification received: {...}
✨ New notification added: {...}
```

## 📱 Responsive

- Desktop: 400px width
- Mobile: Full width - 20px padding
- Tự động adjust khi màn hình nhỏ

## 🎭 Dark Mode

Dark mode được support tự động. Toggle từ settings sẽ áp dụng cho notifications.

## 🔊 Notification Sound

Âm thanh thông báo sẽ phát khi có notification mới. Để tắt:

```javascript
// Trong Notifications.js, comment dòng này:
// playNotificationSound();
```

## 🌐 Browser Notifications

Sau 5 giây, user sẽ được hỏi permission. Để test:

```javascript
// Trong console
Notification.requestPermission();
```

## 🚀 Next Steps (Khi có Backend)

1. **API Endpoints cần thiết:**
   ```
   GET  /api/notifications          - Lấy danh sách notifications
   POST /api/notifications/:id/read - Mark notification as read
   POST /api/notifications/read-all - Mark all as read
   ```

2. **WebSocket Topics:**
   ```
   /user/{userId}/queue/notifications - Nhận real-time notifications
   ```

3. **Database Schema:**
   ```sql
   CREATE TABLE notifications (
       id BIGINT PRIMARY KEY,
       user_id BIGINT,
       actor_id BIGINT,
       type VARCHAR(20), -- like, comment, friend, message
       target_id BIGINT,
       target_type VARCHAR(20),
       content TEXT,
       is_read BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP
   );
   ```

## 💡 Tips

1. **Performance**: Giới hạn số lượng notifications load (50-100 items)
2. **Pagination**: Implement "Load more" khi scroll đến bottom
3. **Caching**: Cache notifications trong localStorage
4. **Real-time**: Sử dụng heartbeat để check connection
5. **Security**: Validate notification data trước khi render

## 🎉 Demo Features

- ✅ Click notification → Log action và URL sẽ navigate
- ✅ Mark as read → Xóa unread dot
- ✅ Filter tabs → Chuyển đổi mượt mà
- ✅ Real-time count → Update badge ngay lập tức
- ✅ Animations → Mượt mà và đẹp mắt

## 📞 Support

Nếu có vấn đề, check console logs và đảm bảo:
1. ✅ CSS được load (`Notifications.css`)
2. ✅ JS được load (`Notifications.js`)
3. ✅ WebSocket connection thành công
4. ✅ localStorage có `currentUserId`

---

**Created with ❤️ for TFT Social Network**
