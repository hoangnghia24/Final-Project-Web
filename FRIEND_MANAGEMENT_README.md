# 👥 FRIEND MANAGEMENT SYSTEM - TFT SOCIAL NETWORK

## 📋 Tổng quan

Hệ thống quản lý bạn bè hoàn chỉnh với giao diện đẹp mắt, animations mượt mà và đầy đủ tính năng.

## ✨ Tính năng

### 1. **Danh sách bạn bè (All Friends)**
- Hiển thị tất cả bạn bè với card đẹp mắt
- Avatar với cover gradient ngẫu nhiên
- Hiển thị số bạn chung
- Online status indicator (chấm xanh)
- Search bạn bè theo tên
- Filter: Tất cả / Đang hoạt động / Mới kết bạn
- Action buttons: Xem trang cá nhân, Hủy kết bạn

### 2. **Lời mời kết bạn (Friend Requests)**
- Danh sách lời mời kết bạn pending
- Hiển thị thời gian gửi (5 phút trước, 1 giờ trước...)
- Accept/Reject buttons với animations đẹp
- **Accept Animation**: Card phóng to → màu xanh → fade out
- **Reject Animation**: Card trượt sang phải → fade out
- Real-time update số lượng lời mời
- Badge đỏ trên tab khi có lời mời mới

### 3. **Gợi ý kết bạn (Suggestions)**
- Hiển thị người dùng có thể biết
- Dựa trên: Bạn chung, cùng trường, cùng thành phố, sở thích
- Thêm bạn bè button → chuyển thành "Đã gửi"
- Xóa gợi ý không muốn xem
- Auto-remove sau khi gửi lời mời

### 4. **Sidebar Summary**
- Mini widget hiển thị 3 lời mời mới nhất
- Mini widget hiển thị 5 gợi ý kết bạn
- Quick action buttons
- "Xem tất cả" link để chuyển sang tab chính

## 🎨 Giao diện

### **Header**
- Tiêu đề "Bạn bè"
- Search bar với icon kính lúp
- Responsive design

