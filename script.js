document.addEventListener('DOMContentLoaded', () => {
    // 1. Clock Functionality
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const hourEl = document.getElementById('hour');
        const minuteEl = document.getElementById('minute');
        const secondEl = document.getElementById('second');

        if(hourEl) hourEl.textContent = hours;
        if(minuteEl) minuteEl.textContent = minutes;
        if(secondEl) secondEl.textContent = seconds;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. Calendar Functionality
    function initCalendar() {
        // ... existing calendar code ...
        const calendarGrid = document.getElementById('calendar-grid');
        
        if(!calendarGrid) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11
        const today = now.getDate();
        
        // Generate Grid
        // Headers
        const shortWeekDays = ['一', '二', '三', '四', '五', '六', '日'];
        shortWeekDays.forEach(day => {
            const el = document.createElement('div');
            el.className = 'calendar-day-name';
            el.textContent = day;
            calendarGrid.appendChild(el);
        });

        // Days
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0-6
        // Adjust for Monday start (0=Sun -> 7, then -1 to make Mon=0)
        let startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty slots before first day
        for (let i = 0; i < startOffset; i++) {
            const el = document.createElement('div');
            el.className = 'calendar-day empty';
            calendarGrid.appendChild(el);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const el = document.createElement('div');
            el.className = 'calendar-day';
            el.textContent = i;
            if (i === today) {
                el.classList.add('current');
            }
            calendarGrid.appendChild(el);
        }
    }
    initCalendar();

    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    function persistTheme(theme) {
        setTheme(theme);
        localStorage.setItem('theme', theme);
    }

    function syncThemeToggle(theme) {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        const iconEl = toggleBtn.querySelector('i');
        const textEl = toggleBtn.querySelector('.theme-toggle-text');
        const isDark = theme === 'dark';

        if (iconEl) iconEl.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        if (textEl) textEl.textContent = isDark ? '深色' : '浅色';
        toggleBtn.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
    }

    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme ?? (prefersDarkScheme.matches ? 'dark' : 'light');
    setTheme(initialTheme);
    syncThemeToggle(initialTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            persistTheme(nextTheme);
            syncThemeToggle(nextTheme);
        });
    }

    // Auto switch listener
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const nextTheme = e.matches ? 'dark' : 'light';
            setTheme(nextTheme);
            syncThemeToggle(nextTheme);
        }
    });
});
