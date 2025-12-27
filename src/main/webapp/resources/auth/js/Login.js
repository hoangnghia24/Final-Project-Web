$(document).ready(function () {
    // Giữ nguyên cách đặt tên biến như code gốc để dễ đối chiếu
    const loginForm = $("#loginForm");
    const usernameInput = $("#username");
    const passwordInput = $("#password");
    const clientError = $("#client-error");
    const errorAlert = $("#error-alert");
    const btnLogin = $("#btnLogin");

    loginForm.on("submit", function (event) {
        event.preventDefault(); // Ngăn reload trang

        // Reset thông báo lỗi cũ
        let errorMessage = "";
        clientError.addClass("d-none");
        errorAlert.addClass("d-none");

        // 1. VALIDATION (Giữ nguyên logic và câu văn)
        if (!usernameInput.val().trim()) {
            errorMessage = "Vui lòng nhập tên đăng nhập hoặc email.";
        } else if (!passwordInput.val().trim()) {
            errorMessage = "Vui lòng nhập mật khẩu.";
        }

        if (errorMessage) {
            clientError.text(errorMessage);
            clientError.removeClass("d-none");
            usernameInput.focus();
            return;
        }

        // 2. GỌI AJAX (Đã thay công cụ sang jQuery)

        // Hiệu ứng loading (Giữ nguyên html loading)
        const originalBtnText = btnLogin.html();
        btnLogin.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...');
        btnLogin.prop("disabled", true);

        const username = usernameInput.val();
        const password = passwordInput.val();

        // Chuẩn bị data (Giữ nguyên cấu trúc Query gốc)
        var graphqlData = {
            query: `
                query GetUserLogin($username: String!, $password: String!) {
                    getUserLogin(username: $username, password: $password) {
                        id
                        username
                        email
                    }
                }
            `,
            variables: {
                username: username,
                password: password
            }
        };

        // --- BẮT ĐẦU THAY ĐỔI CÔNG CỤ (XMLHttpRequest -> $.ajax) ---
        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            dataType: "json", // jQuery tự động parse JSON
            data: JSON.stringify(graphqlData),

            // Xử lý khi thành công (tương đương status === 200)
            // ... Trong file Login.js đoạn success: function (response) ...

            success: function (response) {
                if (response.errors && response.errors.length > 0) {
                    showErrorServer(response.errors[0].message);
                }
                else if (response.data && response.data.getUserLogin) {
                    // --- BƯỚC QUAN TRỌNG CẦN THÊM ---

                    // 1. Lấy thông tin user từ kết quả trả về
                    const user = response.data.getUserLogin;

                    // 2. Lưu username và userId vào localStorage
                    localStorage.setItem("username", user.username);
                    localStorage.setItem("currentUserId", user.id);

                    // 3. Sau khi lưu xong mới chuyển trang
                    window.location.href = "/profile";
                }
                else {
                    showErrorServer("Tên đăng nhập hoặc mật khẩu không đúng.");
                }
            },

            // Xử lý khi có lỗi mạng/server (tương đương else của status 200)
            error: function (xhr) {
                if (xhr.status === 403) {
                    showErrorServer("Lỗi 403: Truy cập bị từ chối.");
                } else {
                    showErrorServer("Lỗi hệ thống (" + xhr.status + ").");
                }
            },

            // Xử lý dọn dẹp (tương đương readyState === 4 để reset nút)
            complete: function () {
                btnLogin.prop("disabled", false);
                btnLogin.html(originalBtnText);
            }
        });
        // --- KẾT THÚC THAY ĐỔI CÔNG CỤ ---
    });

    // Hàm hiển thị lỗi giữ nguyên
    function showErrorServer(msg) {
        errorAlert.text(msg);
        errorAlert.removeClass('d-none');
    }
});