(function () {
    function initCardEnergyBorders(scope = document, appState = {}) {
        if (!scope || !scope.querySelectorAll) return;
        scope.querySelectorAll('.card.glass').forEach((card) => {
            if (card.classList.contains('card--ghost')) return;
            if (card.querySelector('.card-energy-border')) return;
            const border = document.createElement('span');
            border.className = 'card-energy-border';
            border.setAttribute('aria-hidden', 'true');
            card.appendChild(border);
        });

        if (scope === document && !appState.cardBorderObserver && document.body) {
            appState.cardBorderObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (!(node instanceof HTMLElement)) return;
                        if (node.matches?.('.card.glass')) {
                            initCardEnergyBorders(node.parentElement || node, appState);
                        } else if (node.querySelector?.('.card.glass')) {
                            initCardEnergyBorders(node, appState);
                        }
                    });
                });
            });
            appState.cardBorderObserver.observe(document.body, { childList: true, subtree: true });
        }
    }

    function stopMusicPulse(appState = {}) {
        if (appState.musicPulseRafId) {
            cancelAnimationFrame(appState.musicPulseRafId);
            appState.musicPulseRafId = null;
        }
        if (typeof appState.musicPulseCleanup === 'function') {
            appState.musicPulseCleanup();
            appState.musicPulseCleanup = null;
        }
        const musicCard = document.getElementById('music-card');
        if (musicCard) {
            musicCard.classList.remove('is-playing');
            musicCard.style.setProperty('--music-beat', '0');
        }
    }

    function attachMusicPulse(player, card, appState = {}) {
        stopMusicPulse(appState);
        if (!player || !card || !player.audio) return;

        const audio = player.audio;
        const syncPlayingState = () => {
            const playing = !audio.paused && !audio.ended;
            card.classList.toggle('is-playing', playing);
            if (!playing) card.style.setProperty('--music-beat', '0');
        };

        const tick = () => {
            if (!card.isConnected) {
                stopMusicPulse(appState);
                return;
            }
            if (!audio.paused && !audio.ended) {
                const pulseA = (Math.sin(audio.currentTime * 5.8) + 1) * 0.5;
                const pulseB = (Math.sin(audio.currentTime * 11.2 + 0.9) + 1) * 0.5;
                const blend = pulseA * 0.62 + pulseB * 0.38;
                const beat = 0.09 + blend * (0.24 + audio.volume * 0.26);
                card.style.setProperty('--music-beat', beat.toFixed(3));
            } else {
                card.style.setProperty('--music-beat', '0');
            }
            appState.musicPulseRafId = requestAnimationFrame(tick);
        };

        const onPlay = () => syncPlayingState();
        const onPause = () => syncPlayingState();
        const onEnded = () => syncPlayingState();
        const onVolumeChange = () => syncPlayingState();

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('volumechange', onVolumeChange);
        appState.musicPulseCleanup = () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('volumechange', onVolumeChange);
        };

        syncPlayingState();
        appState.musicPulseRafId = requestAnimationFrame(tick);
    }

    async function initMusicPlayer(options = {}) {
        const {
            appState = {},
            fetchConfig,
            getVisualSettings,
        } = options;
        const musicCard = document.getElementById('music-card');
        if (!musicCard || typeof fetchConfig !== 'function' || typeof getVisualSettings !== 'function') return;

        try {
            stopMusicPulse(appState);
            musicCard.classList.remove('card--ghost');
            if (appState.hitokotoIntervalId) {
                clearInterval(appState.hitokotoIntervalId);
                appState.hitokotoIntervalId = null;
            }

            const config = await fetchConfig();
            const allMusicItems = Array.isArray(config?.netease_music_items)
                ? config.netease_music_items
                : [];
            const visualSettings = getVisualSettings() || {};
            const playlistType = visualSettings.playlistType || 'song';
            const filteredItems = allMusicItems.filter((item) => item.type === playlistType);

            if (filteredItems && filteredItems.length > 0) {
                const item = filteredItems[Math.floor(Math.random() * filteredItems.length)];
                const { id, type } = item;

                musicCard.innerHTML = `
                    <div class="card-header music-card-header">
                        <div class="card-title">音乐</div>
                        <div class="card-meta">网易云</div>
                    </div>
                    <div class="music-player-shell"></div>
                `;

                const meting = document.createElement('meting-js');
                meting.setAttribute('server', 'netease');
                meting.setAttribute('type', type);
                meting.setAttribute('id', id);
                meting.setAttribute('fixed', 'false');
                meting.setAttribute('autoplay', visualSettings.musicAutoplay ? 'true' : 'false');
                meting.setAttribute('loop', 'all');
                meting.setAttribute('order', 'random');
                meting.setAttribute('preload', 'auto');
                meting.setAttribute('list-folded', 'true');

                const playerShell = musicCard.querySelector('.music-player-shell');
                if (playerShell) {
                    playerShell.appendChild(meting);
                } else {
                    musicCard.appendChild(meting);
                }

                const observer = new MutationObserver((mutations, obs) => {
                    const aplayer = meting.querySelector('.aplayer');
                    if (aplayer) {
                        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                        if (meting.aplayer) {
                            meting.aplayer.theme(currentTheme === 'dark' ? '#222' : '#fff', true);
                            attachMusicPulse(meting.aplayer, musicCard, appState);
                        }
                        obs.disconnect();
                    }
                });
                observer.observe(musicCard, { childList: true, subtree: true });
                initCardEnergyBorders(musicCard, appState);
            } else {
                throw new Error(`在 config.json 中未找到类型为 "${playlistType}" 的有效音乐项目`);
            }
        } catch (error) {
            console.error('初始化音乐播放器失败:', error);
            stopMusicPulse(appState);
            musicCard.classList.remove('card--ghost');
            musicCard.innerHTML = `
                <div class="music-player-container">
                    <div class="music-header">
                        <i class="fa-solid fa-music"></i>
                        <span>音乐</span>
                    </div>
                    <div class="music-content">
                        <span>播放器加载失败</span>
                    </div>
                </div>
            `;
            initCardEnergyBorders(musicCard, appState);
        }
    }

    function initHitokotoFallback(container, options = {}) {
        if (!container) return;
        const { ghost = true, appState = {} } = options;
        container.classList.toggle('card--ghost', ghost);
        container.innerHTML = `
            <div class="music-player-container">
                <div class="music-header">
                    <i class="fa-solid fa-quote-left"></i>
                    <span>Hitokoto</span>
                </div>
                <div class="music-content">
                    <div class="hitokoto-container">
                        <p class="hitokoto-text"></p><span class="cursor"></span>
                        <p class="hitokoto-from"></p>
                    </div>
                </div>
            </div>
        `;
        const textEl = container.querySelector('.hitokoto-text');
        const fromEl = container.querySelector('.hitokoto-from');
        if (!textEl || !fromEl) return;

        if (!Array.isArray(appState.hitokotoTargets)) {
            appState.hitokotoTargets = [];
        }
        const existingIndex = appState.hitokotoTargets.findIndex((item) => item.container === container);
        const target = { container, textEl, fromEl };
        if (existingIndex >= 0) {
            appState.hitokotoTargets[existingIndex] = target;
        } else {
            appState.hitokotoTargets.push(target);
        }

        const typewriter = (text, element, onComplete) => {
            let i = 0;
            element.innerHTML = '';
            const typing = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(typing, 80);
                } else if (onComplete) {
                    onComplete();
                }
            };
            typing();
        };

        const renderAll = (text, from) => {
            appState.hitokotoTargets.forEach((item) => {
                if (!item.textEl || !item.fromEl) return;
                item.fromEl.style.opacity = '0';
                typewriter(text, item.textEl, () => {
                    item.fromEl.textContent = from;
                    item.fromEl.style.opacity = '1';
                });
            });
        };

        const fetchAndShowHitokoto = async () => {
            try {
                const response = await fetch('https://v1.hitokoto.cn/?encode=json&charset=utf-8');
                if (!response.ok) throw new Error('Hitokoto API request failed');
                const data = await response.json();
                const fromWho = data.from_who ? data.from_who : '';
                const from = data.from ? data.from : '';
                const suffix = `—— ${fromWho}${from ? `「${from}」` : ''}`;
                renderAll(data.hitokoto, suffix);
            } catch (error) {
                console.error('获取一言失败:', error);
                renderAll('生活，就是一半烟火，一半清欢。', '');
            }
        };
        fetchAndShowHitokoto();
        if (appState.hitokotoIntervalId) clearInterval(appState.hitokotoIntervalId);
        appState.hitokotoIntervalId = setInterval(fetchAndShowHitokoto, 10000);
    }

    window.TikaMusicModule = {
        initCardEnergyBorders,
        stopMusicPulse,
        attachMusicPulse,
        initMusicPlayer,
        initHitokotoFallback,
    };
})();
