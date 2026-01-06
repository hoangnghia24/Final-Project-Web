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
        const $passwordInput = $("#password");
        const $strengthBox = $("#password-strength-box");
        const $strengthBar = $("#password-strength-bar");
        const $strengthText = $("#password-strength-text");
        if (password !== confirmPassword) {
            showError("Mật khẩu xác nhận không khớp!");
            return;
        }
        $passwordInput.on("input", function () {
            const val = $(this).val();

            // Nếu ô trống thì ẩn thanh đánh giá
            if (val.length === 0) {
                $strengthBox.addClass("d-none");
                return;
            } else {
                $strengthBox.removeClass("d-none");
            }

            const result = checkPasswordStrength(val);
            updateStrengthUI(result);
        });

        // Hàm tính điểm độ mạnh
        function checkPasswordStrength(password) {
            let score = 0;

            if (!password) return 0;

            // Tiêu chí 1: Độ dài > 8 ký tự
            if (password.length >= 8) score += 1;

            // Tiêu chí 2: Có chữ thường
            if (/[a-z]/.test(password)) score += 1;

            // Tiêu chí 3: Có chữ hoa
            if (/[A-Z]/.test(password)) score += 1;

            // Tiêu chí 4: Có số
            if (/[0-9]/.test(password)) score += 1;

            // Tiêu chí 5: Có ký tự đặc biệt
            if (/[^A-Za-z0-9]/.test(password)) score += 1;

            return score;
        }

        // Hàm cập nhật giao diện dựa trên điểm
        function updateStrengthUI(score) {
            let width = 0;
            let colorClass = "";
            let text = "";

            switch (score) {
                case 0:
                case 1:
                    width = 20;
                    colorClass = "bg-danger"; // Đỏ
                    text = "Rất yếu (Cần thêm ký tự, số hoặc chữ hoa)";
                    break;
                case 2:
                    width = 40;
                    colorClass = "bg-warning"; // Vàng cam
                    text = "Yếu";
                    break;
                case 3:
                    width = 60;
                    colorClass = "bg-info"; // Xanh dương nhạt
                    text = "Trung bình";
                    break;
                case 4:
                    width = 80;
                    colorClass = "bg-primary"; // Xanh dương
                    text = "Tốt";
                    break;
                case 5:
                    width = 100;
                    colorClass = "bg-success"; // Xanh lá
                    text = "Tuyệt vời";
                    break;
            }

            // Reset class màu cũ
            $strengthBar.removeClass("bg-danger bg-warning bg-info bg-primary bg-success");

            // Add class mới
            $strengthBar.addClass(colorClass);
            $strengthBar.css("width", width + "%");
            $strengthText.text(text);

            // Đổi màu chữ thông báo cho đồng bộ
            $strengthText.removeClass("text-danger text-warning text-info text-primary text-success text-muted");
            if (score < 2) $strengthText.addClass("text-danger");
            else if (score === 5) $strengthText.addClass("text-success");
            else $strengthText.addClass("text-muted");
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
                    // [SỬA TẠI ĐÂY] Lấy tin nhắn lỗi từ server
                    const errorMsg = response.errors[0].message.toLowerCase();

                    // Kiểm tra xem lỗi có phải do trùng lặp không (check các từ khóa thường gặp)
                    if (errorMsg.includes("exist") || errorMsg.includes("duplicate") || errorMsg.includes("already")) {
                        showError("Đã có tài khoản này");
                    } else {
                        // Nếu là lỗi khác (ví dụ mật khẩu ngắn), hiển thị nguyên văn hoặc tùy chỉnh tiếp
                        showError(response.errors[0].message);
                    }
                }
                else if (response.data && response.data.register) {
                    const payload = response.data.register;
                    const user = payload.user;

                    // ... (Đoạn lưu localStorage giữ nguyên) ...
                    localStorage.setItem("accessToken", payload.token);
                    localStorage.setItem("currentUser", JSON.stringify(user));
                    localStorage.setItem("username", user.username);
                    localStorage.setItem("currentUserId", user.id);
                    localStorage.setItem("currentUsername", user.username);
                    localStorage.setItem("userAvatarUrl", "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png");

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