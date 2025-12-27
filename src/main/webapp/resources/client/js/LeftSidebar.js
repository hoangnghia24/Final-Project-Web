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
        
        // Apply collapsed state to container
        const homeContainer = document.querySelector('.home-container');
        const profileWrapper = document.querySelector('.profile-wrapper');
        
        if (homeContainer) {
            homeContainer.classList.add('sidebar-collapsed');
        }
        if (profileWrapper) {
            profileWrapper.classList.add('sidebar-collapsed');
        }
    }
    
    // Toggle sidebar on button click
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const collapsed = sidebar.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
        
        // Save state to localStorage
        localStorage.setItem('leftSidebarCollapsed', collapsed);
        
        // Update body/container class for layout adjustment
        const homeContainer = document.querySelector('.home-container');
        const profileWrapper = document.querySelector('.profile-wrapper');
        
        if (homeContainer) {
            if (collapsed) {
                homeContainer.classList.add('sidebar-collapsed');
            } else {
                homeContainer.classList.remove('sidebar-collapsed');
            }
        }
        
        if (profileWrapper) {
            if (collapsed) {
                profileWrapper.classList.add('sidebar-collapsed');
            } else {
                profileWrapper.classList.remove('sidebar-collapsed');
            }
        }
        
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
