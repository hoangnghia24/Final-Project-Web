document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const clientError = document.getElementById("client-error");
    const errorAlert = document.getElementById("error-alert"); // Thêm cái này để hứng lỗi từ Server
    const btnLogin = document.getElementById("btnLogin");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Luôn ngăn chặn reload trang ngay đầu tiên

        // Reset thông báo lỗi cũ
        let errorMessage = "";
        clientError.classList.add("d-none");
        errorAlert.classList.add("d-none");

        // 1. VALIDATION (Kiểm tra input client)
        if (!usernameInput.value.trim()) {
            errorMessage = "Vui lòng nhập tên đăng nhập hoặc email.";
        } else if (!passwordInput.value.trim()) {
            errorMessage = "Vui lòng nhập mật khẩu.";
        }

        if (errorMessage) {
            clientError.textContent = errorMessage;
            clientError.classList.remove("d-none");
            usernameInput.focus();
            return; // Dừng lại nếu validate sai
        }

        // 2. GỌI AJAX (Nếu validate ok)

        // Hiệu ứng loading
        const originalBtnText = btnLogin.innerHTML;
        btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';
        btnLogin.disabled = true;

        const username = usernameInput.value;
        const password = passwordInput.value;

        // Chuẩn bị data (Đã sửa lại variables cho khớp với Query)
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
                // SỬA LỖI: Truyền trực tiếp, không bọc trong "input"
                username: username,
                password: password
            }
        };

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/graphql", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                // Reset nút bấm
                btnLogin.disabled = false;
                btnLogin.innerHTML = originalBtnText;

                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);

                        // Trường hợp 1: Có lỗi từ GraphQL trả về
                        if (response.errors && response.errors.length > 0) {
                            showErrorServer(response.errors[0].message);
                        }
                        // Trường hợp 2: Đăng nhập thành công (SỬA LỖI: check getUserLogin)
                        else if (response.data && response.data.getUserLogin) {
                            // alert("Đăng nhập thành công!"); // Có thể bỏ alert cho mượt

                            // Điều hướng về trang chủ thay vì trang login
                            window.location.href = "/profile"; // hoặc "/"
                        }
                        // Trường hợp 3: Trả về null (ví dụ sai pass mà server không quăng error)
                        else {
                            showErrorServer("Tên đăng nhập hoặc mật khẩu không đúng.");
                        }
                    } catch (e) {
                        showErrorServer("Lỗi xử lý dữ liệu từ máy chủ.");
                    }
                } else {
                    if (xhr.status === 403) {
                        showErrorServer("Lỗi 403: Truy cập bị từ chối.");
                    } else {
                        showErrorServer("Lỗi hệ thống (" + xhr.status + ").");
                    }
                }
            }
        };

        xhr.send(JSON.stringify(graphqlData));
    });

    // Hàm hiển thị lỗi từ Server
    function showErrorServer(msg) {
        errorAlert.textContent = msg;
        errorAlert.classList.remove('d-none');
    }
});