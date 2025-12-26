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
    };

    if (window.matchMedia('(max-width: 960px)').matches) {
        CONFIG.RAINDROP_COUNT = 50;
    }

    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = CONFIG.SCRAMBLE_CHARS;
            this.update = this.update.bind(this);
            this.isRunning = false;
        }
        setText(newText) {
            if (this.isRunning) return Promise.resolve();
            this.isRunning = true;
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => (this.resolve = resolve));
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        update() {
            let output = '';
            let complete = 0;
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.randomChar();
                        this.queue[i].char = char;
                    }
                    output += `<span class="dud">${char}</span>`;
                } else {
                    output += from;
                }
            }
            this.el.innerHTML = output;
            if (complete === this.queue.length) {
                this.resolve();
                this.isRunning = false;
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
        randomChar() {
            return this.chars[Math.floor(Math.random() * this.chars.length)];
        }
    }

    class Star {
        constructor(width, height) {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        draw(ctx) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class ShootingStar {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.reset();
        }
        reset() {
            this.x = Math.random() * this.width;
            this.y = 0;
            this.len = Math.random() * 80 + 10;
            this.speed = Math.random() * 10 + 6;
            this.size = Math.random() * 1 + 0.1;
            this.waitTime = new Date().getTime() + Math.random() * CONFIG.SHOOTING_STAR_RESPAWN_DELAY;
            this.active = false;
        }
        update() {
            if (this.active) {
                this.x -= this.speed;
                this.y += this.speed;
                if (this.x < 0 || this.y >= this.height) {
                    this.reset();
                }
            } else if (new Date().getTime() > this.waitTime) {
                this.active = true;
            }
        }
        draw(ctx) {
            if (!this.active) return;
            ctx.lineWidth = this.size;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.len, this.y + this.len);
            ctx.stroke();
        }
    }

    class Raindrop {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.reset();
        }
        reset() {
            this.x = Math.random() * this.width;
            this.y = Math.random() * -this.height;
            this.speed = Math.random() * 6 + 2;
            this.length = Math.random() * 20 + 10;
            this.opacity = Math.random() * 0.3 + 0.2;
        }
        update() {
            this.y += this.speed;
            if (this.y > this.height) {
                this.reset();
                this.y = 0;
            }
        }
        draw(ctx) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.length);
            ctx.stroke();
        }
    }

    function initWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        const welcomeTextEl = document.getElementById('welcome-text');
        if (!welcomeScreen || !welcomeTextEl) {
            document.body.classList.add('is-ready');
            return;
        }
        let charIndex = 0;
        function typeChar() {
            if (charIndex < CONFIG.WELCOME_TEXT.length) {
                welcomeTextEl.textContent += CONFIG.WELCOME_TEXT.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, CONFIG.WELCOME_TYPE_SPEED);
            } else {
                setTimeout(() => {
                    welcomeScreen.classList.add('hidden');
                    document.body.classList.add('is-ready');
                }, CONFIG.WELCOME_FADE_DELAY);
            }
        }
        setTimeout(typeChar, 500);
    }

    function initClockAndGreeting() {
        const hourEl = document.getElementById('hour');
        const minuteEl = document.getElementById('minute');
        const secondEl = document.getElementById('second');
        const greetingEl = document.getElementById('greeting');
        const todayEl = document.getElementById('today');
        if (!hourEl && !minuteEl && !secondEl && !greetingEl && !todayEl) return;

        let clockTimer = null;
        let lastGreetingKey = '';
        let lastDateKey = '';
        const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
        });
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function updateGreeting(now) {
            if (!greetingEl && !todayEl) return;
            const hours = now.getHours();
            const greetingKey = String(hours);

            if (greetingKey !== lastGreetingKey) {
                let greetingText = '你好';
                if (hours >= 5 && hours <= 8) greetingText = '早上好';
                else if (hours >= 9 && hours <= 11) greetingText = '上午好';
                else if (hours >= 12 && hours <= 13) greetingText = '中午好';
                else if (hours >= 14 && hours <= 17) greetingText = '下午好';
                else if (hours >= 18 && hours <= 22) greetingText = '晚上好';
                else greetingText = '夜深了';

                if (greetingEl && !reduceMotion) {
                    greetingEl.innerHTML = '';
                    greetingText.split('').forEach((char, i) => {
                        const span = document.createElement('span');
                        span.textContent = char;
                        span.style.setProperty('--char-index', i);
                        greetingEl.appendChild(span);
                    });
                } else if (greetingEl) {
                    greetingEl.textContent = greetingText;
                }
                lastGreetingKey = greetingKey;
            }

            if (todayEl) {
                const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
                if (dateKey !== lastDateKey) {
                    todayEl.textContent = dateFormatter.format(now);
                    lastDateKey = dateKey;
                }
            }
        }

        function updateClock() {
            const now = new Date();
            if (hourEl) hourEl.textContent = String(now.getHours()).padStart(2, '0');
            if (minuteEl) minuteEl.textContent = String(now.getMinutes()).padStart(2, '0');
            if (secondEl) secondEl.textContent = String(now.getSeconds()).padStart(2, '0');
            updateGreeting(now);
        }

        function scheduleClock() {
            updateClock();
            const delay = 1000 - (Date.now() % 1000);
            clockTimer = window.setTimeout(scheduleClock, delay);
        }

        scheduleClock();
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                if (clockTimer) window.clearTimeout(clockTimer);
                scheduleClock();
            }
        });
    }

    function initCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        const calendarMonthEl = document.getElementById('calendar-month');
        if (!calendarGrid) return;

        calendarGrid.textContent = '';
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();

        if (calendarMonthEl) {
            calendarMonthEl.textContent = `${year}年${month + 1}月`;
        }

        const shortWeekDays = ['一', '二', '三', '四', '五', '六', '日'];
        shortWeekDays.forEach((day, index) => {
            const el = document.createElement('div');
            el.className = 'calendar-day-name';
            if (index >= 5) el.classList.add('weekend');
            el.textContent = day;
            calendarGrid.appendChild(el);
        });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        let startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < startOffset; i++) {
            const el = document.createElement('div');
            el.className = 'calendar-day empty';
            calendarGrid.appendChild(el);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const el = document.createElement('div');
            el.className = 'calendar-day';
            el.textContent = i;
            const dayOfWeek = new Date(year, month, i).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) el.classList.add('weekend');
            if (i === today) el.classList.add('current');
            calendarGrid.appendChild(el);
        }
    }

    async function initWeather() {
        const weatherCard = document.getElementById('weather-card');
        if (!weatherCard) return;

        const locationEl = weatherCard.querySelector('.weather-location');
        const tempEl = weatherCard.querySelector('.weather-temp');
        const iconEl = weatherCard.querySelector('.weather-icon i');
        const descriptionEl = weatherCard.querySelector('.weather-description');

        const weatherCodeMap = {
            0: { icon: 'fa-solid fa-sun', description: '晴' },
            1: { icon: 'fa-solid fa-cloud-sun', description: '基本晴朗' },
            2: { icon: 'fa-solid fa-cloud', description: '部分多云' },
            3: { icon: 'fa-solid fa-cloud', description: '阴天' },
            45: { icon: 'fa-solid fa-smog', description: '雾' },
            48: { icon: 'fa-solid fa-smog', description: '冻雾' },
            51: { icon: 'fa-solid fa-cloud-rain', description: '小雨' },
            53: { icon: 'fa-solid fa-cloud-rain', description: '中雨' },
            55: { icon: 'fa-solid fa-cloud-showers-heavy', description: '大雨' },
            61: { icon: 'fa-solid fa-cloud-rain', description: '小雨' },
            63: { icon: 'fa-solid fa-cloud-rain', description: '中雨' },
            65: { icon: 'fa-solid fa-cloud-showers-heavy', description: '大雨' },
            80: { icon: 'fa-solid fa-cloud-showers-heavy', description: '阵雨' },
            81: { icon: 'fa-solid fa-cloud-showers-heavy', description: '中度阵雨' },
            82: { icon: 'fa-solid fa-cloud-showers-heavy', description: '猛烈阵雨' },
            95: { icon: 'fa-solid fa-bolt', description: '雷暴' },
        };

        function updateWeatherUI(location, temperature, weatherInfo) {
            if (tempEl) tempEl.textContent = `${Math.round(temperature)}°`;
            if (descriptionEl) descriptionEl.textContent = weatherInfo.description;
            if (iconEl) iconEl.className = weatherInfo.icon;
            if (locationEl) locationEl.textContent = location;
            weatherCard.hidden = false;
        }

        function showVirtualWeather() {
            console.log("加载虚拟天气数据...");
            const weatherCodes = Object.keys(weatherCodeMap);
            const randomCode = weatherCodes[Math.floor(Math.random() * weatherCodes.length)];
            const virtualWeatherInfo = weatherCodeMap[randomCode];
            const virtualTemperature = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
            updateWeatherUI('ALp_Studio', virtualTemperature, virtualWeatherInfo);
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
            });
            const { latitude, longitude } = position.coords;
            const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP 错误! 状态: ${response.status}`);
            const data = await response.json();
            const weatherInfo = weatherCodeMap[data.current.weather_code] || { icon: 'fa-solid fa-question', description: '未知' };
            updateWeatherUI('当前位置', data.current.temperature_2m, weatherInfo);
        } catch (error) {
            console.error("获取天气失败:", error.message || error);
            showVirtualWeather();
        }
    }

    function initTheme() {
        const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
        const toggleBtn = document.getElementById('theme-toggle');

        function setTheme(theme, isInitial = false) {
            document.documentElement.setAttribute('data-theme', theme);
            // APlayer 主题切换
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
        }

        const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
        syncThemeToggle(initialTheme);

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (event) => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

                if (!document.startViewTransition) {
                    setTheme(nextTheme);
                    localStorage.setItem('theme', nextTheme);
                    syncThemeToggle(nextTheme);
                    return;
                }

                const x = event.clientX;
                const y = event.clientY;
                const endRadius = Math.hypot(
                    Math.max(x, window.innerWidth - x),
                    Math.max(y, window.innerHeight - y)
                );

                const transition = document.startViewTransition(() => {
                    setTheme(nextTheme);
                    localStorage.setItem('theme', nextTheme);
                    syncThemeToggle(nextTheme);
                });

                if (window.matchMedia('(min-width: 961px)').matches) {
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
            if (!localStorage.getItem('theme')) {
                const nextTheme = e.matches ? 'dark' : 'light';
                if (!document.startViewTransition) {
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

    function initInteractiveEffects() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const bg = document.querySelector('.background-gradient');
        const gridContainer = document.querySelector('.grid-container');
        const profileCard = document.querySelector('.profile-card');
        const avatarHalo = profileCard?.querySelector('.avatar-large');
        const animationState = {
            targetX: 0, currentX: 0,
            targetY: 0, currentY: 0,
            targetSpotX: 50, currentSpotX: 50,
            targetSpotY: 28, currentSpotY: 28,
            targetSpotA: 0.1, currentSpotA: 0.1,
            targetHaloScale: 1, currentHaloScale: 1,
            targetHaloOpacity: 0.72, currentHaloOpacity: 0.72,
            targetGlobalTiltX: 0, currentGlobalTiltX: 0,
            targetGlobalTiltY: 0, currentGlobalTiltY: 0,
            magneticElements: [],
            floatingElements: [],
            starfieldUpdate: () => {},
            shootingStarUpdate: () => {},
            raindropUpdate: () => {},
        };

        function tick() {
            const { LERP_FACTOR_NORMAL, LERP_FACTOR_FAST } = CONFIG;
            animationState.currentX += (animationState.targetX - animationState.currentX) * LERP_FACTOR_NORMAL;
            animationState.currentY += (animationState.targetY - animationState.currentY) * LERP_FACTOR_NORMAL;
            animationState.currentSpotX += (animationState.targetSpotX - animationState.currentSpotX) * LERP_FACTOR_NORMAL;
            animationState.currentSpotY += (animationState.targetSpotY - animationState.currentSpotY) * LERP_FACTOR_NORMAL;
            animationState.currentSpotA += (animationState.targetSpotA - animationState.currentSpotA) * LERP_FACTOR_FAST;
            animationState.currentHaloScale += (animationState.targetHaloScale - animationState.currentHaloScale) * LERP_FACTOR_FAST;
            animationState.currentHaloOpacity += (animationState.targetHaloOpacity - animationState.currentHaloOpacity) * LERP_FACTOR_FAST;
            animationState.currentGlobalTiltX += (animationState.targetGlobalTiltX - animationState.currentGlobalTiltX) * LERP_FACTOR_NORMAL;
            animationState.currentGlobalTiltY += (animationState.targetGlobalTiltY - animationState.currentGlobalTiltY) * LERP_FACTOR_NORMAL;

            if (bg) {
                bg.style.transform = `translate3d(${animationState.currentX}px, ${animationState.currentY}px, 0) scale(1.06)`;
                bg.style.setProperty('--spot-x', `${animationState.currentSpotX.toFixed(2)}%`);
                bg.style.setProperty('--spot-y', `${animationState.currentSpotY.toFixed(2)}%`);
                bg.style.setProperty('--spot-a', animationState.currentSpotA.toFixed(3));
            }
            if (avatarHalo) {
                avatarHalo.style.setProperty('--halo-scale', animationState.currentHaloScale.toFixed(3));
                avatarHalo.style.setProperty('--halo-opacity', animationState.currentHaloOpacity.toFixed(3));
            }
            if (gridContainer) {
                gridContainer.style.setProperty('--global-tilt-x', `${animationState.currentGlobalTiltX.toFixed(2)}deg`);
                gridContainer.style.setProperty('--global-tilt-y', `${animationState.currentGlobalTiltY.toFixed(2)}deg`);
            }

            animationState.magneticElements.forEach(item => {
                item.currentX += (item.targetX - item.currentX) * LERP_FACTOR_FAST;
                item.currentY += (item.targetY - item.currentY) * LERP_FACTOR_FAST;
                item.el.style.setProperty('--magnetic-x', `${item.currentX.toFixed(2)}px`);
                item.el.style.setProperty('--magnetic-y', `${item.currentY.toFixed(2)}px`);
            });

            const now = performance.now();
            if (visualSettings.cardFloat) {
                animationState.floatingElements.forEach(item => {
                    const floatY = Math.sin(item.phase + now * item.speed) * item.amplitude;
                    item.el.style.setProperty('--float-y', `${floatY.toFixed(2)}px`);
                });
            } else {
                animationState.floatingElements.forEach(item => {
                    if (item.el.style.getPropertyValue('--float-y') !== '0px') {
                        item.el.style.setProperty('--float-y', '0px');
                    }
                });
            }
            
            animationState.starfieldUpdate(animationState.currentX, animationState.currentY);
            animationState.shootingStarUpdate();
            animationState.raindropUpdate();
            requestAnimationFrame(tick);
        }

        const resetAnimationTargets = () => {
            animationState.targetX = 0;
            animationState.targetY = 0;
            animationState.targetSpotX = 50;
            animationState.targetSpotY = 28;
            animationState.targetSpotA = 0.1;
            animationState.targetHaloScale = 1;
            animationState.targetHaloOpacity = 0.72;
            animationState.targetGlobalTiltX = 0;
            animationState.targetGlobalTiltY = 0;
        };

        window.addEventListener('mousemove', (e) => {
            const { clientX: mouseX, clientY: mouseY } = e;
            const { innerWidth, innerHeight } = window;
            const dx = mouseX / innerWidth - 0.5;
            const dy = mouseY / innerHeight - 0.5;

            animationState.targetX = dx * CONFIG.PARALLAX_STRENGTH_X;
            animationState.targetY = dy * CONFIG.PARALLAX_STRENGTH_Y;
            animationState.targetGlobalTiltX = -dy * CONFIG.GLOBAL_TILT_STRENGTH;
            animationState.targetGlobalTiltY = dx * CONFIG.GLOBAL_TILT_STRENGTH;
            animationState.targetSpotX = (mouseX / innerWidth) * 100;
            animationState.targetSpotY = (mouseY / innerHeight) * 100;
            animationState.targetSpotA = 0.18;

            if (profileCard) {
                const rect = profileCard.getBoundingClientRect();
                const dist = Math.hypot(mouseX - (rect.left + rect.width / 2), mouseY - (rect.top + rect.height / 2));
                const proximity = Math.max(0, 1 - dist / CONFIG.HALO_PROXIMITY_MAX_DIST);
                animationState.targetHaloScale = 1 + proximity * 0.05;
                animationState.targetHaloOpacity = 0.72 + proximity * 0.28;
            }

            animationState.magneticElements.forEach(item => {
                const rect = item.el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const dist = Math.hypot(mouseX - centerX, mouseY - centerY);
                
                if (dist < item.maxDist) {
                    const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
                    const proximity = 1 - (dist / item.maxDist);
                    item.targetX = Math.cos(angle) * item.strength * proximity;
                    item.targetY = Math.sin(angle) * item.strength * proximity;
                } else {
                    item.targetX = 0;
                    item.targetY = 0;
                }
            });
        });
        window.addEventListener('blur', resetAnimationTargets);
        document.addEventListener('mouseleave', resetAnimationTargets);

        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            document.querySelectorAll('.card').forEach((card, index) => {
                const floatItem = {
                    el: card,
                    phase: Math.random() * Math.PI * 2,
                    amplitude: 2 + Math.random() * 2,
                    speed: 0.005 + Math.random() * 0.005,
                };
                animationState.floatingElements.push(floatItem);

                if (card.classList.contains('link-card')) {
                    animationState.magneticElements.push({
                        el: card,
                        targetX: 0, currentX: 0,
                        targetY: 0, currentY: 0,
                        strength: CONFIG.MAGNETIC_STRENGTH,
                        maxDist: CONFIG.MAGNETIC_MAX_DIST,
                    });

                    const textEl = card.querySelector('.link-text');
                    if (textEl) {
                        const fx = new TextScramble(textEl);
                        const originalText = textEl.textContent;
                        card.addEventListener('mouseenter', () => {
                            // 在动画开始前固定宽度以防止抖动
                            const textWidth = textEl.getBoundingClientRect().width;
                            textEl.style.setProperty('--scramble-width', `${textWidth}px`);
                            textEl.classList.add('is-scrambling');
                            fx.setText(originalText).then(() => {
                                // 动画结束后移除固定宽度
                                textEl.classList.remove('is-scrambling');
                                textEl.style.removeProperty('--scramble-width');
                            });
                        });
                    }
                }

                card.addEventListener('pointermove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const px = (e.clientX - rect.left) / rect.width - 0.5;
                    const py = (e.clientY - rect.top) / rect.height - 0.5;
                    card.style.setProperty('--tilt-y', `${px * CONFIG.TILT_MAX_ANGLE}deg`);
                    card.style.setProperty('--tilt-x', `${-py * CONFIG.TILT_MAX_ANGLE}deg`);
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

        animationState.starfieldUpdate = initStarfield();
        animationState.shootingStarUpdate = initShootingStars();
        animationState.raindropUpdate = initRaindrops();
        
        tick();
    }

    function initStarfield() {
        const layers = [
            { canvas: document.getElementById('starfield-layer1'), count: CONFIG.STAR_COUNT_LAYER1, factor: CONFIG.STAR_PARALLAX_FACTOR1 },
            { canvas: document.getElementById('starfield-layer2'), count: CONFIG.STAR_COUNT_LAYER2, factor: CONFIG.STAR_PARALLAX_FACTOR2 },
            { canvas: document.getElementById('starfield-layer3'), count: CONFIG.STAR_COUNT_LAYER3, factor: CONFIG.STAR_PARALLAX_FACTOR3 },
        ];
        let width, height, dpr;
        const starLayers = [];

        function resize() {
            dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            starLayers.length = 0;
            layers.forEach(layerConfig => {
                if (!layerConfig.canvas) return;
                const canvas = layerConfig.canvas;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);
                const stars = Array.from({ length: layerConfig.count }, () => new Star(width, height));
                starLayers.push({ ctx, stars, factor: layerConfig.factor });
            });
        }
        resize();
        window.addEventListener('resize', resize);

        return function updateStarfield(parallaxX, parallaxY) {
            starLayers.forEach(({ ctx, stars, factor }) => {
                ctx.clearRect(0, 0, width, height);
                ctx.save();
                ctx.translate(parallaxX * factor, parallaxY * factor);
                stars.forEach(star => star.draw(ctx));
                ctx.restore();
            });
        };
    }

    function initShootingStars() {
        const canvas = document.getElementById('shooting-star-canvas');
        if (!canvas) return () => {};
        let width, height, dpr;
        let shootingStars = [];
        const ctx = canvas.getContext('2d');

        function resize() {
            dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            shootingStars = Array.from({ length: CONFIG.SHOOTING_STAR_COUNT }, () => new ShootingStar(width, height));
        }
        resize();
        window.addEventListener('resize', resize);

        return function updateShootingStars() {
            ctx.clearRect(0, 0, width, height);
            shootingStars.forEach(star => {
                star.update();
                star.draw(ctx);
            });
        };
    }

    function initRaindrops() {
        const canvas = document.getElementById('raindrop-canvas');
        if (!canvas) return () => {};
        let width, height, dpr;
        let raindrops = [];
        const ctx = canvas.getContext('2d');

        function resize() {
            dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            raindrops = Array.from({ length: CONFIG.RAINDROP_COUNT }, () => new Raindrop(width, height));
        }
        resize();
        window.addEventListener('resize', resize);

        return function updateRaindrops() {
            ctx.clearRect(0, 0, width, height);
            raindrops.forEach(drop => {
                drop.update();
                drop.draw(ctx);
            });
        };
    }

    function initSettingsPanel() {
        const settingsToggle = document.getElementById('settings-toggle');
        const settingsPanel = document.getElementById('settings-panel');
        const settingsClose = document.getElementById('settings-close');
        const controls = document.querySelectorAll('.toggle-switch, .select-switch');

        if (!settingsPanel || !settingsToggle || !settingsClose) return;

        const defaultSettings = {
            starfield: true,
            shootingStars: true,
            raindrops: true,
            cardFloat: true,
            musicAutoplay: true,
            playlistType: 'song',
        };

        const savedSettings = JSON.parse(localStorage.getItem('visualSettings')) || {};
        visualSettings = { ...defaultSettings, ...savedSettings };

        const effectElements = {
            starfield: [
                document.getElementById('starfield-layer1'),
                document.getElementById('starfield-layer2'),
                document.getElementById('starfield-layer3'),
            ],
            shootingStars: [document.getElementById('shooting-star-canvas')],
            raindrops: [document.getElementById('raindrop-canvas')],
        };

        function applySetting(key, value) {
            visualSettings[key] = value;
            localStorage.setItem('visualSettings', JSON.stringify(visualSettings));

            if (effectElements[key]) {
                effectElements[key].forEach(el => {
                    if (el) el.hidden = !value;
                });
            }
            if (key === 'playlistType' || key === 'musicAutoplay') {
                initMusicPlayer();
            }
        }

        controls.forEach(control => {
            const key = control.dataset.setting;
            if (key in visualSettings) {
                if (control.type === 'checkbox') {
                    control.checked = visualSettings[key];
                } else {
                    control.value = visualSettings[key];
                }
                if (effectElements[key]) {
                    effectElements[key].forEach(el => {
                        if (el) el.hidden = !visualSettings[key];
                    });
                }
            }
            control.addEventListener('change', (e) => {
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                applySetting(key, value);
            });
        });

        settingsToggle.addEventListener('click', () => settingsPanel.hidden = !settingsPanel.hidden);
        settingsClose.addEventListener('click', () => settingsPanel.hidden = true);
        document.addEventListener('click', (e) => {
            if (!settingsPanel.hidden && !settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
                settingsPanel.hidden = true;
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !settingsPanel.hidden) {
                settingsPanel.hidden = true;
            }
        });
    }

    function initCLI() {
        const cliContainer = document.getElementById('cli-container');
        const cliOutput = document.getElementById('cli-output');
        const cliInput = document.getElementById('cli-input');
        if (!cliContainer || !cliInput || !cliOutput) return;

        function escapeHTML(value) {
            return value.replace(/[&<>"']/g, (char) => {
                switch (char) {
                    case '&':
                        return '&amp;';
                    case '<':
                        return '&lt;';
                    case '>':
                        return '&gt;';
                    case '"':
                        return '&quot;';
                    case "'":
                        return '&#39;';
                    default:
                        return char;
                }
            });
        }

        const UPTIME_START = Date.parse('2020-06-21T01:39:45Z');
        function formatUptime() {
            const diffMs = Math.max(0, Date.now() - UPTIME_START);
            const totalSeconds = Math.floor(diffMs / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${days} 天, ${hours} 小时, ${minutes} 分钟, ${seconds} 秒`;
        }

        let commandHistory = [];
        let historyIndex = -1;
        let uptimeTimer = null;

        const commands = {
            help: () => {
                return `<div class="cli-section">
<pre class="cli-banner">   █████████   █████       ███████████             █████████  ███████████ █████  █████ ██████████   █████    ███████   
  ███░░░░░███ ░░███       ░░███░░░░░███           ███░░░░░███░█░░░███░░░█░░███  ░░███ ░░███░░░░███ ░░███   ███░░░░░███ 
 ░███    ░███  ░███        ░███    ░███          ░███    ░░░ ░   ░███  ░  ░███   ░███  ░███   ░░███ ░███  ███     ░░███
 ░███████████  ░███        ░██████████           ░░█████████     ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███░░░░░███  ░███        ░███░░░░░░             ░░░░░░░░███    ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███    ░███  ░███      █ ░███                   ███    ░███    ░███     ░███   ░███  ░███    ███  ░███ ░░███     ███ 
 █████   █████ ███████████ █████        █████████░░█████████     █████    ░░████████   ██████████   █████ ░░░███████░  
░░░░░   ░░░░░ ░░░░░░░░░░░ ░░░░░        ░░░░░░░░░  ░░░░░░░░░     ░░░░░      ░░░░░░░░   ░░░░░░░░░░   ░░░░░    ░░░░░░░    </pre>
<pre class="cli-help">可用命令:
  <span class="cli-command">help</span>      - 显示此帮助信息
  <span class="cli-command">clear</span>     - 清空终端屏幕
  <span class="cli-command">theme</span>     - 切换亮/暗主题
  <span class="cli-command">info</span>      - 显示系统和版本信息
  <span class="cli-command">date</span>      - 显示当前时间
  <span class="cli-command">fortune</span>   - 随机输出一言
  <span class="cli-command">say</span>       - 说点什么
  <span class="cli-command">exit</span>      - 关闭 CLI 窗口</pre>
</div>`;
            },
            clear: () => {
                cliOutput.innerHTML = '';
                if (uptimeTimer) {
                    clearInterval(uptimeTimer);
                    uptimeTimer = null;
                }
                return '';
            },
            theme: () => {
                document.getElementById('theme-toggle')?.click();
                const currentTheme = document.documentElement.getAttribute('data-theme');
                return `主题已切换为 ${currentTheme === 'dark' ? '深色' : '浅色'} 模式。`;
            },
            info: () => {
                return `<div class="cli-section">
<pre class="cli-banner">   █████████   █████       ███████████             █████████  ███████████ █████  █████ ██████████   █████    ███████   
  ███░░░░░███ ░░███       ░░███░░░░░███           ███░░░░░███░█░░░███░░░█░░███  ░░███ ░░███░░░░███ ░░███   ███░░░░░███ 
 ░███    ░███  ░███        ░███    ░███          ░███    ░░░ ░   ░███  ░  ░███   ░███  ░███   ░░███ ░███  ███     ░░███
 ░███████████  ░███        ░██████████           ░░█████████     ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███░░░░░███  ░███        ░███░░░░░░             ░░░░░░░░███    ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███    ░███  ░███      █ ░███                   ███    ░███    ░███     ░███   ░███  ░███    ███  ░███ ░░███     ███ 
 █████   █████ ███████████ █████        █████████░░█████████     █████    ░░████████   ██████████   █████ ░░░███████░  
░░░░░   ░░░░░ ░░░░░░░░░░░ ░░░░░        ░░░░░░░░░  ░░░░░░░░░     ░░░░░      ░░░░░░░░   ░░░░░░░░░░   ░░░░░    ░░░░░░░    </pre>
<pre class="cli-info"><span class="cli-user">tika</span>@<span class="cli-host">lab</span>
--------------------
<span class="cli-title">操作系统</span>:   TikaOS 情绪体接口
<span class="cli-title">主机</span>:       个人主页 v2.3
<span class="cli-title">内核</span>:       5.4.0-TikaRa
<span class="cli-title">运行时间</span>:   <span class="cli-uptime">${formatUptime()}</span>
<span class="cli-title">主题</span>:       ${document.documentElement.getAttribute('data-theme') === 'dark' ? '深色' : '浅色'}</pre>
</div>`;
            },
            date: () => {
                return new Intl.DateTimeFormat('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }).format(new Date());
            },
            fortune: () => {
                printToCLI('正在获取一言...');
                return fetch('https://v1.hitokoto.cn/?encode=json', { cache: 'no-store' })
                    .then((response) => {
                        if (!response.ok) throw new Error('hitokoto fetch failed');
                        return response.json();
                    })
                    .then((data) => {
                        const text = typeof data?.hitokoto === 'string' ? data.hitokoto : '';
                        if (!text) throw new Error('invalid hitokoto');
                        const fromWho = typeof data?.from_who === 'string' ? data.from_who.trim() : '';
                        const from = typeof data?.from === 'string' ? data.from.trim() : '';
                        const suffixParts = [];
                        if (fromWho) suffixParts.push(fromWho);
                        if (from) suffixParts.push(`《${from}》`);
                        const suffix = suffixParts.length > 0 ? ` —— ${suffixParts.join(' ')}` : '';
                        return `${escapeHTML(text)}${escapeHTML(suffix)}`;
                    })
                    .catch(() => '抱歉，该实验体权限不足');
            },
            say: (args) => {
                const message = args.join(' ').trim();
                if (!message) return '请输入内容。';
                return escapeHTML(message);
            },
            exit: () => {
                toggleCLI(false);
                return '关闭终端...';
            }
        };

        function toggleCLI(show) {
            const isVisible = !cliContainer.hidden;
            if (show === undefined) show = !isVisible;

            if (show) {
                cliContainer.hidden = false;
                cliInput.focus();
                if (cliOutput.innerHTML === '') {
                    executeCommand('info');
                }
            } else {
                cliContainer.hidden = true;
                cliInput.blur();
            }
        }

        function printToCLI(text) {
            cliOutput.innerHTML += `<div>${text}</div>`;
            setTimeout(() => {
                cliContainer.scrollTop = cliContainer.scrollHeight;
            }, 0);
        }

        function startUptimeTicker() {
            const nodes = cliOutput.querySelectorAll('.cli-uptime');
            const uptimeEl = nodes[nodes.length - 1];
            if (!uptimeEl) return;
            if (uptimeTimer) clearInterval(uptimeTimer);
            const update = () => {
                uptimeEl.textContent = formatUptime();
            };
            update();
            uptimeTimer = setInterval(update, 1000);
        }

        function executeCommand(command) {
            const trimmedCommand = command.trim();
            if (trimmedCommand === '') return;

            const safeCommand = escapeHTML(trimmedCommand);
            printToCLI(`<span class="cli-prompt">[tika@lab ~]$</span> <span class="cli-command-input">${safeCommand}</span>`);

            if (commandHistory[0] !== trimmedCommand) {
                commandHistory.unshift(trimmedCommand);
            }
            historyIndex = -1;

            const parts = trimmedCommand.split(' ');
            const cmd = parts.shift().toLowerCase();
            const args = parts;
            if (commands[cmd]) {
                const result = commands[cmd](args);
                if (result && typeof result.then === 'function') {
                    result
                        .then((text) => {
                            if (text) {
                                printToCLI(text);
                                if (text.includes('cli-uptime')) startUptimeTicker();
                            }
                        })
                        .catch(() => printToCLI('抱歉，该实验体权限不足'));
                } else if (result) {
                    printToCLI(result);
                    if (result.includes('cli-uptime')) startUptimeTicker();
                }
            } else {
                printToCLI('抱歉，该实验体权限不足');
            }
        }

        cliContainer.addEventListener('click', () => {
            const selection = window.getSelection();
            if (selection.type !== 'Range') {
                cliInput.focus();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                toggleCLI();
            }
            if (e.key === 'Escape' && !cliContainer.hidden) {
                toggleCLI(false);
            }
        });

        cliInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                executeCommand(cliInput.value);
                cliInput.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    cliInput.value = commandHistory[historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    cliInput.value = commandHistory[historyIndex];
                } else {
                    historyIndex = -1;
                    cliInput.value = '';
                }
            }
        });
    }

    async function initMusicPlayer() {
        const musicCard = document.getElementById('music-card');
        if (!musicCard) return;

        try {
            if (appState.hitokotoIntervalId) {
                clearInterval(appState.hitokotoIntervalId);
                appState.hitokotoIntervalId = null;
            }

            const config = {
              "netease_music_items": [
                { "id": "2053344480", "type": "song" },
                { "id": "2053344483", "type": "song" },
                { "id": "2053344486", "type": "song" },
                { "id": "179521966", "type": "album" }
              ]
            };
            const allMusicItems = config.netease_music_items;

            const playlistType = visualSettings.playlistType || 'song';
            const filteredItems = allMusicItems.filter(item => item.type === playlistType);

            if (filteredItems && filteredItems.length > 0) {
                const item = filteredItems[Math.floor(Math.random() * filteredItems.length)];
                const { id, type } = item;

                // 清空旧的播放器
                musicCard.innerHTML = '';

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
                
                // 将 MetingJS 播放器添加到 music-card 中
                musicCard.appendChild(meting);

                // 确保 APlayer 主题在加载后能正确设置
                const observer = new MutationObserver((mutations, obs) => {
                    const aplayer = meting.querySelector('.aplayer');
                    if (aplayer) {
                        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                        if (meting.aplayer) {
                           meting.aplayer.theme(currentTheme === 'dark' ? '#222' : '#fff', true);
                        }
                        obs.disconnect(); // 找到后停止观察
                    }
                });
                observer.observe(musicCard, { childList: true, subtree: true });

            } else {
                throw new Error(`在 config.json 中未找到类型为 "${playlistType}" 的有效音乐项目`);
            }
        } catch (error) {
            console.error('初始化音乐播放器失败:', error);
            initHitokotoFallback(musicCard);
        }
    }

    function initHitokotoFallback(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="music-player-container">
                <div class="music-header">
                    <i class="fa-solid fa-quote-left"></i>
                    <span>Hitokoto</span>
                </div>
                <div class="music-content">
                    <div class="hitokoto-container">
                        <p id="hitokoto-text"></p><span class="cursor"></span>
                        <p id="hitokoto-from"></p>
                    </div>
                </div>
            </div>
        `;
        const textEl = document.getElementById('hitokoto-text');
        const fromEl = document.getElementById('hitokoto-from');
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
        const fetchAndShowHitokoto = async () => {
            try {
                const response = await fetch('https://v1.hitokoto.cn/?encode=json&charset=utf-8');
                if (!response.ok) throw new Error('Hitokoto API request failed');
                const data = await response.json();
                typewriter(data.hitokoto, textEl, () => {
                    fromEl.textContent = `—— ${data.from_who || ''}「${data.from}」`;
                    fromEl.style.opacity = '1';
                });
                fromEl.style.opacity = '0';
            } catch (error) {
                console.error('获取一言失败:', error);
                textEl.textContent = '生活，就是一半烟火，一半清欢。';
                fromEl.textContent = '';
            }
        };
        fetchAndShowHitokoto();
        if (appState.hitokotoIntervalId) clearInterval(appState.hitokotoIntervalId);
        appState.hitokotoIntervalId = setInterval(fetchAndShowHitokoto, 10000);
    }

    function main() {
        document.querySelectorAll('.card').forEach((card, index) => {
            card.style.setProperty('--stagger', String(index));
        });
        initWelcomeScreen();
        initClockAndGreeting();
        initCalendar();
        initWeather();
        initTheme();
        initSettingsPanel();
        initCLI();
        initMusicPlayer();
        if (window.matchMedia('(min-width: 961px)').matches) {
            initInteractiveEffects();
        }
    }

    document.addEventListener('DOMContentLoaded', main);
})();
