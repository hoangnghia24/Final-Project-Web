$(document).ready(function () {
    // --- KHAI BÁO BIẾN ---
    const newsfeedContainer = $("#newsfeed-container");

    // Create Modal
    const createPostModal = $('#createPostModal');
    const btnSubmitPost = $("#btnSubmitPost");
    const postContentInput = $("#postContentInput");
    const fileInput = $("#fileUploadInput");
    const mediaPreviewContainer = $("#mediaPreviewContainer");
    const imagePreview = $("#imagePreview");
    const videoPreview = $("#videoPreview");
    const btnRemoveMedia = $("#btnRemoveMedia");

    // Update Modal
    const updatePostModal = $('#updatePostModal');
    const btnUpdatePost = $("#btnUpdatePost");
    const updatePostContentInput = $("#updatePostContentInput");
    const updatePrivacySelect = $("#updatePrivacySelect");
    const updateMediaPreviewContainer = $("#updateMediaPreviewContainer");
    const updateImagePreview = $("#updateImagePreview");
    const updateVideoPreview = $("#updateVideoPreview");
    const btnRemoveUpdateMedia = $("#btnRemoveUpdateMedia"); // Nút Xóa ảnh
    const updateFileInput = $("#updateFileUploadInput");     // Input chọn file

    let currentFile = null;
    let updateFile = null;  // Biến lưu file mới khi sửa
    let currentPosts = [];
    let isMediaDeleted = false; // Cờ đánh dấu đã xóa ảnh cũ hay chưa

    // --- CHECK LOGIN ---
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    // --- INIT ---
    checkLoginAndLoadInfo();
    loadAllPosts();

    // ==========================================
    // 1. XỬ LÝ MODAL TẠO BÀI (GIỮ NGUYÊN)
    // ==========================================
    function updatePostButtonState() {
        const hasText = postContentInput.val().trim().length > 0;
        const hasFile = currentFile !== null;
        btnSubmitPost.prop("disabled", !(hasText || hasFile));
    }
    postContentInput.on("input", updatePostButtonState);

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

    btnRemoveMedia.on("click", function () {
        currentFile = null;
        fileInput.val("");
        mediaPreviewContainer.hide();
        imagePreview.attr("src", "");
        videoPreview.attr("src", "");
        updatePostButtonState();
    });

    btnSubmitPost.click(function () {
        handlePostSubmission();
    });

    // ==========================================
    // 2. XỬ LÝ MODAL SỬA BÀI (PHẦN BẠN CẦN)
    // ==========================================

    // A. Xử lý khi bấm nút "Sửa bài viết" từ menu 3 chấm
    $(document).on('click', '.edit-post-btn', function (e) {
        e.stopPropagation();
        const postId = $(this).data('id');
        prepareEditPost(postId);
        $('.post-menu-dropdown').remove();
    });

    // B. Hàm đổ dữ liệu vào Modal Sửa
    // B. Hàm đổ dữ liệu vào Modal Sửa
    function prepareEditPost(postId) {
        const post = currentPosts.find(p => p.id == postId);
        if (!post) {
            alert("Lỗi: Không tìm thấy bài viết!");
            return;
        }

        // 1. Reset trạng thái file
        updateFile = null;
        isMediaDeleted = false;
        updateFileInput.val("");

        // 2. Đổ thông tin User (Avatar + Tên) vào Modal
        const currentUserStr = localStorage.getItem("currentUser");
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);

            // --- FIX LỖI AVATAR Ở ĐÂY ---
            // Sử dụng logic giống hệt màn hình chính: Nếu không có avatarUrl thì dùng DiceBear theo username
            const avatar = user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
            $("#updateModalUserAvatar").attr("src", avatar);

            $("#updateModalUserName").text(user.fullName || user.username);
        }

        // 3. Đổ nội dung bài viết
        updatePostContentInput.val(post.content);
        updatePrivacySelect.val(post.privacyLevel);

        // 4. Hiển thị ảnh cũ (nếu có)
        // Ưu tiên mediaUrl (biến mới), nếu không có thì tìm imageUrl (biến cũ)
        const mediaUrl = post.mediaUrl || post.imageUrl;

        if (mediaUrl) {
            updateMediaPreviewContainer.show();
            // Kiểm tra xem là video hay ảnh
            const isVideo = (post.mediaType === 'VIDEO') || (mediaUrl.match(/\.(mp4|mov|avi|mkv)$/i));

            if (isVideo) {
                updateImagePreview.hide();
                updateVideoPreview.attr("src", mediaUrl).show();
            } else {
                updateVideoPreview.hide();
                updateImagePreview.attr("src", mediaUrl).show();
            }
        } else {
            // Nếu bài viết không có ảnh thì ẩn khung preview đi
            updateMediaPreviewContainer.hide();
            updateImagePreview.attr("src", "");
            updateVideoPreview.attr("src", "");
        }

        // Lưu postId vào nút Lưu để biết đang sửa bài nào
        btnUpdatePost.data("id", postId);

        // Hiện Modal
        updatePostModal.modal('show');
    }

    // C. SỬA LỖI KHÔNG ĐỔI ĐƯỢC ẢNH: Sự kiện chọn file mới
    updateFileInput.on("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        updateFile = file; // Lưu file mới vào biến
        isMediaDeleted = false; // Reset cờ xóa

        const objectUrl = URL.createObjectURL(file);
        updateMediaPreviewContainer.fadeIn();

        if (file.type.startsWith("video/")) {
            updateImagePreview.hide();
            updateVideoPreview.attr("src", objectUrl).show();
        } else {
            updateVideoPreview.hide();
            updateImagePreview.attr("src", objectUrl).show();
        }
    });

    // D. SỬA LỖI KHÔNG XÓA ĐƯỢC ẢNH: Sự kiện bấm nút X
    btnRemoveUpdateMedia.on("click", function () {
        updateFile = null;       // Hủy file mới chọn (nếu có)
        updateFileInput.val(""); // Reset input file
        isMediaDeleted = true;   // Đánh dấu là người dùng muốn xóa ảnh cũ

        updateMediaPreviewContainer.hide();
        updateImagePreview.attr("src", "");
        updateVideoPreview.attr("src", "");
    });

    // E. Sự kiện bấm nút "Lưu thay đổi" (Chưa gọi API thật, chỉ thông báo)
    btnUpdatePost.click(function () {
        // Logic xử lý API Update sẽ viết sau ở đây
        // Gợi ý logic:
        // - Nếu updateFile != null -> Upload ảnh mới -> Lấy URL mới
        // - Nếu isMediaDeleted == true -> Gửi mediaUrl = null lên server để xóa ảnh
        // - Nếu không -> Giữ nguyên URL cũ
        alert("Đã bấm Lưu! (Chức năng Update API sẽ làm ở bước sau)");
        updatePostModal.modal('hide');
    });

    // ==========================================
    // 3. CÁC HÀM XỬ LÝ KHÁC (MENU, DELETE...)
    // ==========================================

    $(document).on('click', '.post-menu-btn', function (e) {
        e.stopPropagation();
        const postId = $(this).closest('.reddit-post-card').data('post-id');
        $('.post-menu-dropdown').remove();
        const menuHtml = `
            <div class="post-menu-dropdown active">
                <div class="menu-item edit-post-btn" data-id="${postId}">✏️ Chỉnh sửa bài viết</div>
                <div class="menu-divider"></div>
                <div class="menu-item danger delete-post-btn" data-id="${postId}">🗑️ Xóa bài viết</div>
            </div>`;
        $(this).parent().css('position', 'relative').append(menuHtml);
    });

    $(document).click(() => $('.post-menu-dropdown').remove());

    $(document).on('click', '.delete-post-btn', function (e) {
        e.stopPropagation();
        const postId = $(this).data('id');
        if (confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
            alert("Đã xác nhận xóa bài ID: " + postId);
        }
        $('.post-menu-dropdown').remove();
    });

    $(document).on('click', '.see-more-btn', function (e) {
        e.preventDefault();
        const container = $(this).closest('.post-body-text');
        const isExpanding = $(this).text() === "Xem thêm";
        container.find('.content-short').toggle(!isExpanding);
        container.find('.content-full').toggle(isExpanding);
        $(this).text(isExpanding ? "Thu gọn" : "Xem thêm");
    });

    // ==========================================
    // 4. CORE FUNCTIONS (UPLOAD, LOAD POSTS...)
    // ==========================================

    async function handlePostSubmission() {
        btnSubmitPost.text("Đang xử lý...").prop("disabled", true);
        let finalMediaUrl = null;
        try {
            if (currentFile) {
                finalMediaUrl = await uploadMedia(currentFile);
            }
            callCreatePostGraphQL(finalMediaUrl);
        } catch (error) {
            alert("⚠️ " + error.message);
            btnSubmitPost.text("Đăng").prop("disabled", false);
        }
    }

    function callCreatePostGraphQL(mediaUrl) {
        const content = postContentInput.val();
        const privacy = $("#privacySelect").val();
        let type = "NONE";
        if (mediaUrl) {
            type = (currentFile && currentFile.type.startsWith("video/")) ? "VIDEO" : "IMAGE";
        }

        const mutation = {
            query: `mutation CreatePost($input: CreatePostInput!) { 
                createPost(input: $input) { id } 
            }`,
            variables: {
                input: {
                    content: content,
                    mediaUrl: mediaUrl,
                    mediaType: type,
                    privacyLevel: privacy
                }
            }
        };

        sendGraphQLRequest(mutation, () => {
            createPostModal.modal('hide');
            resetForm();
            loadAllPosts();
        }, () => btnSubmitPost.text("Đăng").prop("disabled", false));
    }

    function uploadMedia(file) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);
            $.ajax({
                url: "/api/upload/media",
                type: "POST",
                headers: { "Authorization": "Bearer " + token },
                data: formData,
                processData: false,
                contentType: false,
                success: (res) => {
                    if (res && res.url) resolve(res.url);
                    else if (typeof res === 'string' && res.startsWith('/')) resolve(res);
                    else reject(new Error("Lỗi upload media."));
                },
                error: (xhr) => reject(new Error("Lỗi kết nối upload."))
            });
        });
    }

    function sendGraphQLRequest(payload, onSuccess, onError) {
        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(payload),
            success: (res) => {
                if (res.data) onSuccess(res);
                else {
                    alert("Lỗi server: " + (res.errors ? res.errors[0].message : "Unknown"));
                    if (onError) onError();
                }
            },
            error: () => {
                alert("Lỗi kết nối Server");
                if (onError) onError();
            }
        });
    }

    function resetForm() {
        postContentInput.val("");
        btnRemoveMedia.click();
    }

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
        const query = {
            query: `query { getAllPosts { id content mediaUrl mediaType createdAt privacyLevel likeCount commentCount user { id fullName username avatarUrl } } }`
        };

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(query),
            success: (res) => {
                if (res.data && res.data.getAllPosts) {
                    currentPosts = res.data.getAllPosts; // Cập nhật danh sách bài để sửa
                    renderPosts(currentPosts);
                } else {
                    newsfeedContainer.html('<div class="text-center py-5 text-muted">Chưa có bài viết nào.</div>');
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
            const content = post.content || "";
            let contentHtml = content.replace(/\n/g, "<br>");
            if (content.length > 300) {
                contentHtml = `
                    <span class="content-short">${content.substring(0, 300).replace(/\n/g, "<br>")}...</span>
                    <span class="content-full" style="display:none;">${content.replace(/\n/g, "<br>")}</span>
                    <a href="#" class="see-more-btn">Xem thêm</a>`;
            }

            let mediaHtml = '';
            const urlToDisplay = post.mediaUrl || post.imageUrl;
            if (urlToDisplay) {
                const isVideo = (post.mediaType === 'VIDEO') || (urlToDisplay.match(/\.(mp4|mov|avi|mkv)$/i));
                if (isVideo) {
                    mediaHtml = `
                        <div style="background:black; width:100%; display:flex; justify-content:center;">
                            <video controls class="post-full-image" style="max-height:500px; width:100%;">
                                <source src="${urlToDisplay}" type="video/mp4">
                            </video>
                        </div>`;
                } else {
                    mediaHtml = `<img src="${urlToDisplay}" class="post-full-image" loading="lazy">`;
                }
            }

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
        return date.toLocaleDateString("vi-VN");
    }
});