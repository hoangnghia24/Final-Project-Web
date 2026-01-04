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
    const btnRemoveUpdateMedia = $("#btnRemoveUpdateMedia");
    const updateFileInput = $("#updateFileUploadInput");

    let currentFile = null;
    let updateFile = null;
    let currentPosts = [];
    let isMediaDeleted = false;

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
    // 1. XỬ LÝ MODAL TẠO BÀI
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
    // 2. XỬ LÝ MODAL SỬA BÀI
    // ==========================================

    $(document).on('click', '.edit-post-btn', function (e) {
        e.stopPropagation();
        const postId = $(this).data('id');
        prepareEditPost(postId);
        $('.post-menu-dropdown').remove();
    });

    function prepareEditPost(postId) {
        const post = currentPosts.find(p => p.id == postId);
        if (!post) {
            alert("Lỗi: Không tìm thấy bài viết!");
            return;
        }

        updateFile = null;
        isMediaDeleted = false;
        updateFileInput.val("");

        const currentUserStr = localStorage.getItem("currentUser");
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            const avatar = user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
            $("#updateModalUserAvatar").attr("src", avatar);
            $("#updateModalUserName").text(user.fullName || user.username);
        }

        updatePostContentInput.val(post.content);
        updatePrivacySelect.val(post.privacyLevel);

        const mediaUrl = post.mediaUrl || post.imageUrl;

        if (mediaUrl) {
            updateMediaPreviewContainer.show();
            const isVideo = (post.mediaType === 'VIDEO') || (mediaUrl.match(/\.(mp4|mov|avi|mkv)$/i));

            if (isVideo) {
                updateImagePreview.hide();
                updateVideoPreview.attr("src", mediaUrl).show();
            } else {
                updateVideoPreview.hide();
                updateImagePreview.attr("src", mediaUrl).show();
            }
        } else {
            updateMediaPreviewContainer.hide();
            updateImagePreview.attr("src", "");
            updateVideoPreview.attr("src", "");
        }

        btnUpdatePost.data("id", postId);
        updatePostModal.modal('show');
    }

    updateFileInput.on("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        updateFile = file;
        isMediaDeleted = false;

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

    btnRemoveUpdateMedia.on("click", function () {
        updateFile = null;
        updateFileInput.val("");
        isMediaDeleted = true;

        updateMediaPreviewContainer.hide();
        updateImagePreview.attr("src", "");
        updateVideoPreview.attr("src", "");
    });

    btnUpdatePost.click(async function () {
        const postId = $(this).data("id"); // Lấy ID bài viết đang sửa
        const content = updatePostContentInput.val();
        const privacy = updatePrivacySelect.val();

        // Disable nút để tránh bấm nhiều lần
        btnUpdatePost.text("Đang lưu...").prop("disabled", true);

        // 1. Xác định URL ảnh cuối cùng
        // Lấy lại thông tin bài viết gốc từ mảng currentPosts để so sánh
        const originalPost = currentPosts.find(p => p.id == postId);
        let finalMediaUrl = originalPost.mediaUrl || originalPost.imageUrl; // Mặc định giữ nguyên ảnh cũ
        let finalMediaType = originalPost.mediaType || "NONE";

        try {
            // Trường hợp 1: Người dùng chọn file mới -> Upload file mới
            if (updateFile) {
                finalMediaUrl = await uploadMedia(updateFile);
                finalMediaType = (updateFile.type.startsWith("video/")) ? "VIDEO" : "IMAGE";
            }
            // Trường hợp 2: Người dùng bấm nút Xóa ảnh cũ -> Gán null
            else if (isMediaDeleted) {
                finalMediaUrl = null;
                finalMediaType = "NONE";
            }
            // Trường hợp 3: Không làm gì cả -> Giữ nguyên finalMediaUrl cũ (đã gán ở trên)

            // 2. Gọi GraphQL Mutation Update
            const mutation = {
                query: `mutation UpdatePost($input: UpdatePostInput!) { 
                    updatePost(input: $input) { 
                        id content mediaUrl mediaType privacyLevel 
                        user { id fullName avatarUrl }
                    } 
                }`,
                variables: {
                    input: {
                        id: postId,
                        content: content,
                        mediaUrl: finalMediaUrl,
                        mediaType: finalMediaType,
                        privacyLevel: privacy
                    }
                }
            };

            sendGraphQLRequest(mutation, (res) => {
                // Thành công
                alert("Cập nhật bài viết thành công!");
                updatePostModal.modal('hide');

                // Reset form
                updateFile = null;
                isMediaDeleted = false;
                updateFileInput.val("");

                // Load lại feed để thấy thay đổi
                loadAllPosts();
            }, () => {
                // Thất bại
                btnUpdatePost.text("Lưu thay đổi").prop("disabled", false);
            });

        } catch (error) {
            alert("Lỗi: " + error.message);
            btnUpdatePost.text("Lưu thay đổi").prop("disabled", false);
        }
    });

    // ==========================================
    // 3. CÁC HÀM XỬ LÝ KHÁC
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

        // Xóa menu dropdown cho gọn
        $('.post-menu-dropdown').remove();

        if (confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) {
            // Gọi API Xóa
            const mutation = {
                query: `mutation DeletePost($id: ID!) { 
                    deletePost(id: $id) 
                }`,
                variables: {
                    id: postId
                }
            };

            // Hiệu ứng UX: Tạm thời làm mờ bài viết để người dùng thấy đang xử lý
            const $postCard = $(`.reddit-post-card[data-post-id="${postId}"]`);
            $postCard.css('opacity', '0.5');

            sendGraphQLRequest(mutation, (res) => {
                if (res.data && res.data.deletePost) {
                    // Thành công: Xóa hẳn element khỏi giao diện (không cần load lại toàn bộ feed)
                    $postCard.slideUp(300, function () {
                        $(this).remove();
                    });

                    // Cập nhật lại mảng currentPosts (xóa bài khỏi mảng cục bộ)
                    currentPosts = currentPosts.filter(p => p.id != postId);
                } else {
                    alert("Xóa thất bại!");
                    $postCard.css('opacity', '1'); // Hoàn tác hiệu ứng mờ
                }
            }, () => {
                // Lỗi mạng
                $postCard.css('opacity', '1');
            });
        }
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
    // 4. CORE FUNCTIONS
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
                    currentPosts = res.data.getAllPosts;
                    renderPosts(currentPosts);
                } else {
                    newsfeedContainer.html('<div class="text-center py-5 text-muted">Chưa có bài viết nào.</div>');
                }
            },
            error: () => newsfeedContainer.html('<div class="text-center text-danger py-5">Lỗi tải bài viết.</div>')
        });
    }

    // --- HÀM NÀY ĐÃ ĐƯỢC SỬA ĐỂ HIỂN THỊ ICON ĐÚNG ---
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

            // Xử lý icon Quyền riêng tư
            let privacyIcon = '🔒'; // Mặc định là PRIVATE
            if (post.privacyLevel === 'PUBLIC') {
                privacyIcon = '🌎';
            } else if (post.privacyLevel === 'FRIENDS_ONLY') { // <-- Sửa logic ở đây
                privacyIcon = '👥'; // Icon 2 người
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
                                    ${calculateTimeAgo(post.createdAt)} • ${privacyIcon} </small>
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