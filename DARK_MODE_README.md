# 🌙 Dark Mode - TFT Social Network

## Tổng quan

Tính năng Dark Mode được implement đầy đủ trên toàn bộ website TFT Social Network, mang lại trải nghiệm người dùng tốt nhất trong điều kiện ánh sáng yếu.

## ✨ Tính năng

### 1. **Toggle Dark Mode**
- Vị trí: Profile dropdown menu (góc trên bên phải)
- Toggle switch hiện đại với animation mượt mà
- Icon: ☀️ (Light Mode) ↔️ 🌙 (Dark Mode)
- Lưu trữ trạng thái trong localStorage

### 2. **Màu sắc chủ đạo**

#### Light Mode (Mặc định)
- Background: `#f0f2f5`
- Text: `#050505`
- Card background: `#ffffff`
- Border: `#e4e6eb`

#### Dark Mode
- Background: `#030303`
- Text: `#d7dadc`
- Card background: `#1a1a1b`
- Border: `#343536`
- Secondary text: `#818384`

## 🎨 Các trang đã hỗ trợ Dark Mode

### ✅ Hoàn thiện 100%
1. **Home** (`Home.html` + `Home.css`)
   - Newsfeed
   - Post creation form
   - Stories section
   - Right sidebar

2. **Profile** (`Profile.html` + `Profile.css`)
   - User info section
   - Tabs navigation
   - Posts display

3. **UserProfile** (`UserProfile.html` + `UserProfile.css`)
   - Cover photo section
   - Profile header
   - Friends widget
   - Posts filter

4. **Messages** (`Messages.html` + `Messages.css`)
   - Conversations list
   - Chat window
   - Message input

5. **Header** (`Header.html` + `Header.css`)
   - Main navigation
   - Profile dropdown
   - Notifications popup
   - Messages popup

6. **Left Sidebar** (`Left-Sidebar.html` + `LeftSidebar.css`)
   - Navigation items
   - Active states

7. **Post Components**
   - `RedditPost.css` - Reddit-style posts
   - `ModernPost.css` - Modern post cards
   - `PostDetail.css` - Post detail page
   - `PostInteractions.css` - Like, comment, share

8. **Explore** (`Explore.html` + `Explore.css`)
   - Category grid
   - Search bar
   - Topic chips
   - Cards grid

9. **Friends** (`Friends.html` + `FriendRequests.css`)
   - Friends list
   - Friend requests
   - Friend suggestions

10. **Notifications** (`Notifications.css`)
    - Notification dropdown
    - Notification items
    - Mark as read

11. **Stories** (`Stories.css`)
    - Stories viewer
    - Stories list
    - Story creation

12. **ModernUI** (`ModernUI.css`)
    - Buttons
    - Cards
    - Shadows
    - Utilities

## 🔧 Implementation

### JavaScript (`Header.js`)

```javascript
// Load dark mode state from localStorage on page load
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeCheckbox.checked = true;
}

// Toggle dark mode
darkModeCheckbox.addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
});
```

### CSS Pattern

Tất cả các CSS files sử dụng pattern nhất quán:

```css
/* Light mode - Default styles */
.element {
    background: #ffffff;
    color: #050505;
}

/* Dark mode - Override styles */
body.dark-mode .element {
    background: #1a1a1b;
    color: #d7dadc;
}
```

## 🎯 Cách sử dụng

### Cho người dùng:
1. Click vào avatar ở góc trên bên phải
2. Tìm mục "Dark Mode" trong dropdown menu
3. Toggle switch để bật/tắt Dark Mode
4. Trạng thái sẽ được lưu tự động

### Cho developer:

#### Thêm dark mode cho component mới:

```css
/* 1. Define light mode styles */
.my-component {
    background: #ffffff;
    color: #050505;
    border: 1px solid #e4e6eb;
}

/* 2. Add dark mode overrides */
body.dark-mode .my-component {
    background: #1a1a1b;
    color: #d7dadc;
    border: 1px solid #343536;
}
```

## 🎨 Color Variables (Khuyến nghị)

### Light Mode
```css
--bg-primary: #ffffff;
--bg-secondary: #f0f2f5;
--bg-tertiary: #e4e6eb;
--text-primary: #050505;
--text-secondary: #65676b;
--border-color: #e4e6eb;
--accent-purple: #6200ea;
```

### Dark Mode
```css
--bg-primary: #1a1a1b;
--bg-secondary: #030303;
--bg-tertiary: #272729;
--text-primary: #d7dadc;
--text-secondary: #818384;
--border-color: #343536;
--accent-purple: #9d4edd;
```

## ✨ Modern Toggle Switch Design

Toggle switch được thiết kế với:
- Gradient background đẹp mắt
- Animation mượt mà (cubic-bezier)
- Icon ☀️ và 🌙 tự động thay đổi
- Shadow effects
- Hover state

## 📱 Responsive

Dark mode hoạt động hoàn hảo trên mọi kích thước màn hình:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🐛 Testing Checklist

- [x] Toggle switch hoạt động
- [x] LocalStorage lưu trữ state
- [x] Tất cả trang hiển thị đúng
- [x] Header và sidebar đúng màu
- [x] Post cards đúng theme
- [x] Dropdown menus đúng theme
- [x] Input fields đúng theme
- [x] Buttons đúng theme
- [x] Modals đúng theme
- [x] Notifications đúng theme

## 🚀 Performance

- Sử dụng CSS classes thay vì inline styles
- Không có flash of unstyled content (FOUC)
- Smooth transitions (0.3s)
- localStorage cache để tải nhanh

## 📝 Notes

- Dark mode state được persist qua các session
- Tất cả các trang tự động áp dụng dark mode khi enabled
- Không cần reload page khi toggle
- Compatible với tất cả modern browsers

## 🎉 Hoàn thành

Tính năng Dark Mode đã được implement hoàn thiện 100% trên toàn bộ website!

---

**Phiên bản:** 1.0.0  
**Ngày cập nhật:** December 30, 2025  
**Developer:** TFT Development Team
