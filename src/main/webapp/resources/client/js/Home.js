$(document).ready(function () {
    // 1. CONFIG & VARIABLES
    const newsfeedContainer = $("#newsfeed-container");
    const createPostModal = $('#createPostModal');
    const btnSubmitPost = $("#btnSubmitPost");
    const postContentInput = $("#postContentInput");

    // Variables cho Upload
    const fileInput = $("#fileUploadInput");
    const mediaPreviewContainer = $("#mediaPreviewContainer");
    const imagePreview = $("#imagePreview");
    const videoPreview = $("#videoPreview");
    const btnRemoveMedia = $("#btnRemoveMedia");

    let currentFile = null; // Lưu file đang chọn

    // 2. AUTHENTICATION CHECK
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    // 3. INITIAL LOAD
    checkLoginAndLoadInfo();
    loadAllPosts();

    // 4. EVENT HANDLERS

    // Enable/Disable nút Đăng
    function updatePostButtonState() {
        const hasText = postContentInput.val().trim().length > 0;
        const hasFile = currentFile !== null;
        // Cho phép đăng nếu có chữ HOẶC có file
        btnSubmitPost.prop("disabled", !(hasText || hasFile));
    }

    postContentInput.on("input", updatePostButtonState);

    // Xử lý chọn File từ máy tính
    fileInput.on("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        currentFile = file;
        const objectUrl = URL.createObjectURL(file);

        mediaPreviewContainer.fadeIn();

        if (file.type.startsWith("video/")) {
            imagePreview.hide();
            videoPreview.attr("src", objectUrl).show();
        } else {
            videoPreview.hide();
            imagePreview.attr("src", objectUrl).show();
        }
        updatePostButtonState();
    });

    // Xử lý xóa File đã chọn
    btnRemoveMedia.on("click", function () {
        currentFile = null;
        fileInput.val(""); // Reset input
        mediaPreviewContainer.hide();
        imagePreview.attr("src", "");
        videoPreview.attr("src", "");
        updatePostButtonState();
    });

    // Sự kiện nút ĐĂNG
    btnSubmitPost.click(function () {
        handlePostSubmission();
    });

    // Sự kiện Xem thêm / Thu gọn
    $(document).on('click', '.see-more-btn', function (e) {
        e.preventDefault();
        const container = $(this).closest('.post-body-text');
        const isExpanding = $(this).text() === "Xem thêm";

        container.find('.content-short').toggle(!isExpanding);
        container.find('.content-full').toggle(isExpanding);
        $(this).text(isExpanding ? "Thu gọn" : "Xem thêm");
    });

    // Sự kiện Menu bài viết (3 chấm)
    $(document).on('click', '.post-menu-btn', function (e) {
        e.stopPropagation();
        $('.post-menu-dropdown').remove();
        const menuHtml = `
            <div class="post-menu-dropdown active">
                <div class="menu-item">Ẩn bài viết</div>
                <div class="menu-divider"></div>
                <div class="menu-item danger">Báo cáo</div>
            </div>`;
        $(this).parent().css('position', 'relative').append(menuHtml);
    });

    $(document).click(() => $('.post-menu-dropdown').remove());

    // 5. CORE FUNCTIONS

    // --- LOGIC ĐĂNG BÀI (Upload File -> Lấy URL -> Gửi GraphQL) ---
    async function handlePostSubmission() {
        btnSubmitPost.text("Đang xử lý...").prop("disabled", true);

        let finalImageUrl = null;

        try {
            // BƯỚC 1: Upload ảnh nếu có
            if (currentFile) {
                const formData = new FormData();
                formData.append("file", currentFile);

                // Dùng Promise để bọc $.ajax giúp bắt lỗi chính xác hơn
                finalImageUrl = await new Promise((resolve, reject) => {
                    $.ajax({
                        url: "/api/upload/media",
                        type: "POST",
                        headers: { "Authorization": "Bearer " + token },
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: (res) => {
                            // Kiểm tra kỹ phản hồi có phải là URL hợp lệ không
                            if (res && res.url) {
                                resolve(res.url);
                            } else if (typeof res === 'string' && res.startsWith('/')) {
                                resolve(res);
                            } else {
                                // Nếu server trả về HTML (do lỗi redirect), reject ngay
                                reject(new Error("Lỗi upload: Server trả về dữ liệu không hợp lệ (Có thể do file quá lớn)."));
                            }
                        },
                        error: (xhr) => {
                            console.error(xhr);
                            let msg = "Không thể upload ảnh.";
                            if (xhr.status === 413) msg = "File quá lớn (Vượt quá giới hạn cho phép).";
                            reject(new Error(msg));
                        }
                    });
                });
            }

            // BƯỚC 2: Chỉ gọi tạo bài viết khi đã có link ảnh (hoặc không có file)
            // Nếu bước trên lỗi, code sẽ nhảy xuống catch và KHÔNG tạo bài viết rác
            callCreatePostGraphQL(finalImageUrl);

        } catch (error) {
            alert("⚠️ " + error.message);
            btnSubmitPost.text("Đăng").prop("disabled", false);
        }
    }

    function callCreatePostGraphQL(imageUrl) {
        const content = postContentInput.val();
        const privacy = $("#privacySelect").val();

        // 1. Xác định mediaType (IMAGE hoặc VIDEO) dựa trên file đang chọn
        let type = "NONE";
        if (imageUrl) {
            if (currentFile && currentFile.type.startsWith("video/")) {
                type = "VIDEO";
            } else {
                type = "IMAGE";
            }
        }

        const mutation = {
            query: `mutation CreatePost($input: CreatePostInput!) { 
                createPost(input: $input) { id } 
            }`,
            variables: {
                input: {
                    content: content,
                    // 2. Đổi tên từ imageUrl -> mediaUrl
                    mediaUrl: imageUrl,
                    // 3. Thêm trường mediaType
                    mediaType: type,
                    privacyLevel: privacy
                }
            }
        };

        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(mutation),
            success: (res) => {
                if (res.data && res.data.createPost) {
                    // Thành công
                    createPostModal.modal('hide');
                    resetForm();
                    loadAllPosts(); // Reload lại feed
                } else {
                    // Lấy thông báo lỗi chi tiết từ server
                    alert("Lỗi server: " + (res.errors ? res.errors[0].message : "Unknown"));
                }
            },
            error: () => alert("Lỗi kết nối đến server GraphQL"),
            complete: () => btnSubmitPost.text("Đăng").prop("disabled", false)
        });
    }

    function resetForm() {
        postContentInput.val("");
        btnRemoveMedia.click(); // Xóa file đang chọn
    }

    // --- CÁC HÀM LOAD DATA ---

    function checkLoginAndLoadInfo() {
        const userStr = localStorage.getItem("currentUser");
        if (userStr) {
            const user = JSON.parse(userStr);
            const avatar = user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
            $("#currentUserAvatarSmall, #modalUserAvatar").attr("src", avatar);
            $("#modalUserName").text(user.fullName || user.username);
        }
    }

    function loadAllPosts() {
        // Query GraphQL lấy bài viết
        const query = {
            query: `query { getAllPosts { id content mediaUrl mediaType createdAt privacyLevel likeCount commentCount user { id fullName username avatarUrl } } }`
        };

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(query),
            success: (res) => {
                if (res.data && res.data.getAllPosts) {
                    renderPosts(res.data.getAllPosts);
                } else {
                    newsfeedContainer.html('<div class="text-center py-5 text-muted">Chưa có bài viết nào. Hãy là người đầu tiên!</div>');
                }
            },
            error: () => newsfeedContainer.html('<div class="text-center text-danger py-5">Lỗi tải bài viết.</div>')
        });
    }

    function renderPosts(posts) {
        newsfeedContainer.empty();

        if (posts.length === 0) {
            newsfeedContainer.html('<div class="text-center py-5 text-muted">Chưa có bài viết nào.</div>');
            return;
        }

        posts.forEach(post => {
            if (!post.user) return;

            const avatar = post.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`;

            // Xử lý Text dài
            const content = post.content || "";
            let contentHtml = content.replace(/\n/g, "<br>"); // Chuyển xuống dòng thành <br>

            if (content.length > 300) {
                contentHtml = `
                    <span class="content-short">${content.substring(0, 300).replace(/\n/g, "<br>")}...</span>
                    <span class="content-full" style="display:none;">${content.replace(/\n/g, "<br>")}</span>
                    <a href="#" class="see-more-btn">Xem thêm</a>`;
            }

            // --- SỬA LỖI HIỂN THỊ ẢNH Ở ĐÂY ---
            let mediaHtml = '';
            // Ưu tiên dùng mediaUrl vì đây là biến chuẩn mới, fallback về imageUrl nếu dữ liệu cũ còn
            const urlToDisplay = post.mediaUrl || post.imageUrl;

            if (urlToDisplay) {
                // Kiểm tra xem là Video hay Ảnh dựa trên mediaType hoặc đuôi file
                const isVideo = (post.mediaType === 'VIDEO') || (urlToDisplay.match(/\.(mp4|mov|avi|mkv)$/i));

                if (isVideo) {
                    mediaHtml = `
                        <div style="background:black; width:100%; display:flex; justify-content:center;">
                            <video controls class="post-full-image" style="max-height:500px; width:100%;">
                                <source src="${urlToDisplay}" type="video/mp4">
                                Trình duyệt không hỗ trợ thẻ video.
                            </video>
                        </div>`;
                } else {
                    mediaHtml = `<img src="${urlToDisplay}" class="post-full-image" loading="lazy" alt="Post image">`;
                }
            }

            // QUAN TRỌNG: Đã xóa class 'text-dark' ở thẻ <b> để CSS có thể điều khiển màu
            const html = `
                <div class="reddit-post-card" data-post-id="${post.id}">
                    <div class="post-header">
                        <div class="d-flex align-items-center">
                            <img src="${avatar}" class="post-user-avatar">
                            <div class="post-user-info ms-2">
                                <b>${post.user.fullName}</b>
                                <small class="text-muted" style="font-size: 12px;">
                                    ${calculateTimeAgo(post.createdAt)} • ${post.privacyLevel === 'PUBLIC' ? '🌎' : '🔒'}
                                </small>
                            </div>
                        </div>
                        <button class="post-menu-btn">...</button>
                    </div>
                    
                    <div class="post-body-text">${contentHtml}</div>
                    
                    ${mediaHtml}
                    
                    <div class="post-stats-bar mt-2 text-muted small d-flex justify-content-between">
                        <span>👍 ${post.likeCount || 0}</span> 
                        <span>${post.commentCount || 0} bình luận</span>
                    </div>
                    
                    <div class="post-action-buttons">
                        <button class="action-btn">👍 Thích</button>
                        <button class="action-btn">💬 Bình luận</button>
                        <button class="action-btn">↗️ Chia sẻ</button>
                    </div>
                </div>`;
            newsfeedContainer.append(html);
        });
    }

    function calculateTimeAgo(dateString) {
        if (!dateString) return "Vừa xong";
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return "Vừa xong";
        if (diff < 3600) return Math.floor(diff / 60) + " phút trước";
        if (diff < 86400) return Math.floor(diff / 3600) + " giờ trước";
        if (diff < 2592000) return Math.floor(diff / 86400) + " ngày trước";

        return date.toLocaleDateString("vi-VN");
    }
});