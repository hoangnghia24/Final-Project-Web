document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('leftSidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');

    // --- 1. XỬ LÝ ẨN/HIỆN SIDEBAR ---
    if (sidebar && toggleBtn) {
        // Load trạng thái từ localStorage
        const isCollapsed = localStorage.getItem('leftSidebarCollapsed') === 'true';
        if (isCollapsed) {
            setSidebarState(true);
        }

        // Sự kiện click nút Toggle
        toggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Toggle class
            const willCollapse = !sidebar.classList.contains('collapsed');
            setSidebarState(willCollapse);

            // Lưu trạng thái
            localStorage.setItem('leftSidebarCollapsed', willCollapse);
        });
    }

    function setSidebarState(collapsed) {
        if (collapsed) {
            sidebar.classList.add('collapsed');
            toggleBtn.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed'); // Thêm class vào body để CSS khác bắt được
        } else {
            sidebar.classList.remove('collapsed');
            toggleBtn.classList.remove('collapsed');
            document.body.classList.remove('sidebar-collapsed');
        }
    }

    // --- 2. XỬ LÝ ACCORDION (MENU CON) ---
    // Sử dụng jQuery vì logic cũ của bạn dùng jQuery slideToggle
    if (typeof $ !== 'undefined') {
        $('.sidebar-accordion-toggle').on('click', function (e) {
            e.preventDefault();

            // Nếu sidebar đang thu nhỏ thì không cho mở menu con
            if ($('#leftSidebar').hasClass('collapsed')) {
                // Tùy chọn: Tự động mở sidebar ra nếu người dùng bấm vào accordion
                // $('#sidebarToggleBtn').click(); 
                return;
            }

            var $block = $(this).closest('.sidebar-accordion-block');
            var $submenu = $block.find('.sidebar-submenu').first();

            $(this).toggleClass('active');
            $submenu.stop().slideToggle(220);
        });
    }

    // --- 3. ACTIVE LINK (Đánh dấu menu đang chọn) ---
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav-item:not(.sidebar-accordion-toggle)'); // Trừ nút accordion ra

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');

        if (href && (href === currentPath || (href !== '/home' && currentPath.startsWith(href)))) {
            link.classList.add('active');
        } else if (href === '/home' && currentPath === '/home') {
            link.classList.add('active');
        }
    });
});