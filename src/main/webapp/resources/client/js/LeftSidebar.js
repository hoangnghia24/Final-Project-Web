// Left Sidebar Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('leftSidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    
    if (!sidebar || !toggleBtn) {
        console.log('Left sidebar elements not found');
        return;
    }
    
    console.log('Left sidebar initialized');
    
    // Load saved state from localStorage
    const isCollapsed = localStorage.getItem('leftSidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        toggleBtn.classList.add('collapsed');
        
        // Apply collapsed state to all containers
        const containers = document.querySelectorAll('.home-container, .trending-container, .explore-container, .all-container, .profile-wrapper');
        containers.forEach(container => {
            container.classList.add('sidebar-collapsed');
        });
    }
    
    // Toggle sidebar on button click
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const collapsed = sidebar.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
        
        // Save state to localStorage
        localStorage.setItem('leftSidebarCollapsed', collapsed);
        
        // Update all container classes for layout adjustment
        const containers = document.querySelectorAll('.home-container, .trending-container, .explore-container, .all-container, .profile-wrapper');
        containers.forEach(container => {
            if (collapsed) {
                container.classList.add('sidebar-collapsed');
            } else {
                container.classList.remove('sidebar-collapsed');
            }
        });
        
        console.log('Left sidebar collapsed:', collapsed);
    });
    
    // Set active link based on current URL
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav-item');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        // Check if current path matches or starts with the link href
        if (href === currentPath || (href !== '/home' && currentPath.startsWith(href))) {
            link.classList.add('active');
        } else if (href === '/home' && currentPath === '/home') {
            link.classList.add('active');
        }
    });
});
