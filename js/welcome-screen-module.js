(function () {
    function initWelcomeScreen(options = {}) {
        const {
            config,
            prefersReducedMotion = false,
            playWelcomeLowPolyDissolve,
        } = options;
        if (!config || typeof playWelcomeLowPolyDissolve !== 'function') return;
        const isMobile = window.matchMedia('(max-width: 960px)').matches;

        const welcomeScreen = document.getElementById('welcome-screen');
        const welcomeTextEl = document.getElementById('welcome-text');
        let hasMarkedReady = false;
        const markPageReady = () => {
            if (hasMarkedReady) return;
            hasMarkedReady = true;
            document.body.classList.add('is-ready');
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                document.body.classList.add('is-main-reveal');
                window.setTimeout(() => {
                    document.body.classList.remove('is-main-reveal');
                }, 1300);
            }
            window.dispatchEvent(new Event('welcome-ready'));
        };
        if (!welcomeScreen || !welcomeTextEl) {
            markPageReady();
            return;
        }
        let charIndex = 0;
        const typeSpeed = isMobile ? Math.min(config.WELCOME_TYPE_SPEED, 70) : config.WELCOME_TYPE_SPEED;
        function typeChar() {
            if (charIndex < config.WELCOME_TEXT.length) {
                welcomeTextEl.textContent += config.WELCOME_TEXT.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, typeSpeed);
            } else {
                setTimeout(() => {
                    if (prefersReducedMotion || isMobile) {
                        welcomeScreen.style.transition = 'none';
                        welcomeScreen.classList.add('hidden');
                        markPageReady();
                        return;
                    }

                    welcomeScreen.classList.add('is-cracking');
                    playWelcomeLowPolyDissolve(welcomeScreen, {
                        onDissolveStart: () => {
                            welcomeScreen.classList.add('is-revealing-main');
                            markPageReady();
                        },
                    }).finally(() => {
                        welcomeScreen.classList.remove('is-cracking');
                        welcomeScreen.classList.remove('is-dissolving');
                        welcomeScreen.style.transition = 'none';
                        welcomeScreen.classList.add('hidden');
                        markPageReady();
                    });
                }, isMobile ? 80 : config.WELCOME_FADE_DELAY);
            }
        }
        setTimeout(typeChar, isMobile ? 120 : 500);
    }

    window.TikaWelcomeScreenModule = {
        initWelcomeScreen,
    };
})();
