$(document).ready(function () {
    // 1. Lấy các element giao diện
    // (Giả sử Form của bạn có id="registerForm" - xem phần hướng dẫn HTML bên dưới)
    const $registerForm = $("#registerForm");
    const $errorAlert = $("#error-alert");
    // Tìm nút submit nằm bên trong form
    const $btnSubmit = $registerForm.find("button[type='submit']");

    // Gắn sự kiện submit cho Form
    $registerForm.on("submit", function (event) {

        // Ngăn chặn reload trang
        event.preventDefault();

        // Reset thông báo lỗi cũ
        $errorAlert.addClass("d-none");
        $errorAlert.text("");

        // 2. Lấy dữ liệu từ input
        const fullName = $("#fullname").val();
        const email = $("#email").val();
        const username = $("#username").val();
        const password = $("#password").val();
        const confirmPassword = $("#confirm_password").val();

        // 3. Validate phía Client (Giữ nguyên logic cũ)
        if (password !== confirmPassword) {
            showError("Mật khẩu xác nhận không khớp!");
            return;
        }

        // 4. Chuẩn bị dữ liệu GraphQL (Payload giữ nguyên)
        const graphqlData = {
            query: `
                mutation CreateRegister($input: RegisterInput!) {
                    createRegister(input: $input) {
                        id
                        username
                        email
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

        // 5. GỌI AJAX VỚI JQUERY

        // Hiệu ứng loading
        const originalBtnText = $btnSubmit.text(); // Lấy text cũ (Đăng ký...)
        $btnSubmit.prop("disabled", true);
        $btnSubmit.text("Đang xử lý...");

        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(graphqlData),

            // Xử lý thành công (HTTP 200)
            success: function (response) {
                // Kiểm tra lỗi từ GraphQL
                if (response.errors && response.errors.length > 0) {
                    showError(response.errors[0].message);
                }
                // Kiểm tra dữ liệu thành công
                else if (response.data && response.data.createRegister) {
                    alert("Đăng ký thành công! Chuyển hướng đăng nhập...");
                    window.location.href = "/login";
                }
                else {
                    showError("Phản hồi không hợp lệ từ máy chủ.");
                }
            },

            // Xử lý lỗi HTTP (403, 500...)
            error: function (xhr) {
                if (xhr.status === 403) {
                    showError("Lỗi 403: Bạn không có quyền thực hiện hành động này (Xem ghi chú bên dưới).");
                } else {
                    showError("Lỗi hệ thống (" + xhr.status + "). Vui lòng thử lại sau.");
                }
            },

            // Chạy cuối cùng để reset nút bấm
            complete: function () {
                $btnSubmit.prop("disabled", false);
                $btnSubmit.text(originalBtnText); // Trả lại text gốc
            }
        });
    });

    // Hàm hiển thị lỗi
    function showError(msg) {
        $errorAlert.text(msg);
        $errorAlert.removeClass("d-none");
    }
});