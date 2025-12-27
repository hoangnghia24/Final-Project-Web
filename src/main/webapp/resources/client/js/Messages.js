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
        
        // Nếu đang chat với người gửi, hiển thị tin nhắn ngay
        if (currentChatUserId == messageData.senderId || currentChatUserId == messageData.receiverId) {
            appendMessage(messageData, currentUserId);
        }
        
        // Cập nhật danh sách conversations (reload để có tin nhắn mới nhất)
        loadConversations();
    }

    /**
     * Append a single message to messages area
     */
    function appendMessage(msg, currentUserId) {
        const isSent = msg.senderId == currentUserId;
        const messageClass = isSent ? 'sent' : 'received';
        const time = formatTime(msg.sentAt);
        
        let messageHtml = '<div class="message-group"><div class="message ' + messageClass + '">';
        
        // Avatar cho tin nhắn nhận được
        if (!isSent) {
            messageHtml += `<img src="${msg.senderAvatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + msg.senderId}" 
                                 alt="${msg.senderName}" class="message-avatar">`;
        }
        
        messageHtml += `
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(msg.content)}</div>
                <span class="message-time">${time}</span>
            </div>
        `;
        
        messageHtml += '</div></div>';
        
        messagesArea.append(messageHtml);
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

        // Recipient input - search users
        recipientInput.on('input', debounce(searchUsers, 300));

        // Search conversations
        searchInput.on('input', debounce(filterConversations, 300));

        // Auto-scroll to bottom when new messages arrive
        if (messagesArea.length) {
            scrollToBottom();
        }
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

        const html = partners.map(partner => `
            <div class="conversation-item" data-user-id="${partner.id}">
                <div class="conversation-avatar">
                    <img src="${partner.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + partner.username}" 
                         alt="${partner.fullName}">
                </div>
                <div class="conversation-content">
                    <div class="conversation-header">
                        <span class="conversation-name">${partner.fullName}</span>
                        <span class="conversation-time">Gần đây</span>
                    </div>
                    <div class="conversation-preview">${partner.bio || 'Bắt đầu trò chuyện...'}</div>
                </div>
            </div>
        `).join('');

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
        const html = messages.map(msg => {
            const isSent = msg.senderId == currentUserId;
            const messageClass = isSent ? 'sent' : 'received';
            const time = formatTime(msg.sentAt);
            
            let messageHtml = '<div class="message-group"><div class="message ' + messageClass + '">';
            
            // Avatar cho tin nhắn nhận được
            if (!isSent) {
                messageHtml += `<img src="${msg.senderAvatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + msg.senderId}" 
                                     alt="${msg.senderName}" class="message-avatar">`;
            }
            
            messageHtml += `
                <div class="message-content">
                    <div class="message-bubble">${escapeHtml(msg.content)}</div>
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
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return hours + ':' + minutes;
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
        const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

        // Create message element
        const messageHtml = `
            <div class="message-group">
                <div class="message sent">
                    <div class="message-content">
                        <div class="message-bubble">${escapeHtml(content)}</div>
                        <span class="message-time">${timeStr}</span>
                    </div>
                </div>
            </div>
        `;

        // Append to messages area
        messagesArea.append(messageHtml);

        // Clear input
        messageInput.val('');

        // Scroll to bottom
        scrollToBottom();

        // TODO: Send message to server via WebSocket/API
        console.log('Sending message to user', currentChatUserId, ':', content);

        // Simulate received response after 2 seconds
        setTimeout(() => {
            const responseHtml = `
                <div class="message-group">
                    <div class="message received">
                        <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=user${currentChatUserId}" alt="Avatar" class="message-avatar">
                        <div class="message-content">
                            <div class="message-bubble">Cảm ơn bạn đã nhắn tin!</div>
                            <span class="message-time">${timeStr}</span>
                        </div>
                    </div>
                </div>
            `;
            messagesArea.append(responseHtml);
            scrollToBottom();
        }, 2000);
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
            messagesArea[0].scrollTop = messagesArea[0].scrollHeight;
        }
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
