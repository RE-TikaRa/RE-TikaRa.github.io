/**
 *
 *  Tika's Personal Homepage - Interactive Script
 *  Version: 2.2 (Re-introducing Shooting Stars)
 *
 */

/**
 * Configuration object for various effects and settings.
 */
const CONFIG = {
    // Welcome screen settings
    WELCOME_TEXT: "正在唤醒生命体接口…",
    WELCOME_TYPE_SPEED: 120, // ms
    WELCOME_FADE_DELAY: 1000, // ms

    // Animation interpolation factors
    LERP_FACTOR_FAST: 0.1,
    LERP_FACTOR_NORMAL: 0.08,

    // Global Parallax effect
    GLOBAL_TILT_STRENGTH: 8, // degrees

    // Parallax effect on background
    PARALLAX_STRENGTH_X: -14,
    PARALLAX_STRENGTH_Y: -10,

    // Card tilt effect
    TILT_MAX_ANGLE: 3.2, // degrees

    // Magnetic card effect
    MAGNETIC_STRENGTH: 12, // Increased for a stronger pull
    MAGNETIC_MAX_DIST: 150, // Increased detection range

    // Avatar halo effect
    HALO_PROXIMITY_MAX_DIST: 400, // pixels

    // Starfield background effect
    STAR_COUNT_LAYER1: 300,
    STAR_COUNT_LAYER2: 200,
    STAR_COUNT_LAYER3: 100,
    STAR_PARALLAX_FACTOR1: 0.1,
    STAR_PARALLAX_FACTOR2: 0.3,
    STAR_PARALLAX_FACTOR3: 0.6,

    // Shooting star effect
    SHOOTING_STAR_COUNT: 3,
    SHOOTING_STAR_RESPAWN_DELAY: 2000, // ms

    // Text scramble effect characters
    SCRAMBLE_CHARS: 'ĀČĘĢĪĶĻŅŌŖŠŪŽdħĕįŏŧș⇋⇌⇟⇞⌆⌅⌄⍰⍞⍯⎈⎔⎚☍⚿⛶⛯⛮⛻⛼⛾⛿',

    // Raindrop effect
    RAINDROP_COUNT: 150,
};


/* --- 1. EFFECT CLASSES --- */
/* ------------------------- */

/**
 * Creates a text scramble animation effect on an element.
 */
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

/**
 * Represents a single star in the starfield background.
 */
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

/**
 * Represents a single shooting star.
 */
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

/**
 * Represents a single raindrop.
 */
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


/* --- 2. INITIALIZATION FUNCTIONS --- */
/* ----------------------------------- */

/**
 * Initializes the welcome screen typing animation.
 */
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

/**
 * Initializes the clock, greeting, and date display.
 */
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
}

/**
 * Initializes the calendar widget.
 */
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

/**
 * Initializes the theme toggle functionality with a creative transition.
 */
function initTheme() {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const toggleBtn = document.getElementById('theme-toggle');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
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

    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme ?? (prefersDarkScheme.matches ? 'dark' : 'light');
    setTheme(initialTheme);
    syncThemeToggle(initialTheme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (event) => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

            // Fallback for browsers that don't support View Transitions
            if (!document.startViewTransition) {
                setTheme(nextTheme);
                localStorage.setItem('theme', nextTheme);
                syncThemeToggle(nextTheme);
                return;
            }

            // Get click coordinates for the circular reveal animation
            const x = event.clientX;
            const y = event.clientY;
            const endRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );

            // Start the view transition
            const transition = document.startViewTransition(() => {
                setTheme(nextTheme);
                localStorage.setItem('theme', nextTheme);
                syncThemeToggle(nextTheme);
            });

            // Animate the new view
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

/**
 * Initializes all interactive visual effects.
 */
function initInteractiveEffects() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bg = document.querySelector('.background-gradient');
    const gridContainer = document.querySelector('.grid-container');
    const profileCard = document.querySelector('.profile-card');
    const avatarHalo = profileCard?.querySelector('.avatar-large');

    // Animation state variables
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

    // Main animation loop
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
        animationState.floatingElements.forEach(item => {
            const floatY = Math.sin(item.phase + now * item.speed) * item.amplitude;
            item.el.style.setProperty('--float-y', `${floatY.toFixed(2)}px`);
        });
        
        animationState.starfieldUpdate(animationState.currentX, animationState.currentY);
        animationState.shootingStarUpdate();
        animationState.raindropUpdate();
        requestAnimationFrame(tick);
    }

    // Mouse move listener for parallax and other effects
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

    // Card tilt, magnetic, and text scramble setup
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('.card').forEach((card, index) => {
            // Add floating animation properties to each card
            const floatItem = {
                el: card,
                phase: Math.random() * Math.PI * 2, // Random start phase for natural look
                amplitude: 2 + Math.random() * 2, // Slight variation in float height
                speed: 0.005 + Math.random() * 0.005, // Slight variation in float speed
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
                    card.addEventListener('mouseenter', () => fx.setText(originalText));
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

    // Initialize background effects
    animationState.starfieldUpdate = initStarfield();
    animationState.shootingStarUpdate = initShootingStars();
    animationState.raindropUpdate = initRaindrops();
    
    // Start the animation loop
    tick();
}

/**
 * Initializes and manages the multi-layered starfield background.
 * @returns {function} An update function to be called in the main animation loop.
 */
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
        
        starLayers.length = 0; // Clear existing layers

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

/**
 * Initializes and manages the shooting star effect.
 * @returns {function} An update function to be called in the main animation loop.
 */
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

/**
 * Initializes and manages the raindrop effect.
 * @returns {function} An update function to be called in the main animation loop.
 */
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


/* --- 3. MAIN APPLICATION --- */
/* --------------------------- */

/**
 * Main function to initialize the application.
 */
function main() {
    // Set stagger animation delay for cards
    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.setProperty('--stagger', String(index));
    });

    initWelcomeScreen();
    initClockAndGreeting();
    initCalendar();
    initTheme();
    initInteractiveEffects();
}

// Run the application
document.addEventListener('DOMContentLoaded', main);
