$(document).ready(function () {
    const $registerForm = $("#registerForm");
    const $errorAlert = $("#error-alert");
    const $btnSubmit = $registerForm.find("button[type='submit']");

    $registerForm.on("submit", function (event) {
        event.preventDefault();
        $errorAlert.addClass("d-none");

        // Lấy dữ liệu
        const fullName = $("#fullname").val();
        const email = $("#email").val();
        const username = $("#username").val();
        const password = $("#password").val();
        const confirmPassword = $("#confirm_password").val();

        if (password !== confirmPassword) {
            showError("Mật khẩu xác nhận không khớp!");
            return;
        }

        // --- SỬA GraphQL Query ---
        // Đổi tên mutation thành 'register' và lấy về token
        const graphqlData = {
            query: `
                mutation Register($input: RegisterInput!) {
                    register(input: $input) {
                        token
                        user {
                            id
                            username
                            email
                            role
                        }
                    }
                }
            `,
            variables: {
                input: {
                    username: username,
                    password: password,
                    email: email,
                    fullName: fullName
                }
            }
        };

        // Loading
        const originalBtnText = $btnSubmit.text();
        $btnSubmit.prop("disabled", true);
        $btnSubmit.text("Đang xử lý...");

        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(graphqlData),

            success: function (response) {
                if (response.errors && response.errors.length > 0) {
                    showError(response.errors[0].message);
                }
                else if (response.data && response.data.register) {
                    const payload = response.data.register;
                    const user = payload.user;

                    // Lưu đầy đủ thông tin như bên Login
                    localStorage.setItem("accessToken", payload.token);
                    localStorage.setItem("currentUser", JSON.stringify(user));

                    // --- BỔ SUNG ---
                    localStorage.setItem("username", user.username);
                    localStorage.setItem("currentUserId", user.id);
                    localStorage.setItem("currentUsername", user.username);
                    localStorage.setItem("userAvatarUrl", "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png"); // Avatar mặc định

                    alert("Đăng ký thành công!");
                    window.location.href = "/";
                } else {
                    showError("Lỗi không xác định.");
                }
            },
            error: function (xhr) {
                showError("Lỗi hệ thống (" + xhr.status + ")");
            },
            complete: function () {
                $btnSubmit.prop("disabled", false);
                $btnSubmit.text(originalBtnText);
            }
        });
    });

    function showError(msg) {
        $errorAlert.text(msg);
        $errorAlert.removeClass("d-none");
    }
});