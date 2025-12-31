# ❤️ Post Interactions System

Hệ thống tương tác bài viết với đầy đủ tính năng như Facebook.

## 🎯 Tính năng

### 1. ❤️ Like với Emoji Reactions
- **Quick like**: Click nhanh nút "Thích" → like thông thường
- **Long-press**: Giữ nút "Thích" → hiện bảng chọn emoji reactions
- **6 loại reactions**: 
  - 👍 Like (xanh dương)
  - ❤️ Love (đỏ)
  - 😂 Haha (vàng)
  - 😮 Wow (cam)
  - 😢 Sad (xanh nhạt)
  - 😠 Angry (đỏ cam)
- **Flying hearts animation**: Trái tim bay lên khi like
- **Real-time counter**: Cập nhật số lượt thích ngay lập tức

### 2. 💬 Comments System
- **Comment input**: Gõ và Enter để gửi, hoặc click nút "Gửi"
- **Nested comments**: Hỗ trợ trả lời comment (replies)
- **Like comment**: Thích từng comment riêng lẻ
- **Comment actions**: Like, Reply, Timestamp
- **Auto-scroll**: Tự động scroll xuống comment mới
- **Real-time count**: Cập nhật số lượng comments

### 3. 📤 Share Post
Modal với 4 options:
- **Chia sẻ ngay**: Share lên newsfeed
- **Chia sẻ lên Story**: Share dưới dạng story
- **Gửi qua tin nhắn**: Share qua message
- **Sao chép link**: Copy link bài viết
- **Caption input**: Thêm nội dung khi share
- **Post preview**: Xem trước bài viết sẽ share

### 4. 🔖 Save/Bookmark
- Click nút "Lưu" để save bài viết
- **Visual indicator**: Icon bookmark xuất hiện ở góc phải post
- **Toggle state**: Click lại để unsave
- **Saved collection**: Lưu vào collection riêng

### 5. 👁️ View Likes List
- Click số lượt thích → mở modal
- **Tabs filtering**: All / Love / Haha / Wow / Sad / Angry
- **User list**: Avatar, tên, reaction icon
- **Scrollable**: Kéo xem danh sách dài
- **Real-time data**: Cập nhật khi có người like mới

---

## 📁 Files Structure

```
src/main/webapp/resources/client/
├── css/
│   └── PostInteractions.css    (~1000 lines)
└── js/
    └── PostInteractions.js     (~900 lines)

root/
├── post-interactions-demo.html  (demo page)
└── POST_INTERACTIONS_README.md  (documentation)
```

---

## 🔧 Setup & Usage

### 1. Include Files

**Trong HTML (head section):**
```html
<link rel="stylesheet" href="/resources/client/css/PostInteractions.css">
```

**Trước closing `</body>` tag:**
```html
<script src="/resources/client/js/PostInteractions.js"></script>
```

### 2. HTML Structure

