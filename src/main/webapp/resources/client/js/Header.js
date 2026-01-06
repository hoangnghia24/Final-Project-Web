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
        // stompClient.debug = null; // Bật lại log nếu cần debug

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

            // Lắng nghe thông báo
            stompClient.subscribe('/topic/notifications/' + currentUserId, function (message) {
                const body = JSON.parse(message.body);
                handleIncomingNotification(body);
            });

            // Lắng nghe tin nhắn
            stompClient.subscribe('/user/' + currentUserId + '/queue/messages', function (message) {
                let mBadge = parseInt($("#header-message-badge").text()) || 0;
                $("#header-message-badge").text(mBadge + 1).show();
            });
        }, function (error) {
            console.log("WS Error: " + error);
            setTimeout(connectWebSocket, 5000);
        });
    }

    // --- XỬ LÝ SỰ KIỆN CLICK (Dùng Event Delegation) ---

    // 1. Click Icon Thông báo
    $(document).on('click', '#notification-icon', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#notification-popup').toggleClass('show');
        $('#profile-dropdown').removeClass('show');
        $('#messages-popup').hide();
    });

    // 2. Click Icon Tin nhắn
    $(document).on('click', '#message-icon', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const popup = $('#messages-popup');
        if (popup.is(':visible')) {
            popup.hide();
        } else {
            popup.css('display', 'grid');
        }
        $('#notification-popup').removeClass('show');
        $('#profile-dropdown').removeClass('show');
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
        if (!$(e.target).closest('#notification-icon, #notification-popup, #profile-menu-container, #messages-popup, #message-icon').length) {
            $('.notification-popup').removeClass('show');
            $('.profile-dropdown').removeClass('show');
            $('#messages-popup').hide();
        }
    });

    // --- CÁC HÀM HỖ TRỢ ---

    function loadMyNotifications() {
        if (!currentUserId) return;
        const query = `query { getMyNotifications { id content isRead createdAt type targetId sender { fullName avatarUrl } } }`;
        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            headers: { "Authorization": "Bearer " + localStorage.getItem("accessToken") },
            data: JSON.stringify({ query: query }),
            success: function (response) {
                if (response.data && response.data.getMyNotifications) {
                    // FIX: Thêm || [] để đảm bảo không bao giờ truyền null vào hàm render
                    renderNotificationList(response.data.getMyNotifications || []);
                } else {
                    renderNotificationList([]); // Render rỗng nếu không có data
                }
            },
            error: function () {
                renderNotificationList([]); // Render rỗng nếu lỗi
            }
        });
    }

    function renderNotificationList(notifications) {
        const list = $("#notification-list");
        list.find(".notification-item").remove();

        // --- FIX LỖI "reading 'length' of undefined" TẠI ĐÂY ---
        if (!notifications || notifications.length === 0) {
            $("#notification-empty").show();
            return;
        }
        // -------------------------------------------------------

        $("#notification-empty").hide();

        notifications.forEach(n => {
            const isUnread = !n.isRead ? 'unread' : '';
            // Xử lý an toàn cho sender (tránh lỗi null)
            const senderName = n.sender ? n.sender.fullName : "Hệ thống";
            const avatar = (n.sender && n.sender.avatarUrl) ? n.sender.avatarUrl : 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + senderName;

            // Xử lý nội dung hiển thị
            let contentDisplay = n.content;
            if (n.type === "NEW_POST" && !n.content.includes("đăng")) contentDisplay = "vừa đăng một bài viết mới.";

            list.append(`
                <div class="notification-item ${isUnread}" data-id="${n.id}" data-target-id="${n.targetId}">
                    <div class="notification-avatar"><img src="${avatar}"></div>
                    <div class="notification-content">
                        <p class="notification-text"><strong>${senderName}</strong> ${contentDisplay}</p>
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
        console.log("Socket Data:", n);
        $("#notification-empty").hide();

        // Chuẩn hóa dữ liệu sender từ socket (đề phòng backend gửi cấu trúc khác)
        let senderName = "Thành viên";
        let senderAvatar = "";

        if (n.sender) {
            senderName = n.sender.fullName;
            senderAvatar = n.sender.avatarUrl;
        } else {
            senderName = n.senderName || "Thành viên";
            senderAvatar = n.senderAvatar;
        }

        if (!senderAvatar) {
            senderAvatar = 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + senderName;
        }

        const html = `
            <div class="notification-item unread" id="notif-${n.id || Date.now()}" data-target-id="${n.targetId || n.postId}">
                <div class="notification-avatar"><img src="${senderAvatar}"></div>
                <div class="notification-content">
                    <p class="notification-text"><strong>${senderName}</strong> ${n.content}</p>
                    <span class="notification-time">Vừa xong</span>
                </div>
                <div class="unread-dot"></div>
            </div>
        `;

        $("#notification-list").prepend(html);

        let count = (parseInt($("#notification-badge").text()) || 0) + 1;
        $("#notification-badge").text(count).show();

        // Hiệu ứng rung chuông
        $("#notification-icon").addClass("animate-shake");
        setTimeout(() => $("#notification-icon").removeClass("animate-shake"), 500);
    }

    $(document).on('click', '.notification-item', function () {
        const targetId = $(this).attr('data-target-id') || $(this).data('target-id');
        if (targetId) window.location.href = "/post-detail?id=" + targetId;
    });

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