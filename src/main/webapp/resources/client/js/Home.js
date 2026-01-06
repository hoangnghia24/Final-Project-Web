$(document).ready(function () {
    // --- 1. KHỞI TẠO (INIT) ---
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    const newsfeedContainer = $("#newsfeed-container");
    const createPostModal = $('#createPostModal');
    const btnSubmitPost = $("#btnSubmitPost");
    const postContentInput = $("#postContentInput");
    const fileInput = $("#fileUploadInput");
    const mediaPreviewContainer = $("#mediaPreviewContainer");
    const imagePreview = $("#imagePreview");
    const videoPreview = $("#videoPreview");
    const btnRemoveMedia = $("#btnRemoveMedia");

    const updatePostModal = $('#updatePostModal');
    const btnUpdatePost = $("#btnUpdatePost");
    const updatePostContentInput = $("#updatePostContentInput");
    const updatePrivacySelect = $("#updatePrivacySelect");
    const updateMediaPreviewContainer = $("#updateMediaPreviewContainer");
    const updateImagePreview = $("#updateImagePreview");
    const updateVideoPreview = $("#updateVideoPreview");
    const btnRemoveUpdateMedia = $("#btnRemoveUpdateMedia");
    const updateFileInput = $("#updateFileUploadInput");

    let currentPosts = [];
    let currentFile = null;
    let updateFile = null;
    let isMediaDeleted = false;

    fetchCurrentUserProfile();
    loadAllPosts();

    // --- 2. LOGIC ĐĂNG BÀI (CÓ XỬ LÝ ẢNH/VIDEO) ---
    function updatePostButtonState() {
        const hasText = postContentInput.val().trim().length > 0;
        const hasFile = currentFile !== null;
        btnSubmitPost.prop("disabled", !(hasText || hasFile));
    }

    postContentInput.on("input", updatePostButtonState);

    // Fix chọn file và hiện Preview
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
        updatePostButtonState();
    });

    btnSubmitPost.click(async function () {
        btnSubmitPost.text("Đang xử lý...").prop("disabled", true);
        try {
            let mediaUrl = null;
            if (currentFile) mediaUrl = await uploadMedia(currentFile);
            const type = mediaUrl ? (currentFile.type.startsWith("video/") ? "VIDEO" : "IMAGE") : "NONE";

            const mutation = {
                query: `mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { id } }`,
                variables: {
                    input: {
                        content: postContentInput.val(),
                        mediaUrl: mediaUrl,
                        mediaType: type,
                        privacyLevel: $("#privacySelect").val() || "PUBLIC"
                    }
                }
            };

            $.ajax({
                url: "/graphql", type: "POST", contentType: "application/json",
                headers: { "Authorization": "Bearer " + token },
                data: JSON.stringify(mutation),
                success: function (res) {
                    if (res.data && res.data.createPost) {
                        createPostModal.modal('hide');
                        resetForm();
                        loadAllPosts();
                    }
                    btnSubmitPost.text("Đăng").prop("disabled", false);
                }
            });
        } catch (e) { alert(e.message); btnSubmitPost.text("Đăng").prop("disabled", false); }
    });

    // --- 3. LOGIC LIKE (MÀU TÍM) ---
    $(document).on('click', '.btn-like', function (e) {
        e.stopPropagation();
        const btn = $(this);
        const postId = btn.data('id');
        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify({ query: `mutation { toggleLikePost(postId: "${postId}") }` }),
            success: (res) => {
                if (res.data) {
                    const isLiked = res.data.toggleLikePost;
                    const countSpan = $(`#like-count-${postId}`);
                    let count = parseInt(countSpan.text().replace(/[^0-9]/g, '')) || 0;
                    if (isLiked) {
                        btn.addClass('liked');
                        btn.find('svg').attr('fill', '#4e54c8').attr('stroke', '#4e54c8');
                        countSpan.text(`👍 ${count + 1}`);
                    } else {
                        btn.removeClass('liked');
                        btn.find('svg').attr('fill', 'none').attr('stroke', 'currentColor');
                        countSpan.text(`👍 ${Math.max(0, count - 1)}`);
                    }
                }
            }
        });
    });

    // --- 4. LOGIC BÌNH LUẬN ---
    $(document).on('click', '.btn-show-comments', function (e) {
        e.preventDefault(); e.stopPropagation();
        const postId = $(this).data('id');
        $(`#comment-section-${postId}`).slideToggle();
        if ($(`#comment-section-${postId}`).is(':visible')) loadComments(postId);
    });

    $(document).on('keypress', '.comment-input-field', function (e) {
        if (e.which === 13) {
            const postId = $(this).data('id');
            const content = $(this).val().trim();
            if (content) submitComment(postId, content, $(this));
        }
    });

    $(document).on('click', '.btn-send-comment', function (e) {
        e.preventDefault(); e.stopPropagation();
        const postId = $(this).data('id');
        const inputField = $(this).siblings('.comment-input-field');
        const content = inputField.val().trim();
        if (content) submitComment(postId, content, inputField);
    });

    function submitComment(postId, content, inputEl) {
        const mutation = {
            query: `mutation CreateComment($input: CreateCommentInput!) { createComment(input: $input) { id content user { fullName avatarUrl } } }`,
            variables: { input: { postId: postId.toString(), content: content } }
        };
        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(mutation),
            success: function (res) {
                if (res.data && res.data.createComment) {
                    inputEl.val('');
                    loadComments(postId);
                    let label = $(`#comment-count-${postId}`);
                    label.text(`${(parseInt(label.text()) || 0) + 1} bình luận`);
                }
            }
        });
    }

    function loadComments(postId) {
        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify({ query: `query { getCommentsByPostId(postId: "${postId}") { id content user { fullName avatarUrl username } } }` }),
            success: function (res) {
                const container = $(`#comment-list-${postId}`).empty();
                res.data.getCommentsByPostId.forEach(c => {
                    const avt = c.user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.user.username}`;
                    container.append(`<div class="comment-item d-flex mb-2"><img src="${avt}" class="comment-avatar"><div class="comment-bubble"><strong>${c.user.fullName}</strong><p class="mb-0">${c.content}</p></div></div>`);
                });
            }
        });
    }

    // --- 5. LOGIC MENU BA CHẤM, SỬA, XÓA ---
    $(document).on('click', '.post-menu-btn', function (e) {
        e.preventDefault(); e.stopPropagation();
        const postId = $(this).closest('.reddit-post-card').data('post-id');
        $('.post-menu-dropdown').remove();
        $(this).after(`<div class="post-menu-dropdown active"><div class="menu-item edit-post-btn" data-id="${postId}">✏️ Chỉnh sửa</div><div class="menu-divider"></div><div class="menu-item danger delete-post-btn" data-id="${postId}">🗑️ Xóa</div></div>`);
    });

    $(document).on('click', '.delete-post-btn', function (e) {
        e.preventDefault(); e.stopPropagation();
        const postId = $(this).data('id');
        if (confirm("Xóa bài viết này?")) {
            $.ajax({
                url: "/graphql", type: "POST", contentType: "application/json", headers: { "Authorization": "Bearer " + token },
                data: JSON.stringify({ query: `mutation { deletePost(id: "${postId}") }` }),
                success: function (res) { if (res.data.deletePost) $(`.reddit-post-card[data-post-id="${postId}"]`).fadeOut(300, function () { $(this).remove(); }); }
            });
        }
    });

    $(document).on('click', '.edit-post-btn', function (e) {
        const postId = $(this).data('id');
        const post = currentPosts.find(p => p.id == postId);
        if (!post) return;
        updatePostContentInput.val(post.content);
        updatePrivacySelect.val(post.privacyLevel);

        if (post.mediaUrl) {
            updateMediaPreviewContainer.show();
            if (post.mediaType === 'VIDEO') {
                updateImagePreview.hide(); updateVideoPreview.attr("src", post.mediaUrl).show();
            } else {
                updateVideoPreview.hide(); updateImagePreview.attr("src", post.mediaUrl).show();
            }
        } else { updateMediaPreviewContainer.hide(); }

        btnUpdatePost.data("id", postId);
        $('.post-menu-dropdown').remove();
        updatePostModal.modal('show');
    });

    updateFileInput.on("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;
        updateFile = file;
        isMediaDeleted = false;
        const objectUrl = URL.createObjectURL(file);
        updateMediaPreviewContainer.fadeIn();
        if (file.type.startsWith("video/")) {
            updateImagePreview.hide(); updateVideoPreview.attr("src", objectUrl).show();
        } else {
            updateVideoPreview.hide(); updateImagePreview.attr("src", objectUrl).show();
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
        btnUpdatePost.text("Đang lưu...").prop("disabled", true);

        let finalUrl = currentPosts.find(x => x.id == postId).mediaUrl;
        let finalType = currentPosts.find(x => x.id == postId).mediaType;
        if (updateFile) {
            finalUrl = await uploadMedia(updateFile);
            finalType = updateFile.type.startsWith("video/") ? "VIDEO" : "IMAGE";
        } else if (isMediaDeleted) { finalUrl = null; finalType = "NONE"; }

        const mutation = {
            query: `mutation UpdatePost($input: UpdatePostInput!) { updatePost(input: $input) { id } }`,
            variables: { input: { id: postId.toString(), content: updatePostContentInput.val(), mediaUrl: finalUrl, mediaType: finalType, privacyLevel: updatePrivacySelect.val() } }
        };
        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json", headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(mutation),
            success: function () { updatePostModal.modal('hide'); loadAllPosts(); btnUpdatePost.text("Lưu thay đổi").prop("disabled", false); }
        });
    });

    // --- 6. RENDER VÀ HELPERS ---
    function renderPosts(posts) {
        newsfeedContainer.empty();
        posts.forEach(post => {
            const avatar = post.user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${post.user.username}`;
            let mediaHtml = post.mediaUrl ? (post.mediaType === 'VIDEO' ? `<video controls class="post-full-image" src="${post.mediaUrl}"></video>` : `<img src="${post.mediaUrl}" class="post-full-image">`) : '';
            const isLiked = post.isLikedByMe;
            newsfeedContainer.append(`
            <div class="reddit-post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${avatar}" class="post-user-avatar">
                    <div class="post-user-info"><b>${post.user.fullName}</b><small>${new Date(post.createdAt).toLocaleString('vi-VN')}</small></div>
                    <div class="post-header-actions" style="position: relative;"><button class="post-menu-btn">...</button></div>
                </div>
                <div class="post-main-content"><div class="post-body-text">${post.content}</div>${mediaHtml}</div>
                <div class="post-stats-bar">
                    <div class="post-stats-left"><span id="like-count-${post.id}">👍 ${post.likeCount}</span></div>
                    <div class="post-stats-right"><span>${post.commentCount} bình luận</span></div>
                </div>
                <div class="post-action-buttons">
                    <button class="action-btn btn-like ${isLiked ? 'liked' : ''}" data-id="${post.id}">
                        <svg viewBox="0 0 24 24" fill="${isLiked ? '#4e54c8' : 'none'}" stroke="${isLiked ? '#4e54c8' : 'currentColor'}" width="20" height="20" stroke-width="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                        <span>Thích</span>
                    </button>
                    <button class="action-btn btn-show-comments" data-id="${post.id}">💬 <span>Bình luận</span></button>
                    <button class="action-btn">↗️ <span>Chia sẻ</span></button>
                </div>
                <div class="post-comments-section" id="comment-section-${post.id}" style="display:none;">
                    <div class="comment-list" id="comment-list-${post.id}"></div>
                    <div class="comment-input-wrapper">
                        <img src="${localStorage.getItem('userAvatarUrl') || ''}" class="comment-avatar">
                        <div class="comment-input-container" style="position: relative; flex: 1; display: flex; align-items: center;">
                            <input type="text" class="comment-input comment-input-field" placeholder="Viết bình luận..." data-id="${post.id}">
                            <button class="btn-send-comment" data-id="${post.id}"><svg viewBox="0 0 24 24" width="20" height="20" fill="#4e54c8"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg></button>
                        </div>
                    </div>
                </div>
            </div>`);
        });
    }

    function loadAllPosts() {
        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json", headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify({ query: `query { getAllPosts { id content mediaUrl mediaType createdAt privacyLevel likeCount commentCount isLikedByMe user { id fullName username avatarUrl } } }` }),
            success: (res) => { if (res.data) { currentPosts = res.data.getAllPosts; renderPosts(currentPosts); } }
        });
    }

    function uploadMedia(file) {
        const fd = new FormData(); fd.append("file", file);
        return new Promise((resolve) => {
            $.ajax({ url: "/api/upload/media", type: "POST", headers: { "Authorization": "Bearer " + token }, data: fd, processData: false, contentType: false, success: (r) => resolve(r.url) });
        });
    }

    function fetchCurrentUserProfile() {
        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json", headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify({ query: `query { getUserByUsername(username: "${localStorage.getItem("username")}") { avatarUrl fullName username } }` }),
            success: function (res) {
                if (res.data && res.data.getUserByUsername) {
                    const u = res.data.getUserByUsername;
                    const avt = u.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.username}`;
                    $('.create-post-avatar, #currentUserAvatarSmall, #modalUserAvatar, #updateModalUserAvatar').attr('src', avt);
                    localStorage.setItem('userAvatarUrl', avt);
                }
            }
        });
    }

    function resetForm() { postContentInput.val(""); currentFile = null; fileInput.val(""); mediaPreviewContainer.hide(); updatePostButtonState(); }
    $(document).on('click', function () { $('.post-menu-dropdown').remove(); });
});