**Post Card Template:**
```html
<div class="post-card" data-post-id="123">
    <!-- Header -->
    <div class="post-header">
        <img src="avatar.jpg" alt="User" class="post-avatar">
        <div class="post-author-info">
            <div class="post-author-name">Tên người dùng</div>
            <div class="post-timestamp">2 giờ trước • 🌍</div>
        </div>
        <button class="post-more-btn">⋮</button>
    </div>

    <!-- Content -->
    <div class="post-content">
        Nội dung bài viết...
    </div>

    <!-- Image (optional) -->
    <img src="post-image.jpg" alt="Post" class="post-image">

    <!-- Stats -->
    <div class="post-stats">
        <div class="post-stats-left">
            <div class="post-reaction-icons">
                <div class="post-reaction-icon reaction-like">👍</div>
                <div class="post-reaction-icon reaction-love">❤️</div>
            </div>
            <span class="post-likes-count">42</span>
        </div>
        <div class="post-stats-right">
            <span class="post-stat-item"><span class="post-comments-count">12</span> bình luận</span>
            <span class="post-stat-item"><span class="post-shares-count">5</span> chia sẻ</span>
        </div>
    </div>

    <!-- Actions -->
    <div class="post-actions">
        <button class="post-action-btn post-like-btn">
            <svg>...</svg>
            <span>Thích</span>
        </button>
        <button class="post-action-btn post-comment-btn">
            <svg>...</svg>
            <span>Bình luận</span>
        </button>
        <button class="post-action-btn post-share-btn">
            <svg>...</svg>
            <span>Chia sẻ</span>
        </button>
        <button class="post-action-btn post-save-btn">
            <svg>...</svg>
            <span>Lưu</span>
        </button>
    </div>

    <!-- Save Indicator -->
    <div class="post-saved-indicator">
        <svg>...</svg>
    </div>

    <!-- Comments Section -->
    <div class="post-comments-section">
        <!-- Comment Input -->
        <div class="comment-input-wrapper">
            <img src="user-avatar.jpg" alt="You" class="comment-avatar">
            <div class="comment-input-box">
                <input type="text" class="comment-input" placeholder="Viết bình luận...">
                <button class="comment-emoji-btn">😊</button>
                <button class="comment-send-btn">Gửi</button>
            </div>
        </div>

        <!-- Comments List -->
        <div class="comments-list">
            <!-- Comments will be rendered here -->
        </div>
    </div>
</div>
```

---

## 🎨 CSS Classes

### Post Card
- `.post-card` - Container chính
- `.post-header` - Header với avatar và tên
- `.post-content` - Nội dung bài viết
- `.post-image` - Ảnh bài viết
- `.post-stats` - Thống kê (likes, comments, shares)
- `.post-actions` - Các nút action

### Interaction States
- `.post-like-btn.liked` - Đã like (red color)
- `.post-save-btn.saved` - Đã save (purple color)
- `.post-saved-indicator` - Bookmark icon góc phải
- `.comment-like-action.liked` - Comment đã thích

### Reactions
- `.reactions-picker` - Bảng chọn emoji
- `.reaction-item` - Từng emoji trong bảng
- `.post-reaction-icon` - Icon emoji ở stats
- `.reaction-like/love/haha/wow/sad/angry` - Màu cho từng loại

### Comments
- `.comment-item` - Container comment
- `.comment-bubble` - Bubble chứa nội dung
- `.comment-replies` - Nested replies
- `.comment-actions` - Actions (Like, Reply)

### Modals
- `.share-modal-overlay` - Overlay share modal
- `.share-modal` - Share modal content
- `.likes-modal-overlay` - Overlay likes modal
- `.likes-modal` - Likes modal content

---

## 🚀 JavaScript API

### Global Object
```javascript
window.PostInteractions
```

### Methods

#### Like/Unlike Post
```javascript
// Like với reaction type
PostInteractions.likePost(postId, reactionType);
// reactionType: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

// Unlike post
PostInteractions.unlikePost(postId);
```

#### Save/Unsave Post
```javascript
PostInteractions.savePost(postId);
PostInteractions.unsavePost(postId);
```

#### Show Modals
```javascript
// Share modal
PostInteractions.showShareModal(postId);

// Likes list modal
PostInteractions.showLikesModal(postId);
```

### Event Handlers (Internal)

**Tất cả events được handle tự động qua event delegation:**

1. **Like button click**
   - Quick click → like
   - Long press (700ms) → show reactions picker

2. **Comment input**
   - Enter key → submit comment
   - "Gửi" button → submit comment

3. **Comment actions**
   - Click "Thích" → like comment
   - Click "Trả lời" → reply to comment

4. **Share button click**
   - Open share modal with 4 options

5. **Save button click**
   - Toggle save/unsave state

6. **Stats click**
   - Click likes count → show likes modal

---

## 🎬 Animations

### CSS Keyframes

