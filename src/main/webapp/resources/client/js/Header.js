// Header profile menu dropdown
$(document).ready(function() {
    console.log('Header.js loaded');
    
    // WebSocket connection for real-time messages
    let headerStompClient = null;
    let isConnected = false;
    
    // Load user avatar from GraphQL
    loadUserAvatar();
    
    const profileAvatar = document.getElementById('header-user-avatar');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileMenu = document.getElementById('profile-menu');
    const notificationPopup = document.getElementById('notification-popup');
    const messageIcon = document.getElementById('message-icon');
    const messagesPopup = document.getElementById('messages-popup');
    const chatWindow = document.getElementById('chat-window');
    
    console.log('Profile avatar:', profileAvatar);
    console.log('Profile dropdown:', profileDropdown);
    console.log('Notification popup:', notificationPopup);
    
    // Function to load user avatar
    function loadUserAvatar() {
        const currentUsername = localStorage.getItem('username') || 'huynh.nguyen';
        
        const graphqlData = {
            query: `
                query GetUserProfile($username: String!) {
                    getUserByUsername(username: $username) {
                        username
                        fullName
                        avatarUrl
                    }
                }
            `,
            variables: {
                username: currentUsername
            }
        };
        
        $.ajax({
            url: '/graphql',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(graphqlData),
            success: function(response) {
                if (response.data && response.data.getUserByUsername) {
                    const user = response.data.getUserByUsername;
                    const avatarUrl = user.avatarUrl || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png';
                    
                    // Update header avatar
                    const headerAvatar = document.getElementById('header-user-avatar');
                    if (headerAvatar) {
                        headerAvatar.style.backgroundImage = `url('${avatarUrl}')`;
                        headerAvatar.style.backgroundSize = 'cover';
                        headerAvatar.style.backgroundPosition = 'center';
                    }
                    
                    // Update dropdown avatar
                    const dropdownAvatar = document.getElementById('dropdown-avatar');
                    if (dropdownAvatar) {
                        dropdownAvatar.style.backgroundImage = `url('${avatarUrl}')`;
                        dropdownAvatar.style.backgroundSize = 'cover';
                        dropdownAvatar.style.backgroundPosition = 'center';
                    }
                    
                    // Update dropdown info
                    const dropdownFullname = document.getElementById('dropdown-fullname');
                    const dropdownUsername = document.getElementById('dropdown-username');
                    if (dropdownFullname) dropdownFullname.textContent = user.fullName;
                    if (dropdownUsername) dropdownUsername.textContent = 'u/' + user.username;
                    
                    console.log('Avatar loaded:', avatarUrl);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading user avatar:', error);
            }
        });
    }
    
    if (profileAvatar && profileDropdown) {
        console.log('Profile menu elements found');
        
        // Click vào avatar để toggle menu
        profileAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            // Đóng notification popup nếu đang mở
            if (notificationPopup) {
                notificationPopup.classList.remove('show');
            }
            // Đóng chat window
            const chatWindow = document.getElementById('chat-window');
            if (chatWindow) {
                chatWindow.classList.remove('show');
            }
            console.log('Avatar clicked, dropdown show:', profileDropdown.classList.contains('show'));
        });
        
        // Click bên ngoài để đóng menu
        document.addEventListener('click', function(e) {
            if (profileMenu && !profileMenu.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
        
        // Ngăn dropdown đóng khi click vào nó
        profileDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    } else {
        console.log('Profile menu elements not found');
    }

    // Messages Popup Toggle
    const messagesPopupClose = document.getElementById('messages-popup-close');
    const messagesPopupExpand = document.getElementById('messages-popup-expand');
    const minimizeChat = document.getElementById('minimize-chat');
    const closeChat = document.getElementById('close-chat');
    
    console.log('Message icon:', messageIcon);
    console.log('Messages popup:', messagesPopup);
    console.log('Chat window:', chatWindow);
    
    if (messageIcon && messagesPopup) {
        console.log('Messages popup elements found');
        
        let currentChatUserId = null;
        
        // Load conversation partners on popup open
        let conversationPartners = [];
        
        // Connect WebSocket for real-time messages
        connectHeaderWebSocket();
        
        // Click vào icon tin nhắn để toggle messages popup
        messageIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Toggle messages popup
            if (messagesPopup.style.display === 'none' || messagesPopup.style.display === '') {
                messagesPopup.style.display = 'grid';
                // Load conversation partners khi mở popup
                loadConversationPartners();
            } else {
                messagesPopup.style.display = 'none';
            }
            
            // Đóng các popup khác
            if (notificationPopup) {
                notificationPopup.classList.remove('show');
            }
            if (profileDropdown) {
                profileDropdown.classList.remove('show');
            }
            if (chatWindow) {
                chatWindow.classList.remove('show');
            }
            
            console.log('Message icon clicked, messages popup display:', messagesPopup.style.display);
        });
        
        // Đóng messages popup
        if (messagesPopupClose) {
            messagesPopupClose.addEventListener('click', function(e) {
                e.stopPropagation();
                messagesPopup.style.display = 'none';
            });
        }
        
        // Mở rộng (navigate to full messages page)
        if (messagesPopupExpand) {
            messagesPopupExpand.addEventListener('click', function(e) {
                e.stopPropagation();
                window.location.href = '/messages';
            });
        }
        
        // Ngăn messages popup đóng khi click vào nó
        messagesPopup.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Click conversation item to show chat
        const messageItems = messagesPopup.querySelectorAll('.messages-popup-item');
        messageItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Get user info
                const userId = this.getAttribute('data-user-id');
                const userName = this.getAttribute('data-user-name');
                const avatarUrl = this.querySelector('.messages-popup-avatar img').src;
                
                // Update active state
                messageItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // Load chat
                loadChat(userId, userName, avatarUrl);
            });
        });
        
        // Load chat function
        function loadChat(userId, userName, avatarUrl) {
            currentChatUserId = userId;
            
            // Hide empty state, show chat view
            document.getElementById('messages-popup-empty').style.display = 'none';
            document.getElementById('messages-popup-chat-view').style.display = 'flex';
            
            // Update header
            document.getElementById('messages-popup-chat-avatar').src = avatarUrl;
            document.getElementById('messages-popup-chat-name').textContent = userName;
            
            // Load messages from server
            loadMessagesFromServer(userId);
        }
        
        // Send message
        const sendButton = document.getElementById('messages-popup-send');
        const inputField = document.getElementById('messages-popup-input');
        
        if (sendButton && inputField) {
            sendButton.addEventListener('click', function() {
                sendMessage();
            });
            
            inputField.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
        
        function sendMessage() {
            const text = inputField.value.trim();
            if (!text || !currentChatUserId) return;
            
            const currentUserId = localStorage.getItem('currentUserId');
            if (!currentUserId) {
                console.error('Không tìm thấy currentUserId trong localStorage');
                return;
            }
            
            // Send via WebSocket
            if (headerStompClient && isConnected) {
                const messageData = {
                    senderId: parseInt(currentUserId),
                    receiverId: parseInt(currentChatUserId),
                    content: text,
                    timestamp: new Date().toISOString()
                };
                
                headerStompClient.send("/app/chat", {}, JSON.stringify(messageData));
                console.log('Sent message via WebSocket:', messageData);
                
                // Display message immediately
                displayMessageInPopup(messageData, true);
                
                // Clear input
                inputField.value = '';
            } else {
                console.error('WebSocket not connected');
            }
        }
        
        // Helper function to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // ===== WebSocket Functions =====
        function connectHeaderWebSocket() {
            const currentUserId = localStorage.getItem('currentUserId');
            if (!currentUserId) {
                console.warn('Chưa đăng nhập, không kết nối WebSocket');
                return;
            }
            
            console.log('Connecting WebSocket for header messages...');
            
            const socket = new SockJS('/ws');
            headerStompClient = Stomp.over(socket);
            
            headerStompClient.connect({}, function(frame) {
                console.log('Header WebSocket connected:', frame);
                isConnected = true;
                
                // Subscribe to user's message queue
                headerStompClient.subscribe('/user/' + currentUserId + '/queue/messages', function(message) {
                    console.log('Received message in header:', message.body);
                    const messageData = JSON.parse(message.body);
                    handleIncomingMessageInHeader(messageData);
                });
            }, function(error) {
                console.error('Header WebSocket connection error:', error);
                isConnected = false;
                // Reconnect after 5 seconds
                setTimeout(connectHeaderWebSocket, 5000);
            });
        }
        
        function handleIncomingMessageInHeader(messageData) {
            console.log('New message received:', messageData);
            
            const currentUserId = localStorage.getItem('currentUserId');
            const otherUserId = messageData.senderId == currentUserId ? messageData.receiverId : messageData.senderId;
            
            // If chat is open with this user, display message
            if (currentChatUserId == otherUserId) {
                displayMessageInPopup(messageData, false);
            }
            
            // Update conversation list
            loadConversationPartners();
        }
        
        function displayMessageInPopup(messageData, isSent) {
            const messagesContainer = document.getElementById('messages-popup-chat-messages');
            if (!messagesContainer) return;
            
            const currentUserId = localStorage.getItem('currentUserId');
            const currentAvatar = localStorage.getItem('userAvatarUrl') || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default';
            
            // Get other user's avatar
            const messageItem = messagesPopup.querySelector(`.messages-popup-item[data-user-id="${currentChatUserId}"]`);
            const otherAvatar = messageItem ? messageItem.querySelector('.messages-popup-avatar img').src : 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
            
            const time = new Date(messageData.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            
            messageDiv.innerHTML = `
                <img src="${isSent ? currentAvatar : otherAvatar}" alt="Avatar" class="message-bubble-avatar">
                <div class="message-bubble-content">
                    <div class="message-bubble-text">${escapeHtml(messageData.content)}</div>
                    <div class="message-bubble-time">${time}</div>
                </div>
            `;
            
            // Prepend newest on top
            if (messagesContainer.firstChild) {
                messagesContainer.insertBefore(messageDiv, messagesContainer.firstChild);
            } else {
                messagesContainer.appendChild(messageDiv);
            }
            messagesContainer.scrollTop = 0;
        }
        
        function loadConversationPartners() {
            const currentUserId = localStorage.getItem('currentUserId');
            if (!currentUserId) {
                console.error('Không tìm thấy currentUserId');
                return;
            }
            
            $.ajax({
                url: `/api/messages/conversations?userId=${currentUserId}`,
                type: 'GET',
                success: function(partners) {
                    console.log('Loaded conversation partners:', partners);
                    conversationPartners = partners;
                    displayConversationPartners(partners);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading conversations:', error);
                }
            });
        }
        
        function displayConversationPartners(partners) {
            const container = messagesPopup.querySelector('.messages-popup-list');
            if (!container) return;
            
            if (partners.length === 0) {
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Chưa có tin nhắn nào</div>';
                return;
            }
            
            container.innerHTML = '';
            // Sort conversations by lastMessageTime (newest first)
            const sorted = partners.slice().sort((a, b) => {
                const parse = (val) => {
                    try {
                        if (!val) return new Date(0);
                        if (typeof val === 'string') return new Date(val.replace('T', ' '));
                        if (Array.isArray(val)) return new Date(val[0], val[1]-1, val[2], val[3]||0, val[4]||0, val[5]||0);
                        const d = new Date(val);
                        return isNaN(d.getTime()) ? new Date(0) : d;
                    } catch { return new Date(0); }
                };
                return parse(b.lastMessageTime) - parse(a.lastMessageTime);
            });
            sorted.forEach(partner => {
                const currentUserId = parseInt(localStorage.getItem('currentUserId'));
                const hasUnread = partner.unreadCount > 0;
                const isFromOther = partner.lastMessageSenderId && partner.lastMessageSenderId != currentUserId;
                
                const item = document.createElement('div');
                item.className = 'messages-popup-item';
                item.setAttribute('data-user-id', partner.id);
                item.setAttribute('data-user-name', partner.fullName);
                item.setAttribute('data-has-unread', hasUnread);
                
                const avatarUrl = partner.avatarUrl || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png';
                
                // Format time
                let timeStr = '';
                if (partner.lastMessageTime) {
                    try {
                        // Parse LocalDateTime từ Java (format: 2025-12-27T12:30:45)
                        let msgDate;
                        if (typeof partner.lastMessageTime === 'string') {
                            // Thay 'T' bằng space để tương thích với Safari
                            msgDate = new Date(partner.lastMessageTime.replace('T', ' '));
                        } else if (Array.isArray(partner.lastMessageTime)) {
                            // Nếu backend trả về array [year, month, day, hour, minute, second]
                            msgDate = new Date(
                                partner.lastMessageTime[0], 
                                partner.lastMessageTime[1] - 1, 
                                partner.lastMessageTime[2],
                                partner.lastMessageTime[3] || 0,
                                partner.lastMessageTime[4] || 0,
                                partner.lastMessageTime[5] || 0
                            );
                        } else {
                            msgDate = new Date(partner.lastMessageTime);
                        }
                        
                        if (!isNaN(msgDate.getTime())) {
                            const now = new Date();
                            const diffMs = now - msgDate;
                            const diffMins = Math.floor(diffMs / 60000);
                            
                            if (diffMins < 1) {
                                timeStr = 'Vừa xong';
                            } else if (diffMins < 60) {
                                timeStr = diffMins + ' phút';
                            } else if (diffMins < 1440) {
                                timeStr = Math.floor(diffMins / 60) + ' giờ';
                            } else if (diffMins < 10080) { // < 7 ngày
                                timeStr = Math.floor(diffMins / 1440) + ' ngày';
                            } else {
                                // Hiển thị ngày/tháng/năm
                                const day = msgDate.getDate().toString().padStart(2, '0');
                                const month = (msgDate.getMonth() + 1).toString().padStart(2, '0');
                                const year = msgDate.getFullYear();
                                timeStr = `${day}/${month}/${year}`;
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing date:', e, partner.lastMessageTime);
                        timeStr = '';
                    }
                }
                
                // Message style: bold if unread from other person
                const messageStyle = (hasUnread && isFromOther) ? 'font-weight: 700; color: #1c1c1c;' : 'font-weight: 400; color: #7c7c7c;';
                
                item.innerHTML = `
                    <div class="messages-popup-avatar">
                        <img src="${avatarUrl}" alt="${partner.fullName}">
                        ${hasUnread ? '<div class="unread-badge"></div>' : ''}
                    </div>
                    <div class="messages-popup-content">
                        <div class="messages-popup-name">${partner.fullName}</div>
                        <div class="messages-popup-message" style="${messageStyle}">${escapeHtml(partner.lastMessage || 'Bắt đầu trò chuyện...')}</div>
                    </div>
                    <div class="messages-popup-time">${timeStr}</div>
                `;
                
                item.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // Update active state
                    container.querySelectorAll('.messages-popup-item').forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Mark as read (update style)
                    const messageDiv = this.querySelector('.messages-popup-message');
                    if (messageDiv) {
                        messageDiv.style.fontWeight = '400';
                        messageDiv.style.color = '#7c7c7c';
                    }
                    const badge = this.querySelector('.unread-badge');
                    if (badge) {
                        badge.remove();
                    }
                    
                    // Mark unread messages as read in database
                    markConversationAsRead(partner.id);
                    
                    // Load chat
                    loadChat(partner.id, partner.fullName, avatarUrl);
                });
                
                container.appendChild(item);
            });
        }
        
        function markConversationAsRead(otherUserId) {
            const currentUserId = localStorage.getItem('currentUserId');
            if (!currentUserId) return;
            
            // Load conversation để lấy messageIds
            $.ajax({
                url: `/api/messages/conversation?userId1=${currentUserId}&userId2=${otherUserId}`,
                type: 'GET',
                success: function(messages) {
                    // Mark all unread messages from other user as read
                    messages.forEach(msg => {
                        if (msg.senderId == otherUserId && !msg.isRead) {
                            $.ajax({
                                url: `/api/messages/read?messageId=${msg.id}`,
                                type: 'POST',
                                success: function() {
                                    console.log('Marked message as read:', msg.id);
                                },
                                error: function(xhr, status, error) {
                                    console.error('Error marking message as read:', error);
                                }
                            });
                        }
                    });
                },
                error: function(xhr, status, error) {
                    console.error('Error loading conversation:', error);
                }
            });
        }
        
        function loadMessagesFromServer(userId) {
            const currentUserId = localStorage.getItem('currentUserId');
            if (!currentUserId) {
                console.error('Không tìm thấy currentUserId');
                return;
            }
            
            $.ajax({
                url: `/api/messages/conversation?userId1=${currentUserId}&userId2=${userId}`,
                type: 'GET',
                success: function(messages) {
                    console.log('Loaded messages:', messages);
                    displayMessagesInPopup(messages, userId);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading messages:', error);
                }
            });
        }
        
        function displayMessagesInPopup(messages, otherUserId) {
            const messagesContainer = document.getElementById('messages-popup-chat-messages');
            if (!messagesContainer) return;
            
            const currentUserId = parseInt(localStorage.getItem('currentUserId'));
            const currentAvatar = localStorage.getItem('userAvatarUrl') || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default';
            
            // Get other user's avatar
            const messageItem = messagesPopup.querySelector(`.messages-popup-item[data-user-id="${otherUserId}"]`);
            const otherAvatar = messageItem ? messageItem.querySelector('.messages-popup-avatar img').src : 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png';
            
            messagesContainer.innerHTML = '';
            const sorted = messages.slice().sort((a, b) => {
                const da = (() => {
                    if (typeof a.sentAt === 'string') return new Date(a.sentAt.replace('T', ' '));
                    if (Array.isArray(a.sentAt)) return new Date(a.sentAt[0], a.sentAt[1]-1, a.sentAt[2], a.sentAt[3]||0, a.sentAt[4]||0, a.sentAt[5]||0);
                    return new Date(a.sentAt);
                })();
                const db = (() => {
                    if (typeof b.sentAt === 'string') return new Date(b.sentAt.replace('T', ' '));
                    if (Array.isArray(b.sentAt)) return new Date(b.sentAt[0], b.sentAt[1]-1, b.sentAt[2], b.sentAt[3]||0, b.sentAt[4]||0, b.sentAt[5]||0);
                    return new Date(b.sentAt);
                })();
                return db - da;
            });
            sorted.forEach(msg => {
                const isSent = msg.senderId == currentUserId;
                const messageDiv = document.createElement('div');
                messageDiv.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
                
                // Parse sentAt with proper handling
                let time = 'N/A';
                try {
                    let msgDate;
                    if (typeof msg.sentAt === 'string') {
                        // Handle string format like "2025-12-27T12:30:45"
                        msgDate = new Date(msg.sentAt.replace('T', ' '));
                    } else if (Array.isArray(msg.sentAt)) {
                        // Handle array format [year, month, day, hour, minute, second]
                        msgDate = new Date(
                            msg.sentAt[0],
                            msg.sentAt[1] - 1,
                            msg.sentAt[2],
                            msg.sentAt[3] || 0,
                            msg.sentAt[4] || 0,
                            msg.sentAt[5] || 0
                        );
                    } else {
                        msgDate = new Date(msg.sentAt);
                    }
                    
                    if (!isNaN(msgDate.getTime())) {
                        time = msgDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    }
                } catch (e) {
                    console.error('Error parsing message date:', msg.sentAt, e);
                }
                
                messageDiv.innerHTML = `
                    <img src="${isSent ? currentAvatar : otherAvatar}" alt="Avatar" class="message-bubble-avatar">
                    <div class="message-bubble-content">
                        <div class="message-bubble-text">${escapeHtml(msg.content)}</div>
                        <div class="message-bubble-time">${time}</div>
                    </div>
                `;
                
                messagesContainer.appendChild(messageDiv);
            });
            
            // Keep top (newest-first)
            messagesContainer.scrollTop = 0;
        }
    } else {
        console.log('Messages popup elements not found');
    }
    
    // Old chat window functionality (if still exists)
    if (chatWindow) {
        // Thu nhỏ chat window
        if (minimizeChat) {
            minimizeChat.addEventListener('click', function(e) {
                e.stopPropagation();
                chatWindow.classList.toggle('minimized');
            });
        }
        
        // Đóng chat window
        if (closeChat) {
            closeChat.addEventListener('click', function(e) {
                e.stopPropagation();
                chatWindow.classList.remove('show');
                chatWindow.classList.remove('minimized');
            });
        }
        
        // Ngăn chat window đóng khi click vào nó
        chatWindow.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Click bên ngoài để đóng tất cả popup
    document.addEventListener('click', function(e) {
        if (messagesPopup && !messagesPopup.contains(e.target) && e.target !== messageIcon) {
            messagesPopup.style.display = 'none';
        }
        if (chatWindow && !chatWindow.contains(e.target)) {
            chatWindow.classList.remove('show');
        }
    });

    // Notification Popup Toggle
    const notificationIcon = document.getElementById('notification-icon');
    const notificationMenu = document.querySelector('.notification-menu');
    
    console.log('Notification icon:', notificationIcon);
    console.log('Notification menu:', notificationMenu);
    
    if (notificationIcon && notificationPopup) {
        console.log('Notification elements found');
        
        // Set initial timestamps for demo notifications
        const now = new Date();
        const notificationTimes = document.querySelectorAll('.notification-time');
        if (notificationTimes.length >= 5) {
            // 5 phút trước
            notificationTimes[0].setAttribute('data-timestamp', new Date(now - 5 * 60 * 1000).toISOString());
            // 1 giờ trước
            notificationTimes[1].setAttribute('data-timestamp', new Date(now - 60 * 60 * 1000).toISOString());
            // 3 giờ trước
            notificationTimes[2].setAttribute('data-timestamp', new Date(now - 3 * 60 * 60 * 1000).toISOString());
            // 1 ngày trước
            notificationTimes[3].setAttribute('data-timestamp', new Date(now - 24 * 60 * 60 * 1000).toISOString());
            // 2 ngày trước
            notificationTimes[4].setAttribute('data-timestamp', new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString());
        }
        
        // Load trạng thái thông báo đã đọc từ localStorage
        loadNotificationState();
        
        // Click vào icon thông báo để toggle popup
        notificationIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationPopup.classList.toggle('show');
            // Đóng các popup khác
            if (profileDropdown) {
                profileDropdown.classList.remove('show');
            }
            const chatWindow = document.getElementById('chat-window');
            if (chatWindow) {
                chatWindow.classList.remove('show');
            }
            console.log('Notification icon clicked, popup show:', notificationPopup.classList.contains('show'));
        });
        
        // Click bên ngoài để đóng popup
        document.addEventListener('click', function(e) {
            if (notificationMenu && !notificationMenu.contains(e.target)) {
                notificationPopup.classList.remove('show');
            }
        });
        
        // Ngăn popup đóng khi click vào nó
        notificationPopup.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Xử lý click vào notification item
        const notificationItems = document.querySelectorAll('.notification-item');
        notificationItems.forEach((item, index) => {
            item.addEventListener('click', function() {
                // Xóa class unread và unread-dot
                this.classList.remove('unread');
                const unreadDot = this.querySelector('.unread-dot');
                if (unreadDot) {
                    unreadDot.remove();
                }
                
                // Lưu trạng thái đã đọc vào localStorage
                saveNotificationState(index, true);
                
                // Cập nhật badge count
                updateNotificationBadge();
            });
        });
        
        // Xử lý nút "Đánh dấu đã đọc"
        const markAllReadBtn = document.querySelector('.mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Xóa tất cả unread
                const unreadItems = document.querySelectorAll('.notification-item.unread');
                unreadItems.forEach((item, index) => {
                    item.classList.remove('unread');
                    const unreadDot = item.querySelector('.unread-dot');
                    if (unreadDot) {
                        unreadDot.remove();
                    }
                    
                    // Lưu từng thông báo đã đọc
                    const allItems = document.querySelectorAll('.notification-item');
                    const itemIndex = Array.from(allItems).indexOf(item);
                    saveNotificationState(itemIndex, true);
                });
                
                // Cập nhật badge
                updateNotificationBadge();
            });
        }
        
        // Function để lưu trạng thái thông báo
        function saveNotificationState(index, isRead) {
            const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
            readNotifications[index] = isRead;
            localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
        }
        
        // Function để load trạng thái thông báo
        function loadNotificationState() {
            const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
            const notificationItems = document.querySelectorAll('.notification-item');
            
            notificationItems.forEach((item, index) => {
                if (readNotifications[index]) {
                    // Đánh dấu là đã đọc
                    item.classList.remove('unread');
                    const unreadDot = item.querySelector('.unread-dot');
                    if (unreadDot) {
                        unreadDot.remove();
                    }
                }
            });
            
            // Cập nhật badge ngay khi load
            updateNotificationBadge();
        }
        
        // Function để cập nhật số lượng thông báo chưa đọc
        function updateNotificationBadge() {
            const badge = document.querySelector('.notification-badge');
            const unreadCount = document.querySelectorAll('.notification-item.unread').length;
            
            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } else {
        console.log('Notification elements not found');
    }

    // Dark Mode Toggle
    const darkModeCheckbox = document.getElementById('dark-mode-checkbox');
    
    // Kiểm tra dark mode từ localStorage
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        if (darkModeCheckbox) {
            darkModeCheckbox.checked = true;
        }
    }
    
    // Xử lý toggle dark mode
    if (darkModeCheckbox) {
        darkModeCheckbox.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }
});
