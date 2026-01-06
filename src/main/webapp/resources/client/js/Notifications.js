/**
 * Notifications.js - Real-time Notification System
 * TFT Social Network
 */

(function () {
    'use strict';

    // State Management
    let notifications = [];
    let unreadCount = 0;
    let currentFilter = 'all'; // 'all' or 'unread'
    let notificationStompClient = null;
    let isNotificationConnected = false;

    // DOM Elements (will be initialized after DOM ready)
    let notificationIcon;
    let notificationPopup;
    let notificationBadge;
    let notificationList;
    let markAllReadBtn;
    let notificationTabs;

    // Initialize
    function init() {
        console.log('🔔 Initializing Notification System...');

        // Mock user ID for testing if not exists
        if (!localStorage.getItem('currentUserId')) {
            console.warn('⚠️ No currentUserId in localStorage, using mock ID');
            localStorage.setItem('currentUserId', '1');
        }

        // Get DOM elements
        notificationIcon = document.getElementById('notification-icon');
        notificationPopup = document.getElementById('notification-popup');
        notificationBadge = document.getElementById('notification-badge');
        notificationList = document.getElementById('notification-list');
        markAllReadBtn = document.getElementById('mark-all-read-btn');
        notificationTabs = document.querySelectorAll('.notification-tab');

        console.log('📍 DOM Elements found:', {
            icon: !!notificationIcon,
            popup: !!notificationPopup,
            badge: !!notificationBadge,
            list: !!notificationList,
            markAllBtn: !!markAllReadBtn,
            tabs: notificationTabs.length
        });

        if (!notificationIcon || !notificationPopup) {
            console.error('❌ Required DOM elements not found! Make sure Header.html is loaded.');
            return;
        }

        // Setup event listeners
        setupEventListeners();

        // Load initial notifications
        loadNotifications();

        // Connect to WebSocket
        connectNotificationWebSocket();

        // Update relative times every minute
        setInterval(updateRelativeTimes, 60000);

        console.log('✅ Notification system initialized successfully!');
    }

    // Setup Event Listeners
    function setupEventListeners() {
        console.log('🎯 Setting up event listeners...');

        // Toggle notification popup
        if (notificationIcon) {
            notificationIcon.addEventListener('click', function (e) {
                e.stopPropagation();
                console.log('🔔 Notification icon clicked');
                toggleNotificationPopup();
            });
            console.log('✅ Notification icon listener added');
        } else {
            console.warn('⚠️ Notification icon not found!');
        }

        // Close popup when clicking outside
        document.addEventListener('click', function (e) {
            if (notificationPopup && !notificationPopup.contains(e.target) && e.target !== notificationIcon) {
                closeNotificationPopup();
            }
        });

        // Mark all as read
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('✅ Mark all as read clicked');
                markAllAsRead();
            });
            console.log('✅ Mark all button listener added');
        } else {
            console.warn('⚠️ Mark all read button not found!');
        }

        // Filter tabs
        if (notificationTabs && notificationTabs.length > 0) {
            notificationTabs.forEach((tab, index) => {
                tab.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const filter = this.getAttribute('data-filter');
                    console.log('🔄 Filter tab clicked:', filter);
                    switchFilter(filter);
                });
            });
            console.log('✅ Filter tabs listeners added:', notificationTabs.length);
        } else {
            console.warn('⚠️ Notification tabs not found!');
        }
    }

    // Toggle Notification Popup
    function toggleNotificationPopup() {
        console.log('🔄 Toggle notification popup called');
        if (!notificationPopup) {
            console.error('❌ Notification popup element not found!');
            return;
        }

        if (notificationPopup.classList.contains('show')) {
            console.log('📪 Closing popup');
            closeNotificationPopup();
        } else {
            console.log('📬 Opening popup');
            openNotificationPopup();
        }
    }

    function openNotificationPopup() {
        if (!notificationPopup || !notificationIcon) {
            console.error('❌ Cannot open popup - elements not found');
            return;
        }
        notificationPopup.classList.add('show');
        notificationIcon.classList.add('active');
        console.log('✅ Notification popup opened');
    }

    function closeNotificationPopup() {
        if (!notificationPopup || !notificationIcon) return;
        notificationPopup.classList.remove('show');
        notificationIcon.classList.remove('active');
        console.log('✅ Notification popup closed');
    }

    // Load Notifications from Server (Mock Data for Frontend)
    function loadNotifications() {
        console.log('📥 Loading notifications...');

        // Mock data for frontend demo
        const mockNotifications = [
            {
                id: 1,
                type: 'like',
                actorName: 'Nguyễn Văn A',
                actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=user1',
                action: 'đã thích bài viết của bạn',
                targetId: 123,
                targetType: 'post',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                isRead: false
            },
            {
                id: 2,
                type: 'comment',
                actorName: 'Trần Thị B',
                actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=user2',
                action: 'đã bình luận',
                content: 'Bài viết hay quá! 👍',
                targetId: 123,
                targetType: 'post',
                timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                isRead: false
            },
            {
                id: 3,
                type: 'friend',
                actorName: 'Lê Văn C',
                actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=user3',
                action: 'đã gửi lời mời kết bạn',
                targetId: 456,
                targetType: 'friendship',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                isRead: false
            },
            {
                id: 4,
                type: 'like',
                actorName: 'Phạm Thị D',
                actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=user4',
                action: 'đã thích bình luận của bạn',
                targetId: 789,
                targetType: 'comment',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                isRead: true
            },
            {
                id: 5,
                type: 'friend',
                actorName: 'Hoàng Văn E',
                actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=user5',
                action: 'đã chấp nhận lời mời kết bạn',
                targetId: 999,
                targetType: 'friendship',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                isRead: true
            }
        ];

        notifications = mockNotifications;
        updateUnreadCount();
        renderNotifications();
    }

    // Render Notifications
    function renderNotifications() {
        if (!notificationList) return;

        // Filter notifications based on current filter
        let filteredNotifications = notifications;
        if (currentFilter === 'unread') {
            filteredNotifications = notifications.filter(n => !n.isRead);
        }

        // Clear list
        notificationList.innerHTML = '';

        if (filteredNotifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <p>${currentFilter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}</p>
                </div>
            `;
            return;
        }

        // Render each notification
        filteredNotifications.forEach(notification => {
            const notificationEl = createNotificationElement(notification);
            notificationList.appendChild(notificationEl);
        });
    }

    // Create Notification Element
    function createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${notification.isRead ? '' : 'unread'}`;
        div.setAttribute('data-notification-id', notification.id);

        // Get icon for notification type
        const typeIcon = getNotificationTypeIcon(notification.type);

        // Format content based on type
        let contentHTML = `<strong>${escapeHtml(notification.actorName)}</strong> ${escapeHtml(notification.action)}`;
        if (notification.content) {
            contentHTML += `: "${escapeHtml(notification.content)}"`;
        }

        div.innerHTML = `
            <div class="notification-avatar">
                <img src="${notification.actorAvatar}" alt="${escapeHtml(notification.actorName)}">
                <div class="notification-type-icon ${notification.type}">
                    ${typeIcon}
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-text">${contentHTML}</div>
                <div class="notification-time" data-timestamp="${notification.timestamp}">
                    ${formatRelativeTime(new Date(notification.timestamp))}
                </div>
                ${notification.type === 'friend' && !notification.isRead ? createFriendRequestButtons() : ''}
            </div>
            ${!notification.isRead ? '<div class="unread-dot"></div>' : ''}
        `;

        // Add click handler
        div.addEventListener('click', function (e) {
            // Don't navigate if clicking on action buttons
            if (e.target.classList.contains('notification-btn')) {
                return;
            }
            handleNotificationClick(notification);
        });

        // Add button handlers for friend requests
        if (notification.type === 'friend' && !notification.isRead) {
            setTimeout(() => {
                const acceptBtn = div.querySelector('.notification-btn.accept');
                const declineBtn = div.querySelector('.notification-btn.decline');

                if (acceptBtn) {
                    acceptBtn.addEventListener('click', () => handleFriendRequest(notification.id, 'accept'));
                }
                if (declineBtn) {
                    declineBtn.addEventListener('click', () => handleFriendRequest(notification.id, 'decline'));
                }
            }, 0);
        }

        return div;
    }

    // Get Notification Type Icon
    function getNotificationTypeIcon(type) {
        const icons = {
            like: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
            comment: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
            friend: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            message: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
        };
        return icons[type] || icons.like;
    }

    // Create Friend Request Buttons
    function createFriendRequestButtons() {
        return `
            <div class="notification-actions">
                <button class="notification-btn accept">Chấp nhận</button>
                <button class="notification-btn decline">Từ chối</button>
            </div>
        `;
    }

    // Handle Notification Click
    function handleNotificationClick(notification) {
        console.log('🔔 Notification clicked:', notification);

        // Mark as read
        markNotificationAsRead(notification.id);

        // Navigate based on type
        const routes = {
            like: `/post/${notification.targetId}`,
            comment: `/post/${notification.targetId}`,
            friend: `/profile/${notification.targetId}`,
            message: `/messages`
        };

        const route = routes[notification.type];
        if (route) {
            // Close popup
            closeNotificationPopup();

            // Navigate (uncomment when backend is ready)
            // window.location.href = route;

            console.log('📍 Would navigate to:', route);
        }
    }

    // Handle Friend Request
    function handleFriendRequest(notificationId, action) {
        console.log(`👥 Friend request ${action}:`, notificationId);

        // Mock API call
        setTimeout(() => {
            // Remove notification
            notifications = notifications.filter(n => n.id !== notificationId);
            updateUnreadCount();
            renderNotifications();

            // Show feedback
            showToast(`Đã ${action === 'accept' ? 'chấp nhận' : 'từ chối'} lời mời kết bạn`);
        }, 300);
    }

    // Mark Notification as Read
    function markNotificationAsRead(notificationId) {
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
            notification.isRead = true;
            updateUnreadCount();
            renderNotifications();

            // Update DOM immediately for smooth UX
            const notificationEl = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notificationEl) {
                notificationEl.classList.remove('unread');
                const unreadDot = notificationEl.querySelector('.unread-dot');
                if (unreadDot) {
                    unreadDot.remove();
                }
            }

            console.log('✅ Notification marked as read:', notificationId);
        }
    }

    // Mark All as Read
    function markAllAsRead() {
        console.log('✅ Marking all notifications as read...');

        notifications.forEach(n => n.isRead = true);
        updateUnreadCount();
        renderNotifications();

        showToast('Đã đánh dấu tất cả là đã đọc');
    }

    // Switch Filter
    function switchFilter(filter) {
        console.log('🔄 Switching filter to:', filter);
        currentFilter = filter;

        // Update active tab
        if (notificationTabs && notificationTabs.length > 0) {
            notificationTabs.forEach(tab => {
                if (tab.getAttribute('data-filter') === filter) {
                    tab.classList.add('active');
                    console.log('✅ Tab activated:', filter);
                } else {
                    tab.classList.remove('active');
                }
            });
        }

        renderNotifications();
        console.log('✅ Filter switched and notifications re-rendered');
    }

    // Update Unread Count
    function updateUnreadCount() {
        unreadCount = notifications.filter(n => !n.isRead).length;

        if (notificationBadge) {
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                notificationBadge.style.display = 'block';
            } else {
                notificationBadge.style.display = 'none';
            }
        }

        console.log('🔢 Unread count updated:', unreadCount);
    }

    // Connect to WebSocket for Real-time Notifications
    function connectNotificationWebSocket() {
        const currentUserId = localStorage.getItem('currentUserId');
        if (!currentUserId) {
            console.warn('⚠️ No user ID, skipping notification WebSocket connection');
            return;
        }

        console.log('🔌 Connecting to notification WebSocket...');

        const socket = new SockJS('/ws');
        notificationStompClient = Stomp.over(socket);
        notificationStompClient.debug = null; // Disable debug logs

        notificationStompClient.connect({}, function (frame) {
            console.log('✅ Notification WebSocket connected:', currentUserId);
            isNotificationConnected = true;

            // Subscribe to user's notification queue
            notificationStompClient.subscribe('/user/' + currentUserId + '/queue/notifications', function (message) {
                const notification = JSON.parse(message.body);
                console.log('🔔 New notification received:', notification);
                handleNewNotification(notification);
            });
        }, function (error) {
            console.error('❌ Notification WebSocket connection error:', error);
            isNotificationConnected = false;

            // Reconnect after 5 seconds
            setTimeout(connectNotificationWebSocket, 5000);
        });
    }

    // Handle New Notification from WebSocket
    function handleNewNotification(notification) {
        // Add to beginning of array
        notifications.unshift(notification);

        // Update UI
        updateUnreadCount();
        renderNotifications();

        // Show browser notification if permission granted
        showBrowserNotification(notification);

        // Play sound (optional)
        playNotificationSound();

        console.log('✨ New notification added:', notification);
    }

    // Show Browser Notification
    function showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = 'TFT - Thông báo mới';
            const options = {
                body: `${notification.actorName} ${notification.action}`,
                icon: notification.actorAvatar,
                badge: '/favicon.ico',
                tag: 'notification-' + notification.id
            };

            const browserNotification = new Notification(title, options);

            browserNotification.onclick = function () {
                window.focus();
                handleNotificationClick(notification);
                browserNotification.close();
            };

            setTimeout(() => browserNotification.close(), 5000);
        }
    }

    // Play Notification Sound
    function playNotificationSound() {
        // Create a simple beep sound
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRE');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Could not play notification sound'));
        } catch (e) {
            // Silently fail if audio not supported
        }
    }

    // Update Relative Times
    function updateRelativeTimes() {
        const timeElements = document.querySelectorAll('.notification-time[data-timestamp]');
        timeElements.forEach(el => {
            const timestamp = el.getAttribute('data-timestamp');
            if (timestamp) {
                el.textContent = formatRelativeTime(new Date(timestamp));
            }
        });
    }

    // Format Relative Time
    function formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay === 1) return 'Hôm qua';
        if (diffDay < 7) return `${diffDay} ngày trước`;
        if (diffDay < 30) return `${Math.floor(diffDay / 7)} tuần trước`;

        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // Show Toast Message
    function showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Request Notification Permission
    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('🔔 Notification permission:', permission);
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            console.log('📄 DOM loaded, initializing notifications...');
            init();
        });
    } else {
        // DOM already loaded
        console.log('📄 DOM already loaded, initializing notifications immediately...');
        // Use setTimeout to ensure all scripts are loaded
        setTimeout(init, 100);
    }

    // Request notification permission after 5 seconds
    setTimeout(requestNotificationPermission, 5000);

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
        }
    `;

    // Add styles after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            document.head.appendChild(style);
        });
    } else {
        document.head.appendChild(style);
    }

    $(document).ready(function () {
        // Mỗi khi trang load, lấy danh sách thông báo cũ từ DB
        loadMyNotifications();
    });

    function loadMyNotifications() {
        const query = `
        query {
            getMyNotifications {
                id
                content
                type
                isRead
                createdAt
                sender {
                    fullName
                    avatarUrl
                }
            }
        }
    `;

        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            data: JSON.stringify({ query: query }),
            success: function (response) {
                if (response.data && response.data.getMyNotifications) {
                    renderNotifications(response.data.getMyNotifications);
                }
            }
        });
    }

    function renderNotifications(notifications) {
        const listContainer = $("#notification-list");
        listContainer.empty(); // Xóa sạch dữ liệu cũ/ảo

        if (notifications.length === 0) {
            listContainer.append('<p class="text-center p-3">Không có thông báo nào.</p>');
            return;
        }

        notifications.forEach(n => {
            const isUnread = !n.isRead ? 'unread' : '';
            const avatar = n.sender.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + n.sender.fullName;

            const html = `
            <div class="notification-item ${isUnread}" onclick="handleNotificationClick(${n.id})">
                <div class="notification-avatar">
                    <img src="${avatar}" alt="avatar">
                </div>
                <div class="notification-content">
                    <p class="notification-text">
                        <strong>${n.sender.fullName}</strong> ${n.content}
                    </p>
                    <span class="notification-time">${timeSince(new Date(n.createdAt))}</span>
                </div>
                ${!n.isRead ? '<div class="unread-dot"></div>' : ''}
            </div>
        `;
            listContainer.append(html);
        });

        // Cập nhật con số trên icon chuông
        const unreadCount = notifications.filter(n => !n.isRead).length;
        updateBadgeCount(unreadCount);
    }

    function updateBadgeCount(count) {
        const badge = $(".notification-badge");
        if (count > 0) {
            badge.text(count).show();
        } else {
            badge.hide();
        }
    }
    function timeSince(date) {
        var seconds = Math.floor((new Date() - date) / 1000);
        var interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return "Vừa xong";
    }

})();
