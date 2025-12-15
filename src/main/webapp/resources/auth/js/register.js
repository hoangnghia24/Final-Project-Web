function handleRegister(event) {
    // 1. Ngăn chặn form submit mặc định (tránh load lại trang)
    event.preventDefault();

    // 2. Lấy các element giao diện
    var errorAlert = document.getElementById('error-alert');
    var btnSubmit = document.querySelector('button[type="submit"]');

    // Reset thông báo lỗi
    errorAlert.classList.add('d-none');
    errorAlert.innerText = '';

    // 3. Lấy dữ liệu từ input (Dựa trên id trong file register.html)
    var fullName = document.getElementById('fullname').value;
    var email = document.getElementById('email').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirm_password').value;

    // 4. Validate phía Client
    if (password !== confirmPassword) {
        showError("Mật khẩu xác nhận không khớp!");
        return;
    }

    // 5. Chuẩn bị dữ liệu GraphQL (Payload)
    // Cấu trúc biến "input" phải khớp với RegisterInput trong Java và schema.graphqls
    var graphqlData = {
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

    // 6. Khởi tạo đối tượng AJAX (XMLHttpRequest)
    var xhr = new XMLHttpRequest();

    // Mở kết nối POST đến endpoint /graphql
    xhr.open("POST", "/graphql", true);

    // Set Header để Server hiểu là đang gửi JSON
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");

    // Hiệu ứng loading (disable nút bấm)
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Đang xử lý...";

    // 7. Xử lý sự kiện khi nhận phản hồi từ Server
    xhr.onreadystatechange = function () {
        // ReadyState 4 nghĩa là request đã hoàn thành
        if (xhr.readyState === 4) {
            // Bật lại nút bấm
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Đăng ký tài khoản";

            if (xhr.status === 200) {
                // Parse kết quả JSON trả về
                var response = JSON.parse(xhr.responseText);

                // Kiểm tra lỗi từ GraphQL (GraphQL thường trả về 200 kèm field errors nếu lỗi)
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
            } else {
                // Xử lý lỗi HTTP (403, 500, etc.)
                if (xhr.status === 403) {
                    showError("Lỗi 403: Bạn không có quyền thực hiện hành động này (Xem ghi chú bên dưới).");
                } else {
                    showError("Lỗi hệ thống (" + xhr.status + "). Vui lòng thử lại sau.");
                }
            }
        }
    };

    // 8. Gửi request
    xhr.send(JSON.stringify(graphqlData));
}

// Hàm phụ trợ để hiển thị lỗi
function showError(msg) {
    var errorAlert = document.getElementById('error-alert');
    errorAlert.innerText = msg;
    errorAlert.classList.remove('d-none');
}