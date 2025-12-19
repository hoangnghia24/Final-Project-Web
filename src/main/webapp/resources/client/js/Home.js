$(document).ready(function () {
    // 1. Lấy thông tin user từ localStorage để hiển thị lời chào
    const currentUser = localStorage.getItem("username");
    if (currentUser) {
        $("#display-username").text(currentUser);
    }

    // 2. Tải danh sách bài viết khi vào trang
    loadFeeds();

    // 3. Xử lý sự kiện Đăng bài
    $("#btn-post").on("click", function () {
        const $btn = $(this);
        const content = $("#post-content").val();

        if (!content.trim()) {
            alert("Vui lòng nhập nội dung bài viết!");
            return;
        }

        // Hiệu ứng loading cho nút đăng
        const originalText = $btn.text();
        $btn.prop("disabled", true).text("Đang đăng...");

        createPost(content, $btn, originalText);
    });
});

// --- HÀM LẤY DANH SÁCH BÀI VIẾT (QUERY) ---
function loadFeeds() {
    const graphqlData = {
        query: `
            query {
                getAllPublicPosts {
                    id
                    content
                    imageUrl
                    createdAt
                    user {
                        username
                        fullName
                        avatarUrl
                    }
                }
            }
        `
    };

    $.ajax({
        url: "/graphql",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(graphqlData),
        success: function (response) {
            // Xóa spinner ngay khi có phản hồi từ server
            $("#loading-spinner").remove();

            if (response.data && response.data.getAllPublicPosts) {
                renderPosts(response.data.getAllPublicPosts);
            } else if (response.errors) {
                console.error("Lỗi GraphQL:", response.errors);
                $(".main-feed").append('<div class="alert alert-danger">Không thể tải bảng tin.</div>');
            }
        },
        error: function (xhr) {
            $("#loading-spinner").remove();
            console.error("Lỗi hệ thống:", xhr);
            $(".main-feed").append('<div class="alert alert-danger">Lỗi kết nối máy chủ!</div>');
        }
    });
}

// --- HÀM TẠO BÀI VIẾT MỚI (MUTATION) ---
function createPost(content, $btn, originalText) {
    const username = localStorage.getItem("username");

    // Kiểm tra nếu chưa đăng nhập
    if (!username) {
        alert("Vui lòng đăng nhập để đăng bài!");
        window.location.href = "/login";
        return;
    }

    const graphqlData = {
        query: `
            mutation CreatePost($content: String!, $username: String!) {
                createPost(content: $content, username: $username) {
                    id
                    content
                    createdAt
                }
            }
        `,
        variables: {
            content: content,
            username: username
        }
    };

    $.ajax({
        url: "/graphql",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(graphqlData),
        success: function (response) {
            if (response.data && response.data.createPost) {
                $("#post-content").val(""); // Xóa trắng ô nhập liệu
                loadFeeds(); // Tải lại danh sách bài viết mới nhất
            } else {
                alert("Lỗi: " + (response.errors ? response.errors[0].message : "Không rõ lỗi"));
            }
        },
        error: function () {
            alert("Không thể kết nối đến máy chủ để đăng bài.");
        },
        complete: function () {
            // Reset trạng thái nút bấm
            $btn.prop("disabled", false).text(originalText);
        }
    });
}

// --- HÀM HIỂN THỊ BÀI VIẾT LÊN HTML ---
function renderPosts(posts) {
    const $feedContainer = $(".main-feed");

    // Xóa các card bài viết cũ để tránh trùng lặp, trừ card đăng bài (form-card)
    $feedContainer.find(".feed-card").remove();

    if (posts.length === 0) {
        $feedContainer.append('<div class="feed-card text-center p-4 text-muted">Chưa có bài đăng nào. Hãy là người đầu tiên!</div>');
        return;
    }

    posts.forEach(post => {
        const avatar = post.user.avatarUrl || "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png";
        // Format ngày tháng: 09:22 19/12/2025
        const dateObj = new Date(post.createdAt);
        const postDate = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + " " + dateObj.toLocaleDateString('vi-VN');

        const imageHtml = post.imageUrl ? `<img src="${post.imageUrl}" class="feed-image">` : "";

        const postHtml = `
            <div class="feed-card animate-fade-in">
                <div class="feed-header">
                    <img src="${avatar}" class="feed-avatar" alt="avatar">
                    <div>
                        <h6 class="mb-0 fw-bold">${post.user.fullName}</h6>
                        <small class="text-muted">${postDate} • @${post.user.username}</small>
                    </div>
                </div>
                <div class="feed-content mt-2">
                    ${post.content}
                </div>
                ${imageHtml}
                <hr>
                <div class="d-flex text-center">
                    <button class="btn btn-light flex-grow-1 fw-bold text-secondary">👍 Thích</button>
                    <button class="btn btn-light flex-grow-1 fw-bold text-secondary">💬 Bình luận</button>
                </div>
            </div>
        `;
        $feedContainer.append(postHtml);
    });
}