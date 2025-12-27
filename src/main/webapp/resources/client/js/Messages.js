/**
 * Messages.js - Real-time Chat UI for MXH Social Network
 * Handles conversation list, active chat, and new message functionality
 */

$(document).ready(function() {
    console.log('Messages.js loaded - MXH Chat System');

    // State Management
    let currentChatUserId = null;
    let currentChatUserName = '';
    let conversations = [];
    let stompClient = null;

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
            console.warn('No user ID, skipping WebSocket connection');
            return;
        }

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Tắt debug log

        stompClient.connect({}, function(frame) {
            console.log('WebSocket connected for user:', currentUserId);
            
            // Subscribe để nhận tin nhắn
            stompClient.subscribe('/user/' + currentUserId + '/queue/messages', function(message) {
                const data = JSON.parse(message.body);
                console.log('Received real-time message:', data);
                handleIncomingMessage(data);
            });
        }, function(error) {
            console.error('WebSocket connection error:', error);
        });
    }

    /**
     * Handle incoming message from WebSocket
     */
    function handleIncomingMessage(messageData) {
        const currentUserId = localStorage.getItem('currentUserId');

        // Nếu đang chat với người gửi/người nhận, hiển thị ngay
        const otherUserId = messageData.senderId == currentUserId ? messageData.receiverId : messageData.senderId;
        if (currentChatUserId == otherUserId) {
            appendMessage(messageData, currentUserId);
        }

        // Cập nhật danh sách conversations
        loadConversations();
    }

    /**
     * Append a single message to messages area
     */
    function appendMessage(msg, currentUserId) {
        const isSent = msg.senderId == currentUserId;
        const messageClass = isSent ? 'sent' : 'received';
        const time = formatTime(msg.sentAt || msg.timestamp);
        
        let messageHtml = '<div class="message-group"><div class="message ' + messageClass + '">';
        
        // Avatar cho tin nhắn nhận được
        if (!isSent) {
            messageHtml += `<img src="${msg.senderAvatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + msg.senderId}" 
                                 alt="${msg.senderName}" class="message-avatar">`;
        }
        
        const contentHtml = renderMessageContent(msg.content);
        messageHtml += `
            <div class="message-content">
                <div class="message-bubble">${contentHtml}</div>
                <span class="message-time">${time}</span>
            </div>
        `;
        
        messageHtml += '</div></div>';
        
        messagesArea.prepend(messageHtml);
        scrollToBottom();
    }

    /**
     * Setup Event Listeners
     */
    function setupEventListeners() {
        // Conversation item click
        conversationsList.on('click', '.conversation-item', function() {
            const userId = $(this).data('user-id');
            const userName = $(this).find('.conversation-name').text();
            openChat(userId, userName);
            
            // Update active state
            $('.conversation-item').removeClass('active');
            $(this).addClass('active');
            
            // Remove unread badge
            $(this).find('.unread-badge').fadeOut();
            // Normalize preview style after opening
            $(this).find('.conversation-preview').css({ fontWeight: '400', color: '#7c7c7c' });
        });

        // New message button clicks
        newMessageBtn.on('click', showNewMessageForm);
        startNewMessageBtn.on('click', showNewMessageForm);
        closeFormBtn.on('click', hideNewMessageForm);

        // Send message button
        sendBtn.on('click', sendMessage);
        
        // Enter key to send
        messageInput.on('keypress', function(e) {
            if (e.which === 13 && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Send new message
        sendNewMessageBtn.on('click', sendNewMessage);

        // Attach image flow
        attachImageBtn.on('click', function() {
            imageUploadInput.trigger('click');
        });
        imageUploadInput.on('change', handleImageUpload);

        // Emoji picker toggle and insert
        emojiBtn.on('click', function(e) {
            e.stopPropagation();
            const isShown = emojiPicker.is(':visible');
            $('.emoji-picker-visible').hide().removeClass('emoji-picker-visible');
            if (!isShown) {
                emojiPicker.show().addClass('emoji-picker-visible');
            }
        });
        // Click outside closes picker
        $(document).on('click', function() {
            emojiPicker.hide().removeClass('emoji-picker-visible');
        });
        // Prevent closing when clicking inside
        emojiPicker.on('click', function(e) { e.stopPropagation(); });
        // Handle emoji click
        emojiPicker.on('click', 'span', function() {
            const emoji = $(this).text();
            insertAtCursor($('#messageInput')[0], emoji);
        });

        // Recipient input - search users
        recipientInput.on('input', debounce(searchUsers, 300));

        // Search conversations
        searchInput.on('input', debounce(filterConversations, 300));

        // Auto-scroll to bottom when new messages arrive
        if (messagesArea.length) {
            scrollToBottom();
        }
    }

    function handleImageUpload() {
        const file = this.files && this.files[0];
        if (!file || !currentChatUserId) return;
        const formData = new FormData();
        formData.append('file', file);
        $.ajax({
            url: '/api/messages/upload-image',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(resp) {
                if (resp && resp.success && resp.url) {
                    const now = new Date();
                    const messageData = {
                        senderId: parseInt(localStorage.getItem('currentUserId')),
                        receiverId: parseInt(currentChatUserId),
                        content: 'IMG::' + resp.url,
                        timestamp: now.toISOString()
                    };
                    if (stompClient && stompClient.connected) {
                        try { stompClient.send('/app/chat', {}, JSON.stringify(messageData)); } catch (e) {}
                    }
                    appendMessage({
                        senderId: messageData.senderId,
                        receiverId: messageData.receiverId,
                        content: messageData.content,
                        sentAt: messageData.timestamp
                    }, messageData.senderId);
                    loadConversations();
                } else {
                    alert('Tải ảnh thất bại');
                }
                imageUploadInput.val('');
            },
            error: function() {
                alert('Lỗi khi tải ảnh');
                imageUploadInput.val('');
            }
        });
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

    /**
     * Load conversations from server
     */
    function loadConversations() {
        // Lấy userId hiện tại từ localStorage (đã set khi login)
        const currentUserId = localStorage.getItem('currentUserId');
        
        console.log('Current User ID:', currentUserId);
        
        if (!currentUserId) {
            console.warn('No current user ID found in localStorage');
            conversationsList.html(`
                <div style="text-align: center; padding: 40px 20px; color: #e74c3c;">
                    <p><strong>⚠️ Lỗi:</strong> Không tìm thấy thông tin đăng nhập.</p>
                    <p>Vui lòng <a href="/login">đăng nhập lại</a></p>
                </div>
            `);
            return;
        }

        // Gọi API để lấy danh sách người đã chat
        $.ajax({
            url: '/api/messages/conversations',
            method: 'GET',
            data: { userId: currentUserId },
            success: function(data) {
                conversations = data;
                renderConversations(data);
                console.log('Loaded conversations:', data.length, data);
            },
            error: function(xhr, status, error) {
                console.error('Error loading conversations:', xhr.status, error);
                console.error('Response:', xhr.responseText);
                conversationsList.html(`
                    <div style="text-align: center; padding: 40px 20px; color: #e74c3c;">
                        <p><strong>⚠️ Lỗi tải danh sách:</strong> ${xhr.status} - ${error}</p>
                        <p>Vui lòng thử lại sau</p>
                    </div>
                `);
            }
        });
    }

    /**
     * Render danh sách conversations
     */
    function renderConversations(partners) {
        if (partners.length === 0) {
            conversationsList.html(`
                <div style="text-align: center; padding: 40px 20px; color: #65676b;">
                    <p>Chưa có tin nhắn nào</p>
                </div>
            `);
            return;
        }

        const currentUserId = parseInt(localStorage.getItem('currentUserId'));
        const sorted = partners.slice().sort((a, b) => {
            const da = parseDate(a.lastMessageTime) || new Date(0);
            const db = parseDate(b.lastMessageTime) || new Date(0);
            return db - da; // newest conversation first
        });
        const html = sorted.map(partner => {
            const hasUnread = (partner.unreadCount || 0) > 0;
            const isFromOther = partner.lastMessageSenderId && partner.lastMessageSenderId != currentUserId;

            let timeStr = '';
            if (partner.lastMessageTime) {
                const d = parseDate(partner.lastMessageTime);
                if (d) timeStr = formatRelativeTime(d);
            }

            const rawText = partner.lastMessage || 'Bắt đầu trò chuyện...';
            const previewHtml = (partner.lastMessageSenderId == currentUserId)
                ? `<span style="font-weight:700">Bạn:</span> ${escapeHtml(rawText)}`
                : `${escapeHtml(rawText)}`;
            const msgStyle = (hasUnread && isFromOther) ? 'font-weight:700; color:#1c1c1c;' : 'font-weight:400; color:#7c7c7c;';

            return `
            <div class="conversation-item" data-user-id="${partner.id}">
                <div class="conversation-avatar">
                    <img src="${partner.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + (partner.username || partner.id)}" 
                         alt="${partner.fullName}">
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
     * Open chat with specific user
     */
    function openChat(userId, userName) {
        currentChatUserId = userId;
        currentChatUserName = userName;

        // Hide empty state and new message form
        emptyState.hide();
        newMessageForm.hide();
        
        // Show chat active
        chatActive.show();

        // Update chat header
        $('#chatUserName').text(userName);
        
        // Load messages for this user
        loadMessages(userId);
        // Mark unread as read on open
        markConversationAsRead(userId);

        console.log('Opened chat with:', userName, 'ID:', userId);
    }

    /**
     * Load messages for specific user
     */
    function loadMessages(userId) {
        // Lấy userId hiện tại từ localStorage
        const currentUserId = localStorage.getItem('currentUserId');
        
        if (!currentUserId) {
            messagesArea.html('<div class="no-messages">Vui lòng đăng nhập lại</div>');
            return;
        }

        // Gọi API để lấy lịch sử chat
        $.ajax({
            url: '/api/messages/conversation',
            method: 'GET',
            data: { 
                userId1: currentUserId,
                userId2: userId 
            },
            success: function(messages) {
                if (messages.length === 0) {
                    messagesArea.html(`
                        <div style="text-align: center; padding: 40px 20px; color: #65676b;">
                            <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                        </div>
                    `);
                } else {
                    renderMessages(messages, currentUserId);
                }
                scrollToBottom();
                // Refresh conversations to update last message and unread
                loadConversations();
            },
            error: function(error) {
                console.error('Error loading messages:', error);
                messagesArea.html('<div class="error-message">Không thể tải tin nhắn</div>');
            }
        });
    }

    /**
     * Render messages
     */
    function renderMessages(messages, currentUserId) {
        const sorted = messages.slice().sort((a, b) => {
            const da = parseDate(a.sentAt || a.timestamp) || new Date(0);
            const db = parseDate(b.sentAt || b.timestamp) || new Date(0);
            return db - da; // newest first
        });
        const html = sorted.map(msg => {
            const isSent = msg.senderId == currentUserId;
            const messageClass = isSent ? 'sent' : 'received';
            const time = formatTime(msg.sentAt || msg.timestamp);
            
            let messageHtml = '<div class="message-group"><div class="message ' + messageClass + '">';
            
            // Avatar cho tin nhắn nhận được
            if (!isSent) {
                messageHtml += `<img src="${msg.senderAvatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + msg.senderId}" 
                                     alt="${msg.senderName}" class="message-avatar">`;
            }
            
            const contentHtml = renderMessageContent(msg.content);
            messageHtml += `
                <div class="message-content">
                    <div class="message-bubble">${contentHtml}</div>
                    <span class="message-time">${time}</span>
                </div>
            `;
            
            messageHtml += '</div></div>';
            return messageHtml;
        }).join('');

        messagesArea.html(html);
    }

    /**
     * Format timestamp
     */
    function formatTime(timestamp) {
        const d = parseDate(timestamp);
        if (!d) return '';
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return hours + ':' + minutes;
    }

    function parseDate(value) {
        try {
            if (!value) return null;
            if (typeof value === 'string') {
                return new Date(value.replace('T', ' '));
            }
            if (Array.isArray(value)) {
                return new Date(
                    value[0],
                    (value[1] || 1) - 1,
                    value[2] || 1,
                    value[3] || 0,
                    value[4] || 0,
                    value[5] || 0
                );
            }
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        } catch (e) {
            console.error('Error parsing date:', value, e);
            return null;
        }
    }

    function formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return diffMins + ' phút';
        if (diffMins < 1440) return Math.floor(diffMins / 60) + ' giờ';
        if (diffMins < 10080) return Math.floor(diffMins / 1440) + ' ngày';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Send message
     */
    function sendMessage() {
        const content = messageInput.val().trim();
        
        if (!content || !currentChatUserId) {
            return;
        }

        const now = new Date();
        const messageData = {
            senderId: parseInt(localStorage.getItem('currentUserId')),
            receiverId: parseInt(currentChatUserId),
            content: content,
            timestamp: now.toISOString()
        };

        // Gửi qua WebSocket nếu có kết nối
        if (stompClient && stompClient.connected) {
            try {
                stompClient.send('/app/chat', {}, JSON.stringify(messageData));
                console.log('Sent message via WebSocket:', messageData);
            } catch (e) {
                console.error('Error sending via WebSocket:', e);
            }
        } else {
            console.warn('WebSocket not connected; message will appear locally');
        }

        // Hiển thị ngay tin nhắn gửi
        appendMessage({
            senderId: messageData.senderId,
            receiverId: messageData.receiverId,
            content: messageData.content,
            sentAt: messageData.timestamp
        }, messageData.senderId);

        // Clear input và scroll
        messageInput.val('');
        scrollToBottom();

        // Refresh conversations to update preview/last time
        loadConversations();
    }

    /**
     * Show new message form
     */
    function showNewMessageForm() {
        emptyState.hide();
        chatActive.hide();
        newMessageForm.show();
        recipientInput.focus();
    }

    /**
     * Hide new message form
     */
    function hideNewMessageForm() {
        newMessageForm.hide();
        emptyState.show();
        recipientInput.val('');
        $('#newMessageText').val('');
        $('#recipientSuggestions').hide();
    }

    /**
     * Send new message
     */
    function sendNewMessage() {
        const recipient = recipientInput.val().trim();
        const content = $('#newMessageText').val().trim();

        if (!recipient || !content) {
            alert('Vui lòng nhập người nhận và nội dung tin nhắn');
            return;
        }

        // TODO: Send new message via API
        console.log('Sending new message to:', recipient, 'Content:', content);

        // Simulate success
        alert('Tin nhắn đã được gửi!');
        hideNewMessageForm();

        // TODO: Add new conversation to list and open chat
    }

    /**
     * Search users for recipient
     */
    function searchUsers() {
        const query = recipientInput.val().trim();
        
        if (query.length < 2) {
            $('#recipientSuggestions').hide();
            return;
        }

        // TODO: Replace with actual API call
        const mockUsers = [
            { id: 4, name: 'Phạm Thị D', avatar: 'user4' },
            { id: 5, name: 'Hoàng Văn E', avatar: 'user5' },
            { id: 6, name: 'Đỗ Thị F', avatar: 'user6' }
        ];

        const filtered = mockUsers.filter(u => 
            u.name.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length > 0) {
            const suggestionsHtml = filtered.map(user => `
                <div class="suggestion-item" data-user-id="${user.id}" data-user-name="${user.name}">
                    <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=${user.avatar}" alt="Avatar" class="suggestion-avatar">
                    <span class="suggestion-name">${user.name}</span>
                </div>
            `).join('');

            $('#recipientSuggestions').html(suggestionsHtml).show();

            // Handle suggestion click
            $('.suggestion-item').on('click', function() {
                const userName = $(this).data('user-name');
                recipientInput.val(userName);
                $('#recipientSuggestions').hide();
            });
        } else {
            $('#recipientSuggestions').hide();
        }
    }

    function markConversationAsRead(otherUserId) {
        const currentUserId = localStorage.getItem('currentUserId');
        if (!currentUserId || !otherUserId) return;

        $.ajax({
            url: `/api/messages/conversation?userId1=${currentUserId}&userId2=${otherUserId}`,
            type: 'GET',
            success: function(messages) {
                messages.forEach(msg => {
                    if (msg.senderId == otherUserId && !msg.isRead) {
                        $.ajax({
                            url: `/api/messages/read?messageId=${msg.id}`,
                            type: 'POST',
                            success: function() {
                                // after marking read, refresh conversations
                                loadConversations();
                            },
                            error: function(xhr, status, error) {
                                console.error('Error marking message as read:', error);
                            }
                        });
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error loading conversation for markAsRead:', error);
            }
        });
    }

    /**
     * Filter conversations by search
     */
    function filterConversations() {
        const query = searchInput.val().trim().toLowerCase();

        $('.conversation-item').each(function() {
            const name = $(this).find('.conversation-name').text().toLowerCase();
            const preview = $(this).find('.conversation-preview').text().toLowerCase();

            if (name.includes(query) || preview.includes(query)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    /**
     * Scroll messages to bottom
     */
    function scrollToBottom() {
        if (messagesArea.length) {
            messagesArea[0].scrollTop = 0; // newest-first view keeps top visible
        }
    }

    function renderMessageContent(content) {
        if (!content) return '';
        if (typeof content === 'string' && content.startsWith('IMG::')) {
            const url = content.substring(5);
            return `<img src="${url}" alt="image" style="max-width:240px; border-radius:8px; display:block;" />`;
        }
        return escapeHtml(content);
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Auto-update conversation times using TimeUtils if available
    if (typeof updateAllRelativeTimes === 'function') {
        setInterval(updateAllRelativeTimes, 60000);
    }
});
