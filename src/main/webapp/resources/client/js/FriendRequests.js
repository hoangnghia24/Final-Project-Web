/**
 * FriendRequests.js - Friend Management System
 * TFT Social Network
 * 
 
 */
let friendStompClient = null;
async function graphqlFetch(query, variables = {}) {
    const token = localStorage.getItem('accessToken');

    // 1. Tạo headers mặc định
    const headers = {
        'Content-Type': 'application/json'
    };

    // 2. Chỉ thêm Authorization nếu token tồn tại và hợp lệ
    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 3. Gọi fetch với headers đã xử lý
    const response = await fetch('http://localhost:8081/graphql', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query, variables })
    });

    return response.json();
}
(function () {
    'use strict';

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    let allFriends = [];
    let friendRequests = [];
    let friendSuggestions = [];
    let currentTab = 'all-friends';
    let currentFilter = 'all';
    let friendStompClient = null;
    let isFriendConnected = false;

    // ============================================
    // DOM ELEMENTS
    // ============================================

    let friendsTabs;
    let contentSections;
    let allFriendsGrid;
    let friendRequestsGrid;
    let suggestionsGrid;
    let searchInput;
    let filterButtons;
    let sidebarRequestsList;
    let sidebarSuggestionsList;

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        console.log('👥 Initializing Friend Management System...');

        // Get current user
        const currentUserId = localStorage.getItem('currentUserId');
        if (!currentUserId) {
            console.warn('⚠️ No currentUserId found, using mock ID');
            localStorage.setItem('currentUserId', '1');
        }

        // Get DOM elements
        friendsTabs = document.querySelectorAll('.friends-tab');
        contentSections = document.querySelectorAll('.friends-content-section');
        allFriendsGrid = document.getElementById('all-friends-grid');
        friendRequestsGrid = document.getElementById('friend-requests-grid');
        suggestionsGrid = document.getElementById('suggestions-grid');
        searchInput = document.getElementById('friends-search-input');
        filterButtons = document.querySelectorAll('.filter-btn');
        sidebarRequestsList = document.getElementById('sidebar-requests-list');
        sidebarSuggestionsList = document.getElementById('sidebar-suggestions-list');

        console.log('📍 DOM Elements:', {
            tabs: friendsTabs.length,
            sections: contentSections.length,
            grids: !!(allFriendsGrid && friendRequestsGrid && suggestionsGrid)
        });

        // Setup event listeners
        setupEventListeners();

        // Load initial data
        loadAllFriends();
        loadFriendRequests();
        loadFriendSuggestions();

        // Connect to WebSocket for real-time updates
        connectFriendWebSocket();

        console.log('✅ Friend Management System initialized!');
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    function setupEventListeners() {
        console.log('🎯 Setting up event listeners...');

        // Tab switching
        friendsTabs.forEach(tab => {
            tab.addEventListener('click', function () {
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);
            });
        });

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                handleSearch(this.value);
            });
        }

        // Filter buttons
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const filter = this.getAttribute('data-filter');
                applyFilter(filter);
            });
        });

        // View all requests link
        const viewAllLink = document.getElementById('view-all-requests');
        if (viewAllLink) {
            viewAllLink.addEventListener('click', function (e) {
                e.preventDefault();
                switchTab('friend-requests');
            });
        }
        $(document).on('click', '.btn-add-friend', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const userId = $(this).data('user-id');
            // Gọi hàm gửi kết bạn, truyền vào 'this' là nút đang bấm
            sendFriendRequest(userId, this);
        });

        // Xử lý nút Xóa gợi ý
        $(document).on('click', '.btn-remove-suggestion', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const suggestionId = $(this).data('suggestion-id');
            removeSuggestion(suggestionId);
        });
        $(document).on('click', '.btn-accept-request', function (e) {
            e.preventDefault();
            e.stopPropagation(); // Ngăn việc click xuyên qua thẻ cha
            const requestId = $(this).data('request-id');
            console.log('👆 Đã bấm nút Chấp nhận:', requestId);
            acceptFriendRequest(requestId);
        });

        // Xử lý nút TỪ CHỐI / XÓA (cho cả Sidebar và Main Grid)
        $(document).on('click', '.btn-reject-request', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const requestId = $(this).data('request-id');
            console.log('👆 Đã bấm nút Từ chối:', requestId);
            rejectFriendRequest(requestId);
        });
        // Xử lý nút HỦY KẾT BẠN (Unfriend)
        $(document).on('click', '.btn-unfriend', function (e) {
            e.preventDefault();
            e.stopPropagation(); // Ngăn click nhầm vào thẻ cha

            const friendId = $(this).data('friend-id');
            const friendName = $(this).closest('.friend-card').find('.friend-card-name').text() || "người này";

            if (confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${friendName}?`)) {
                unfriend(friendId);
            }
        });
        $(document).on('click', '.btn-cancel-sent-request', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const requestId = $(this).data('request-id');
            const userId = $(this).data('user-id'); // ID của user kia (để hồi phục nút thêm bạn)

            // Gọi hàm hủy (dùng chung logic với reject nhưng xử lý UI khác)
            cancelSentRequest(requestId, userId);
        });
        console.log('✅ Event listeners setup complete');
    }

    // ============================================
    // TAB SWITCHING
    // ============================================

    function switchTab(tabName) {
        console.log('🔄 Switching to tab:', tabName);

        currentTab = tabName;

        // Update tab buttons
        friendsTabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update content sections
        contentSections.forEach(section => {
            if (section.id === `${tabName}-section`) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    // ============================================
    // LOAD ALL FRIENDS
    // ============================================

    async function loadAllFriends() {
        console.log('📥 Loading REAL friends list...');

        // Show loading state
        if (allFriendsGrid) {
            allFriendsGrid.innerHTML = `
                <div class="friends-loading">
                    <div class="loading-spinner"></div>
                    <p>Đang tải danh sách bạn bè...</p>
                </div>
            `;
        }

        const query = `
            query {
                getMyFriends {
                    id
                    fullName
                    avatarUrl
                    # bio (nếu cần hiển thị thêm)
                }
            }
        `;

        try {
            const result = await graphqlFetch(query);

            if (result.errors) {
                console.error("Lỗi GraphQL:", result.errors);
                return;
            }

            const friends = result.data.getMyFriends || [];

            // Map dữ liệu từ Server sang format của giao diện
            allFriends = friends.map(u => ({
                id: u.id,
                name: u.fullName,
                avatar: u.avatarUrl || '/img/default-avatar.png',
                mutualFriends: 0, // Backend chưa tính được thì để 0
                isOnline: false,  // Tạm thời để false
                coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }));

            renderAllFriends(allFriends);
            updateFriendCount(allFriends.length);

        } catch (error) {
            console.error("Lỗi tải bạn bè:", error);
            if (allFriendsGrid) allFriendsGrid.innerHTML = '<p class="text-danger text-center">Lỗi tải dữ liệu</p>';
        }
    }

    function renderAllFriends(friends) {
        if (!allFriendsGrid) return;

        if (friends.length === 0) {
            allFriendsGrid.innerHTML = `
                <div class="friends-empty">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <h3>Chưa có bạn bè</h3>
                    <p>Hãy thêm bạn bè để bắt đầu kết nối</p>
                    <button class="friend-card-btn btn-primary" onclick="window.location.href='#suggestions'">
                        Tìm bạn bè
                    </button>
                </div>
            `;
            return;
        }

        allFriendsGrid.innerHTML = friends.map(friend => createFriendCard(friend)).join('');
        attachFriendCardListeners();
    }

    function createFriendCard(friend) {
        const mutualText = friend.mutualFriends > 0
            ? `${friend.mutualFriends} bạn chung`
            : 'Không có bạn chung';

        const onlineStatus = friend.isOnline
            ? '<span class="friend-online-status"></span>'
            : '';

        return `
        <div class="friend-card" data-friend-id="${friend.id}">
            <div class="friend-card-cover" style="background: ${friend.coverGradient}"></div>
            <div class="friend-card-avatar-wrapper">
                <img src="${friend.avatar}" alt="${friend.name}" class="friend-card-avatar">
                ${onlineStatus}
            </div>
            <div class="friend-card-body">
                <h3 class="friend-card-name">${friend.name}</h3>
                <div class="friend-card-mutual">
                     ${mutualText}
                </div>
                
                <div class="friend-card-actions" style="position: relative; z-index: 10;">
                    <button class="friend-card-btn btn-primary" onclick="window.location.href='/profile?id=${friend.id}'">
                        Trang cá nhân
                    </button>
                    <button class="friend-card-btn btn-secondary btn-unfriend" data-friend-id="${friend.id}">
                         Hủy kết bạn
                    </button>
                </div>
            </div>
        </div>
    `;
    }

    // ============================================
    // LOAD FRIEND REQUESTS
    // ============================================

    async function loadFriendRequests() {
        console.log('📥 Fetching real friend requests...');

        const query = `
        query {
            getMyFriendRequests {
                id
                requester {
                    id
                    fullName
                    avatarUrl
                }
                createdAt
            }
        }
    `;

        try {
            const result = await graphqlFetch(query);
            const requests = result.data.getMyFriendRequests || [];

            // --- SỬA ĐOẠN NÀY ---
            friendRequests = requests
                // 1. Lọc bỏ các bản ghi bị null hoặc thiếu người gửi
                .filter(req => req && req.requester)
                // 2. Sau đó mới map dữ liệu
                .map(req => ({
                    id: req.id,
                    name: req.requester.fullName,
                    avatar: req.requester.avatarUrl || '/img/default-avatar.png',
                    mutualFriends: 0,
                    timestamp: req.createdAt
                }));
            // ---------------------

            renderFriendRequests(friendRequests);

            // Cập nhật cả sidebar (QUAN TRỌNG để hiển thị bên phải)
            if (typeof renderSidebarRequests === 'function') {
                renderSidebarRequests(friendRequests.slice(0, 5));
            }

            updateRequestsCount(friendRequests.length);

        } catch (error) {
            console.error("Lỗi tải danh sách:", error);
        }
    }

    function renderFriendRequests(requests) {
        if (!friendRequestsGrid) return;

        if (requests.length === 0) {
            friendRequestsGrid.innerHTML = `
                <div class="friends-empty">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    <h3>Không có lời mời kết bạn</h3>
                    <p>Bạn sẽ thấy lời mời kết bạn ở đây</p>
                </div>
            `;
            return;
        }

        friendRequestsGrid.innerHTML = requests.map(request => createRequestCard(request)).join('');
        // attachRequestCardListeners();
    }

    function createRequestCard(request) {
        const timeAgo = getTimeAgo(request.timestamp);
        const mutualText = request.mutualFriends > 0
            ? `${request.mutualFriends} bạn chung`
            : 'Không có bạn chung';

        return `
        <div class="friend-card friend-request-card" data-request-id="${request.id}">
            <div class="friend-card-cover" style="background: ${request.coverGradient}"></div>
            <div class="friend-card-avatar-wrapper">
                <img src="${request.avatar}" alt="${request.name}" class="friend-card-avatar">
            </div>
            <div class="friend-card-body">
                <h3 class="friend-card-name">${request.name}</h3>
                <div class="friend-card-mutual">
                    ${mutualText}
                </div>
                <div style="font-size: 13px; color: #65676b; margin-top: 4px;">${timeAgo}</div>
                
                <div class="friend-card-actions" style="position: relative; z-index: 10;">
                    <button class="friend-card-btn btn-accept btn-accept-request" data-request-id="${request.id}">
                        Xác nhận
                    </button>
                    <button class="friend-card-btn btn-reject btn-reject-request" data-request-id="${request.id}">
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    `;
    }

    function renderSidebarRequests(requests) {
        if (!sidebarRequestsList) return;

        if (requests.length === 0) {
            sidebarRequestsList.innerHTML = `
                <div class="no-requests">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    <p>Không có lời mời kết bạn</p>
                </div>
            `;
            return;
        }

        sidebarRequestsList.innerHTML = requests.map(request => {
            const timeAgo = getTimeAgo(request.timestamp);
            return `
                <div class="sidebar-request-item" data-request-id="${request.id}">
                    <img src="${request.avatar}" alt="${request.name}" class="sidebar-request-avatar">
                    <div class="sidebar-request-info">
                        <div class="sidebar-request-name">${request.name}</div>
                        <div class="sidebar-request-time">${timeAgo}</div>
                        <div class="sidebar-request-actions">
                            <button class="sidebar-request-btn btn-accept btn-accept-request" data-request-id="${request.id}">
                                Xác nhận
                            </button>
                            <button class="sidebar-request-btn btn-secondary btn-reject-request" data-request-id="${request.id}">
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // attachSidebarRequestListeners();
    }

    // ============================================
    // LOAD FRIEND SUGGESTIONS
    // ============================================

    // Trong file FriendRequests.js
    // Trong FriendRequests.js

    async function loadFriendSuggestions() {
        console.log('📥 Loading suggestions & sent requests...');

        if (suggestionsGrid) {
            suggestionsGrid.innerHTML = `<div class="friends-loading"><div class="loading-spinner"></div><p>Đang tải...</p></div>`;
        }

        // Query lấy cả "Lời mời đã gửi" và "Gợi ý người lạ"
        const query = `
        query {
            getSentFriendRequests {
                id
                addressee {
                    id
                    fullName
                    avatarUrl
                }
                createdAt
            }
            getFriendSuggestions {
                id
                fullName
                avatarUrl
            }
        }
    `;

        try {
            const result = await graphqlFetch(query);
            if (result.errors) {
                console.error("GraphQL Error:", result.errors);
                return;
            }

            // 1. Danh sách ĐÃ GỬI (Chuyển đổi sang format thẻ)
            const sentList = (result.data.getSentFriendRequests || []).map(f => ({
                id: f.addressee.id,
                name: f.addressee.fullName,
                avatar: f.addressee.avatarUrl || '/img/default-avatar.png',
                mutualFriends: 0,
                reason: 'Đã gửi lời mời',
                coverGradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',

                // QUAN TRỌNG: Đánh dấu đây là request đã gửi & lưu ID lời mời để hủy
                isSent: true,
                requestId: f.id
            }));

            // 2. Danh sách GỢI Ý (Người lạ)
            const suggestionList = (result.data.getFriendSuggestions || []).map(u => ({
                id: u.id,
                name: u.fullName,
                avatar: u.avatarUrl || '/img/default-avatar.png',
                mutualFriends: 0,
                reason: 'Gợi ý cho bạn',
                coverGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                isSent: false
            }));

            // 3. Gộp lại: Đưa người đã gửi lên đầu
            friendSuggestions = [...sentList, ...suggestionList];

            renderFriendSuggestions(friendSuggestions);

        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        }
    }

    // Trong file FriendRequests.js

    function renderFriendSuggestions(suggestions) {
        if (!suggestionsGrid) return;

        // Lọc bỏ những người đã là bạn bè (để chắc chắn)
        const friendIds = allFriends.map(f => String(f.id));
        // Sửa dòng này: Chuyển logic lọc vào biến chính thức
        const filteredSuggestions = suggestions.filter(s => !friendIds.includes(String(s.id)));

        // Sửa check length bằng filteredSuggestions
        if (filteredSuggestions.length === 0) {
            suggestionsGrid.innerHTML = `
            <div class="friends-empty">
                <h3>Không có gợi ý kết bạn</h3>
                <p>Chúng tôi sẽ gợi ý kết bạn dựa trên bạn chung và sở thích</p>
            </div>
        `;
            return;
        }

        // Sửa map bằng filteredSuggestions
        suggestionsGrid.innerHTML = filteredSuggestions.map(suggestion => createSuggestionCard(suggestion)).join('');

        // Lưu ý: Nếu bạn muốn attach sự kiện click (hiện tại trong code bạn comment dòng này), hãy mở lại
        // attachSuggestionCardListeners(); 
    }

    // Trong file FriendRequests.js

    function createSuggestionCard(suggestion) {
        const mutualText = suggestion.mutualFriends > 0
            ? `${suggestion.mutualFriends} bạn chung`
            : suggestion.reason || 'Gợi ý cho bạn';

        // === PHẦN LOGIC MỚI: Kiểm tra trạng thái để chọn nút hiển thị ===
        let actionButtonHtml = '';

        if (suggestion.isSent) {
            // TRƯỜNG HỢP 1: Đã gửi lời mời -> Hiện nút HỦY
            // Cần truyền requestId vào để biết đường mà xóa
            actionButtonHtml = `
            <button class="friend-card-btn btn-secondary btn-cancel-sent-request" 
                    data-request-id="${suggestion.requestId}" 
                    data-user-id="${suggestion.id}">
                Hủy lời mời
            </button>
        `;
        } else {
            // TRƯỜNG HỢP 2: Chưa gửi -> Hiện nút THÊM BẠN BÈ (như cũ)
            actionButtonHtml = `
            <button class="friend-card-btn btn-primary btn-add-friend" data-user-id="${suggestion.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Thêm bạn bè
            </button>
        `;
        }

        // === RETURN HTML ===
        return `
        <div class="friend-card suggestion-card" data-suggestion-id="${suggestion.id}">
            <div class="friend-card-cover" style="background: ${suggestion.coverGradient}"></div>
            <div class="friend-card-avatar-wrapper">
                <img src="${suggestion.avatar}" alt="${suggestion.name}" class="friend-card-avatar">
            </div>
            <div class="friend-card-body">
                <h3 class="friend-card-name">${suggestion.name}</h3>
                <div class="friend-card-mutual">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                    ${mutualText}
                </div>
                
                <div class="friend-card-actions" style="position: relative; z-index: 10;">
                    
                    ${actionButtonHtml} <button class="friend-card-btn btn-secondary btn-remove-suggestion" data-suggestion-id="${suggestion.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    }

    function renderSidebarSuggestions(suggestions) {
        if (!sidebarSuggestionsList) return;

        sidebarSuggestionsList.innerHTML = suggestions.map(suggestion => {
            const mutualText = suggestion.mutualFriends > 0
                ? `${suggestion.mutualFriends} bạn chung`
                : 'Gợi ý cho bạn';
            return `
                <div class="sidebar-suggestion-item" data-suggestion-id="${suggestion.id}">
                    <img src="${suggestion.avatar}" alt="${suggestion.name}" class="sidebar-suggestion-avatar">
                    <div class="sidebar-suggestion-info">
                        <div class="sidebar-suggestion-name">${suggestion.name}</div>
                        <div class="sidebar-suggestion-mutual">${mutualText}</div>
                    </div>
                    <button class="sidebar-add-btn btn-add-friend" data-user-id="${suggestion.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        attachSidebarSuggestionListeners();
    }

    // ============================================
    // FRIEND REQUEST ACTIONS
    // ============================================

    function attachRequestCardListeners() {
        // Accept request buttons
        const acceptButtons = document.querySelectorAll('.btn-accept-request');
        console.log('🔘 Found accept buttons:', acceptButtons.length);

        acceptButtons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const requestId = this.getAttribute('data-request-id');
                console.log('👆 Accept button clicked for request:', requestId);
                acceptFriendRequest(requestId);
            });
        });

        // Reject request buttons
        const rejectButtons = document.querySelectorAll('.btn-reject-request');
        console.log('🔘 Found reject buttons:', rejectButtons.length);

        rejectButtons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const requestId = this.getAttribute('data-request-id');
                console.log('👆 Reject button clicked for request:', requestId);
                rejectFriendRequest(requestId);
            });
        });
    }

    function attachSidebarRequestListeners() {
        // Accept request buttons in sidebar
        sidebarRequestsList.querySelectorAll('.btn-accept-request').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const requestId = this.getAttribute('data-request-id');
                acceptFriendRequest(requestId);
            });
        });

        // Reject request buttons in sidebar
        sidebarRequestsList.querySelectorAll('.btn-reject-request').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const requestId = this.getAttribute('data-request-id');
                rejectFriendRequest(requestId);
            });
        });
    }

    async function acceptFriendRequest(requestId) {
        console.log('✅ Accepting friend request ID:', requestId);

        // Gọi API Accept
        const mutation = `
            mutation($reqId: ID!) {
                acceptFriendRequest(requestId: $reqId) {
                    id
                    status
                }
            }
        `;

        try {
            const result = await graphqlFetch(mutation, { reqId: requestId });

            if (result.errors) {
                alert("Lỗi: " + result.errors[0].message);
                return;
            }

            // --- THÀNH CÔNG ---

            // 1. Hiệu ứng ẩn dòng lời mời (UI)
            const card = document.querySelector(`.friend-request-card[data-request-id="${requestId}"]`);
            if (card) card.classList.add('accepting');

            // 2. Cập nhật dữ liệu Frontend
            setTimeout(() => {
                // Xóa khỏi danh sách chờ
                // Chuyển cả 2 về String để so sánh cho chắc chắn
                friendRequests = friendRequests.filter(r => String(r.id) !== String(requestId));// ParseInt nếu ID là số

                renderFriendRequests(friendRequests);
                if (typeof renderSidebarRequests === 'function') {
                    renderSidebarRequests(friendRequests.slice(0, 5));
                }
                updateRequestsCount(friendRequests.length);

                // 3. QUAN TRỌNG: Tải lại danh sách bạn bè để hiện người mới
                loadAllFriends();

            }, 500);

        } catch (error) {
            console.error("Lỗi mạng:", error);
        }
    }

    async function rejectFriendRequest(requestId) {
        console.log('❌ Rejecting friend request:', requestId);

        // 1. Tạo hiệu ứng ẩn UI ngay lập tức cho mượt
        const card = document.querySelector(`.friend-request-card[data-request-id="${requestId}"]`);
        const sidebarItem = document.querySelector(`.sidebar-request-item[data-request-id="${requestId}"]`);

        if (card) card.classList.add('rejecting');
        if (sidebarItem) {
            sidebarItem.style.opacity = '0';
            sidebarItem.style.transform = 'translateX(100%)';
        }

        // 2. Gọi API GraphQL xuống Server
        const mutation = `
        mutation($reqId: ID!) {
            rejectFriendRequest(requestId: $reqId) 
        }
    `;

        try {
            const result = await graphqlFetch(mutation, { reqId: requestId });

            if (result.errors) {
                console.error("Lỗi từ chối kết bạn:", result.errors);
                alert("Có lỗi xảy ra: " + result.errors[0].message);
                // Nếu lỗi thì hiện lại UI (bỏ class ẩn)
                if (card) card.classList.remove('rejecting');
                if (sidebarItem) {
                    sidebarItem.style.opacity = '1';
                    sidebarItem.style.transform = 'none';
                }
                return;
            }

            // 3. Xử lý dữ liệu sau khi Server báo thành công
            setTimeout(() => {
                // Xóa khỏi mảng friendRequests hiện tại
                friendRequests = friendRequests.filter(r => String(r.id) !== String(requestId));

                // Render lại danh sách lời mời
                renderFriendRequests(friendRequests);

                // Cập nhật lại Sidebar (nếu có hàm này)
                if (typeof renderSidebarRequests === 'function') {
                    renderSidebarRequests(friendRequests.slice(0, 5));
                }

                // Cập nhật số lượng trên badge
                updateRequestsCount(friendRequests.length);

                // === QUAN TRỌNG: Cập nhật lại danh sách gợi ý ===
                // Vì vừa từ chối xong, người đó có thể quay lại danh sách gợi ý
                loadFriendSuggestions();

                console.log('✅ Đã từ chối và cập nhật danh sách');
            }, 500); // Đợi 0.5s để hiệu ứng CSS chạy xong

        } catch (error) {
            console.error("Lỗi mạng:", error);
            alert("Lỗi kết nối đến máy chủ");
        }
    }

    // ============================================
    // FRIEND SUGGESTIONS ACTIONS
    // ============================================

    // function attachSuggestionCardListeners() {
    //     // Add friend buttons
    //     document.querySelectorAll('.btn-add-friend').forEach(btn => {
    //         btn.addEventListener('click', function (e) {
    //             e.stopPropagation();
    //             const userId = this.getAttribute('data-user-id');
    //             sendFriendRequest(userId, this);
    //         });
    //     });

    //     // Remove suggestion buttons
    //     document.querySelectorAll('.btn-remove-suggestion').forEach(btn => {
    //         btn.addEventListener('click', function (e) {
    //             e.stopPropagation();
    //             const suggestionId = this.getAttribute('data-suggestion-id');
    //             removeSuggestion(suggestionId);
    //         });
    //     });
    // }

    function attachSidebarSuggestionListeners() {
        if (!sidebarSuggestionsList) return;

        sidebarSuggestionsList.querySelectorAll('.btn-add-friend').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const userId = this.getAttribute('data-user-id');
                sendFriendRequest(userId, this);
            });
        });
    }

    // Trong file FriendRequests.js

    // Trong file FriendRequests.js

    async function sendFriendRequest(userId, buttonElement) {
        console.log('📤 Sending friend request to:', userId);

        // Tìm tất cả nút liên quan đến user này
        const $allButtons = $(`.btn-add-friend[data-user-id="${userId}"]`);

        // 1. Hiệu ứng loading
        $allButtons.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        // Query phải lấy về ID để sau này còn dùng để Hủy
        const mutation = `
        mutation($targetId: ID!) {
            sendFriendRequest(targetUserId: $targetId) {
                id 
                status
            }
        }
    `;

        try {
            const result = await graphqlFetch(mutation, { targetId: userId });

            if (result.errors) {
                alert("Lỗi: " + result.errors[0].message);
                // Reset lại nút nếu lỗi
                $allButtons.prop('disabled', false).html('Thêm bạn bè');
                return;
            }

            const newRequestId = result.data.sendFriendRequest.id;

            // 2. THÀNH CÔNG -> Đổi thành nút HỦY LỜI MỜI
            console.log('✅ Request sent! New Request ID:', newRequestId);

            $allButtons.each(function () {
                const $btn = $(this);

                $btn.removeClass('btn-primary btn-add-friend');
                $btn.addClass('btn-secondary btn-cancel-sent-request');
                $btn.html('Hủy lời mời');

                // === SỬA DÒNG NÀY ===
                // Cũ: $btn.data('request-id', newRequestId);
                // Mới: Dùng attr để cập nhật HTML, giúp selector tìm thấy được nút này sau đó
                $btn.attr('data-request-id', newRequestId);

                $btn.prop('disabled', false);
            });

        } catch (error) {
            console.error("Lỗi mạng:", error);
            $allButtons.prop('disabled', false).text('Thử lại');
        }
    }
    function removeSuggestion(suggestionId) {
        console.log('🗑️ Removing suggestion:', suggestionId);

        const card = document.querySelector(`.suggestion-card[data-suggestion-id="${suggestionId}"]`);

        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
                card.remove();
                friendSuggestions = friendSuggestions.filter(s => s.id !== parseInt(suggestionId));
                if (friendSuggestions.length === 0) {
                    renderFriendSuggestions([]);
                }
            }, 300);
        }
    }

    // ============================================
    // UNFRIEND ACTION
    // ============================================

    function attachFriendCardListeners() {
        document.querySelectorAll('.btn-unfriend').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const friendId = this.getAttribute('data-friend-id');
                if (confirm('Bạn có chắc muốn hủy kết bạn?')) {
                    unfriend(friendId);
                }
            });
        });
    }

    async function unfriend(targetUserId) {
        console.log('💔 Đang hủy kết bạn với ID:', targetUserId);

        // 1. Hiệu ứng UI: Làm mờ thẻ ngay lập tức cho mượt
        const card = document.querySelector(`.friend-card[data-friend-id="${targetUserId}"]`);
        if (card) {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none'; // Khóa click
        }

        const mutation = `
        mutation($targetId: ID!) {
            unfriend(targetUserId: $targetId) 
        }
    `;

        try {
            const result = await graphqlFetch(mutation, { targetId: targetUserId });

            if (result.errors) {
                alert("Lỗi: " + result.errors[0].message);
                // Nếu lỗi thì hồi phục lại UI
                if (card) {
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                }
                return;
            }

            // 2. Thành công -> Xóa hẳn khỏi giao diện
            if (card) {
                card.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    card.remove();

                    // Cập nhật mảng dữ liệu local
                    allFriends = allFriends.filter(f => String(f.id) !== String(targetUserId));

                    // Cập nhật số lượng hiển thị
                    updateFriendCount(allFriends.length);

                    // Nếu xóa hết thì hiện thông báo trống
                    if (allFriends.length === 0) {
                        renderAllFriends([]);
                    }

                    // Load lại gợi ý (vì người vừa xóa có thể trở thành gợi ý mới)
                    loadFriendSuggestions();

                }, 300);
            }

        } catch (error) {
            console.error("Lỗi mạng:", error);
            alert("Lỗi kết nối đến máy chủ");
            if (card) card.style.opacity = '1';
        }
    }

    // ============================================
    // SEARCH FUNCTIONALITY
    // ============================================

    function handleSearch(query) {
        console.log('🔍 Searching:', query);

        if (!query.trim()) {
            // Show all based on current tab and filter
            if (currentTab === 'all-friends') {
                renderAllFriends(applyCurrentFilter(allFriends));
            } else if (currentTab === 'friend-requests') {
                renderFriendRequests(friendRequests);
            } else if (currentTab === 'suggestions') {
                renderFriendSuggestions(friendSuggestions);
            }
            return;
        }

        const searchTerm = query.toLowerCase();

        if (currentTab === 'all-friends') {
            const filtered = allFriends.filter(friend =>
                friend.name.toLowerCase().includes(searchTerm)
            );
            renderAllFriends(filtered);
        } else if (currentTab === 'friend-requests') {
            const filtered = friendRequests.filter(request =>
                request.name.toLowerCase().includes(searchTerm)
            );
            renderFriendRequests(filtered);
        } else if (currentTab === 'suggestions') {
            const filtered = friendSuggestions.filter(suggestion =>
                suggestion.name.toLowerCase().includes(searchTerm)
            );
            renderFriendSuggestions(filtered);
        }
    }

    // ============================================
    // FILTER FUNCTIONALITY
    // ============================================

    function applyFilter(filter) {
        console.log('🎯 Applying filter:', filter);

        currentFilter = filter;

        // Update filter button states
        filterButtons.forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Apply filter to current friends list
        const filtered = applyCurrentFilter(allFriends);
        renderAllFriends(filtered);
    }

    function applyCurrentFilter(friends) {
        if (currentFilter === 'all') {
            return friends;
        } else if (currentFilter === 'online') {
            return friends.filter(f => f.isOnline);
        } else if (currentFilter === 'recent') {
            // Sort by friendship date (most recent first)
            return [...friends].sort((a, b) => b.friendshipDate - a.friendshipDate);
        }
        return friends;
    }

    // ============================================
    // UPDATE COUNTS
    // ============================================

    function updateFriendCount(count) {
        const countElement = document.getElementById('all-friends-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    function updateRequestsCount(count) {
        const countElement = document.getElementById('friend-requests-count');
        const subtitleElement = document.getElementById('requests-subtitle');

        if (countElement) {
            countElement.textContent = count;
            if (count > 0) {
                countElement.style.display = 'inline-flex';
            } else {
                countElement.style.display = 'none';
            }
        }

        if (subtitleElement) {
            subtitleElement.textContent = count === 0
                ? 'Không có lời mời kết bạn'
                : `Bạn có ${count} lời mời kết bạn`;
        }
    }

    // ============================================
    // WEBSOCKET CONNECTION
    // ============================================

    function connectFriendWebSocket() {
        console.log('🔌 Connecting to WebSocket...');
        const socket = new SockJS('/ws');
        friendStompClient = Stomp.over(socket);
        friendStompClient.debug = null; // Tắt log debug cho đỡ rối

        friendStompClient.connect({}, function (frame) {
            console.log('✅ Connected WebSocket: ' + frame);
            isFriendConnected = true;

            // Subscribe
            friendStompClient.subscribe('/user/queue/friend-requests', function (message) {
                console.log("🔔 Có thông báo WebSocket mới:", message.body);

                // Reload lại toàn bộ danh sách (Hàm loadFriendRequests ở trên đã sửa để update cả sidebar)
                loadFriendRequests();

                // Reload cả suggestions để loại bỏ người vừa gửi (nếu cần)
                // loadFriendSuggestions(); 

                // Hiển thị badge đỏ trên Header
                updateHeaderNotificationCount();
            });

        }, function (error) {
            console.error('❌ WebSocket error:', error);
        });
    }

    // Thêm hàm update số lượng (Optional)
    function updateHeaderNotificationCount() {
        const countBadge = document.getElementById('friend-requests-count');
        if (countBadge) {
            let current = parseInt(countBadge.innerText) || 0;
            countBadge.innerText = current + 1;
            countBadge.style.display = 'inline-flex';
        }
    }

    function onFriendConnected() {
        console.log('✅ Friend WebSocket connected');
        isFriendConnected = true;

        // Subscribe to friend request updates
        // friendStompClient.subscribe('/user/queue/friend-requests', onFriendRequestReceived);
    }

    function onFriendRequestReceived(message) {
        console.log('📬 New friend request received:', message);

        // Parse and add to friend requests list
        // loadFriendRequests();
    }

    function onFriendError(error) {
        console.error('❌ Friend WebSocket error:', error);
        isFriendConnected = false;
    }

    // ============================================
    // MOCK DATA GENERATORS
    // ============================================

    function generateMockFriends(count) {
        const friends = [];
        const names = [
            'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung',
            'Hoàng Văn Em', 'Vũ Thị Phương', 'Đỗ Văn Giang', 'Bùi Thị Hoa',
            'Đinh Văn Ích', 'Lý Thị Khánh', 'Mai Văn Linh', 'Chu Thị Mai',
            'Đặng Văn Nam', 'Phan Thị Oanh', 'Võ Văn Phúc', 'Tạ Thị Quỳnh',
            'Dương Văn Sơn', 'Lương Thị Tâm', 'Trịnh Văn Uy', 'Hồ Thị Vân'
        ];

        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        ];

        for (let i = 0; i < count && i < names.length; i++) {
            friends.push({
                id: i + 1,
                name: names[i],
                avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${names[i]}`,
                coverGradient: gradients[i % gradients.length],
                mutualFriends: Math.floor(Math.random() * 20),
                isOnline: Math.random() > 0.5,
                friendshipDate: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
            });
        }

        return friends;
    }

    function generateMockFriendRequests(count) {
        const requests = [];
        const names = [
            'Cao Văn Xuân', 'Ngô Thị Yến', 'Lâm Văn Zen', 'Kiều Thị Anh',
            'Tô Văn Bảo', 'Đào Thị Chi', 'Hà Văn Dũng', 'Từ Thị Emi'
        ];

        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        ];

        for (let i = 0; i < count && i < names.length; i++) {
            requests.push({
                id: 100 + i,
                name: names[i],
                avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${names[i]}`,
                coverGradient: gradients[i % gradients.length],
                mutualFriends: Math.floor(Math.random() * 15),
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        return requests;
    }

    function generateMockSuggestions(count) {
        const suggestions = [];
        const names = [
            'Trương Văn Phi', 'Lục Thị Gấm', 'Vương Văn Hùng', 'Tống Thị Ivy',
            'Âu Văn Khang', 'Lê Thị Lan', 'Mã Văn Minh', 'Triệu Thị Nga',
            'Tôn Văn Ong', 'Viên Thị Phượng', 'Quan Văn Quang', 'Doãn Thị Rồng'
        ];

        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        ];

        const reasons = [
            'Cùng học trường Đại học FPT',
            'Sống tại Hà Nội',
            'Làm việc tại Google',
            'Thích lập trình',
            null
        ];

        for (let i = 0; i < count && i < names.length; i++) {
            suggestions.push({
                id: 200 + i,
                name: names[i],
                avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${names[i]}`,
                coverGradient: gradients[i % gradients.length],
                mutualFriends: Math.floor(Math.random() * 10),
                reason: reasons[i % reasons.length]
            });
        }

        return suggestions;
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    function getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return 'Vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
        return `${Math.floor(diffInSeconds / 604800)} tuần trước`;
    }

    // ============================================
    // INITIALIZE ON DOM READY
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(init, 100);
        });
    } else {
        setTimeout(init, 100);
    }

})();
async function cancelSentRequest(requestId, userId) {
    console.log('undo ↩️ Hủy lời mời đã gửi:', requestId);

    // Tìm nút đang bấm
    const $buttons = $(`.btn-cancel-sent-request[data-request-id="${requestId}"]`);

    // Loading...
    $buttons.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

    // Dùng chung API reject (vì bản chất là xóa record trong DB)
    const mutation = `
        mutation($reqId: ID!) {
            rejectFriendRequest(requestId: $reqId) 
        }
    `;

    try {
        const result = await graphqlFetch(mutation, { reqId: requestId });

        if (result.errors) {
            alert("Lỗi: " + result.errors[0].message);
            $buttons.prop('disabled', false).html('Hủy lời mời');
            return;
        }

        // THÀNH CÔNG -> Đổi ngược lại thành nút THÊM BẠN BÈ
        $buttons.each(function () {
            const $btn = $(this);

            $btn.removeClass('btn-secondary btn-cancel-sent-request');
            $btn.addClass('btn-primary btn-add-friend');

            // Trả về icon và text cũ
            $btn.html(`
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg> Thêm bạn bè
            `);

            // Xóa data request id đi
            $btn.removeData('request-id');
            $btn.prop('disabled', false);
        });

        console.log("Đã hủy lời mời, quay về trạng thái chưa kết bạn");

    } catch (error) {
        console.error("Lỗi mạng:", error);
        $buttons.prop('disabled', false).text('Lỗi');
    }
}