$(document).ready(function () {
    // --- INIT ---
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    // 1. Tải thông tin User mới nhất từ Server (Fix lỗi avatar cũ)
    fetchCurrentUserProfile();

    // 2. Tải bài viết
    loadAllPosts();

    // --- VARIABLES ---
    const newsfeedContainer = $("#newsfeed-container");
    // Create Modal Elements
    const createPostModal = $('#createPostModal');
    const btnSubmitPost = $("#btnSubmitPost");
    const postContentInput = $("#postContentInput");
    const fileInput = $("#fileUploadInput");
    const mediaPreviewContainer = $("#mediaPreviewContainer");
    const imagePreview = $("#imagePreview");
    const videoPreview = $("#videoPreview");
    const btnRemoveMedia = $("#btnRemoveMedia");
    // Update Modal Elements
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

    // --- FUNCTION: LẤY INFO USER MỚI NHẤT ---
    function fetchCurrentUserProfile() {
        const username = localStorage.getItem("username");
        if (!username) return;

        const query = {
            query: `query GetMe($username: String!) {
                getUserByUsername(username: $username) {
                    id fullName username avatarUrl
                }
            }`,
            variables: { username: username }
        };

        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(query),
            success: function (res) {
                if (res.data && res.data.getUserByUsername) {
                    const user = res.data.getUserByUsername;
                    const realAvatar = user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`;

                    // Cập nhật giao diện
                    $('#currentUserAvatarSmall').attr('src', realAvatar);
                    $('#modalUserAvatar').attr('src', realAvatar);
                    $('#updateModalUserAvatar').attr('src', realAvatar);

                    // Cập nhật lại localStorage để các trang khác dùng
                    localStorage.setItem('userAvatarUrl', realAvatar);
                    // Cập nhật currentUser object trong storage
                    let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    currentUser.avatarUrl = user.avatarUrl;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }
            }
        });
    }

    // ==========================================
    // CÁC HÀM XỬ LÝ MODAL & POST (GIỮ NGUYÊN LOGIC CŨ)
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

    btnSubmitPost.click(function () { handlePostSubmission(); });

    // --- Update Modal Logic ---
    $(document).on('click', '.edit-post-btn', function (e) {
        e.stopPropagation();
        const postId = $(this).data('id');
        prepareEditPost(postId);
        $('.post-menu-dropdown').remove();
    });

    function prepareEditPost(postId) {
        const post = currentPosts.find(p => p.id == postId);
        if (!post) { alert("Lỗi: Không tìm thấy bài viết!"); return; }

        updateFile = null;
        isMediaDeleted = false;
        updateFileInput.val("");

        // Set info user (lấy từ ảnh đã đồng bộ ở trên)
        const currentAvatar = $('#currentUserAvatarSmall').attr('src');
        $("#updateModalUserAvatar").attr("src", currentAvatar);
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        $("#updateModalUserName").text(currentUser.fullName || currentUser.username);

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
    });

    btnUpdatePost.click(async function () {
        const postId = $(this).data("id");
        const content = updatePostContentInput.val();
        const privacy = updatePrivacySelect.val();
        btnUpdatePost.text("Đang lưu...").prop("disabled", true);

        const originalPost = currentPosts.find(p => p.id == postId);
        let finalMediaUrl = originalPost.mediaUrl || originalPost.imageUrl;
        let finalMediaType = originalPost.mediaType || "NONE";

        try {
            if (updateFile) {
                finalMediaUrl = await uploadMedia(updateFile);
                finalMediaType = (updateFile.type.startsWith("video/")) ? "VIDEO" : "IMAGE";
            } else if (isMediaDeleted) {
                finalMediaUrl = null;
                finalMediaType = "NONE";
            }

            const mutation = {
                query: `mutation UpdatePost($input: UpdatePostInput!) { 
                    updatePost(input: $input) { id } 
                }`,
                variables: {
                    input: {
                        id: postId, content: content, mediaUrl: finalMediaUrl,
                        mediaType: finalMediaType, privacyLevel: privacy
                    }
                }
            };

            sendGraphQLRequest(mutation, () => {
                alert("Cập nhật thành công!");
                updatePostModal.modal('hide');
                loadAllPosts();
            }, () => btnUpdatePost.text("Lưu thay đổi").prop("disabled", false));
        } catch (e) {
            alert("Lỗi: " + e.message);
            btnUpdatePost.text("Lưu thay đổi").prop("disabled", false);
        }
    });

    // --- Post Actions ---
    $(document).on('click', '.post-menu-btn', function (e) {
        e.stopPropagation();
        const postId = $(this).closest('.reddit-post-card').data('post-id');
        $('.post-menu-dropdown').remove();
        const menuHtml = `
            <div class="post-menu-dropdown active">
                <div class="menu-item edit-post-btn" data-id="${postId}">✏️ Chỉnh sửa</div>
                <div class="menu-divider"></div>
                <div class="menu-item danger delete-post-btn" data-id="${postId}">🗑️ Xóa</div>
            </div>`;
        $(this).parent().css('position', 'relative').append(menuHtml);
    });
    $(document).click(() => $('.post-menu-dropdown').remove());

    $(document).on('click', '.delete-post-btn', function (e) {
        e.stopPropagation();
        const postId = $(this).data('id');
        if (confirm("Xóa bài viết này?")) {
            const mutation = { query: `mutation { deletePost(id: "${postId}") }` };
            sendGraphQLRequest(mutation, (res) => {
                if (res.data.deletePost) {
                    $(`.reddit-post-card[data-post-id="${postId}"]`).slideUp(() => $(this).remove());
                }
            });
        }
    });

    // --- Like & Comment ---
    $(document).on('click', '.btn-like', function () {
        const btn = $(this);
        const postId = btn.data('id');
        const mutation = { query: `mutation { toggleLikePost(postId: "${postId}") }` };

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(mutation),
            success: (res) => {
                if (res.data) {
                    const isLiked = res.data.toggleLikePost;
                    const countSpan = $(`#like-count-${postId}`);
                    let count = parseInt(countSpan.text().replace(/[^0-9]/g, ''));
                    if (isLiked) {
                        btn.css('color', '#2e89ff').css('font-weight', 'bold');
                        countSpan.text(`👍 ${count + 1}`);
                    } else {
                        btn.css('color', '');
                        countSpan.text(`👍 ${Math.max(0, count - 1)}`);
                    }
                }
            }
        });
    });

    // --- Helper Functions ---
    async function handlePostSubmission() {
        btnSubmitPost.text("Đang xử lý...").prop("disabled", true);
        try {
            let mediaUrl = null;
            if (currentFile) mediaUrl = await uploadMedia(currentFile);
            callCreatePostGraphQL(mediaUrl);
        } catch (e) {
            alert(e.message);
            btnSubmitPost.text("Đăng").prop("disabled", false);
        }
    }

    function callCreatePostGraphQL(mediaUrl) {
        const type = mediaUrl ? (currentFile.type.startsWith("video/") ? "VIDEO" : "IMAGE") : "NONE";
        const mutation = {
            query: `mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { id } }`,
            variables: {
                input: {
                    content: postContentInput.val(),
                    mediaUrl: mediaUrl, mediaType: type,
                    privacyLevel: $("#privacySelect").val()
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
                url: "/api/upload/media", type: "POST",
                headers: { "Authorization": "Bearer " + token },
                data: formData, processData: false, contentType: false,
                success: (res) => resolve(res.url),
                error: () => reject(new Error("Lỗi upload ảnh"))
            });
        });
    }

    function sendGraphQLRequest(payload, onSuccess, onError) {
        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(payload),
            success: (res) => {
                if (res.data) onSuccess(res);
                else { alert("Lỗi: " + res.errors[0].message); if (onError) onError(); }
            },
            error: () => { alert("Lỗi kết nối"); if (onError) onError(); }
        });
    }

    function loadAllPosts() {
        const query = { query: `query { getAllPosts { id content mediaUrl mediaType createdAt privacyLevel likeCount commentCount isLikedByMe user { id fullName username avatarUrl } } }` };
        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(query),
            success: (res) => {
                if (res.data && res.data.getAllPosts) {
                    currentPosts = res.data.getAllPosts;
                    renderPosts(currentPosts);
                }
            }
        });
    }

    function renderPosts(posts) {
        newsfeedContainer.empty();
        posts.forEach(post => {
            const avatar = post.user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${post.user.username}`;
            let mediaHtml = '';
            if (post.mediaUrl) {
                if (post.mediaType === 'VIDEO') mediaHtml = `<video controls class="post-full-image" src="${post.mediaUrl}"></video>`;
                else mediaHtml = `<img src="${post.mediaUrl}" class="post-full-image">`;
            }

            const likeStyle = post.isLikedByMe ? 'color:#2e89ff; font-weight:bold;' : '';

            const html = `
                <div class="reddit-post-card" data-post-id="${post.id}">
                    <div class="post-header">
                        <img src="${avatar}" class="post-user-avatar">
                        <div class="post-user-info ms-2">
                            <b>${post.user.fullName}</b>
                            <small class="text-muted d-block" style="font-size:12px">${new Date(post.createdAt).toLocaleString('vi-VN')}</small>
                        </div>
                        <button class="post-menu-btn">...</button>
                    </div>
                    <div class="post-body-text mt-2">${post.content}</div>
                    ${mediaHtml}
                    <div class="post-stats-bar mt-2 d-flex justify-content-between text-muted small">
                        <span id="like-count-${post.id}">👍 ${post.likeCount}</span>
                        <span>${post.commentCount} bình luận</span>
                    </div>
                    <div class="post-action-buttons border-top mt-2 pt-2">
                        <button class="action-btn btn-like" data-id="${post.id}" style="${likeStyle}">👍 Thích</button>
                        <button class="action-btn">💬 Bình luận</button>
                        <button class="action-btn">↗️ Chia sẻ</button>
                    </div>
                </div>`;
            newsfeedContainer.append(html);
        });
    }

    function resetForm() {
        postContentInput.val("");
        if (currentFile) btnRemoveMedia.click();
    }
});