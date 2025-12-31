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
        console.log('🔌 Attempting to connect WebSocket for user:', currentUserId);
        
        if (!currentUserId) {
            console.warn('⚠️ No user ID, skipping WebSocket connection');
            return;
        }

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Tắt debug log

        stompClient.connect({}, function(frame) {
            console.log('✅ WebSocket connected successfully for user:', currentUserId);
            console.log('Subscribing to: /user/' + currentUserId + '/queue/messages');
            
            // Subscribe để nhận tin nhắn
            stompClient.subscribe('/user/' + currentUserId + '/queue/messages', function(message) {
                const data = JSON.parse(message.body);
                console.log('📬 Received real-time message from WebSocket:', data);
                handleIncomingMessage(data);
            });
            
            console.log('✅ Subscribed to message queue');
        }, function(error) {
            console.error('❌ WebSocket connection error:', error);
        });
    }

    /**
     * Handle incoming message from WebSocket
     */
    function handleIncomingMessage(messageData) {
        const currentUserId = parseInt(localStorage.getItem('currentUserId'));
        console.log('📨 Received message from WebSocket:', messageData);
        console.log('Current user ID:', currentUserId, 'Type:', typeof currentUserId);
        console.log('Message senderId:', messageData.senderId, 'Type:', typeof messageData.senderId);
        console.log('Message receiverId:', messageData.receiverId, 'Type:', typeof messageData.receiverId);

        // Nếu đang chat với người gửi/người nhận, hiển thị ngay
        const otherUserId = parseInt(messageData.senderId) === currentUserId 
            ? parseInt(messageData.receiverId) 
            : parseInt(messageData.senderId);
        
        console.log('Current chat user ID:', currentChatUserId, 'Type:', typeof currentChatUserId);
        console.log('Other user ID:', otherUserId, 'Type:', typeof otherUserId);
        
        if (parseInt(currentChatUserId) === parseInt(otherUserId)) {
            console.log('✅ Displaying message in current chat');
            appendMessage(messageData, currentUserId);
        } else {
            console.log('ℹ️ Message from different user, not displaying. Current:', currentChatUserId, 'Other:', otherUserId);
        }

        // Cập nhật danh sách conversations sau một chút để tránh conflict
        setTimeout(() => {
            loadConversations();
        }, 300);
    }

    /**
     * Append a single message to messages area
     */
    function appendMessage(msg, currentUserId) {
        console.log('📩 Appending message:', msg);
        
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
        
        messagesArea.append(messageHtml);
        console.log('✅ Message appended, scrolling to bottom...');
        
        // Đảm bảo scroll sau khi DOM được render
        setTimeout(() => {
            scrollToBottom();
        }, 50);
    }

    /**
     * Setup Event Listeners
     */
    function setupEventListeners() {
        // Conversation item click
        conversationsList.on('click', '.conversation-item', function() {
            const userId = $(this).data('user-id');
            const userName = $(this).find('.conversation-name').text();
            
            // Chỉ mở chat nếu khác chat hiện tại
            if (currentChatUserId != userId) {
                openChat(userId, userName);
            } else {
                console.log('ℹ️ Already in this chat');
            }
            
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
                    setTimeout(() => {
                        loadConversations();
                    }, 300);
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
        
        console.log('=== Loading Conversations ===');
        console.log('Current User ID:', currentUserId);
        console.log('localStorage keys:', Object.keys(localStorage));
        
        if (!currentUserId || currentUserId === 'null' || currentUserId === 'undefined') {
            console.warn('No current user ID found in localStorage');
            conversationsList.html(`
                <div style="text-align: center; padding: 40px 20px; color: #e74c3c;">
                    <p><strong>⚠️ Lỗi:</strong> Không tìm thấy thông tin đăng nhập.</p>
                    <p>localStorage không có currentUserId</p>
                    <p>Vui lòng <a href="/login" style="color: #3b82f6; text-decoration: underline;">đăng nhập lại</a></p>
                </div>
            `);
            emptyState.show();
            chatActive.hide();
            return;
        }

        // Gọi API để lấy danh sách người đã chat
        console.log('Fetching conversations from API...');
        $.ajax({
            url: '/api/messages/conversations',
            method: 'GET',
            data: { userId: currentUserId },
            success: function(data) {
                console.log('✅ Conversations loaded successfully:', data.length, 'conversations');
                console.log('Data:', data);
                conversations = data;
                renderConversations(data);
            },
            error: function(xhr, status, error) {
                console.error('❌ Error loading conversations');
                console.error('Status:', xhr.status);
                console.error('Error:', error);
                console.error('Response Text:', xhr.responseText);
                
                let errorMsg = `Lỗi ${xhr.status}`;
                if (xhr.status === 404) {
                    errorMsg = 'API endpoint không tìm thấy';
                } else if (xhr.status === 500) {
                    errorMsg = 'Lỗi server - Kiểm tra database';
                } else if (xhr.status === 0) {
                    errorMsg = 'Không thể kết nối server';
                }
                
                conversationsList.html(`
                    <div style="text-align: center; padding: 40px 20px; color: #e74c3c;">
                        <p><strong>⚠️ ${errorMsg}</strong></p>
                        <p style="font-size: 12px; color: #999; margin-top: 10px;">
                            ${xhr.responseText || error}
                        </p>
                        <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Thử lại
                        </button>
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
        // Đảm bảo userId là number
        userId = parseInt(userId);
        
        const wasAlreadyOpen = (currentChatUserId === userId);
        
        currentChatUserId = userId;
        currentChatUserName = userName;

        console.log('📂 Opening chat - User ID:', userId, 'Type:', typeof userId, 'Name:', userName);

        // Hide empty state and new message form
        emptyState.hide();
        newMessageForm.hide();
        
        // Show chat active
        chatActive.show();

        // Update chat header
        $('#chatUserName').text(userName);
        
        // Chỉ load messages nếu chưa mở chat này, hoặc cần refresh
        if (!wasAlreadyOpen) {
            console.log('🔄 Loading messages for new chat:', userName, 'ID:', userId);
            loadMessages(userId);
        } else {
            console.log('ℹ️ Chat already open, not reloading');
        }
        
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
            return da - db; // oldest first, newest last (at bottom)
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

        // Clear input
        messageInput.val('');

        // Refresh conversations sau một chút để cập nhật danh sách bên trái
        setTimeout(() => {
            loadConversations();
        }, 300);
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
            const element = messagesArea[0];
            element.scrollTop = element.scrollHeight;
            console.log('📜 Scrolled to bottom - scrollHeight:', element.scrollHeight, 'scrollTop:', element.scrollTop);
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
