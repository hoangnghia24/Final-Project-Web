// File: src/main/webapp/resources/admin/js/dashboard.js

$(document).ready(function () {
    loadAllUsers();

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
            data: JSON.stringify(graphqlData),
            success: function (response) {
                if (response.errors) {
                    alert("Lỗi tải dữ liệu: " + response.errors[0].message);
                    return;
                }
                const users = response.data.getAllUsers;
                renderTable(users);
            },
            error: function (xhr) {
                console.error(xhr);
                alert("Lỗi hệ thống khi tải danh sách users.");
            }
        });
    }

    function renderTable(users) {
        ``
        const $tbody = $("#userTableBody");
        $tbody.empty();

        if (!users || users.length === 0) {
            $tbody.append('<tr><td colspan="7" class="text-center">Không có dữ liệu</td></tr>');
            return;
        }

        users.forEach(user => {
            // Xử lý avatar mặc định
            const avatar = user.avatarUrl ? user.avatarUrl : "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png";

            // Xử lý role class
            const roleClass = (user.role === 'ADMIN') ? 'role-admin' : 'role-user';

            // Format ngày tạo (Cắt chuỗi ISO cho gọn)
            const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "N/A";
            const bioText = user.bio ? user.bio : "---";

            const row = `
                <tr>
                    <td>#${user.id}</td>
                    <td><img src="${avatar}" class="table-avatar" alt="avt"></td>
                    <td>
                        <strong>${user.fullName}</strong>
                    </td>
                    <td>${user.email}</td>
                    <td><span class="badge-role ${roleClass}">${user.role}</span></td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="btn btn-sm btn-primary">Chi tiết</button>
                        <button class="btn btn-sm btn-danger">Chặn quyền</button>
                    </td>
                </tr>
            `;
            $tbody.append(row);
        });
    }
});