document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeLabel = themeToggle.querySelector('.nav-label');
    const htmlElement = document.documentElement;
    const iframe = document.getElementById('content-frame');
    const mobileMedia = window.matchMedia('(max-width: 768px)');

    function isMobile() {
        return mobileMedia.matches;
    }

    function setMobileMenu(open) {
        sidebar.classList.toggle('mobile-open', open);
        document.body.classList.toggle('menu-open', open);
        mobileMenuToggle.setAttribute('aria-expanded', String(open));
        sidebarBackdrop.tabIndex = open ? 0 : -1;
    }

    function closeMobileMenu() {
        setMobileMenu(false);
    }

    const savedSidebarState = localStorage.getItem('sidebar-collapsed');
    if (!isMobile() && savedSidebarState === 'true') {
        sidebar.classList.add('collapsed');
        menuToggle.setAttribute('aria-expanded', 'false');
    }

    menuToggle.addEventListener('click', () => {
        if (isMobile()) {
            closeMobileMenu();
            return;
        }

        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
        menuToggle.setAttribute('aria-expanded', String(!isCollapsed));

        if (isCollapsed) {
            document.querySelectorAll('.has-submenu').forEach(item => item.classList.remove('open'));
            document.querySelectorAll('.submenu-toggle').forEach(button => button.setAttribute('aria-expanded', 'false'));
        }
    });

    mobileMenuToggle.addEventListener('click', () => {
        setMobileMenu(!sidebar.classList.contains('mobile-open'));
    });

    sidebarBackdrop.addEventListener('click', closeMobileMenu);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeMobileMenu();
            mobileMenuToggle.focus();
        }
    });

    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            if (!isMobile() && sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
                localStorage.setItem('sidebar-collapsed', 'false');
                menuToggle.setAttribute('aria-expanded', 'true');
            }

            const parentItem = toggle.closest('.has-submenu');
            const shouldOpen = !parentItem.classList.contains('open');

            document.querySelectorAll('.has-submenu').forEach(item => item.classList.remove('open'));
            document.querySelectorAll('.submenu-toggle').forEach(button => button.setAttribute('aria-expanded', 'false'));

            parentItem.classList.toggle('open', shouldOpen);
            toggle.setAttribute('aria-expanded', String(shouldOpen));
        });
    });

    document.querySelectorAll('.submenu-link').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.submenu-link').forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            if (isMobile()) closeMobileMenu();
        });
    });

    function syncIframeTheme(theme) {
        try {
            iframe.contentDocument?.documentElement.setAttribute('data-theme', theme);
        } catch (error) {
            console.warn('Unable to sync theme with iframe:', error);
        }
    }

    function updateThemeUI(theme) {
        const isDark = theme === 'dark';
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        themeLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    htmlElement.setAttribute('data-theme', currentTheme);
    updateThemeUI(currentTheme);

    themeToggle.addEventListener('click', () => {
        currentTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeUI(currentTheme);
        syncIframeTheme(currentTheme);
    });

    iframe.addEventListener('load', () => syncIframeTheme(currentTheme));

    mobileMedia.addEventListener('change', event => {
        closeMobileMenu();
        if (event.matches) {
            sidebar.classList.remove('collapsed');
        } else if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
    });
});
