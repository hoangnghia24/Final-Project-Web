$(document).ready(function () {
    const loginForm = $("#loginForm");
    const usernameInput = $("#username");
    const passwordInput = $("#password");
    const clientError = $("#client-error");
    const errorAlert = $("#error-alert");
    const btnLogin = $("#btnLogin");

    loginForm.on("submit", function (event) {
        event.preventDefault();

        // Reset lỗi
        clientError.addClass("d-none");
        errorAlert.addClass("d-none");

        // 1. Validation
        if (!usernameInput.val().trim()) {
            clientError.text("Vui lòng nhập tên đăng nhập.");
            clientError.removeClass("d-none");
            return;
        }

        // 2. Hiệu ứng Loading
        const originalBtnText = btnLogin.html();
        btnLogin.html('<span class="spinner-border spinner-border-sm"></span> Đang xử lý...');
        btnLogin.prop("disabled", true);

        // 3. Chuẩn bị GraphQL (SỬA LẠI KHỚP SCHEMA)
        // Lưu ý: Đổi từ query sang mutation login
        // Lấy về token và thông tin user
        var graphqlData = {
            query: `
                mutation Login($username: String!, $password: String!) {
                    login(username: $username, password: $password) {
                        token
                        user {
                            id
                            username
                            email
                            fullName
                            role
                        }
                    }
                }
            `,
            variables: {
                username: usernameInput.val(),
                password: passwordInput.val()
            }
        };

        // 4. Gọi Ajax
        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(graphqlData),

            success: function (response) {
                // Check lỗi GraphQL
                if (response.errors && response.errors.length > 0) {
                    // [SỬA TẠI ĐÂY] Luôn báo lỗi chung chung để bảo mật và đúng yêu cầu
                    showErrorServer("Sai thông tin đăng nhập");
                }
                // Check dữ liệu trả về
                else if (response.data && response.data.login) {
                    const payload = response.data.login;
                    const user = payload.user;

                    // ... (Đoạn lưu localStorage giữ nguyên không đổi) ...
                    localStorage.setItem("accessToken", payload.token);
                    localStorage.setItem("currentUser", JSON.stringify(user));
                    localStorage.setItem("username", user.username);
                    localStorage.setItem("currentUserId", user.id);
                    localStorage.setItem("currentUsername", user.username);
                    localStorage.setItem("userAvatarUrl", user.avatarUrl || "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png");

                    window.location.href = "/";
                } else {
                    // [SỬA TẠI ĐÂY] Cập nhật thông báo ở đây luôn
                    showErrorServer("Sai thông tin đăng nhập");
                }
            },
            error: function (xhr) {
                showErrorServer("Lỗi kết nối server (" + xhr.status + ")");
            },
            complete: function () {
                btnLogin.prop("disabled", false);
                btnLogin.html(originalBtnText);
            }
        });
    });

    function showErrorServer(msg) {
        errorAlert.text(msg);
        errorAlert.removeClass('d-none');
    }
});

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');

    if (input.type === "password") {
        input.type = "text"; // Hiện mật khẩu
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash'); // Đổi icon thành mắt gạch chéo
    } else {
        input.type = "password"; // Ẩn mật khẩu
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye'); // Đổi lại icon mắt thường
    }
}