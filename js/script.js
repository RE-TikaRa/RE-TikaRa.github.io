document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Clock Functionality
    const hourEl = document.getElementById('hour');
    const minuteEl = document.getElementById('minute');
    const secondEl = document.getElementById('second');

    let clockTimer = null;
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        if (hourEl) hourEl.textContent = hours;
        if (minuteEl) minuteEl.textContent = minutes;
        if (secondEl) secondEl.textContent = seconds;
    }

    function scheduleClock() {
        updateClock();
        const delay = 1010 - (Date.now() % 1000);
        clockTimer = window.setTimeout(scheduleClock, delay);
    }

    scheduleClock();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            if (clockTimer) window.clearTimeout(clockTimer);
            scheduleClock();
        }
    });

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
        shortWeekDays.forEach((day, index) => {
            const el = document.createElement('div');
            el.className = 'calendar-day-name';
            if (index >= 5) el.classList.add('weekend');
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
            const dayOfWeek = new Date(year, month, i).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                el.classList.add('weekend');
            }
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

    if (!reduceMotion) {
        const bg = document.querySelector('.background-gradient');
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        function tickParallax() {
            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;
            if (bg) bg.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1.06)`;
            requestAnimationFrame(tickParallax);
        }
        if (bg) requestAnimationFrame(tickParallax);

        if (bg) {
            const resetParallax = () => {
                targetX = 0;
                targetY = 0;
            };

            window.addEventListener('mousemove', (e) => {
                const dx = e.clientX / window.innerWidth - 0.5;
                const dy = e.clientY / window.innerHeight - 0.5;
                targetX = dx * -14;
                targetY = dy * -10;
            });
            window.addEventListener('blur', resetParallax);
            document.addEventListener('mouseleave', resetParallax);
        }

        const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (finePointer) {
            document.querySelectorAll('.card').forEach((card) => {
                card.addEventListener('pointermove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const px = (e.clientX - rect.left) / rect.width - 0.5;
                    const py = (e.clientY - rect.top) / rect.height - 0.5;
                    const max = 3.2;
                    card.style.setProperty('--tilt-y', `${px * max}deg`);
                    card.style.setProperty('--tilt-x', `${-py * max}deg`);
                    card.style.setProperty('--mx', `${Math.round((px + 0.5) * 100)}%`);
                    card.style.setProperty('--my', `${Math.round((py + 0.5) * 100)}%`);
                });

                card.addEventListener('pointerleave', () => {
                    card.style.setProperty('--tilt-x', '0deg');
                    card.style.setProperty('--tilt-y', '0deg');
                    card.style.setProperty('--mx', '50%');
                    card.style.setProperty('--my', '15%');
                });
            });
        }
    }
});
