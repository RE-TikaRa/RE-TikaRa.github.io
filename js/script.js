(function() {
    /**
     *
     *  Tika's Personal Homepage - Interactive Script
     *  Version: 2.3 (APlayer + MetingJS Integration)
     *  Tika 的个人主页 - 交互脚本
     *  版本: 2.3 (集成 APlayer + MetingJS)
     *
     */

    let visualSettings = {}; // 全局视觉设置
    const appState = {
        hitokotoIntervalId: null,
        hitokotoTargets: [],
        musicPulseRafId: null,
        musicPulseCleanup: null,
        cardBorderObserver: null,
    };

    const CONFIG = {
        WELCOME_TEXT: "正在唤醒情绪体接口…",
        WELCOME_TYPE_SPEED: 120,
        WELCOME_FADE_DELAY: 1000,
        LERP_FACTOR_FAST: 0.1,
        LERP_FACTOR_NORMAL: 0.08,
        GLOBAL_TILT_STRENGTH: 8,
        PARALLAX_STRENGTH_X: -14,
        PARALLAX_STRENGTH_Y: -10,
        TILT_MAX_ANGLE: 3.2,
        MAGNETIC_STRENGTH: 12,
        MAGNETIC_MAX_DIST: 150,
        HALO_PROXIMITY_MAX_DIST: 400,
        STAR_COUNT_LAYER1: 300,
        STAR_COUNT_LAYER2: 200,
        STAR_COUNT_LAYER3: 100,
        STAR_PARALLAX_FACTOR1: 0.1,
        STAR_PARALLAX_FACTOR2: 0.3,
        STAR_PARALLAX_FACTOR3: 0.6,
        SHOOTING_STAR_COUNT: 3,
        SHOOTING_STAR_RESPAWN_DELAY: 2000,
        SCRAMBLE_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        RAINDROP_COUNT: 150,
        CURSOR_AURA_BASE_OPACITY: 0.34,
        CURSOR_AURA_MAX_OPACITY: 0.72,
        CURSOR_AURA_SCALE_RANGE: 0.28,
    };

    function normalizeExternalUrl(value) {
        const sharedNormalizer = window.TikaShared?.normalizeExternalUrl;
        if (typeof sharedNormalizer === 'function') {
            return sharedNormalizer(value);
        }
        if (typeof value !== 'string') return '#';
        try {
            const url = new URL(value, window.location.href);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                return url.href;
            }
            return '#';
        } catch {
            return '#';
        }
    }

    const isMobile = window.matchMedia('(max-width: 960px)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (isMobile) {
        CONFIG.STAR_COUNT_LAYER1 = 80;
        CONFIG.STAR_COUNT_LAYER2 = 50;
        CONFIG.STAR_COUNT_LAYER3 = 30;
        CONFIG.SHOOTING_STAR_COUNT = 1;
        CONFIG.RAINDROP_COUNT = 30;
    }
    
    if (prefersReducedMotion) {
        CONFIG.STAR_COUNT_LAYER1 = 0;
        CONFIG.STAR_COUNT_LAYER2 = 0;
        CONFIG.STAR_COUNT_LAYER3 = 0;
        CONFIG.SHOOTING_STAR_COUNT = 0;
        CONFIG.RAINDROP_COUNT = 0;
    }

    const isStatusPage = document.body && document.body.classList.contains('status-page');
    const isErrorPage = document.body && document.body.classList.contains('error-page');
    if (isStatusPage) {
        CONFIG.STAR_COUNT_LAYER1 = 140;
        CONFIG.STAR_COUNT_LAYER2 = 90;
        CONFIG.STAR_COUNT_LAYER3 = 60;
        CONFIG.SHOOTING_STAR_COUNT = 1;
        CONFIG.RAINDROP_COUNT = 0;
        CONFIG.GLOBAL_TILT_STRENGTH = 5;
        CONFIG.PARALLAX_STRENGTH_X = -10;
        CONFIG.PARALLAX_STRENGTH_Y = -8;
    }

    function initCardEnergyBorders(scope = document) {
        const module = window.TikaMusicModule?.initCardEnergyBorders;
        if (typeof module !== 'function') return;
        module(scope, appState);
    }

    function stopMusicPulse() {
        const module = window.TikaMusicModule?.stopMusicPulse;
        if (typeof module !== 'function') return;
        module(appState);
    }

    function attachMusicPulse(player, card) {
        const module = window.TikaMusicModule?.attachMusicPulse;
        if (typeof module !== 'function') return;
        module(player, card, appState);
    }

    function playWelcomeLowPolyDissolve(welcomeScreen, options = {}) {
        const module = window.TikaWelcomeEffectsModule?.playWelcomeLowPolyDissolve;
        if (typeof module !== 'function') return Promise.resolve();
        return module(welcomeScreen, options);
    }

    function initWelcomeScreen() {
        const module = window.TikaWelcomeScreenModule?.initWelcomeScreen;
        if (typeof module !== 'function') {
            if (document.body && !document.body.classList.contains('is-ready')) {
                document.body.classList.add('is-ready');
                window.dispatchEvent(new Event('welcome-ready'));
            }
            return;
        }
        module({
            config: CONFIG,
            prefersReducedMotion,
            playWelcomeLowPolyDissolve,
        });
    }

    function initClockAndGreeting() {
        const module = window.TikaClockModule?.initClockAndGreeting;
        if (typeof module !== 'function') return;
        module();
    }

    async function initWeather() {
        const module = window.TikaWeatherModule?.initWeather;
        if (typeof module !== 'function') return;
        await module();
    }

    function initTheme() {
        const module = window.TikaThemeModule?.initTheme;
        if (typeof module !== 'function') return;
        module();
    }

    function initInteractiveEffects() {
        const module = window.TikaInteractiveEffectsModule?.initInteractiveEffects;
        if (typeof module !== 'function') return;
        module({
            config: CONFIG,
            getVisualSettings: () => visualSettings,
        });
    }

    function initSettingsPanel() {
        const module = window.TikaSettingsPanelModule?.initSettingsPanel;
        if (typeof module !== 'function') return;
        const settings = module({
            isStatusPage,
            onMusicSettingsChange: () => initMusicPlayer(),
        });
        if (settings && typeof settings === 'object') {
            visualSettings = settings;
        }
    }

    function initCLI() {
        const module = window.TikaCliModule?.initCLI;
        if (typeof module !== 'function') return;
        module();
    }

    const fetchConfig = async () => {
        const loader = window.TikaConfigLoader?.fetchConfigJSON;
        if (typeof loader !== 'function') {
            throw new Error('config loader unavailable');
        }
        return loader();
    };

    async function initMusicPlayer() {
        const module = window.TikaMusicModule?.initMusicPlayer;
        if (typeof module !== 'function') return;
        await module({
            appState,
            fetchConfig,
            getVisualSettings: () => visualSettings,
        });
    }

    function initHitokotoFallback(container, options = {}) {
        const module = window.TikaMusicModule?.initHitokotoFallback;
        if (typeof module !== 'function') return;
        module(container, { ...options, appState });
    }

    async function initLatestArticles() {
        const extension = window.TikaHomePageExtensions?.initLatestArticles;
        if (typeof extension !== 'function') return;
        await extension({ fetchConfig, normalizeExternalUrl });
    }

    function initScrollLayout() {
        const extension = window.TikaHomePageExtensions?.initScrollLayout;
        if (typeof extension !== 'function') return;
        extension();
    }

    function initScrollProgress() {
        const extension = window.TikaHomePageExtensions?.initScrollProgress;
        if (typeof extension !== 'function') return;
        extension();
    }

    function initHiddenStatusNavigation() {
        const extension = window.TikaHomePageExtensions?.initHiddenStatusNavigation;
        if (typeof extension !== 'function') return;
        extension();
    }

    function initAccessGuard() {
        const module = window.TikaAccessGuardModule?.initAccessGuard;
        if (typeof module !== 'function') return { blocked: false };
        return module();
    }

    function runInitializer(name, initializer) {
        try {
            const result = initializer();
            if (result && typeof result.then === 'function') {
                result.catch((error) => {
                    console.error(`初始化失败: ${name}`, error);
                });
            }
        } catch (error) {
            console.error(`初始化失败: ${name}`, error);
        }
    }

    function main() {
        const accessGuardState = initAccessGuard();
        if (accessGuardState?.blocked) {
            return;
        }

        document.querySelectorAll('.card').forEach((card, index) => {
            card.style.setProperty('--stagger', String(index));
        });

        const baseInitializers = [
            ['card-energy-borders', () => initCardEnergyBorders()],
            ['welcome-screen', () => initWelcomeScreen()],
            ['clock-and-greeting', () => initClockAndGreeting()],
            ['weather', () => initWeather()],
            ['theme', () => initTheme()],
            ['settings-panel', () => initSettingsPanel()],
            ['cli', () => initCLI()],
            ['music-player', () => initMusicPlayer()],
            ['latest-articles', () => initLatestArticles()],
            ['scroll-layout', () => initScrollLayout()],
            ['scroll-progress', () => initScrollProgress()],
            ['hidden-status-navigation', () => initHiddenStatusNavigation()],
        ];
        baseInitializers.forEach(([name, initializer]) => runInitializer(name, initializer));

        const hitokotoCard = document.getElementById('hitokoto-card');
        if (hitokotoCard) {
            runInitializer('hitokoto-fallback', () => initHitokotoFallback(hitokotoCard, { ghost: false }));
        }
        if (window.matchMedia('(min-width: 961px)').matches && !isErrorPage) {
            runInitializer('interactive-effects', () => initInteractiveEffects());
        }
        runInitializer('view-transitions', () => initViewTransitions());
        runInitializer('scroll-reveal', () => initScrollReveal());
    }

    function initScrollReveal() {
        const module = window.TikaNavigationEffectsModule?.initScrollReveal;
        if (typeof module !== 'function') return;
        module();
    }

    function initViewTransitions() {
        const module = window.TikaNavigationEffectsModule?.initViewTransitions;
        if (typeof module !== 'function') return;
        module();
    }

    document.addEventListener('DOMContentLoaded', main);
})();
