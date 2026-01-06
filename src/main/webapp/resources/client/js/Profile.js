$(document).ready(function () {
    // =========================================================
    // 1. KHỞI TẠO & CHECK AUTH
    // =========================================================
    const accessToken = localStorage.getItem("accessToken");
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentUserId = localStorage.getItem("currentUserId");
    // Lấy username từ object currentUser đã parse
    const currentUsername = currentUser ? currentUser.username : null;

    // Kiểm tra đăng nhập
    if (!accessToken) {
        window.location.href = "/login";
        return;
    }

    // =========================================================
    // 2. XÁC ĐỊNH PROFILE ĐANG XEM (LOGIC MỚI)
    // =========================================================
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('id');

    // Mặc định là xem chính mình
    let targetUserId = currentUserId;
    let isMe = true;

    // Nếu trên URL có ID và ID đó KHÁC ID của mình -> Đang xem người khác
    if (paramId && paramId !== currentUserId) {
        targetUserId = paramId;
        isMe = false;
    }

    console.log("Viewing Profile ID:", targetUserId, "| isMe:", isMe);

    // =========================================================
    // 3. XỬ LÝ GIAO DIỆN (ẨN/HIỆN NÚT THEO QUYỀN)
    // =========================================================
    if (!isMe) {
        // --- ẨN CÁC PHẦN CHỈ DÀNH CHO CHỦ TÀI KHOẢN ---
        $("#btn-open-edit-profile").hide(); // Nút sửa profile chính
        $(".edit-bio-btn").hide();          // Nút sửa bio nhỏ
        $(".create-post-box").hide();       // Khung tạo bài viết ở giữa

        // Ẩn nút tạo bài ở Sidebar phải (ID mới thêm trong HTML)
        $("#sidebar-create-post-btn").hide();

        // Ẩn nút tạo bài ở màn hình Empty State (ID mới thêm trong HTML)
        $("#empty-state-create-btn").hide();

        // Sửa câu thông báo Empty State
        $("#empty-state-text").text("Người dùng này chưa có bài đăng nào");
    } else {
        // --- HIỆN NẾU LÀ CHÍNH MÌNH ---
        $("#btn-open-edit-profile").show();
        $(".create-post-box").show();
        $("#sidebar-create-post-btn").show();
        $("#empty-state-create-btn").show();
        $("#empty-state-text").text("Bạn chưa có bài đăng nào");

        // Chỉ setup modal user info nếu là mình (để hiện avatar mình trong modal đăng bài)
        setupCreateModalUserInfo();
    }

    // =========================================================
    // 4. XỬ LÝ CHUYỂN TAB (FIX LỖI TAB KHÔNG CHẠY)
    // =========================================================
    $('.tab-item').off('click').on('click', function () {
        // 1. Xử lý class active cho Tab Menu
        $('.tab-item').removeClass('active');
        $(this).addClass('active');

        // 2. Lấy tên tab (overview hoặc posts)
        const tabName = $(this).data('tab');

        // 3. Ẩn tất cả nội dung tab
        $('.tab-content').removeClass('active').hide();

        // 4. Hiện tab cần hiện (FadeIn cho mượt)
        $('#tab-' + tabName).addClass('active').fadeIn();
    });

    // =========================================================
    // 5. LOAD DỮ LIỆU CHÍNH
    // =========================================================
    // Gọi hàm load user theo ID -> Trong đó sẽ gọi tiếp loadUserPosts
    loadUserProfile(targetUserId);


    // =========================================================
    // KHAI BÁO BIẾN CHO CÁC MODAL (GIỮ NGUYÊN)
    // =========================================================
    // --- Create Modal Variables ---
    const createPostModal = new bootstrap.Modal(document.getElementById('createPostModal')); // Fix: Dùng new bootstrap.Modal để gọi .hide() chuẩn hơn
    const btnSubmitPost = $("#btnSubmitPost");
    const postContentInput = $("#postContentInput");
    const fileInput = $("#fileUploadInput");
    const mediaPreviewContainer = $("#mediaPreviewContainer");
    const imagePreview = $("#imagePreview");
    const videoPreview = $("#videoPreview");
    const btnRemoveMedia = $("#btnRemoveMedia");

    // --- Update Modal Variables ---
    const updatePostModal = new bootstrap.Modal(document.getElementById('updatePostModal'));
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

    // --- Edit Profile Variables ---
    const editProfileModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    const btnOpenEditProfile = $("#btn-open-edit-profile");
    const editAvatarInput = $("#editAvatarInput");
    const editAvatarPreview = $("#edit-avatar-preview");
    const editFullnameInput = $("#edit-fullname-input");
    const editBioInput = $("#edit-bio-input");
    const btnSaveProfile = $("#btn-save-profile");
    let newAvatarFile = null;


    // =========================================================
    // 6. LOGIC EDIT PROFILE
    // =========================================================

    // MỞ MODAL & ĐIỀN DỮ LIỆU CŨ
    btnOpenEditProfile.click(function () {
        const user = window.viewingProfileUser; // Lấy từ biến toàn cục đã lưu khi load profile
        if (!user) return;

        editFullnameInput.val(user.fullName);
        editBioInput.val(user.bio || "");
        editAvatarPreview.attr("src", user.avatarUrl || "/img/default-avatar.png");
        newAvatarFile = null;
        editAvatarInput.val("");

        editProfileModal.show();
    });

    // XỬ LÝ CHỌN ẢNH AVATAR MỚI
    editAvatarInput.change(function (e) {
        const file = e.target.files[0];
        if (file) {
            newAvatarFile = file;
            const objectUrl = URL.createObjectURL(file);
            editAvatarPreview.attr("src", objectUrl);
        }
    });

    // LƯU THAY ĐỔI PROFILE
    btnSaveProfile.click(async function () {
        const newName = editFullnameInput.val().trim();
        const newBio = editBioInput.val().trim();

        if (!newName) {
            alert("Tên không được để trống!");
            return;
        }

        btnSaveProfile.prop("disabled", true).text("Đang lưu...");

        try {
            let finalAvatarUrl = window.viewingProfileUser.avatarUrl;

            if (newAvatarFile) {
                finalAvatarUrl = await uploadMedia(newAvatarFile);
            }

            const mutation = `
                mutation UpdateProfile($input: UpdateProfileInput!) {
                    updateUserProfile(input: $input) {
                        id fullName bio avatarUrl
                    }
                }
            `;

            const variables = {
                input: {
                    fullName: newName,
                    bio: newBio,
                    avatarUrl: finalAvatarUrl
                }
            };

            $.ajax({
                url: "/graphql", type: "POST", contentType: "application/json",
                headers: { "Authorization": "Bearer " + accessToken },
                data: JSON.stringify({ query: mutation, variables: variables }),
                success: function (res) {
                    if (res.data && res.data.updateUserProfile) {
                        alert("Cập nhật thành công!");
                        editProfileModal.hide();
                        location.reload();
                    } else {
                        alert("Lỗi: " + (res.errors ? res.errors[0].message : "Unknown"));
                    }
                    btnSaveProfile.prop("disabled", false).text("Lưu thay đổi");
                },
                error: function () {
                    alert("Lỗi kết nối server");
                    btnSaveProfile.prop("disabled", false).text("Lưu thay đổi");
                }
            });

        } catch (error) {
            console.error(error);
            alert("Lỗi khi upload ảnh hoặc cập nhật");
            btnSaveProfile.prop("disabled", false).text("Lưu thay đổi");
        }
    });


    // =========================================================
    // 7. HÀM LOAD PROFILE (Sửa dùng getUserById)
    // =========================================================
    function loadUserProfile(userId) {
        // Query dùng ID
        const graphqlData = {
            query: `query GetUserProfile($id: ID!) {
                getUserById(id: $id) {
                    id 
                    username 
                    fullName 
                    email 
                    avatarUrl 
                    bio 
                    createdAt 
                    role
                    friendCount
                }
            }`,
            variables: { id: userId }
        };

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
            headers: { "Authorization": "Bearer " + accessToken },
            data: JSON.stringify(graphqlData),
            success: function (response) {
                if (response.data && response.data.getUserById) {
                    const user = response.data.getUserById;

                    // Lưu user vào biến toàn cục
                    window.viewingProfileUser = user;

                    // Render thông tin
                    renderUserData(user);

                    // --- QUAN TRỌNG: Load bài viết của username vừa lấy được ---
                    loadUserPosts(user.username);
                } else {
                    alert("Không tìm thấy người dùng!");
                    window.location.href = "/home";
                }
            },
            error: function (err) {
                console.error("Lỗi tải profile:", err);
            }
        });
    }

    function renderUserData(user) {
        const avatarUrl = user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

        $("#header-avatar").css("background-image", `url('${avatarUrl}')`);
        $("#sidebar-avatar").css("background-image", `url('${avatarUrl}')`);

        $("#header-fullname").text(user.fullName);
        $("#header-username").text("u/" + user.username);
        $("#sidebar-fullname").text(user.fullName);
        $("#sidebar-tag").text("u/" + user.username);

        const bioText = user.bio ? user.bio : "Người dùng này chưa viết giới thiệu.";
        $("#user-bio-display").text(bioText);
        $("#sidebar-bio").text(bioText);

        $("#user-friend-count").text(user.friendCount || 0);

        if (user.createdAt) {
            const date = new Date(user.createdAt);
            const dateStr = "tháng " + (date.getMonth() + 1) + " năm " + date.getFullYear();
            $("#user-join-date").text(dateStr);
            $("#sidebar-created").text(date.toLocaleDateString("vi-VN"));
        }
    }


    // =========================================================
    // 8. LOGIC BÀI VIẾT
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
                    // Lọc bài viết của user đang xem
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

            // Menu bài viết (Chỉ hiện nếu là bài của mình)
            let menuHtml = '';
            if (post.user.username === currentUsername) {
                menuHtml = `<button class="post-menu-btn">...</button>`;
            }

            const myAvatar = currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`;

            const html = `
                <div class="reddit-post-card" data-post-id="${post.id}" style="margin-bottom: 16px;">
                    <div class="post-header">
                        <div class="d-flex align-items-center">
                            <img src="${avatar}" class="post-user-avatar">
                            <div class="post-user-info ms-2">
                                <b>${post.user.fullName}</b>
                                <small class="text-muted" style="font-size: 12px;">
                                    ${calculateTimeAgo(post.createdAt)}
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

            loadPostComments(post.id, postElement.find(".comments-list"));
        });
    }

    function loadPostComments(postId, container) {
        const query = `
            query GetComments($postId: ID!) {
                getCommentsByPostId(postId: $postId) {
                    id
                    content
                    createdAt
                    user { username fullName avatarUrl }
                }
            }
        `;

        $.ajax({
            url: "/graphql", type: "POST", contentType: "application/json",
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
    // 9. EVENT LISTENERS (CREATE, UPDATE, DELETE, LIKE)
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

    // CREATE POST
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
                createPostModal.hide(); // Dùng .hide() của Bootstrap instance
                resetForm();
                // Reload bài viết của user đang xem (thường là mình)
                if (window.viewingProfileUser) {
                    loadUserPosts(window.viewingProfileUser.username);
                }
            });
        } catch (error) {
            alert("Lỗi: " + error.message);
            btnSubmitPost.text("Đăng").prop("disabled", false);
        }
    });

    // UPDATE POST
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
                query: `mutation UpdatePost($input: UpdatePostInput!) { updatePost(input: $input) { id } }`,
                variables: {
                    input: {
                        id: postId,
                        content: updatePostContentInput.val(),
                        mediaUrl: finalMediaUrl,
                        mediaType: finalMediaType,
                        privacyLevel: $("#updatePrivacySelect").val()
                    }
                }
            };

            sendGraphQLRequest(mutation, () => {
                updatePostModal.hide(); // Dùng .hide() của Bootstrap instance
                if (window.viewingProfileUser) {
                    loadUserPosts(window.viewingProfileUser.username);
                }
            }, () => btnUpdatePost.text("Lưu thay đổi").prop("disabled", false));

        } catch (e) {
            alert(e.message);
            btnUpdatePost.text("Lưu thay đổi").prop("disabled", false);
        }
    });

    // DELETE POST
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

    // OPEN UPDATE MODAL
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
        updatePostModal.show();
    });

    // TOGGLE LIKE
    $(document).on("click", ".action-btn", function (e) {
        if ($(this).index() === 0) { // Like Button
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

    // COMMENT INTERACTION
    $(document).on("click", ".action-btn:nth-child(2)", function (e) {
        e.preventDefault();
        $(this).closest(".reddit-post-card").find(".comment-input").focus();
    });

    $(document).on("click", ".comment-send-btn", function (e) {
        e.preventDefault();
        const btn = $(this);
        const card = btn.closest(".reddit-post-card");
        const postId = card.attr("data-post-id");
        const input = card.find(".comment-input");
        const content = input.val().trim();

        if (!content) return;
        btn.prop("disabled", true);

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
                                    <span class="comment-action">Phản hồi</span>
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

    $(document).on("keypress", ".comment-input", function (e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            $(this).closest(".comment-input-box").find(".comment-send-btn").click();
        }
    });

    // POST MENU DROPDOWN
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

    // HELPERS
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