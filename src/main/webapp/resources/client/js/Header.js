// Header profile menu & Realtime Notifications
$(document).ready(function () {
    console.log('Header.js loaded');

    // WebSocket connection
    let headerStompClient = null;
    let isConnected = false;

    // Load user avatar
    loadUserAvatar();

    // Kết nối Socket để nhận thông báo và tin nhắn
    connectHeaderWebSocket();

    const profileAvatar = document.getElementById('header-user-avatar');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileMenu = document.getElementById('profile-menu');
    const notificationPopup = document.getElementById('notification-popup');
    const notificationIcon = document.getElementById('notification-icon');
    const messageIcon = document.getElementById('message-icon');
    const messagesPopup = document.getElementById('messages-popup');

    // ============================================
    // 1. WEBSOCKET NOTIFICATION & CHAT
    // ============================================
    function connectHeaderWebSocket() {
        const currentUserId = localStorage.getItem('currentUserId');
        if (!currentUserId) {
            console.warn('Chưa đăng nhập, không kết nối WebSocket Header');
            return;
        }

        console.log('🔌 Connecting Header WebSocket...');
        const socket = new SockJS('/ws');
        headerStompClient = Stomp.over(socket);
        headerStompClient.debug = null; // Tắt log

        headerStompClient.connect({}, function (frame) {
            console.log('✅ Header WebSocket connected');
            isConnected = true;

            // 1. Subscribe Tin nhắn (Logic cũ)
            headerStompClient.subscribe('/user/' + currentUserId + '/queue/messages', function (message) {
                // Logic xử lý tin nhắn (giữ nguyên hoặc tách hàm)
                console.log('Received message:', message.body);
            });

            // 2. SUBSCRIBE THÔNG BÁO TỪ BẠN BÈ (LOGIC MỚI)
            // Lắng nghe kênh: /topic/notifications/{userId}
            headerStompClient.subscribe('/topic/notifications/' + currentUserId, function (message) {
                const notif = JSON.parse(message.body);
                console.log('🔔 New Notification:', notif);

                // Hiển thị thông báo lên UI
                handleRealtimeNotification(notif);
            });

        }, function (error) {
            console.error('Header WebSocket connection error:', error);
            setTimeout(connectHeaderWebSocket, 5000);
        });
    }

    function handleRealtimeNotification(notif) {
        // 1. Cập nhật Badge (Số đỏ trên chuông)
        const badge = document.getElementById('notification-badge');
        if (badge) {
            let count = parseInt(badge.textContent) || 0;
            badge.textContent = count + 1;
            badge.style.display = 'block';

            // Hiệu ứng rung chuông (Optional)
            if (notificationIcon) {
                notificationIcon.classList.add('shake-animation');
                setTimeout(() => notificationIcon.classList.remove('shake-animation'), 500);
            }
        }

        // 2. Thêm vào danh sách trong Popup
        const notificationList = document.getElementById('notification-list');
        if (notificationList) {
            // Xóa thông báo "Chưa có thông báo" nếu có
            const emptyState = notificationList.querySelector('.notification-empty');
            if (emptyState) emptyState.remove();

            // Tạo HTML cho thông báo mới
            const item = document.createElement('div');
            item.className = 'notification-item unread'; // Class unread để tô đậm
            item.innerHTML = `
                <div class="notification-avatar">
                    <img src="${notif.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}" alt="Avatar">
                </div>
                <div class="notification-content">
                    <div class="notification-text">${notif.content}</div>
                    <div class="notification-time">${notif.timeAgo || 'Vừa xong'}</div>
                </div>
                <div class="unread-dot"></div>
            `;

            // Click vào thông báo thì làm gì đó (ví dụ chuyển trang)
            item.addEventListener('click', function () {
                // Ví dụ: window.location.href = `/post/${notif.postId}`;
                alert("Chuyển đến bài viết ID: " + notif.postId);
                // Đánh dấu đã đọc...
                this.classList.remove('unread');
                this.querySelector('.unread-dot')?.remove();
            });

            // Chèn vào đầu danh sách
            notificationList.insertBefore(item, notificationList.firstChild);
        }
    }

    // ============================================
    // 2. CÁC XỬ LÝ SỰ KIỆN UI KHÁC (GIỮ NGUYÊN)
    // ============================================

    // Notification Popup Toggle
    if (notificationIcon && notificationPopup) {
        notificationIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            notificationPopup.classList.toggle('show');

            // Khi mở popup, có thể ẩn badge số lượng đi
            /*
            const badge = document.getElementById('notification-badge');
            if(badge) {
                badge.style.display = 'none';
                badge.textContent = '0';
            }
            */

            // Đóng các popup khác
            if (profileDropdown) profileDropdown.classList.remove('show');
            if (messagesPopup) messagesPopup.style.display = 'none';
        });

        notificationPopup.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    // Profile Menu Toggle
    if (profileAvatar && profileDropdown) {
        profileAvatar.addEventListener('click', function (e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            if (notificationPopup) notificationPopup.classList.remove('show');
            if (messagesPopup) messagesPopup.style.display = 'none';
        });

        profileDropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    // Load User Avatar
    function loadUserAvatar() {
        const currentUserStr = localStorage.getItem("currentUser");
        const currentUsername = currentUserStr ? JSON.parse(currentUserStr).username : null;
        if (!currentUsername) return;

        const graphqlData = {
            query: `query GetUserProfile($username: String!) {
                    getUserByUsername(username: $username) { username fullName avatarUrl }
                }`,
            variables: { username: currentUsername }
        };

        $.ajax({
            url: '/graphql', type: 'POST', contentType: 'application/json',
            data: JSON.stringify(graphqlData),
            success: function (response) {
                if (response.data && response.data.getUserByUsername) {
                    const user = response.data.getUserByUsername;
                    const avatarUrl = user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

                    // Update header avatar
                    const headerAvatar = document.getElementById('header-user-avatar');
                    if (headerAvatar) {
                        headerAvatar.style.backgroundImage = `url('${avatarUrl}')`;
                        headerAvatar.style.backgroundSize = 'cover';
                    }

                    // Update dropdown info
                    const dropdownAvatar = document.getElementById('dropdown-avatar');
                    if (dropdownAvatar) {
                        dropdownAvatar.style.backgroundImage = `url('${avatarUrl}')`;
                        dropdownAvatar.style.backgroundSize = 'cover';
                    }
                    const dropdownFullname = document.getElementById('dropdown-fullname');
                    if (dropdownFullname) dropdownFullname.textContent = user.fullName;
                }
            }
        });
    }

    // Message Icon Click (Giữ nguyên logic cũ của bạn)
    if (messageIcon) {
        messageIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            if (messagesPopup.style.display === 'none' || messagesPopup.style.display === '') {
                messagesPopup.style.display = 'grid';
            } else {
                messagesPopup.style.display = 'none';
            }
            if (notificationPopup) notificationPopup.classList.remove('show');
            if (profileDropdown) profileDropdown.classList.remove('show');
        });
        if (messagesPopup) messagesPopup.addEventListener('click', e => e.stopPropagation());
    }

    // Close all popups when click outside
    document.addEventListener('click', function (e) {
        if (profileDropdown && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
        if (notificationPopup && !notificationPopup.contains(e.target)) {
            notificationPopup.classList.remove('show');
        }
        if (messagesPopup && !messagesPopup.contains(e.target) && e.target !== messageIcon) {
            messagesPopup.style.display = 'none';
        }
    });
});