(function () {
    function safeParseObjectJSON(rawValue, fallback) {
        const sharedParser = window.TikaShared?.safeParseObjectJSON;
        if (typeof sharedParser === 'function') {
            return sharedParser(rawValue, fallback);
        }
        if (typeof rawValue !== 'string' || rawValue.trim() === '') return fallback;
        try {
            const parsed = JSON.parse(rawValue);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch {
            return fallback;
        }
    }

    function initSettingsPanel(options = {}) {
        const {
            isStatusPage = false,
            onMusicSettingsChange = null,
        } = options;

        const settingsToggle = document.getElementById('settings-toggle');
        const settingsPanel = document.getElementById('settings-panel');
        const settingsClose = document.getElementById('settings-close');
        const controls = document.querySelectorAll('.toggle-switch, .select-switch');

        if (!settingsPanel || !settingsToggle || !settingsClose) return null;

        const defaultSettings = {
            highContrast: false,
            liteMode: false,
            starfield: true,
            shootingStars: true,
            raindrops: true,
            cardFloat: true,
            musicAutoplay: true,
            playlistType: 'song',
        };
        const isMobile = window.matchMedia('(max-width: 960px)').matches;
        if (isMobile) {
            defaultSettings.starfield = false;
            defaultSettings.shootingStars = false;
            defaultSettings.raindrops = false;
            defaultSettings.cardFloat = false;
        }
        if (isStatusPage) {
            defaultSettings.shootingStars = false;
            defaultSettings.raindrops = false;
            defaultSettings.cardFloat = false;
        }

        const rawSettings = localStorage.getItem('visualSettings');
        const parsedSettings = safeParseObjectJSON(rawSettings, null);
        const visualSettings = parsedSettings && typeof parsedSettings === 'object'
            ? { ...defaultSettings, ...parsedSettings }
            : { ...defaultSettings };

        if (rawSettings && !parsedSettings) {
            console.warn('读取 visualSettings 失败，使用默认设置');
        }

        const effectElements = {
            starfield: [
                document.getElementById('starfield-layer1'),
                document.getElementById('starfield-layer2'),
                document.getElementById('starfield-layer3'),
            ],
            shootingStars: [document.getElementById('shooting-star-canvas')],
            raindrops: [document.getElementById('raindrop-canvas')],
        };
        const controlMap = new Map();
        controls.forEach((control) => {
            controlMap.set(control.dataset.setting, control);
        });
        const liteDependentKeys = ['starfield', 'shootingStars', 'raindrops', 'cardFloat'];

        const setRootAttribute = (name, enabled, enabledValue) => {
            if (enabled) {
                document.documentElement.setAttribute(name, enabledValue);
            } else {
                document.documentElement.removeAttribute(name);
            }
        };

        const setEffectVisibility = (key, enabled) => {
            const elements = effectElements[key];
            if (!elements) return;
            elements.forEach((el) => {
                if (el) el.hidden = !enabled;
            });
        };

        const setControlLocked = (key, locked) => {
            const control = controlMap.get(key);
            if (!control) return;
            control.disabled = locked;
            control.setAttribute('aria-disabled', locked ? 'true' : 'false');
            const item = control.closest('.setting-item');
            if (item) {
                item.classList.toggle('is-disabled', locked);
            }
        };

        const syncLiteModeDependents = () => {
            const locked = Boolean(visualSettings.liteMode);
            liteDependentKeys.forEach((key) => setControlLocked(key, locked));
        };

        setRootAttribute('data-contrast', visualSettings.highContrast, 'high');
        setRootAttribute('data-lite', visualSettings.liteMode, 'true');

        const applySetting = (key, value) => {
            visualSettings[key] = value;
            localStorage.setItem('visualSettings', JSON.stringify(visualSettings));

            if (key === 'highContrast') {
                setRootAttribute('data-contrast', value, 'high');
            }
            if (key === 'liteMode') {
                setRootAttribute('data-lite', value, 'true');
                syncLiteModeDependents();
            }
            setEffectVisibility(key, value);
            if ((key === 'playlistType' || key === 'musicAutoplay') && typeof onMusicSettingsChange === 'function') {
                onMusicSettingsChange();
            }
        };

        controls.forEach((control) => {
            const key = control.dataset.setting;
            if (key in visualSettings) {
                if (control.type === 'checkbox') {
                    control.checked = visualSettings[key];
                } else {
                    control.value = visualSettings[key];
                }
                setEffectVisibility(key, visualSettings[key]);
            }
            control.addEventListener('change', (event) => {
                const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
                applySetting(key, value);
            });
        });

        syncLiteModeDependents();

        const setSettingsOpen = (isOpen) => {
            settingsPanel.hidden = !isOpen;
            settingsToggle.setAttribute('aria-expanded', String(isOpen));
        };

        settingsToggle.addEventListener('click', () => setSettingsOpen(settingsPanel.hidden));
        settingsClose.addEventListener('click', () => setSettingsOpen(false));
        document.addEventListener('click', (event) => {
            if (!settingsPanel.hidden && !settingsPanel.contains(event.target) && !settingsToggle.contains(event.target)) {
                setSettingsOpen(false);
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !settingsPanel.hidden) {
                setSettingsOpen(false);
            }
        });

        return visualSettings;
    }

    window.TikaSettingsPanelModule = {
        initSettingsPanel,
    };
})();
