$(document).ready(function () {
    loadAllFeed('NEW'); // Mặc định load mới nhất
    loadSidebarSuggestions();
});

// Hàm gọi API lấy bài viết
function loadAllFeed(filterType) {
    $('#all-posts-container').empty();
    $('#feed-loading').show();

    // Cập nhật UI tabs
    $('.filter-tab-btn').removeClass('active');
    $(`.filter-tab-btn:contains('${filterType === 'NEW' ? 'Mới nhất' : filterType === 'HOT' ? 'Hot' : 'Top Like'}')`).addClass('active');

    const query = `
        query GetAllPosts {
            getAllPosts {
                id
                content
                mediaUrl
                mediaType
                feeling
                privacyLevel
                createdAt
                likeCount
                commentCount
                isLikedByMe
                user {
                    id
                    fullName
                    avatarUrl
                    username
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
            $('#feed-loading').hide();
            if (response.data && response.data.getAllPosts) {
                let posts = response.data.getAllPosts;

                // Xử lý sort phía Client (hoặc tốt nhất là làm ở Backend)
                if (filterType === 'TOP') {
                    posts.sort((a, b) => b.likeCount - a.likeCount);
                }
                // Mặc định GraphQL trả về CreatedAt DESC rồi nên NEW không cần sort lại

                renderPosts(posts);
                $('#total-posts-count').text(posts.length); // Cập nhật thống kê
            }
        },
        error: function (err) {
            $('#feed-loading').hide();
            console.error("Lỗi tải feed:", err);
        }
    });
}

function renderPosts(posts) {
    const container = $('#all-posts-container');

    if (posts.length === 0) {
        container.html('<div class="text-center p-5 text-muted">Chưa có bài viết nào trên hệ thống.</div>');
        return;
    }

    posts.forEach(post => {
        const avatarUrl = post.user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${post.user.username}`;
        const timeAgo = typeof TimeUtils !== 'undefined' ? TimeUtils.timeSince(post.createdAt) : post.createdAt;

        // Xử lý Media (Ảnh/Video)
        let mediaHtml = '';
        if (post.mediaUrl) {
            if (post.mediaType === 'VIDEO') {
                mediaHtml = `<video src="${post.mediaUrl}" controls class="post-full-image"></video>`;
            } else {
                mediaHtml = `<img src="${post.mediaUrl}" class="post-full-image" alt="Post Image">`;
            }
        }

        // HTML Card (Giống hệt cấu trúc RedditPost.css của bạn)
        const html = `
            <div class="reddit-post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${avatarUrl}" class="post-user-avatar" onclick="window.location.href='/u/${post.user.id}'">
                    <div class="post-user-info">
                        <div class="post-user-name-row">
                            <a href="/u/${post.user.id}" class="post-user-name">${post.user.fullName}</a>
                            ${post.feeling ? `<span style="font-size:13px; color:#666;"> &bull; đang cảm thấy ${post.feeling}</span>` : ''}
                        </div>
                        <div class="post-time-privacy">
                            <span class="post-time">${timeAgo}</span>
                            <span>•</span>
                            <span style="font-size:12px; color:#666;">${post.privacyLevel}</span>
                        </div>
                    </div>
                </div>

                <div class="post-main-content">
                    <div class="post-body-text">${post.content || ''}</div>
                </div>

                ${mediaHtml}

                <div class="post-stats-bar">
                    <div class="post-stats-left">
                        <span class="post-likes-count" id="like-count-${post.id}">${post.likeCount} lượt thích</span>
                    </div>
                    <div class="post-stats-right">
                        <span class="post-stat-item">${post.commentCount} bình luận</span>
                    </div>
                </div>

                <div class="post-action-buttons">
                    <button class="action-btn post-like-btn ${post.isLikedByMe ? 'liked' : ''}" 
                            onclick="toggleLike(${post.id})">
                        <svg viewBox="0 0 24 24" fill="${post.isLikedByMe ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>Thích</span>
                    </button>
                    <button class="action-btn" onclick="window.location.href='/post/${post.id}'">
                        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span>Bình luận</span>
                    </button>
                </div>
            </div>
        `;
        container.append(html);
    });
}

// Hàm gợi ý bạn bè bên phải
function loadSidebarSuggestions() {
    const query = `query { getFriendSuggestions { id fullName username avatarUrl } }`;

    $.ajax({
        url: "/graphql",
        type: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("accessToken") },
        data: JSON.stringify({ query: query }),
        success: function (resp) {
            const container = $('#sidebar-suggestions');
            container.empty();
            if (resp.data && resp.data.getFriendSuggestions) {
                resp.data.getFriendSuggestions.slice(0, 5).forEach(u => {
                    let avt = u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`;
                    container.append(`
                        <div class="suggested-user">
                            <img src="${avt}" class="suggested-avatar">
                            <div class="suggested-info">
                                <div class="suggested-name">${u.fullName}</div>
                                <div class="suggested-mutual">@${u.username}</div>
                            </div>
                            <button class="suggested-follow-btn" onclick="sendFriendRequest(${u.id})">Kết bạn</button>
                        </div>
                    `);
                });
            }
        }
    });
}