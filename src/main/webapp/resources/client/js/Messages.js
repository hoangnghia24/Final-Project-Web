/**
 * Messages.js - Real-time Chat UI for MXH Social Network
 * Fixes: Avatar Header Update, Retract Message
 */

$(document).ready(function () {
    console.log('Messages.js loaded - MXH Chat System');

    // --- CẤU HÌNH TỰ ĐỘNG GỬI TOKEN ---
    $.ajaxSetup({
        beforeSend: function (xhr) {
            const token = localStorage.getItem('accessToken');
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
        }
    });

    // State Management
    let currentChatUserId = null;
    let currentChatUserName = '';
    let conversations = [];
    let stompClient = null;
    let searchTimeout = null;

    // DOM Elements
    const emptyState = $('#emptyState');
    const chatActive = $('#chatActive');
    const newMessageForm = $('#newMessageForm');
    const conversationsList = $('#conversationsList');
    const messagesArea = $('#messagesArea');
    const messageInput = $('#messageInput');
    const sendBtn = $('#sendMessageBtn');
    const newMessageBtn = $('#newMessageBtn');
    const startNewMessageBtn = $('#startNewMessage');
    const closeFormBtn = $('#closeFormBtn');
    const recipientInput = $('#recipientInput');
    const sendNewMessageBtn = $('#sendNewMessageBtn');
    const searchInput = $('#searchConversations');
    const imageUploadInput = $('#imageUploadInput');
    const attachImageBtn = $('#attachImageBtn');
    const emojiBtn = $('#emojiBtn');
    const emojiPicker = $('#emojiPicker');

    // Initialize
    loadConversations();
    setupEventListeners();
    connectWebSocket();

    /**
     * Connect to WebSocket
     */
    function connectWebSocket() {
        const currentUserId = localStorage.getItem('currentUserId');

        if (!currentUserId) {
            console.warn("Chưa có User ID, không kết nối socket.");
            return;
        }

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function (frame) {
            console.log('✅ WebSocket connected');

            // Subscribe theo ID của mình
            stompClient.subscribe('/topic/chat/' + currentUserId, function (message) {
                const data = JSON.parse(message.body);

                // Xử lý tín hiệu thu hồi
                if (data.type === 'RETRACT') {
                    handleRetractSignal(data);
                } else {
                    handleIncomingMessage(data);
                }
            });

        }, function (error) {
            console.error('❌ WebSocket connection error:', error);
            setTimeout(connectWebSocket, 5000);
        });
    }

    function handleRetractSignal(data) {
        const msgId = data.messageId;
        const msgElement = $(`#msg-${msgId}`);
        if (msgElement.length > 0) {
            msgElement.find('.message-bubble').html('<em style="color:#999; font-size: 13px;">Tin nhắn đã bị thu hồi</em>');
            msgElement.find('.btn-retract').remove();
            msgElement.find('img:not(.message-avatar)').remove();
        }
    }

    function handleIncomingMessage(messageData) {
        const currentUserId = parseInt(localStorage.getItem('currentUserId'));
        const otherUserId = parseInt(messageData.senderId) === currentUserId
            ? parseInt(messageData.receiverId)
            : parseInt(messageData.senderId);

        if (parseInt(currentChatUserId) === parseInt(otherUserId)) {
            appendMessage(messageData, currentUserId);
        }

        if (!searchInput.val().trim()) {
            setTimeout(() => { loadConversations(); }, 500);
        }
    }

    function appendMessage(msg, currentUserId) {
        const isSent = msg.senderId == currentUserId;
        const messageClass = isSent ? 'sent' : 'received';
        const time = formatTime(msg.sentAt || msg.timestamp);

        let messageHtml = `<div class="message-group"><div class="message ${messageClass}" id="msg-${msg.id}">`;

        if (!isSent) {
            messageHtml += `<img src="${msg.senderAvatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + msg.senderId}" class="message-avatar">`;
        }

        let contentHtml = '';
        if (msg.isRetracted) {
            contentHtml = '<em style="color:#999; font-style:italic;">Tin nhắn đã bị thu hồi</em>';
        } else {
            contentHtml = renderMessageContent(msg.content);
        }

        messageHtml += `
            <div class="message-content">
                <div class="message-bubble">${contentHtml}</div>
                <div class="message-meta" style="display:flex; align-items:center; gap:5px;">
                    <span class="message-time">${time}</span>
                    ${(isSent && !msg.isRetracted) ?
                `<i class="fas fa-undo btn-retract" 
                            onclick="window.retractMessage(${msg.id})" 
                            title="Thu hồi" 
                            style="cursor:pointer; font-size:10px; color:#ccc; margin-left: 5px;"></i>`
                : ''}
                </div>
            </div>
        `;
        messageHtml += '</div></div>';

        messagesArea.append(messageHtml);
        setTimeout(() => { scrollToBottom(); }, 50);
    }

    /**
     * Setup Event Listeners
     */
    function setupEventListeners() {
        conversationsList.on('click', '.conversation-item', function () {
            const rawId = $(this).attr("data-user-id");
            const userId = parseInt(rawId);
            const userName = $(this).find('.conversation-name').text();

            // [MỚI] Lấy src ảnh avatar từ item trong danh sách bên trái
            let avatarUrl = $(this).find('.conversation-avatar img').attr('src');
            // Fallback nếu không lấy được ảnh
            if (!avatarUrl) {
                avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${userName}`;
            }

            if (isNaN(userId)) return;

            // Cập nhật tên trên header ngay lập tức
            $('#chatUserName').text(userName);

            if (currentChatUserId !== userId) {
                // Truyền thêm avatarUrl vào hàm openChat
                openChat(userId, userName, avatarUrl);
                if (searchInput.val().trim() !== "") {
                    searchInput.val("");
                }
            }

            $('.conversation-item').removeClass('active');
            $(this).addClass('active');
            $(this).find('.unread-badge').fadeOut();
        });

        sendBtn.on('click', sendMessage);
        messageInput.on('keypress', function (e) {
            if (e.which === 13 && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        searchInput.on('input', debounce(handleSidebarSearch, 300));

        newMessageBtn.on('click', showNewMessageForm);
        startNewMessageBtn.on('click', showNewMessageForm);
        closeFormBtn.on('click', hideNewMessageForm);
        attachImageBtn.on('click', function () { imageUploadInput.trigger('click'); });
        imageUploadInput.on('change', handleImageUpload);

        emojiBtn.on('click', function (e) {
            e.stopPropagation();
            const isShown = emojiPicker.is(':visible');
            $('.emoji-picker-visible').hide().removeClass('emoji-picker-visible');
            if (!isShown) emojiPicker.show().addClass('emoji-picker-visible');
        });
        $(document).on('click', function () { emojiPicker.hide().removeClass('emoji-picker-visible'); });
        emojiPicker.on('click', function (e) { e.stopPropagation(); });
        emojiPicker.on('click', 'span', function () {
            insertAtCursor($('#messageInput')[0], $(this).text());
        });
    }

    function handleSidebarSearch() {
        const query = searchInput.val().trim();
        if (query === "") {
            loadConversations();
            return;
        }

        $.ajax({
            url: '/api/messages/search-friends',
            method: 'GET',
            data: { query: query },
            success: function (friends) {
                if (!Array.isArray(friends)) return;
                renderSearchResults(friends);
            },
            error: function (xhr) {
                console.error("Lỗi tìm kiếm:", xhr.status);
            }
        });
    }

    function renderSearchResults(friends) {
        conversationsList.empty();
        if (friends.length === 0) {
            conversationsList.html('<div class="text-center p-3 text-muted">Không tìm thấy kết quả</div>');
            return;
        }

        const html = friends.map(friend => {
            const isActive = (parseInt(currentChatUserId) === friend.id) ? 'active' : '';
            const avatarUrl = friend.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${friend.username}`;

            return `
            <div class="conversation-item ${isActive}" data-user-id="${friend.id}">
                <div class="conversation-avatar">
                    <img src="${avatarUrl}" alt="${friend.fullName}">
                </div>
                <div class="conversation-content">
                    <div class="conversation-header">
                        <span class="conversation-name">${friend.fullName}</span>
                    </div>
                    <div class="conversation-preview" style="color:#2e89ff">Nhấn để nhắn tin</div>
                </div>
            </div>`;
        }).join('');
        conversationsList.html(html);
    }

    function loadConversations() {
        const currentUserId = localStorage.getItem('currentUserId');
        if (!currentUserId) return;

        $.ajax({
            url: '/api/messages/conversations',
            method: 'GET',
            data: { userId: currentUserId },
            success: function (data) {
                if (!Array.isArray(data)) return;
                conversations = data;
                renderConversations(data);
            },
            error: function (xhr) {
                console.error('Lỗi tải danh sách chat:', xhr.status);
            }
        });
    }

    function renderConversations(partners) {
        if (!Array.isArray(partners)) return;

        if (partners.length === 0) {
            conversationsList.html('<div class="text-center p-4 text-muted">Chưa có tin nhắn nào.<br>Tìm kiếm bạn bè để bắt đầu!</div>');
            return;
        }

        const currentUserId = parseInt(localStorage.getItem('currentUserId'));

        const sorted = partners.slice().sort((a, b) => {
            const da = parseDate(a.lastMessageTime) || new Date(0);
            const db = parseDate(b.lastMessageTime) || new Date(0);
            return db - da;
        });

        const html = sorted.map(partner => {
            const hasUnread = (partner.unreadCount || 0) > 0;
            const isFromOther = partner.lastMessageSenderId && partner.lastMessageSenderId != currentUserId;
            const isActive = (parseInt(currentChatUserId) === partner.id) ? 'active' : '';

            let timeStr = '';
            if (partner.lastMessageTime) {
                const d = parseDate(partner.lastMessageTime);
                if (d) timeStr = formatRelativeTime(d);
            }

            let rawText = partner.lastMessage || 'Bắt đầu trò chuyện...';
            // Nếu tin nhắn là ảnh (bắt đầu bằng IMG::)
            if (rawText.startsWith('IMG::')) {
                rawText = '[Hình ảnh]';
            }

            const previewHtml = (partner.lastMessageSenderId == currentUserId)
                ? `<span style="font-weight:700">Bạn:</span> ${escapeHtml(rawText)}`
                : `${escapeHtml(rawText)}`;
            const msgStyle = (hasUnread && isFromOther) ? 'font-weight:700; color:#1c1c1c;' : 'font-weight:400; color:#7c7c7c;';

            return `
            <div class="conversation-item ${isActive}" data-user-id="${partner.id}">
                <div class="conversation-avatar">
                    <img src="${partner.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + partner.id}" alt="">
                </div>
                <div class="conversation-content">
                    <div class="conversation-header">
                        <span class="conversation-name">${partner.fullName}</span>
                        <span class="conversation-time">${timeStr}</span>
                    </div>
                    <div class="conversation-preview" style="${msgStyle}">${previewHtml}</div>
                </div>
                ${hasUnread ? `<div class="unread-badge">${partner.unreadCount}</div>` : ''}
            </div>`;
        }).join('');

        conversationsList.html(html);
    }

    /**
     * [FIXED] Open Chat Logic: Update Avatar Header
     */
    function openChat(userId, userName, avatarUrl) {
        currentChatUserId = parseInt(userId);
        currentChatUserName = userName;

        emptyState.hide();
        newMessageForm.hide();
        chatActive.show().css('display', 'flex');

        // Cập nhật Tên
        $('#chatUserName').text(userName);

        // [MỚI] Cập nhật Avatar trên header chat
        // Tìm thẻ img có class chat-avatar nằm trong chat-header
        if (avatarUrl) {
            $('.chat-header .chat-avatar').attr('src', avatarUrl);
        }

        loadMessages(userId);
        markConversationAsRead(userId);
    }

    function loadMessages(userId) {
        const currentUserId = localStorage.getItem('currentUserId');
        messagesArea.html('<div class="text-center mt-4"><div class="spinner-border text-primary" role="status"></div></div>');

        $.ajax({
            url: '/api/messages/conversation',
            method: 'GET',
            data: { userId1: currentUserId, userId2: userId },
            success: function (messages) {
                messagesArea.empty();

                if (!Array.isArray(messages)) return;

                if (messages.length === 0) {
                    messagesArea.html('<div class="text-center p-4 text-muted">Hãy bắt đầu cuộc trò chuyện!</div>');
                } else {
                    renderMessages(messages, currentUserId);
                }
                scrollToBottom();
            },
            error: function () {
                messagesArea.html('<div class="text-center text-danger">Lỗi tải tin nhắn</div>');
            }
        });
    }

    function renderMessages(messages, currentUserId) {
        if (!Array.isArray(messages)) return;

        const sorted = messages.slice().sort((a, b) => {
            const da = parseDate(a.sentAt || a.timestamp) || new Date(0);
            const db = parseDate(b.sentAt || b.timestamp) || new Date(0);
            return da - db;
        });

        messagesArea.empty();
        sorted.forEach(msg => {
            appendMessage(msg, currentUserId);
        });
    }

    function sendMessage() {
        const content = messageInput.val().trim();
        if (!content || !currentChatUserId) return;

        const senderId = parseInt(localStorage.getItem('currentUserId'));
        const now = new Date();

        const messageData = {
            senderId: senderId,
            receiverId: currentChatUserId,
            content: content,
            timestamp: now.toISOString()
        };

        if (stompClient && stompClient.connected) {
            stompClient.send('/app/chat', {}, JSON.stringify(messageData));
        } else {
            console.warn("⚠️ WebSocket chưa kết nối");
        }

        messageInput.val('');

        if (!searchInput.val().trim()) {
            setTimeout(() => { loadConversations(); }, 300);
        }
    }

    function markConversationAsRead(otherUserId) {
        const currentUserId = localStorage.getItem('currentUserId');
        $.get(`/api/messages/conversation?userId1=${currentUserId}&userId2=${otherUserId}`, function (messages) {
            if (Array.isArray(messages)) {
                messages.forEach(msg => {
                    if (msg.senderId == otherUserId && !msg.isRead) {
                        $.post(`/api/messages/read?messageId=${msg.id}`);
                    }
                });
            }
        });
    }

    // --- Helpers ---
    function scrollToBottom() {
        if (messagesArea.length) messagesArea[0].scrollTop = messagesArea[0].scrollHeight;
    }

    function parseDate(value) {
        try { return value ? new Date(value) : null; } catch (e) { return null; }
    }

    function formatTime(timestamp) {
        const d = parseDate(timestamp);
        return d ? d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') : '';
    }

    function formatRelativeTime(date) {
        const now = new Date();
        const diffMins = Math.floor((now - date) / 60000);
        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return diffMins + ' phút';
        if (diffMins < 1440) return Math.floor(diffMins / 60) + ' giờ';
        return `${date.getDate()}/${date.getMonth() + 1}`;
    }

    function renderMessageContent(content) {
        if (!content) return '';
        if (typeof content === 'string' && content.startsWith('IMG::')) {
            return `<img src="${content.substring(5)}" style="max-width:240px; border-radius:8px;">`;
        }
        return escapeHtml(content);
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function insertAtCursor(input, text) {
        if (!input) return;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value || '';
        input.value = value.substring(0, start) + text + value.substring(end);
        const pos = start + text.length;
        input.selectionStart = input.selectionEnd = pos;
        input.focus();
        $(input).trigger('input');
    }

    // Image Upload Logic
    function handleImageUpload() {
        const file = this.files && this.files[0];
        if (!file) return;

        if (!currentChatUserId) {
            alert("Vui lòng chọn một người bạn để gửi ảnh!");
            return;
        }

        console.log("📤 Đang upload ảnh...", file.name);

        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('accessToken');

        $.ajax({
            url: '/api/messages/upload-image',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function (resp) {
                if (resp && resp.success && resp.url) {
                    const now = new Date();
                    const messageData = {
                        senderId: parseInt(localStorage.getItem('currentUserId')),
                        receiverId: parseInt(currentChatUserId),
                        content: 'IMG::' + resp.url,
                        timestamp: now.toISOString()
                    };

                    if (stompClient && stompClient.connected) {
                        stompClient.send('/app/chat', {}, JSON.stringify(messageData));
                    }
                } else {
                    alert('Lỗi: ' + (resp.error || "Server trả về dữ liệu không hợp lệ"));
                }
                imageUploadInput.val('');
            },
            error: function (xhr) {
                alert('Lỗi upload: ' + xhr.status);
                imageUploadInput.val('');
            }
        });
    }

    function showNewMessageForm() { emptyState.hide(); chatActive.hide(); newMessageForm.show(); }
    function hideNewMessageForm() { newMessageForm.hide(); emptyState.show(); }
});

// GLOBAL FUNCTION CHO NÚT THU HỒI
window.retractMessage = function (messageId) {
    if (!confirm("Bạn có chắc chắn muốn thu hồi tin nhắn này không?")) return;

    $.ajax({
        url: "/api/messages/retract",
        type: "POST",
        data: { messageId: messageId },
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        success: function (resp) {
            console.log("Đã yêu cầu thu hồi:", resp);
        },
        error: function (err) {
            console.error("Lỗi thu hồi:", err);
            alert("Không thể thu hồi tin nhắn: " + (err.responseText || "Lỗi server"));
        }
    });
};