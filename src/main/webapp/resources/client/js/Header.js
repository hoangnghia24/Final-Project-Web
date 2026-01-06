$(document).ready(function () {
    console.log('Header.js initialized');

    let stompClient = null;
    const currentUserStr = localStorage.getItem("currentUser");
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const currentUserId = currentUser ? currentUser.id : null;

    // 1. Khởi tạo dữ liệu
    loadUserAvatar();
    loadMyNotifications();
    connectWebSocket();

    // --- LOGIC WEBSOCKET ---
    function connectWebSocket() {
        if (!currentUserId) return;
        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function (frame) {
            // Lắng nghe thông báo
            stompClient.subscribe('/topic/notifications/' + currentUserId, function (message) {
                handleIncomingNotification(JSON.parse(message.body));
            });
            // Lắng nghe tin nhắn
            stompClient.subscribe('/user/' + currentUserId + '/queue/messages', function (message) {
                let mBadge = parseInt($("#header-message-badge").text()) || 0;
                $("#header-message-badge").text(mBadge + 1).show();
            });
        }, function (error) {
            setTimeout(connectWebSocket, 5000);
        });
    }

    // --- XỬ LÝ SỰ KIỆN CLICK (Dùng Event Delegation để không bao giờ bị liệt nút) ---

    // 1. Click Icon Thông báo
    $(document).on('click', '#notification-icon', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#notification-popup').toggleClass('show');
        $('#profile-dropdown').removeClass('show');
        $('#messages-popup').hide();
        console.log('Notification toggled');
    });

    // 2. Click Icon Tin nhắn
    $(document).on('click', '#message-icon', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const popup = $('#messages-popup');
        if (popup.is(':visible')) {
            popup.hide();
        } else {
            popup.css('display', 'grid'); // Hiện dạng grid 2 cột theo style của bạn
        }
        $('#notification-popup').removeClass('show');
        $('#profile-dropdown').removeClass('show');
        console.log('Messages popup toggled');
    });

    // 3. Click Avatar Profile
    $(document).on('click', '#header-user-avatar', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#profile-dropdown').toggleClass('show');
        $('#notification-popup').removeClass('show');
        $('#messages-popup').hide();
    });

    // 4. Click bất kỳ đâu bên ngoài để đóng các Popup
    $(document).on('click', function (e) {
        // Nếu click KHÔNG nằm trong các khu vực menu/popup thì mới đóng
        if (!$(e.target).closest('#notification-icon, #notification-popup, #profile-menu-container, #messages-popup, #message-icon').length) {
            $('.notification-popup').removeClass('show');
            $('.profile-dropdown').removeClass('show');
            $('#messages-popup').hide();
        }
    });
    // --- CÁC HÀM HỖ TRỢ (GIỮ NGUYÊN LOGIC THẬT) ---
    function loadMyNotifications() {
        if (!currentUserId) return;
        const query = `query { getMyNotifications { id content isRead createdAt sender { fullName avatarUrl } } }`;
        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            headers: { "Authorization": "Bearer " + localStorage.getItem("accessToken") },
            data: JSON.stringify({ query: query }),
            success: function (response) {
                if (response.data && response.data.getMyNotifications) {
                    renderNotificationList(response.data.getMyNotifications);
                }
            }
        });
    }

    function renderNotificationList(notifications) {
        const list = $("#notification-list");
        list.find(".notification-item").remove();
        if (notifications.length === 0) {
            $("#notification-empty").show();
            return;
        }
        $("#notification-empty").hide();
        notifications.forEach(n => {
            const isUnread = !n.isRead ? 'unread' : '';
            const avatar = n.sender.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + n.sender.fullName;
            list.append(`
                <div class="notification-item ${isUnread}" data-id="${n.id}">
                    <div class="notification-avatar"><img src="${avatar}"></div>
                    <div class="notification-content">
                        <p class="notification-text"><strong>${n.sender.fullName}</strong> ${n.content}</p>
                        <span class="notification-time">${timeSince(new Date(n.createdAt))}</span>
                    </div>
                    ${!n.isRead ? '<div class="unread-dot"></div>' : ''}
                </div>
            `);
        });
        const unreadCount = notifications.filter(n => !n.isRead).length;
        if (unreadCount > 0) $("#notification-badge").text(unreadCount).show();
    }

    function handleIncomingNotification(n) {
        $("#notification-empty").hide();
        const avatar = n.sender.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + n.sender.fullName;
        $("#notification-list").prepend(`
            <div class="notification-item unread" id="notif-${n.id}">
                <div class="notification-avatar"><img src="${avatar}"></div>
                <div class="notification-content">
                    <p class="notification-text"><strong>${n.sender.fullName}</strong> ${n.content}</p>
                    <span class="notification-time">Vừa xong</span>
                </div>
                <div class="unread-dot"></div>
            </div>
        `);
        let count = (parseInt($("#notification-badge").text()) || 0) + 1;
        $("#notification-badge").text(count).show();
    }

    function loadUserAvatar() {
        if (!currentUser) return;
        const query = `query { getUserByUsername(username: "${currentUser.username}") { avatarUrl fullName } }`;
        $.ajax({
            url: '/graphql', type: 'POST', contentType: 'application/json',
            data: JSON.stringify({ query: query }),
            success: function (r) {
                if (r.data && r.data.getUserByUsername) {
                    const u = r.data.getUserByUsername;
                    const url = u.avatarUrl || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png';
                    $('#header-user-avatar, #dropdown-avatar').css('background-image', `url('${url}')`);
                    $('#dropdown-fullname').text(u.fullName);
                }
            }
        });
    }

    function timeSince(date) {
        let seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return "Vừa xong";
        let interval = seconds / 3600;
        if (interval > 24) return Math.floor(interval / 24) + " ngày trước";
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        return Math.floor(seconds / 60) + " phút trước";
    }

    // Dark Mode Logic
    if (localStorage.getItem('darkMode') === 'enabled') document.body.classList.add('dark-mode');
    $('#dark-mode-checkbox').on('change', function () {
        document.body.classList.toggle('dark-mode', this.checked);
        localStorage.setItem('darkMode', this.checked ? 'enabled' : 'disabled');
    });
});