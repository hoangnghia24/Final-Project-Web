// Updated: 20251227062118
$(document).ready(function () {
    // Lấy username từ localStorage
    const currentUsername = localStorage.getItem("username");

    loadUserProfile(currentUsername);

    function loadUserProfile(username) {
        // 1. Chuẩn bị Query GraphQL
        const graphqlData = {
            query: `
                query GetUserProfile($username: String!) {
                    getUserByUsername(username: $username) {
                        id
                        username
                        fullName
                        email
                        avatarUrl
                        bio
                        createdAt
                        role
                    }
                }
            `,
            variables: {
                username: username
            }
        };

        // 2. Gọi AJAX
        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(graphqlData),

            success: function (response) {
                // Kiểm tra lỗi
                if (response.errors) {
                    console.error("Lỗi GraphQL:", response.errors);
                    alert("Không tìm thấy thông tin người dùng!");
                    return;
                }

                const user = response.data.getUserByUsername;
                if (user) {
                    renderUserData(user);
                }
            },
            error: function (xhr, status, error) {
                console.error("Lỗi hệ thống:", error);
            }
        });
    }

    // 3. Hàm hiển thị dữ liệu lên HTML
    function renderUserData(user) {
        // Cập nhật Avatar (Header & Sidebar)
        const avatarUrl = user.avatarUrl ? user.avatarUrl : "https://www.redditstatic.com/avatars/avatar_default_02_A5A4A4.png";
        $("#header-avatar").css("background-image", `url('${avatarUrl}')`);
        $("#sidebar-avatar").css("background-image", `url('${avatarUrl}')`);

        // Cập nhật Tên hiển thị (Fullname)
        $("#header-fullname").text(user.fullName);
        $("#sidebar-fullname").text(user.fullName);

        // Cập nhật Username (u/...)
        $("#header-username").text("u/" + user.username);
        $("#sidebar-tag").text("u/" + user.username);

        // Cập nhật Bio
        $("#sidebar-bio").text(user.bio || "Người dùng này chưa viết giới thiệu.");

        // Cập nhật Ngày tạo (Format lại cho đẹp)
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            const dateString = date.toLocaleDateString("vi-VN");
            $("#sidebar-created").text(dateString);
        } else {
            $("#sidebar-created").text("N/A");
        }
    }

    // Xử lý chuyển đổi tab
    $('.tab-item').on('click', function() {
        // Xóa class active khỏi tất cả tabs
        $('.tab-item').removeClass('active');
        
        // Thêm class active vào tab được click
        $(this).addClass('active');
        
        // Lấy giá trị data-tab
        const tabName = $(this).data('tab');
        
        // Ẩn tất cả nội dung
        $('.tab-content').removeClass('active');
        
        // Hiển thị nội dung của tab được chọn
        $('#tab-' + tabName).addClass('active');
    });

    // NOTE: Profile menu dropdown và Dark mode đã được xử lý trong Header.js
    // Không cần xử lý lại ở đây để tránh conflict với event listeners
});

