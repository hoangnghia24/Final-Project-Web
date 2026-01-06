$(document).ready(function () {

    // ================================================================
    // 1. KIỂM TRA QUYỀN TRUY CẬP (ACCESS CONTROL)
    // ================================================================

    // Lấy token và user từ LocalStorage
    const accessToken = localStorage.getItem("accessToken");
    const currentUserStr = localStorage.getItem("currentUser");

    // Nếu không có token -> Chưa đăng nhập -> Đuổi về trang login
    if (!accessToken || !currentUserStr) {
        alert("Phiên đăng nhập hết hạn hoặc bạn chưa đăng nhập!");
        window.location.href = "/login";
        return; // Dừng code tại đây
    }

    const currentUser = JSON.parse(currentUserStr);

    // Nếu có token nhưng Role không phải ADMIN -> Đuổi về trang chủ
    // (Lưu ý: Đảm bảo Backend trả về role là chuỗi "ADMIN")
    if (currentUser.role !== "ADMIN") {
        alert("Bạn không có quyền truy cập vào trang Quản trị!");
        window.location.href = "/home"; // Hoặc trang chủ của bạn
        return;
    }

    // Nếu đã qua được 2 ải trên, tiến hành tải dữ liệu
    loadAllUsers();


    // ================================================================
    // 2. HÀM TẢI DỮ LIỆU (CÓ KÈM TOKEN)
    // ================================================================
    function loadAllUsers() {
        const graphqlData = {
            query: `
                query GetAllUsers {
                    getAllUsers {
                        id
                        fullName
                        email
                        avatarUrl
                        bio
                        role
                        createdAt
                    }
                }
            `
        };

        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            dataType: "json",

            // --- QUAN TRỌNG: Gửi Token đi kèm ---
            headers: {
                "Authorization": "Bearer " + accessToken
            },
            // ------------------------------------

            data: JSON.stringify(graphqlData),
            success: function (response) {
                // Kiểm tra lỗi từ GraphQL (ví dụ lỗi logic)
                if (response.errors) {
                    // Nếu lỗi do hết quyền (Backend trả về Access Denied)
                    if (response.errors[0].message.includes("Access Denied") || response.errors[0].message.includes("Forbidden")) {
                        alert("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
                        localStorage.clear();
                        window.location.href = "/login";
                        return;
                    }
                    alert("Lỗi tải dữ liệu: " + response.errors[0].message);
                    return;
                }

                // Render dữ liệu nếu thành công
                const users = response.data.getAllUsers;
                renderTable(users);
            },
            error: function (xhr) {
                // Xử lý lỗi HTTP (401, 403 từ Security Filter)
                console.error(xhr);
                if (xhr.status === 403 || xhr.status === 401) {
                    alert("Bạn không có quyền hoặc phiên đăng nhập đã hết hạn.");
                    window.location.href = "/login";
                } else {
                    alert("Lỗi hệ thống khi tải danh sách users (" + xhr.status + ").");
                }
            }
        });
    }

    // ================================================================
    // 3. HÀM RENDER GIAO DIỆN (GIỮ NGUYÊN LOGIC CŨ)
    // ================================================================
    function renderTable(users) {
        const $tbody = $("#userTableBody");
        $tbody.empty();

        if (!users || users.length === 0) {
            $tbody.append('<tr><td colspan="7" class="text-center">Không có dữ liệu</td></tr>');
            return;
        }

        users.forEach(user => {
            // Xử lý avatar mặc định
            const avatar = user.avatarUrl ? user.avatarUrl : "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png";

            // Xử lý role class (để tô màu badge)
            const roleClass = (user.role === 'ADMIN') ? 'bg-danger' : 'bg-primary';
            // Lưu ý: Class 'bg-danger/bg-primary' là class chuẩn Bootstrap, 
            // hoặc bạn dùng class riêng 'role-admin' như cũ nếu CSS đã định nghĩa.

            // Format ngày tạo
            const createdDate = user.createdAt ? new Date(Number(user.createdAt)).toLocaleDateString("vi-VN") : "N/A";
            // Lưu ý: Nếu Backend trả về String ISO thì dùng new Date(user.createdAt)
            // Nếu Backend trả về timestamp (Long) thì dùng new Date(Number(user.createdAt))

            const row = `
                <tr>
                    <td>#${user.id}</td>
                    <td><img src="${avatar}" class="table-avatar" alt="avt" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                    <td><strong>${user.fullName}</strong></td>
                    <td>${user.email}</td>
                    <td><span class="badge ${roleClass}">${user.role}</span></td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="btn btn-sm btn-info text-white" onclick="window.location.href='/profile?id=${user.id}'">Chi tiết</button>
                        <button class="btn btn-sm btn-warning" onclick="blockUser(${user.id})">Xóa tài khoản</button>
                    </td>
                </tr>
            `;
            $tbody.append(row);
        });
    }

    // Có thể thêm các hàm xử lý nút bấm tại đây nếu cần
    window.viewDetail = function (id) {
        alert("Xem chi tiết user ID: " + id);
    };

    // ================================================================
    // 4. CHỨC NĂNG XÓA USER (GỌI GRAPHQL MUTATION)
    // ================================================================
    window.blockUser = function (id) {
        if (!confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản ID " + id + " này không? Hành động này sẽ ẩn toàn bộ bài viết và dữ liệu liên quan.")) {
            return;
        }

        // Tạo câu query Mutation
        const graphqlMutation = {
            query: `
                mutation DeleteUserByAdmin {
                    deleteUserByAdmin(userId: ${id})
                }
            `
        };

        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            headers: {
                "Authorization": "Bearer " + accessToken
            },
            data: JSON.stringify(graphqlMutation),
            success: function (response) {
                // Kiểm tra lỗi từ Backend trả về
                if (response.errors) {
                    alert("Lỗi khi xóa: " + response.errors[0].message);
                    return;
                }

                // Nếu thành công
                alert("Thành công: " + response.data.deleteUserByAdmin);

                // Tải lại bảng dữ liệu để cập nhật danh sách
                // (Giả sử hàm loadAllUsers được định nghĩa ở scope ngoài hoặc ta reload trang)
                // Cách 1: Reload trang
                // location.reload(); 

                // Cách 2: Gọi lại hàm load data (Cần đảm bảo loadAllUsers truy cập được)
                location.reload();
            },
            error: function (xhr) {
                if (xhr.status === 403 || xhr.status === 401) {
                    alert("Phiên đăng nhập hết hạn hoặc không có quyền.");
                    window.location.href = "/login";
                } else {
                    alert("Lỗi hệ thống (" + xhr.status + ")");
                }
            }
        });
    };
});