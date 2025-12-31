/**
 * FriendRequests.js - Friend Management System
 * TFT Social Network
 */

(function() {
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
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);
            });
        });

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                handleSearch(this.value);
            });
        }

        // Filter buttons
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                applyFilter(filter);
            });
        });

        // View all requests link
        const viewAllLink = document.getElementById('view-all-requests');
        if (viewAllLink) {
            viewAllLink.addEventListener('click', function(e) {
                e.preventDefault();
                switchTab('friend-requests');
            });
        }

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
    
    function loadAllFriends() {
        console.log('📥 Loading all friends...');

        // Show loading state
        if (allFriendsGrid) {
            allFriendsGrid.innerHTML = `
                <div class="friends-loading">
                    <div class="loading-spinner"></div>
                    <p>Đang tải danh sách bạn bè...</p>
                </div>
            `;
        }

        // Simulate API call with mock data
        setTimeout(() => {
            allFriends = generateMockFriends(20);
            renderAllFriends(allFriends);
            updateFriendCount(allFriends.length);
        }, 800);
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
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        ${mutualText}
                    </div>
                    <div class="friend-card-actions">
                        <button class="friend-card-btn btn-primary" onclick="window.location.href='/profile?id=${friend.id}'">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Trang cá nhân
                        </button>
                        <button class="friend-card-btn btn-secondary btn-unfriend" data-friend-id="${friend.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // LOAD FRIEND REQUESTS
    // ============================================
    
    function loadFriendRequests() {
        console.log('📥 Loading friend requests...');

        if (friendRequestsGrid) {
            friendRequestsGrid.innerHTML = `
                <div class="friends-loading">
                    <div class="loading-spinner"></div>
                    <p>Đang tải lời mời kết bạn...</p>
                </div>
            `;
        }

        setTimeout(() => {
            friendRequests = generateMockFriendRequests(5);
            renderFriendRequests(friendRequests);
            renderSidebarRequests(friendRequests.slice(0, 3));
            updateRequestsCount(friendRequests.length);
        }, 800);
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
        attachRequestCardListeners();
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
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        ${mutualText}
                    </div>
                    <div style="font-size: 13px; color: #65676b; margin-top: 4px;">${timeAgo}</div>
                    <div class="friend-card-actions">
                        <button class="friend-card-btn btn-accept btn-accept-request" data-request-id="${request.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Xác nhận
                        </button>
                        <button class="friend-card-btn btn-reject btn-reject-request" data-request-id="${request.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
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

        attachSidebarRequestListeners();
    }

    // ============================================
    // LOAD FRIEND SUGGESTIONS
    // ============================================
    
    function loadFriendSuggestions() {
        console.log('📥 Loading friend suggestions...');

        if (suggestionsGrid) {
            suggestionsGrid.innerHTML = `
                <div class="friends-loading">
                    <div class="loading-spinner"></div>
                    <p>Đang tải gợi ý kết bạn...</p>
                </div>
            `;
        }

        setTimeout(() => {
            friendSuggestions = generateMockSuggestions(12);
            renderFriendSuggestions(friendSuggestions);
            renderSidebarSuggestions(friendSuggestions.slice(0, 5));
        }, 800);
    }

    function renderFriendSuggestions(suggestions) {
        if (!suggestionsGrid) return;

        if (suggestions.length === 0) {
            suggestionsGrid.innerHTML = `
                <div class="friends-empty">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <h3>Không có gợi ý kết bạn</h3>
                    <p>Chúng tôi sẽ gợi ý kết bạn dựa trên bạn chung và sở thích</p>
                </div>
            `;
            return;
        }

        suggestionsGrid.innerHTML = suggestions.map(suggestion => createSuggestionCard(suggestion)).join('');
        attachSuggestionCardListeners();
    }

    function createSuggestionCard(suggestion) {
        const mutualText = suggestion.mutualFriends > 0 
            ? `${suggestion.mutualFriends} bạn chung` 
            : suggestion.reason || 'Gợi ý cho bạn';

        return `
            <div class="friend-card suggestion-card" data-suggestion-id="${suggestion.id}">
                <div class="friend-card-cover" style="background: ${suggestion.coverGradient}"></div>
                <div class="friend-card-avatar-wrapper">
                    <img src="${suggestion.avatar}" alt="${suggestion.name}" class="friend-card-avatar">
                </div>
                <div class="friend-card-body">
                    <h3 class="friend-card-name">${suggestion.name}</h3>
                    <div class="friend-card-mutual">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        ${mutualText}
                    </div>
                    <div class="friend-card-actions">
                        <button class="friend-card-btn btn-primary btn-add-friend" data-user-id="${suggestion.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                            Thêm bạn bè
                        </button>
                        <button class="friend-card-btn btn-secondary btn-remove-suggestion" data-suggestion-id="${suggestion.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            btn.addEventListener('click', function(e) {
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
            btn.addEventListener('click', function(e) {
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
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const requestId = this.getAttribute('data-request-id');
                acceptFriendRequest(requestId);
            });
        });

        // Reject request buttons in sidebar
        sidebarRequestsList.querySelectorAll('.btn-reject-request').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const requestId = this.getAttribute('data-request-id');
                rejectFriendRequest(requestId);
            });
        });
    }

    function acceptFriendRequest(requestId) {
        console.log('✅ Accepting friend request:', requestId);

        const card = document.querySelector(`.friend-request-card[data-request-id="${requestId}"]`);
        const sidebarItem = document.querySelector(`.sidebar-request-item[data-request-id="${requestId}"]`);

        // Add animation class
        if (card) {
            card.classList.add('accepting');
        }
        if (sidebarItem) {
            sidebarItem.style.opacity = '0';
            sidebarItem.style.transform = 'translateX(-20px)';
        }

        // Simulate API call
        setTimeout(() => {
            // Remove from friend requests array
            friendRequests = friendRequests.filter(r => r.id !== parseInt(requestId));
            
            // Re-render
            renderFriendRequests(friendRequests);
            renderSidebarRequests(friendRequests.slice(0, 3));
            updateRequestsCount(friendRequests.length);

            // Show success message (optional)
            console.log('✅ Friend request accepted!');

            // Reload friends list to include new friend
            loadAllFriends();
            
            // Update all friends count
            const allFriendsCount = document.getElementById('all-friends-count');
            if (allFriendsCount) {
                const currentCount = parseInt(allFriendsCount.textContent) || 0;
                allFriendsCount.textContent = currentCount + 1;
            }
        }, 600);
    }

    function rejectFriendRequest(requestId) {
        console.log('❌ Rejecting friend request:', requestId);

        const card = document.querySelector(`.friend-request-card[data-request-id="${requestId}"]`);
        const sidebarItem = document.querySelector(`.sidebar-request-item[data-request-id="${requestId}"]`);

        // Add animation class
        if (card) {
            card.classList.add('rejecting');
        }
        if (sidebarItem) {
            sidebarItem.style.opacity = '0';
            sidebarItem.style.transform = 'translateX(100%)';
        }

        // Simulate API call
        setTimeout(() => {
            // Remove from friend requests array
            friendRequests = friendRequests.filter(r => r.id !== parseInt(requestId));
            
            // Re-render
            renderFriendRequests(friendRequests);
            renderSidebarRequests(friendRequests.slice(0, 3));
            updateRequestsCount(friendRequests.length);

            console.log('❌ Friend request rejected');
        }, 600);
    }

    // ============================================
    // FRIEND SUGGESTIONS ACTIONS
    // ============================================
    
    function attachSuggestionCardListeners() {
        // Add friend buttons
        document.querySelectorAll('.btn-add-friend').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const userId = this.getAttribute('data-user-id');
                sendFriendRequest(userId, this);
            });
        });

        // Remove suggestion buttons
        document.querySelectorAll('.btn-remove-suggestion').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const suggestionId = this.getAttribute('data-suggestion-id');
                removeSuggestion(suggestionId);
            });
        });
    }

    function attachSidebarSuggestionListeners() {
        if (!sidebarSuggestionsList) return;

        sidebarSuggestionsList.querySelectorAll('.btn-add-friend').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const userId = this.getAttribute('data-user-id');
                sendFriendRequest(userId, this);
            });
        });
    }

    function sendFriendRequest(userId, button) {
        console.log('📤 Sending friend request to:', userId);

        // Update button state
        button.disabled = true;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Đã gửi
        `;
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');

        // Simulate API call
        setTimeout(() => {
            console.log('✅ Friend request sent!');
            
            // Optionally remove from suggestions after a delay
            setTimeout(() => {
                const card = button.closest('.suggestion-card');
                const sidebarItem = button.closest('.sidebar-suggestion-item');
                
                if (card) {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => card.remove(), 300);
                }
                
                if (sidebarItem) {
                    sidebarItem.style.opacity = '0';
                    setTimeout(() => sidebarItem.remove(), 300);
                }
            }, 1500);
        }, 500);
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
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const friendId = this.getAttribute('data-friend-id');
                if (confirm('Bạn có chắc muốn hủy kết bạn?')) {
                    unfriend(friendId);
                }
            });
        });
    }

    function unfriend(friendId) {
        console.log('💔 Unfriending:', friendId);

        const card = document.querySelector(`.friend-card[data-friend-id="${friendId}"]`);
        
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
                allFriends = allFriends.filter(f => f.id !== parseInt(friendId));
                renderAllFriends(allFriends);
                updateFriendCount(allFriends.length);
            }, 300);
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
        console.log('🔌 Connecting to friend WebSocket...');

        // Reuse existing WebSocket connection if available
        // Otherwise create new connection
        // This is placeholder - actual implementation depends on backend

        // Example:
        // const socket = new SockJS('/ws');
        // friendStompClient = Stomp.over(socket);
        // friendStompClient.connect({}, onFriendConnected, onFriendError);
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
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(init, 100);
        });
    } else {
        setTimeout(init, 100);
    }

})();
