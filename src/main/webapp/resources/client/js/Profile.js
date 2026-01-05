$(document).ready(function () {
    // --- BIẾN TOÀN CỤC ---
    const currentUsername = localStorage.getItem("username"); // User đang đăng nhập
    const accessToken = localStorage.getItem("accessToken");
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // Kiểm tra đăng nhập
    if (!accessToken) {
        window.location.href = "/login";
    }

    // Lấy username của profile đang xem từ URL
    let profileUsername = currentUsername;
    const pathParts = window.location.pathname.split('/');
    if (pathParts.includes('u') && pathParts.length > 2) {
        profileUsername = pathParts[pathParts.indexOf('u') + 1];
    }

    // --- Create Modal Variables ---
    const createPostModal = $('#createPostModal');
    const btnSubmitPost = $("#btnSubmitPost");
    const postContentInput = $("#postContentInput");
    const fileInput = $("#fileUploadInput");
    const mediaPreviewContainer = $("#mediaPreviewContainer");
    const imagePreview = $("#imagePreview");
    const videoPreview = $("#videoPreview");
    const btnRemoveMedia = $("#btnRemoveMedia");

    // --- Update Modal Variables ---
    const updatePostModal = $('#updatePostModal');
    const btnUpdatePost = $("#btnUpdatePost");
    const updatePostContentInput = $("#updatePostContentInput");
    const updateMediaPreviewContainer = $("#updateMediaPreviewContainer");
    const updateImagePreview = $("#updateImagePreview");
    const updateVideoPreview = $("#updateVideoPreview");
    const btnRemoveUpdateMedia = $("#btnRemoveUpdateMedia");
    const updateFileInput = $("#updateFileUploadInput");

    let currentFile = null;
    let updateFile = null;
    let currentPosts = [];

    // --- KHỞI TẠO ---
    loadUserProfile(profileUsername);
    loadUserPosts(profileUsername);
    setupCreateModalUserInfo();

    // =========================================================
    // 1. LOGIC PROFILE (LOAD INFO, TABS)
    // =========================================================
    function loadUserProfile(username) {
        const graphqlData = {
            query: `query GetUserProfile($username: String!) {
                getUserByUsername(username: $username) {
                    id username fullName email avatarUrl bio createdAt role
                }
            }`,
            variables: { username: username }
        };

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + accessToken },
            data: JSON.stringify(graphqlData),
            success: function (response) {
                if (response.data && response.data.getUserByUsername) {
                    renderUserData(response.data.getUserByUsername);
                } else {
                    alert("Không tìm thấy người dùng!");
                }
            }
        });
    }

    function renderUserData(user) {
        const avatarUrl = user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
        $("#header-avatar").css("background-image", `url('${avatarUrl}')`);
        $("#sidebar-avatar").css("background-image", `url('${avatarUrl}')`);
        $("#header-fullname, #sidebar-fullname").text(user.fullName);
        $("#header-username, #sidebar-tag").text("u/" + user.username);
        $("#sidebar-bio").text(user.bio || "Người dùng này chưa viết giới thiệu.");

        if (user.createdAt) {
            const date = new Date(user.createdAt);
            $("#sidebar-created").text(date.toLocaleDateString("vi-VN"));
        }
    }

    $('.tab-item').on('click', function () {
        $('.tab-item').removeClass('active');
        $(this).addClass('active');
        const tabName = $(this).data('tab');
        $('.tab-content').removeClass('active');
        $('#tab-' + tabName).addClass('active');
    });

    // =========================================================
    // 2. LOGIC BÀI VIẾT (LOAD, RENDER)
    // =========================================================

    function setupCreateModalUserInfo() {
        if (currentUser) {
            const avatar = currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`;
            $("#modalUserAvatar").attr("src", avatar);
            $("#modalUserName").text(currentUser.fullName);
        }
    }

    function loadUserPosts(username) {
        const query = {
            query: `query { getAllPosts { id content mediaUrl mediaType createdAt privacyLevel likeCount commentCount user { id fullName username avatarUrl } } }`
        };

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + accessToken },
            data: JSON.stringify(query),
            success: (res) => {
                if (res.data && res.data.getAllPosts) {
                    const allPosts = res.data.getAllPosts;
                    currentPosts = allPosts.filter(post => post.user.username === username);
                    renderUserPosts(currentPosts);
                } else {
                    renderUserPosts([]);
                }
            },
            error: () => console.error("Lỗi tải bài viết")
        });
    }

    function renderUserPosts(posts) {
        const container = $("#profile-posts-container");
        const emptyState = $("#empty-posts-state");
        container.empty();

        if (posts.length === 0) {
            container.hide();
            emptyState.show();
            return;
        }

        container.show();
        emptyState.hide();

        posts.forEach(post => {
            const avatar = post.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`;

            // Xử lý nội dung
            let contentHtml = (post.content || "").replace(/\n/g, "<br>");
            if (post.content && post.content.length > 300) {
                contentHtml = `
                    <span class="content-short">${post.content.substring(0, 300).replace(/\n/g, "<br>")}...</span>
                    <span class="content-full" style="display:none;">${post.content.replace(/\n/g, "<br>")}</span>
                    <a href="#" class="see-more-btn">Xem thêm</a>`;
            }

            // Xử lý Media
            let mediaHtml = '';
            const urlToDisplay = post.mediaUrl || post.imageUrl;
            if (urlToDisplay) {
                const isVideo = (post.mediaType === 'VIDEO') || (urlToDisplay.match(/\.(mp4|mov|avi|mkv)$/i));
                if (isVideo) {
                    mediaHtml = `<div style="background:black;display:flex;justify-content:center;"><video controls class="post-full-image" style="max-height:500px;"><source src="${urlToDisplay}"></video></div>`;
                } else {
                    mediaHtml = `<img src="${urlToDisplay}" class="post-full-image" loading="lazy">`;
                }
            }

            // Menu bài viết (Sửa/Xóa)
            let menuHtml = '';
            if (post.user.username === currentUsername) {
                menuHtml = `<button class="post-menu-btn">...</button>`;
            }

            // Avatar người đang login (cho ô comment)
            const myAvatar = currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`;

            const html = `
                <div class="reddit-post-card" data-post-id="${post.id}" style="margin-bottom: 16px;">
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
                        ${menuHtml}
                    </div>
                    <div class="post-body-text">${contentHtml}</div>
                    ${mediaHtml}
                    <div class="post-stats-bar mt-2 text-muted small d-flex justify-content-between">
                        <span class="post-likes-count">👍 ${post.likeCount || 0} người thích</span> 
                        <span>${post.commentCount || 0} bình luận</span>
                    </div>
                    <div class="post-action-buttons">
                        <button class="action-btn">👍 <span>Thích</span></button>
                        <button class="action-btn">💬 <span>Bình luận</span></button>
                        <button class="action-btn">↗️ <span>Chia sẻ</span></button>
                    </div>
                    
                    <div class="comment-input-wrapper">
                       <img src="${myAvatar}" class="comment-avatar" alt="Avatar">
                       <div class="comment-input-box">
                           <input type="text" class="comment-input" placeholder="Viết bình luận...">
                           <button class="comment-send-btn">Gửi</button>
                       </div>
                    </div>
                    <div class="comments-list">
                        <div class="text-center p-2 loading-comments"><small class="text-muted">Đang tải bình luận...</small></div>
                    </div>
                </div>`;

            const postElement = $(html);
            container.append(postElement);

            // GỌI HÀM LOAD COMMENT
            loadPostComments(post.id, postElement.find(".comments-list"));
        });
    }

    function loadPostComments(postId, container) {
        // Thêm 'username' vào query để lấy seed cho avatar
        const query = `
            query GetComments($postId: ID!) {
                getCommentsByPostId(postId: $postId) {
                    id
                    content
                    createdAt
                    user {
                        username 
                        fullName
                        avatarUrl
                    }
                }
            }
        `;

        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            headers: { "Authorization": "Bearer " + accessToken },
            data: JSON.stringify({ query: query, variables: { postId: postId } }),
            success: function (response) {
                container.empty();

                if (response.data && response.data.getCommentsByPostId) {
                    const comments = response.data.getCommentsByPostId;

                    if (comments.length === 0) return;

                    comments.forEach(comment => {
                        const avatar = comment.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.username}`;

                        const commentHtml = `
                            <div class="comment-item">
                                <img src="${avatar}" class="comment-avatar" onerror="this.src='/resources/images/default-avatar.png'">
                                <div class="comment-content-wrapper">
                                    <div class="comment-bubble">
                                        <a href="#" class="comment-author">${comment.user.fullName}</a>
                                        <div class="comment-text">${comment.content}</div>
                                    </div>
                                    <div class="comment-actions">
                                        <span class="comment-time">${calculateTimeAgo(comment.createdAt)}</span>
                                        <span class="comment-action">Thích</span>
                                        <span class="comment-action">Phản hồi</span>
                                    </div>
                                </div>
                            </div>`;
                        container.append(commentHtml);
                    });
                }
            },
            error: function () {
                container.html('<div class="text-danger small p-2">Lỗi tải bình luận</div>');
            }
        });
    }

    // =========================================================
    // 3. TƯƠNG TÁC BÀI VIẾT (LIKE & COMMENT)
    // =========================================================

    // --- LIKE BÀI VIẾT ---
    $(document).on("click", ".action-btn", function (e) {
        if ($(this).index() === 0) { // Nút Thích
            e.preventDefault();
            const btn = $(this);
            const card = btn.closest(".reddit-post-card");
            const postId = card.attr("data-post-id");

            if (!postId) return;

            const query = `mutation ToggleLikePost($postId: ID!) { toggleLikePost(postId: $postId) }`;

            $.ajax({
                url: "/graphql", type: "POST", contentType: "application/json",
                headers: { "Authorization": "Bearer " + accessToken },
                data: JSON.stringify({ query: query, variables: { postId: postId } }),
                success: function (response) {
                    if (response.data) {
                        const isLiked = response.data.toggleLikePost;
                        const likeCountSpan = card.find(".post-likes-count");
                        let currentCount = parseInt(likeCountSpan.text().replace(/\D/g, '')) || 0;

                        if (isLiked) {
                            btn.addClass("liked");
                            btn.find("span").text("Đã thích");
                            likeCountSpan.text("👍 " + (currentCount + 1) + " người thích");
                        } else {
                            btn.removeClass("liked");
                            btn.find("span").text("Thích");
                            let newCount = Math.max(0, currentCount - 1);
                            likeCountSpan.text("👍 " + newCount + " người thích");
                        }
                    }
                }
            });
        }
    });

    // --- FOCUS Ô BÌNH LUẬN ---
    $(document).on("click", ".action-btn:nth-child(2)", function (e) {
        e.preventDefault();
        const card = $(this).closest(".reddit-post-card");
        const input = card.find(".comment-input");
        input.focus();
    });

    // --- GỬI BÌNH LUẬN ---
    $(document).on("click", ".comment-send-btn", function (e) {
        e.preventDefault();
        const btn = $(this);
        const card = btn.closest(".reddit-post-card");
        const postId = card.attr("data-post-id");
        const input = card.find(".comment-input");
        const content = input.val().trim();

        if (!content) return;

        btn.prop("disabled", true);

        // Thêm username vào response
        const query = `
            mutation CreateComment($input: CreateCommentInput!) {
                createComment(input: $input) {
                    id content createdAt
                    user { username fullName avatarUrl } 
                }
            }
        `;

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + accessToken },
            data: JSON.stringify({
                query: query,
                variables: { input: { postId: postId, content: content } }
            }),
            success: function (response) {
                btn.prop("disabled", false);
                if (response.data && response.data.createComment) {
                    const newComment = response.data.createComment;
                    input.val("");

                    const avatar = newComment.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newComment.user.username}`;

                    const commentHtml = `
                        <div class="comment-item">
                            <img src="${avatar}" class="comment-avatar">
                            <div class="comment-content-wrapper">
                                <div class="comment-bubble">
                                    <a href="#" class="comment-author">${newComment.user.fullName}</a>
                                    <div class="comment-text">${newComment.content}</div>
                                </div>
                                <div class="comment-actions">
                                    <span class="comment-time">Vừa xong</span>
                                    <span class="comment-action">Thích</span>
                                </div>
                            </div>
                        </div>`;

                    let list = card.find(".comments-list");
                    list.find(".loading-comments").remove();
                    list.prepend(commentHtml);
                }
            },
            error: function (err) {
                btn.prop("disabled", false);
                console.error(err);
            }
        });
    });

    // --- ENTER ĐỂ GỬI ---
    $(document).on("keypress", ".comment-input", function (e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            $(this).closest(".comment-input-box").find(".comment-send-btn").click();
        }
    });

    // =========================================================
    // 4. CHỨC NĂNG ĐĂNG BÀI (CREATE POST)
    // =========================================================
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
            imagePreview.hide(); videoPreview.attr("src", objectUrl).show();
        } else {
            videoPreview.hide(); imagePreview.attr("src", objectUrl).show();
        }
        updatePostButtonState();
    });

    btnRemoveMedia.on("click", function () {
        currentFile = null; fileInput.val(""); mediaPreviewContainer.hide();
        updatePostButtonState();
    });

    btnSubmitPost.click(async function () {
        btnSubmitPost.text("Đang xử lý...").prop("disabled", true);
        let finalMediaUrl = null;
        try {
            if (currentFile) finalMediaUrl = await uploadMedia(currentFile);

            const content = postContentInput.val();
            const privacy = $("#privacySelect").val();
            let type = "NONE";
            if (finalMediaUrl) type = (currentFile && currentFile.type.startsWith("video/")) ? "VIDEO" : "IMAGE";

            const mutation = {
                query: `mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { id } }`,
                variables: { input: { content, mediaUrl: finalMediaUrl, mediaType: type, privacyLevel: privacy } }
            };

            sendGraphQLRequest(mutation, () => {
                createPostModal.modal('hide');
                resetForm();
                loadUserPosts(profileUsername); // Reload bài viết
            });
        } catch (error) {
            alert("Lỗi: " + error.message);
            btnSubmitPost.text("Đăng").prop("disabled", false);
        }
    });

    // =========================================================
    // 5. CHỨC NĂNG SỬA & XÓA BÀI (EDIT & DELETE)
    // =========================================================

    // Mở menu
    $(document).on('click', '.post-menu-btn', function (e) {
        e.stopPropagation();
        const postId = $(this).closest('.reddit-post-card').attr('data-post-id');
        $('.post-menu-dropdown').remove();
        const menuHtml = `
            <div class="post-menu-dropdown active" style="display:block; position:absolute; right:0; top:30px; background:white; border:1px solid #ccc; z-index:1000; border-radius:5px;">
                <div class="menu-item edit-post-btn" data-id="${postId}" style="padding:10px; cursor:pointer;">✏️ Chỉnh sửa</div>
                <div class="menu-item danger delete-post-btn" data-id="${postId}" style="padding:10px; cursor:pointer; color:red;">🗑️ Xóa</div>
            </div>`;
        $(this).parent().css('position', 'relative').append(menuHtml);
    });

    $(document).click(() => $('.post-menu-dropdown').remove());

    // Xóa bài
    $(document).on('click', '.delete-post-btn', function () {
        const postId = $(this).data('id');
        if (confirm("Bạn có chắc chắn muốn xóa?")) {
            const mutation = { query: `mutation DeletePost($id: ID!) { deletePost(id: $id) }`, variables: { id: postId } };
            sendGraphQLRequest(mutation, () => {
                $(`.reddit-post-card[data-post-id="${postId}"]`).remove();
                currentPosts = currentPosts.filter(p => p.id != postId);
                if (currentPosts.length === 0) renderUserPosts([]);
            });
        }
    });

    // Sửa bài (Open Modal)
    $(document).on('click', '.edit-post-btn', function () {
        const postId = $(this).data('id');
        const post = currentPosts.find(p => p.id == postId);
        if (!post) return;

        updatePostContentInput.val(post.content);
        $("#updatePrivacySelect").val(post.privacyLevel);

        if (currentUser) {
            const avatar = currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`;
            $("#updateModalUserAvatar").attr("src", avatar);
            $("#updateModalUserName").text(currentUser.fullName);
        }

        updateFile = null;
        updateFileInput.val("");
        const mediaUrl = post.mediaUrl || post.imageUrl;
        if (mediaUrl) {
            updateMediaPreviewContainer.show();
            if (post.mediaType === 'VIDEO' || mediaUrl.match(/\.(mp4|mov|avi)$/i)) {
                updateImagePreview.hide(); updateVideoPreview.attr("src", mediaUrl).show();
            } else {
                updateVideoPreview.hide(); updateImagePreview.attr("src", mediaUrl).show();
            }
        } else {
            updateMediaPreviewContainer.hide();
        }

        btnUpdatePost.data("id", postId);
        updatePostModal.modal('show');
    });

    // Sửa bài (Submit) - ĐÃ FIX LỖI "Unknown field argument 'id'"
    btnUpdatePost.click(async function () {
        btnUpdatePost.text("Đang lưu...").prop("disabled", true);
        const postId = $(this).data("id");
        const oldPost = currentPosts.find(p => p.id == postId);

        let finalMediaUrl = oldPost.mediaUrl || oldPost.imageUrl;
        let finalMediaType = oldPost.mediaType;

        try {
            if (updateFile) {
                finalMediaUrl = await uploadMedia(updateFile);
                finalMediaType = updateFile.type.startsWith("video/") ? "VIDEO" : "IMAGE";
            } else if (updateMediaPreviewContainer.is(":hidden")) {
                finalMediaUrl = null;
                finalMediaType = "NONE";
            }

            // Sửa lại structure mutation cho đúng schema
            const mutation = {
                query: `mutation UpdatePost($input: UpdatePostInput!) { updatePost(input: $input) { id } }`,
                variables: {
                    input: {
                        id: postId, // ID nằm trong object input
                        content: updatePostContentInput.val(),
                        mediaUrl: finalMediaUrl,
                        mediaType: finalMediaType,
                        privacyLevel: $("#updatePrivacySelect").val()
                    }
                }
            };

            sendGraphQLRequest(mutation, () => {
                updatePostModal.modal('hide');
                loadUserPosts(profileUsername);
            }, () => btnUpdatePost.text("Lưu thay đổi").prop("disabled", false));

        } catch (e) {
            alert(e.message);
            btnUpdatePost.text("Lưu thay đổi").prop("disabled", false);
        }
    });

    // Helpers
    updateFileInput.on("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;
        updateFile = file;
        const url = URL.createObjectURL(file);
        updateMediaPreviewContainer.show();
        if (file.type.startsWith("video/")) {
            updateImagePreview.hide(); updateVideoPreview.attr("src", url).show();
        } else {
            updateVideoPreview.hide(); updateImagePreview.attr("src", url).show();
        }
    });

    btnRemoveUpdateMedia.on("click", function () {
        updateFile = null;
        updateFileInput.val("");
        updateMediaPreviewContainer.hide();
    });

    function uploadMedia(file) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);
            $.ajax({
                url: "/api/upload/media", type: "POST",
                headers: { "Authorization": "Bearer " + accessToken },
                data: formData, processData: false, contentType: false,
                success: (res) => resolve(res.url || res),
                error: () => reject(new Error("Lỗi upload file"))
            });
        });
    }

    function sendGraphQLRequest(payload, onSuccess, onError) {
        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + accessToken },
            data: JSON.stringify(payload),
            success: (res) => {
                if (res.data) onSuccess(res);
                else {
                    alert("Lỗi server: " + (res.errors ? res.errors[0].message : "Unknown"));
                    if (onError) onError();
                }
            },
            error: () => { alert("Lỗi kết nối"); if (onError) onError(); }
        });
    }

    function resetForm() {
        postContentInput.val("");
        btnRemoveMedia.click();
        btnSubmitPost.text("Đăng").prop("disabled", false);
    }

    function calculateTimeAgo(dateString) {
        if (!dateString) return "Vừa xong";
        const date = new Date(dateString);
        const diff = Math.floor((new Date() - date) / 1000);
        if (diff < 60) return "Vừa xong";
        if (diff < 3600) return Math.floor(diff / 60) + " phút trước";
        if (diff < 86400) return Math.floor(diff / 3600) + " giờ trước";
        return date.toLocaleDateString("vi-VN");
    }
});