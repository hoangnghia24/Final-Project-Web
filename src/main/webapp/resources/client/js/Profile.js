$(document).ready(function () {
    // Giả lập lấy username từ localStorage (khi đăng nhập bạn nên lưu lại)
    // Nếu chưa có login, mình set cứng giá trị giống Mock Data trong Controller để test
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
        // Nếu không có avatarUrl thì dùng ảnh mặc định
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
            // Giả sử createdAt là String dạng ISO hoặc Date
            const date = new Date(user.createdAt);
            const dateString = date.toLocaleDateString("vi-VN");
            $("#sidebar-created").text(dateString);
        } else {
            $("#sidebar-created").text("N/A");
        }
    }
});