### **Tabs Navigation**
- 3 tabs: Tất cả bạn bè / Lời mời kết bạn / Gợi ý
- Icon SVG đẹp mắt
- Badge count cho mỗi tab
- Active state với màu tím (#6200ea)

### **Friend Cards**
- Cover gradient đẹp mắt (8 màu khác nhau)
- Avatar tròn với border trắng
- Tên bạn bè (hover → màu tím)
- Số bạn chung với icon
- Online status (chấm xanh nhỏ)
- Action buttons với icons
- Hover effect: Shadow + translateY(-2px)

### **Animations**
- **Accept Animation**: Scale 1 → 1.05 → 0.8 + fade + màu xanh
- **Reject Animation**: Slide right + fade out
- **Card Hover**: Shadow + lift effect
- **Button Hover**: Scale 1.02
- **Fade In**: Tất cả cards khi load
- **Loading Spinner**: Border animation xoay

## 📁 Cấu trúc Files

```
src/main/webapp/
├── WEB-INF/view/client/
│   └── Friends.html                    # Trang chính Friend Management
├── resources/client/
│   ├── css/
│   │   └── FriendRequests.css         # Styling (~700 lines)
│   └── js/
│       └── FriendRequests.js          # Logic (~1100 lines)
```

## 🔧 Cài đặt

### 1. **Backend Route**
Đã thêm vào `ClientController.java`:
```java
@GetMapping("/friends")
public String getFriends() {
    return "client/Friends";
}
```

### 2. **Navigation Link**
Đã thêm vào `Left-Sidebar.html`:
```html
<a href="/friends" class="sidebar-nav-item">
    <svg>...</svg>
    <span>Bạn bè</span>
</a>
```

### 3. **CSS & JS Include**
Trong `Friends.html`:
```html
<link th:href="@{/client/css/FriendRequests.css}" rel="stylesheet" />
<script th:src="@{/client/js/FriendRequests.js}"></script>
```

## 💻 Sử dụng

### **Truy cập trang**
```
http://localhost:8080/friends
```

### **Tab Switching**
```javascript
// Tự động xử lý bởi FriendRequests.js
// Click vào tab → switchTab(tabName)
```

### **Accept Friend Request**
```javascript
// Button có class: btn-accept-request
// Data attribute: data-request-id="123"
// Auto animation và update UI
```

### **Reject Friend Request**
```javascript
// Button có class: btn-reject-request
// Data attribute: data-request-id="123"
// Slide animation và remove khỏi list
```

### **Send Friend Request**
```javascript
// Button có class: btn-add-friend
// Data attribute: data-user-id="456"
// Change text: "Thêm bạn bè" → "Đã gửi"
// Disabled sau khi gửi
```

### **Search Friends**
```javascript
// Input: #friends-search-input
// Real-time search trong tab hiện tại
// Filter theo tên bạn bè
```

### **Filter Friends**
```javascript
// Buttons: .filter-btn
// Data attribute: data-filter="all|online|recent"
// Filter danh sách bạn bè
```

## 🔌 WebSocket Integration (Placeholder)

```javascript
function connectFriendWebSocket() {
    // const socket = new SockJS('/ws');
    // friendStompClient = Stomp.over(socket);
    // friendStompClient.connect({}, onFriendConnected);
}

function onFriendRequestReceived(message) {
    // Real-time notification khi nhận lời mời kết bạn
    // Parse message và add vào friendRequests array
    // Update UI tự động
}
```

## 📊 Mock Data

### **Friends (20 người)**
```javascript
{
    id: 1,
    name: 'Nguyễn Văn An',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=...',
    coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    mutualFriends: 12,
    isOnline: true,
    friendshipDate: Date.now() - 30days
}
```

### **Friend Requests (5 người)**
```javascript
{
    id: 101,
    name: 'Cao Văn Xuân',
    avatar: '...',
    coverGradient: '...',
    mutualFriends: 5,
    timestamp: '2025-12-26T10:30:00Z'
}
```

### **Suggestions (12 người)**
```javascript
{
    id: 201,
    name: 'Trương Văn Phi',
    avatar: '...',
    coverGradient: '...',
    mutualFriends: 3,
    reason: 'Cùng học trường Đại học FPT'
}
```

## 🎯 API Endpoints (TODO - Backend)

### **Get All Friends**
```
GET /api/friends
Response: List<FriendDTO>
```

### **Get Friend Requests**
```
GET /api/friends/requests
Response: List<FriendRequestDTO>
```

### **Accept Friend Request**
```
POST /api/friends/requests/{id}/accept
Response: { success: true }
```

### **Reject Friend Request**
```
POST /api/friends/requests/{id}/reject
Response: { success: true }
```

### **Send Friend Request**
```
POST /api/friends/requests
Body: { targetUserId: 123 }
Response: { success: true }
```

### **Get Friend Suggestions**
```
GET /api/friends/suggestions
Response: List<SuggestionDTO>
```

### **Unfriend**
```
DELETE /api/friends/{id}
Response: { success: true }
```

## 📱 Responsive Design

### **Desktop (> 1200px)**
- Grid 3-4 columns
- Full sidebar
- Large cards

### **Tablet (768px - 1200px)**
- Grid 2-3 columns
- Sidebar visible
- Medium cards

### **Mobile (< 768px)**
- Grid 1 column
- Sidebar hidden
- Stack layout
- Full-width search
- Vertical tabs

## 🌙 Dark Mode Support

Tất cả components đều hỗ trợ dark mode:
```css
body.dark-mode .friend-card {
    background: #1c1c1e;
    color: #f0f2f5;
}
```

## ⚡ Performance

- **Lazy Load**: Cards fade in khi render
- **Debounced Search**: 300ms delay
- **Optimized Animations**: GPU accelerated (transform, opacity)
- **Virtual Scrolling**: TODO cho danh sách lớn (>100 items)

## 🐛 Known Issues

1. **WebSocket chưa implement** → Dùng mock data
2. **Backend API chưa có** → Simulate với setTimeout
3. **Pagination chưa có** → Load tất cả một lúc
4. **Image lazy loading chưa có** → Load all images immediately

## 🚀 Next Steps

1. ✅ Frontend hoàn chỉnh
2. ⏳ Backend API implementation
3. ⏳ WebSocket real-time updates
4. ⏳ Pagination / Infinite scroll
5. ⏳ Image optimization
6. ⏳ Unit tests
7. ⏳ E2E tests

## 📸 Screenshots

### Main Page
- Tabs navigation với badges
- Grid layout đẹp mắt
- Search bar responsive

### Friend Request Accept
- Animation phóng to + màu xanh
- Fade out mượt mà
- Update count real-time

### Friend Suggestions
- Card design nhất quán
- Add friend button với icon
- Reason for suggestion

## 🎓 Công nghệ sử dụng

- **HTML5** - Semantic markup
- **CSS3** - Flexbox, Grid, Animations
- **Vanilla JavaScript** - IIFE pattern, ES6+
- **Thymeleaf** - Template engine
- **Spring Boot** - Backend framework
- **WebSocket** - Real-time communication (planned)

## 👨‍💻 Developer Notes

### **Customize Colors**
```css
:root {
    --primary-color: #6200ea;
    --accept-color: #00c853;
    --reject-color: #ff4757;
}
```

### **Adjust Animation Speed**
```css
.friend-card.accepting {
    animation: acceptAnimation 0.6s ease forwards; /* Change 0.6s */
}
```

### **Change Mock Data**
```javascript
// In FriendRequests.js
function generateMockFriends(count) {
    // Modify names, avatars, gradients
}
```

## 📞 Support

Nếu có vấn đề, check console logs:
```javascript
console.log('👥 Initializing Friend Management System...');
console.log('✅ Friend Management System initialized!');
```

---

**Version**: 1.0.0  
**Last Updated**: December 27, 2025  
**Author**: TFT Development Team
