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
                    showErrorServer(response.errors[0].message);
                }
                // Check dữ liệu trả về (SỬA LẠI logic lấy data)
                else if (response.data && response.data.login) {
                    const payload = response.data.login;

                    // --- QUAN TRỌNG: LƯU TOKEN ---
                    localStorage.setItem("accessToken", payload.token);
                    localStorage.setItem("currentUser", JSON.stringify(payload.user));

                    // Chuyển hướng
                    window.location.href = "/"; // Hoặc /home tùy bạn
                } else {
                    showErrorServer("Tên đăng nhập hoặc mật khẩu không đúng.");
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