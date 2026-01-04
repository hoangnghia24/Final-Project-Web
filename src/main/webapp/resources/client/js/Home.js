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
            }
            else if (isMediaDeleted) {
                finalMediaUrl = null;
                finalMediaType = "NONE";
            }

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
                alert("Cập nhật bài viết thành công!");
                updatePostModal.modal('hide');
                updateFile = null;
                isMediaDeleted = false;
                updateFileInput.val("");
                loadAllPosts();
            }, () => {
                btnUpdatePost.text("Lưu thay đổi").prop("disabled", false);
            });

        } catch (error) {
            alert("Lỗi: " + error.message);
            btnUpdatePost.text("Lưu thay đổi").prop("disabled", false);
        }
    });

    // ==========================================
    // 3. CÁC HÀM XỬ LÝ KHÁC (MENU, DELETE, LIKE, COMMENT)
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
        $('.post-menu-dropdown').remove();

        if (confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) {
            const mutation = {
                query: `mutation DeletePost($id: ID!) { 
                    deletePost(id: $id) 
                }`,
                variables: { id: postId }
            };

            const $postCard = $(`.reddit-post-card[data-post-id="${postId}"]`);
            $postCard.css('opacity', '0.5');

            sendGraphQLRequest(mutation, (res) => {
                if (res.data && res.data.deletePost) {
                    $postCard.slideUp(300, function () {
                        $(this).remove();
                    });
                    currentPosts = currentPosts.filter(p => p.id != postId);
                } else {
                    alert("Xóa thất bại!");
                    $postCard.css('opacity', '1');
                }
            }, () => $postCard.css('opacity', '1'));
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

    // --- XỬ LÝ SỰ KIỆN LIKE ---
    $(document).on('click', '.btn-like', function () {
        const btn = $(this);
        const postId = btn.data('id');

        const mutation = {
            query: `mutation ToggleLike($postId: ID!) { toggleLikePost(postId: $postId) }`,
            variables: { postId: postId }
        };

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(mutation),
            success: (res) => {
                if (res.data) {
                    const isLiked = res.data.toggleLikePost;
                    const countSpan = $(`#like-count-${postId}`);
                    let currentCount = parseInt(countSpan.text().replace(/[^0-9]/g, ''));

                    if (isLiked) {
                        btn.css('color', '#2e89ff').css('font-weight', 'bold');
                        countSpan.text(`👍 ${currentCount + 1}`);
                    } else {
                        btn.css('color', '');
                        countSpan.text(`👍 ${Math.max(0, currentCount - 1)}`);
                    }
                }
            }
        });
    });

    // --- XỬ LÝ ẨN/HIỆN VÀ LOAD COMMENT CŨ (ĐÃ CẬP NHẬT) ---
    $(document).on('click', '.btn-toggle-comment', function () {
        const postId = $(this).data('id');
        const commentSection = $(`#comments-area-${postId}`);
        const commentList = $(`#list-comments-${postId}`);

        // Toggle hiển thị
        commentSection.slideToggle();

        // Nếu chưa load comment lần nào (check bằng class hoặc data attribute) thì gọi API
        if (!commentList.data('loaded')) {
            loadComments(postId, commentList);
        }
    });

    function loadComments(postId, commentListElement) {
        const query = {
            query: `query GetComments($postId: ID!) {
                getCommentsByPostId(postId: $postId) {
                    id content createdAt 
                    user { id fullName username avatarUrl }
                }
            }`,
            variables: { postId: postId }
        };

        // Hiện loading
        commentListElement.html('<div class="text-muted text-center small py-2">Đang tải bình luận...</div>');

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(query),
            success: (res) => {
                commentListElement.empty(); // Xóa loading

                // Kiểm tra lỗi từ GraphQL trả về (QUAN TRỌNG)
                if (res.errors) {
                    console.error("GraphQL Error:", res.errors);
                    commentListElement.html(`<div class="text-danger text-center small">Lỗi: ${res.errors[0].message}</div>`);
                    return;
                }

                if (res.data && res.data.getCommentsByPostId) {
                    const comments = res.data.getCommentsByPostId;

                    if (comments.length === 0) {
                        commentListElement.html('<div class="text-muted text-center small mb-2">Chưa có bình luận nào. Hãy là người đầu tiên!</div>');
                    } else {
                        // Render từng comment
                        comments.forEach(comment => {
                            appendCommentToView(postId, comment);
                        });
                    }
                    // Đánh dấu đã load xong
                    commentListElement.data('loaded', true);
                }
            },
            error: (err) => {
                console.error("AJAX Error:", err);
                commentListElement.html('<div class="text-danger text-center small">Lỗi kết nối server.</div>');
            }
        });
    }

    function appendCommentToView(postId, comment) {
        const avatar = comment.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.username}`;

        // Dùng class CSS để style (đã sửa ở bước trước)
        const commentHtml = `
            <div class="comment-item">
                <img src="${avatar}" class="comment-avatar">
                <div class="comment-bubble">
                    <div class="comment-author">${comment.user.fullName}</div>
                    <div class="comment-text">${comment.content}</div>
                </div>
            </div>`;

        $(`#list-comments-${postId}`).append(commentHtml);
    }

    // --- XỬ LÝ GỬI COMMENT MỚI ---
    $(document).on('click', '.btn-send-comment', function () {
        const postId = $(this).data('id');
        const inputField = $(`.comment-input[data-id="${postId}"]`);
        const content = inputField.val().trim();

        if (!content) return;

        const mutation = {
            query: `mutation CreateComment($input: CreateCommentInput!) { 
                createComment(input: $input) { 
                    id content createdAt user { fullName username avatarUrl } 
                } 
            }`,
            variables: {
                input: { postId: postId, content: content }
            }
        };

        const btnSend = $(this);
        btnSend.prop('disabled', true);

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + token },
            data: JSON.stringify(mutation),
            success: (res) => {
                if (res.data && res.data.createComment) {
                    const comment = res.data.createComment;

                    // Nếu đang có thông báo "Chưa có bình luận", xóa nó đi
                    const commentList = $(`#list-comments-${postId}`);
                    if (commentList.text().includes("Chưa có bình luận")) {
                        commentList.empty();
                    }

                    appendCommentToView(postId, comment);
                    inputField.val("");

                    const countSpan = $(`#comment-count-${postId}`);
                    let currentCount = parseInt(countSpan.text().replace(/[^0-9]/g, ''));
                    countSpan.text(`${currentCount + 1} bình luận`);
                }
            },
            complete: () => btnSend.prop('disabled', false)
        });
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

            let privacyIcon = '🔒';
            if (post.privacyLevel === 'PUBLIC') {
                privacyIcon = '🌎';
            } else if (post.privacyLevel === 'FRIENDS_ONLY') {
                privacyIcon = '👥';
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
                                    ${calculateTimeAgo(post.createdAt)} • ${privacyIcon}
                                </small>
                            </div>
                        </div>
                        <button class="post-menu-btn">...</button>
                    </div>
                    <div class="post-body-text">${contentHtml}</div>
                    ${mediaHtml}
                    
                    <div class="post-stats-bar mt-2 text-muted small d-flex justify-content-between">
                        <span id="like-count-${post.id}">👍 ${post.likeCount || 0}</span> 
                        <span id="comment-count-${post.id}">${post.commentCount || 0} bình luận</span>
                    </div>
                    
                    <div class="post-action-buttons">
                        <button class="action-btn btn-like" data-id="${post.id}">👍 Thích</button>
                        <button class="action-btn btn-toggle-comment" data-id="${post.id}">💬 Bình luận</button>
                        <button class="action-btn">↗️ Chia sẻ</button>
                    </div>

                    <div class="post-comments-section" id="comments-area-${post.id}" style="display:none; padding-top: 10px; border-top: 1px solid #eee;">
                        <div class="comments-list" id="list-comments-${post.id}" style="margin-bottom: 10px;">
                            </div>
                        <div class="d-flex gap-2">
                            <input type="text" class="form-control comment-input" data-id="${post.id}" placeholder="Viết bình luận..." style="border-radius: 20px;">
                            <button class="btn btn-primary btn-sm btn-send-comment" data-id="${post.id}" style="border-radius: 20px;">Gửi</button>
                        </div>
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