#### 1. Flying Hearts
```css
@keyframes flyUp {
    0% {
        opacity: 1;
        transform: translateY(0) scale(1) rotate(0deg);
    }
    100% {
        opacity: 0;
        transform: translateY(-100px) scale(0.8) rotate(30deg);
    }
}
```
- Duration: 1s
- Position: Absolute tại vị trí click
- Emoji: ❤️ hoặc reaction icon

#### 2. Like Button Animation
```css
@keyframes likeAnimation {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
}
```
- Duration: 0.3s
- Trigger: Khi like/unlike

#### 3. Reactions Picker
```css
@keyframes reactionsSlideUp {
    from {
        opacity: 0;
        transform: translateY(10px) scale(0.8);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
```
- Duration: 0.3s
- Easing: ease-out

#### 4. Modal Animations
```css
@keyframes modalSlideUp {
    from {
        opacity: 0;
        transform: translateY(50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

#### 5. Comment Fade In
```css
@keyframes commentFadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

---

## 🎨 Color Scheme

### Reaction Colors
```css
Like:   #1877f2 (Facebook blue)
Love:   #f33e58 (Red)
Haha:   #f7b125 (Yellow)
Wow:    #f7b125 (Orange)
Sad:    #5890ff (Light blue)
Angry:  #e9710f (Red-orange)
```

### UI Colors
```css
Primary:    #1877f2 (Blue)
Success:    #42b72a (Green)
Danger:     #f02849 (Red)
Text:       #050505 (Black)
Secondary:  #65676b (Gray)
Border:     #e4e6eb (Light gray)
Background: #ffffff (White)
Hover:      #f0f2f5 (Light gray)
```

### Dark Mode
```css
Background: #18191a
Card:       #242526
Text:       #e4e6eb
Border:     #3e4042
```

---

## 📊 Mock Data

### Current Implementation
PostInteractions.js sử dụng mock data cho demo:

```javascript
// Mock likes data
function generateMockLikes(count) {
    const reactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    // Returns array of {id, name, avatar, reaction}
}

// Mock user data
const currentUser = {
    id: localStorage.getItem('currentUserId'),
    name: localStorage.getItem('currentUsername'),
    avatar: localStorage.getItem('currentUserAvatar')
};
```

---

## 🔌 Backend Integration (TODO)

### Required API Endpoints

#### 1. Like Post
```
POST /api/posts/{postId}/like
Body: { reactionType: "like" | "love" | ... }
Response: { success: true, likesCount: 43, userReaction: "like" }
```

#### 2. Unlike Post
```
DELETE /api/posts/{postId}/like
Response: { success: true, likesCount: 42 }
```

#### 3. Get Likes List
```
GET /api/posts/{postId}/likes?reactionType=all
Response: {
    likes: [
        { userId, username, avatar, reactionType, timestamp }
    ],
    total: 42
}
```

#### 4. Create Comment
```
POST /api/posts/{postId}/comments
Body: { content: "...", parentCommentId?: 123 }
Response: {
    comment: { id, userId, username, avatar, content, timestamp }
}
```

#### 5. Like Comment
```
POST /api/comments/{commentId}/like
Response: { success: true, likesCount: 5 }
```

#### 6. Share Post
```
POST /api/posts/{postId}/share
Body: { shareType: "newsfeed" | "story" | "message", caption: "..." }
Response: { success: true, shareId: 789 }
```

#### 7. Save Post
```
POST /api/posts/{postId}/save
DELETE /api/posts/{postId}/save
Response: { success: true }
```

---

## 🔥 WebSocket Integration (TODO)

### Real-time Updates

**Subscribe to post updates:**
```javascript
stompClient.subscribe(`/topic/posts/${postId}`, (message) => {
    const data = JSON.parse(message.body);
    
    switch(data.type) {
        case 'NEW_LIKE':
            updateLikesCount(postId, data.likesCount);
            break;
        case 'NEW_COMMENT':
            addCommentToUI(postId, data.comment);
            break;
        case 'NEW_SHARE':
            updateSharesCount(postId, data.sharesCount);
            break;
    }
});
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile: < 576px */
- Comment input full width
- Hide some stats text
- Smaller font sizes

/* Tablet: 576px - 768px */
- 2-column layout for share options
- Medium font sizes

/* Desktop: > 768px */
- Full layout
- Hover effects enabled
```

