$(document).ready(function () {
    // --- BIẾN TOÀN CỤC ---
    const currentUsername = localStorage.getItem("username"); // User đang đăng nhập

    // Lấy username của profile đang xem từ URL (ví dụ /u/admin -> admin)
    // Nếu không có trong URL (ví dụ đang ở /profile), dùng currentUsername
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
    const updatePrivacySelect = $("#updatePrivacySelect");
    const updateMediaPreviewContainer = $("#updateMediaPreviewContainer");
    const updateImagePreview = $("#updateImagePreview");
    const updateVideoPreview = $("#updateVideoPreview");
    const btnRemoveUpdateMedia = $("#btnRemoveUpdateMedia");
    const updateFileInput = $("#updateFileUploadInput");

    let currentFile = null;
    let updateFile = null;
    let currentPosts = []; // Danh sách bài viết CỦA PROFILE
    let isMediaDeleted = false;

    // --- KHỞI TẠO ---
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "/login";
    }

    // Load thông tin Profile
    loadUserProfile(profileUsername);
    // Load bài viết của Profile
    loadUserPosts(profileUsername);
    // Setup thông tin cho Modal Đăng bài (Avatar của người đang login)
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
            headers: { "Authorization": "Bearer " + token },
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
    // 2. LOGIC BÀI VIẾT (LOAD, CREATE, EDIT, DELETE) - GIỐNG HOME.JS
    // =========================================================

    function setupCreateModalUserInfo() {
        // Lấy thông tin người đang LOGIN để hiển thị trong modal đăng bài
        const currentUserStr = localStorage.getItem("currentUser");
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            const avatar = user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
            $("#modalUserAvatar").attr("src", avatar);
            $("#modalUserName").text(user.fullName);
        }
    }

    // --- LOAD USER POSTS ---
    function loadUserPosts(username) {
        // Query lấy tất cả bài viết (sau đó filter client-side hoặc dùng query backend nếu có)
        const query = {
            query: `query { getAllPosts { id content mediaUrl mediaType createdAt privacyLevel likeCount commentCount user { id fullName username avatarUrl } } }`
        };

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(query),
            success: (res) => {
                if (res.data && res.data.getAllPosts) {
                    const allPosts = res.data.getAllPosts;
                    // LỌC BÀI VIẾT: Chỉ lấy bài của user profile hiện tại
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

            // Xử lý nội dung dài
            let contentHtml = (post.content || "").replace(/\n/g, "<br>");
            if (post.content && post.content.length > 300) {
                contentHtml = `
                    <span class="content-short">${post.content.substring(0, 300).replace(/\n/g, "<br>")}...</span>
                    <span class="content-full" style="display:none;">${post.content.replace(/\n/g, "<br>")}</span>
                    <a href="#" class="see-more-btn">Xem thêm</a>`;
            }

            // Xử lý Media
            let mediaHtml = '';
            const urlToDisplay = post.mediaUrl || post.imageUrl; // Hỗ trợ cả 2 trường
            if (urlToDisplay) {
                const isVideo = (post.mediaType === 'VIDEO') || (urlToDisplay.match(/\.(mp4|mov|avi|mkv)$/i));
                if (isVideo) {
                    mediaHtml = `<div style="background:black;display:flex;justify-content:center;"><video controls class="post-full-image" style="max-height:500px;"><source src="${urlToDisplay}"></video></div>`;
                } else {
                    mediaHtml = `<img src="${urlToDisplay}" class="post-full-image" loading="lazy">`;
                }
            }

            // Chỉ hiện menu 3 chấm nếu là bài của chính mình (người đang login)
            let menuHtml = '';
            if (post.user.username === currentUsername) {
                menuHtml = `<button class="post-menu-btn">...</button>`;
            }

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
                        <span>👍 ${post.likeCount || 0}</span> <span>${post.commentCount || 0} bình luận</span>
                    </div>
                    <div class="post-action-buttons">
                        <button class="action-btn">👍 Thích</button>
                        <button class="action-btn">💬 Bình luận</button>
                        <button class="action-btn">↗️ Chia sẻ</button>
                    </div>
                </div>`;
            container.append(html);
        });
    }

    // --- CREATE POST LOGIC ---
    // (Copy y nguyên từ Home.js)
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

    btnSubmitPost.click(function () {
        btnSubmitPost.text("Đang xử lý...").prop("disabled", true);
        handlePostSubmission();
    });

    async function handlePostSubmission() {
        let finalMediaUrl = null;
        try {
            if (currentFile) finalMediaUrl = await uploadMedia(currentFile);
            callCreatePostGraphQL(finalMediaUrl);
        } catch (error) {
            alert("Lỗi: " + error.message);
            btnSubmitPost.text("Đăng").prop("disabled", false);
        }
    }

    function callCreatePostGraphQL(mediaUrl) {
        const content = postContentInput.val();
        const privacy = $("#privacySelect").val();
        let type = "NONE";
        if (mediaUrl) type = (currentFile && currentFile.type.startsWith("video/")) ? "VIDEO" : "IMAGE";

        const mutation = {
            query: `mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { id } }`,
            variables: { input: { content, mediaUrl, mediaType: type, privacyLevel: privacy } }
        };

        sendGraphQLRequest(mutation, () => {
            createPostModal.modal('hide');
            resetForm();
            loadUserPosts(profileUsername); // Reload lại danh sách sau khi đăng
        });
    }

    // --- EDIT & DELETE LOGIC ---
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

    // Xóa bài
    $(document).on('click', '.delete-post-btn', function (e) {
        const postId = $(this).data('id');
        if (confirm("Bạn có chắc chắn muốn xóa?")) {
            const mutation = { query: `mutation DeletePost($id: ID!) { deletePost(id: $id) }`, variables: { id: postId } };
            sendGraphQLRequest(mutation, () => {
                $(`.reddit-post-card[data-post-id="${postId}"]`).remove();
                currentPosts = currentPosts.filter(p => p.id != postId);
                if (currentPosts.length === 0) renderUserPosts([]); // Hiện empty state nếu hết bài
            });
        }
    });

    // Sửa bài (Open Modal)
    $(document).on('click', '.edit-post-btn', function (e) {
        const postId = $(this).data('id');
        const post = currentPosts.find(p => p.id == postId);
        if (!post) return;

        // Fill data
        updatePostContentInput.val(post.content);
        $("#updatePrivacySelect").val(post.privacyLevel);
        const currentUserStr = localStorage.getItem("currentUser");
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            const avatar = user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
            $("#updateModalUserAvatar").attr("src", avatar);
            $("#updateModalUserName").text(user.fullName);
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

    // Sửa bài (Submit)
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

            const mutation = {
                query: `mutation UpdatePost($id: ID!, $input: UpdatePostInput!) { updatePost(id: $id, input: $input) { id } }`,
                variables: {
                    id: postId,
                    input: {
                        content: updatePostContentInput.val(),
                        mediaUrl: finalMediaUrl,
                        mediaType: finalMediaType,
                        privacyLevel: $("#updatePrivacySelect").val()
                    }
                }
            };

            sendGraphQLRequest(mutation, () => {
                updatePostModal.modal('hide');
                loadUserPosts(profileUsername); // Reload
            }, () => btnUpdatePost.text("Lưu thay đổi").prop("disabled", false));

        } catch (e) {
            alert(e.message);
            btnUpdatePost.text("Lưu thay đổi").prop("disabled", false);
        }
    });

    // Update Modal Helpers
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

    // --- UTILS ---
    function uploadMedia(file) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);
            $.ajax({
                url: "/api/upload/media", type: "POST",
                headers: { "Authorization": "Bearer " + token },
                data: formData, processData: false, contentType: false,
                success: (res) => resolve(res.url || res),
                error: () => reject(new Error("Lỗi upload file"))
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