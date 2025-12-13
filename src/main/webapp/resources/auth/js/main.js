
// login.js
document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const clientError = document.getElementById("client-error");
    const btnLogin = document.getElementById("btnLogin");

    loginForm.addEventListener("submit", function (event) {
        let errorMessage = "";

        // 1. Kiểm tra input
        if (!usernameInput.value.trim()) {
            errorMessage = "Email hoặc số điện thoại bạn nhập không khớp với bất kỳ tài khoản nào.";
        } else if (!passwordInput.value.trim()) {
            errorMessage = "Vui lòng nhập mật khẩu.";
        }

        // 2. Xử lý lỗi
        if (errorMessage) {
            event.preventDefault();
            clientError.textContent = errorMessage;
            clientError.classList.remove("d-none");

            // Rung nhẹ form (Hiệu ứng thêm nếu muốn)
            usernameInput.focus();
        } else {
            clientError.classList.add("d-none");
            // Đổi text nút bấm
            btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang đăng nhập...';
            btnLogin.disabled = true;

            // Để form tự submit
        }
    });
});