---

## 🎯 Best Practices

### 1. Performance
- ✅ Event delegation (1 listener for all posts)
- ✅ Debounce scroll events
- ✅ Lazy load comments
- ✅ GPU-accelerated animations (transform/opacity)

### 2. Accessibility
- ✅ ARIA labels cho buttons
- ✅ Keyboard navigation (Tab, Enter)
- ✅ Focus states
- ✅ Screen reader friendly

### 3. User Experience
- ✅ Instant feedback (optimistic UI)
- ✅ Loading states
- ✅ Error handling
- ✅ Smooth animations

### 4. Code Quality
- ✅ Modular functions
- ✅ Clear naming conventions
- ✅ Comments cho logic phức tạp
- ✅ Error boundaries

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Mock data**: Chưa connect backend API
2. **Local storage**: User data lưu trong localStorage
3. **No persistence**: Refresh page → mất data
4. **Single user**: Không có multi-user simulation

### TODO Items
- [ ] Backend API integration
- [ ] WebSocket real-time updates
- [ ] Image upload for comments
- [ ] Emoji picker for comments
- [ ] Comment editing/deleting
- [ ] Notification system integration
- [ ] Analytics tracking

---

## 🧪 Testing

### Manual Testing Checklist

**Like System:**
- [ ] Click "Thích" → like thành công
- [ ] Long-press "Thích" → hiện reactions picker
- [ ] Chọn emoji reaction → đổi reaction
- [ ] Click lại → unlike
- [ ] Flying hearts animation hoạt động
- [ ] Counter cập nhật đúng

**Comments:**
- [ ] Gõ comment + Enter → gửi thành công
- [ ] Click "Gửi" → gửi thành công
- [ ] Click "Trả lời" → hiện reply input
- [ ] Reply comment → nested comment hiển thị
- [ ] Like comment → đổi màu xanh
- [ ] Counter cập nhật

**Share:**
- [ ] Click "Chia sẻ" → mở modal
- [ ] 4 options hiển thị đầy đủ
- [ ] Nhập caption
- [ ] Confirm share
- [ ] Close modal

**Save:**
- [ ] Click "Lưu" → icon bookmark xuất hiện
- [ ] Click lại → unsave
- [ ] Visual state toggle

**View Likes:**
- [ ] Click likes count → mở modal
- [ ] Tabs filtering hoạt động
- [ ] List hiển thị đúng
- [ ] Scroll list

---

## 📞 Support

**Demo Page:** `post-interactions-demo.html`

**Files:**
- CSS: `src/main/webapp/resources/client/css/PostInteractions.css`
- JS: `src/main/webapp/resources/client/js/PostInteractions.js`

**Contact:**
- Project: Final-Project-Web
- Feature: Post Interactions System
- Priority: #3

---

## 📝 Changelog

### v1.0.0 (Initial Release)
- ✅ Like button với 6 emoji reactions
- ✅ Flying hearts/emojis animation
- ✅ Comments system với nested replies
- ✅ Share modal với 4 options
- ✅ Save/bookmark functionality
- ✅ View likes list modal
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Demo page

---

## 🎉 Summary

Hệ thống Post Interactions đã hoàn thiện với đầy đủ tính năng:
- ❤️ Like + 6 emoji reactions với flying animation
- 💬 Comments với nested replies
- 📤 Share với 4 options
- 🔖 Save/bookmark
- 👁️ View likes list

**Ready for:** Frontend testing, Backend integration, WebSocket setup

**Next Steps:**
1. Test demo page: `post-interactions-demo.html`
2. Integrate vào Home.html
3. Connect backend APIs
4. Add WebSocket real-time updates
