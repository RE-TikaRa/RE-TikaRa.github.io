(function () {
    function spawnThemeSwitchRipple(x, y, theme) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const ripple = document.createElement('span');
        ripple.className = 'theme-switch-ripple';
        if (theme === 'dark') ripple.classList.add('is-dark');
        ripple.style.setProperty('--tx', `${x}px`);
        ripple.style.setProperty('--ty', `${y}px`);
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );
        ripple.style.setProperty('--tr', `${Math.ceil(endRadius)}px`);
        document.body.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }

    function readStoredTheme() {
        try {
            return localStorage.getItem('theme');
        } catch {
            return null;
        }
    }

    function persistTheme(theme) {
        try {
            localStorage.setItem('theme', theme);
        } catch {}
    }

    function initTheme() {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const toggleBtn = document.getElementById('theme-toggle');
        const isMobile = window.matchMedia('(max-width: 960px)').matches;

        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            const metingEle = document.querySelector('meting-js');
            if (metingEle && metingEle.aplayer) {
                metingEle.aplayer.theme(theme === 'dark' ? '#222' : '#fff', true);
            }
        }

        function syncThemeToggle(theme) {
            if (!toggleBtn) return;
            const iconEl = toggleBtn.querySelector('i');
            const textEl = toggleBtn.querySelector('.theme-toggle-text');
            const isDark = theme === 'dark';
            if (iconEl) iconEl.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
            if (textEl) textEl.textContent = isDark ? '深色' : '浅色';
            toggleBtn.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
            toggleBtn.setAttribute('aria-pressed', String(isDark));
        }

        const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
        syncThemeToggle(initialTheme);

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (event) => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
                const rect = toggleBtn.getBoundingClientRect();
                const hasPointerPos = Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
                const x = hasPointerPos ? event.clientX : (rect.left + rect.width / 2);
                const y = hasPointerPos ? event.clientY : (rect.top + rect.height / 2);
                if (!isMobile) {
                    spawnThemeSwitchRipple(x, y, nextTheme);
                }

                if (!document.startViewTransition || isMobile) {
                    setTheme(nextTheme);
                    persistTheme(nextTheme);
                    syncThemeToggle(nextTheme);
                    return;
                }

                const endRadius = Math.hypot(
                    Math.max(x, window.innerWidth - x),
                    Math.max(y, window.innerHeight - y)
                );

                const transition = document.startViewTransition(() => {
                    setTheme(nextTheme);
                    persistTheme(nextTheme);
                    syncThemeToggle(nextTheme);
                });

                if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    transition.ready.then(() => {
                        document.documentElement.animate(
                            {
                                clipPath: [
                                    `circle(0px at ${x}px ${y}px)`,
                                    `circle(${endRadius}px at ${x}px ${y}px)`,
                                ],
                            },
                            {
                                duration: 550,
                                easing: 'ease-in-out',
                                pseudoElement: '::view-transition-new(root)',
                            }
                        );
                    });
                }
            });
        }

        prefersDarkScheme.addEventListener('change', (e) => {
            if (!readStoredTheme()) {
                const nextTheme = e.matches ? 'dark' : 'light';
                if (!document.startViewTransition || isMobile) {
                    setTheme(nextTheme);
                    syncThemeToggle(nextTheme);
                    return;
                }
                document.startViewTransition(() => {
                    setTheme(nextTheme);
                    syncThemeToggle(nextTheme);
                });
            }
        });
    }

    window.TikaThemeModule = {
        spawnThemeSwitchRipple,
        initTheme,
    };
})();
