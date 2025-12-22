document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        const welcomeTextEl = document.getElementById('welcome-text');
        if (!welcomeScreen || !welcomeTextEl) {
            document.body.classList.add('is-ready');
            return;
        }

        const textToType = "正在唤醒生命体接口…";
        let charIndex = 0;

        function typeChar() {
            if (charIndex < textToType.length) {
                welcomeTextEl.textContent += textToType.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, 120);
            } else {
                // Finished typing
                setTimeout(() => {
                    welcomeScreen.classList.add('hidden');
                    document.body.classList.add('is-ready');
                }, 1000); // Wait 1s before fading out
            }
        }

        // Start typing after a short delay
        setTimeout(typeChar, 500);
    }

    initWelcomeScreen();

    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.setProperty('--stagger', String(index));
    });

    const hourEl = document.getElementById('hour');
    const minuteEl = document.getElementById('minute');
    const secondEl = document.getElementById('second');
    const greetingEl = document.getElementById('greeting');
    const todayEl = document.getElementById('today');

    let clockTimer = null;
    let lastGreetingKey = '';
    let lastDateKey = '';
    const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });

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
                greetingEl.innerHTML = ''; // Clear previous
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
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        if (hourEl) hourEl.textContent = hours;
        if (minuteEl) minuteEl.textContent = minutes;
        if (secondEl) secondEl.textContent = seconds;
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

    function initCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        const calendarMonthEl = document.getElementById('calendar-month');
        
        if(!calendarGrid) return;
        calendarGrid.textContent = '';

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11
        const today = now.getDate();

        if (calendarMonthEl) {
            calendarMonthEl.textContent = `${year}年${month + 1}月`;
        }
        
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
        const profileCard = document.querySelector('.profile-card');
        const avatarHalo = profileCard?.querySelector('.avatar-large');

        // Animation state variables
        let targetX = 0, currentX = 0;
        let targetY = 0, currentY = 0;
        let targetSpotX = 50, currentSpotX = 50;
        let targetSpotY = 28, currentSpotY = 28;
        let targetSpotA = 0.1, currentSpotA = 0.1;
        let targetHaloScale = 1, currentHaloScale = 1;
        let targetHaloOpacity = 0.72, currentHaloOpacity = 0.72;

        // Raindrop effect state
        let raindropUpdateFn = () => {};
        let createRippleFn = () => {};

        // Single animation loop
        function tick() {
            // Interpolate all values
            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;
            currentSpotX += (targetSpotX - currentSpotX) * 0.08;
            currentSpotY += (targetSpotY - currentSpotY) * 0.08;
            currentSpotA += (targetSpotA - currentSpotA) * 0.1;
            currentHaloScale += (targetHaloScale - currentHaloScale) * 0.1;
            currentHaloOpacity += (targetHaloOpacity - currentHaloOpacity) * 0.1;

            // Apply styles
            if (bg) {
                bg.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1.06)`;
                bg.style.setProperty('--spot-x', `${currentSpotX.toFixed(2)}%`);
                bg.style.setProperty('--spot-y', `${currentSpotY.toFixed(2)}%`);
                bg.style.setProperty('--spot-a', currentSpotA.toFixed(3));
            }
            if (avatarHalo) {
                avatarHalo.style.setProperty('--halo-scale', currentHaloScale.toFixed(3));
                avatarHalo.style.setProperty('--halo-opacity', currentHaloOpacity.toFixed(3));
            }
            
            // Update canvas effects
            raindropUpdateFn();

            requestAnimationFrame(tick);
        }
        tick();

        // Single mouse move listener
        const resetAnimationTargets = () => {
            targetX = 0;
            targetY = 0;
            targetSpotX = 50;
            targetSpotY = 28;
            targetSpotA = 0.1;
            targetHaloScale = 1;
            targetHaloOpacity = 0.72;
        };

        window.addEventListener('mousemove', (e) => {
            const dx = e.clientX / window.innerWidth - 0.5;
            const dy = e.clientY / window.innerHeight - 0.5;
            targetX = dx * -14;
            targetY = dy * -10;

            targetSpotX = (e.clientX / window.innerWidth) * 100;
            targetSpotY = (e.clientY / window.innerHeight) * 100;
            targetSpotA = 0.18;

            if (profileCard) {
                const rect = profileCard.getBoundingClientRect();
                const dist = Math.hypot(
                    e.clientX - (rect.left + rect.width / 2),
                    e.clientY - (rect.top + rect.height / 2)
                );
                const maxDist = 400;
                const proximity = Math.max(0, 1 - dist / maxDist);
                targetHaloScale = 1 + proximity * 0.05;
                targetHaloOpacity = 0.72 + proximity * 0.28;
            }

            createRippleFn(e.clientX, e.clientY);
        });
        window.addEventListener('blur', resetAnimationTargets);
        document.addEventListener('mouseleave', resetAnimationTargets);

        // Card tilt effect
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

        // Raindrop & Stardust effect
        function initRaindrops() {
            const canvas = document.getElementById('raindrop-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            let width, height, dpr;
            let raindrops = [];
            let ripples = [];
            let shootingStars = [];

            const RAINDROP_COUNT = 100;
            const SHOOTING_STAR_CHANCE = 0.0015;

            function resize() {
                dpr = window.devicePixelRatio || 1;
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);
            }

            class Raindrop {
                constructor() {
                    this.reset();
                }
                reset() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * -height;
                    this.z = Math.random() * 0.5 + 0.5; // Depth
                    this.len = Math.random() * 15 + 10;
                    this.speed = Math.random() * 8 + 4;
                    this.opacity = Math.random() * 0.4 + 0.2;
                }
                update() {
                    this.y += this.speed;
                    if (this.y > height) {
                        this.reset();
                    }
                }
                draw() {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x, this.y + this.len * this.z);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
                    ctx.lineWidth = 1 * this.z;
                    ctx.stroke();
                }
            }

            class Ripple {
                constructor(x, y) {
                    this.x = x;
                    this.y = y;
                    this.radius = 1;
                    this.maxRadius = Math.random() * 40 + 30;
                    this.speed = Math.random() * 0.3 + 0.2;
                    this.opacity = 0.5;
                    this.fadeSpeed = this.speed / this.maxRadius;
                }
                update() {
                    this.radius += this.speed;
                    this.opacity -= this.fadeSpeed;
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            class ShootingStar {
                constructor() {
                    this.reset();
                }
                reset() {
                    this.x = Math.random() * width * 1.5 - width * 0.25;
                    this.y = Math.random() * height * 0.2;
                    this.len = Math.random() * 80 + 40;
                    this.speed = Math.random() * 8 + 6;
                    this.angle = -Math.PI / 6;
                    this.opacity = 1;
                    this.life = 1;
                }
                update() {
                    this.x += this.speed * Math.cos(this.angle);
                    this.y += this.speed * Math.sin(this.angle);
                    this.life -= 0.01;
                    if (this.life <= 0) {
                        this.reset();
                    }
                }
                draw() {
                    const gradient = ctx.createLinearGradient(
                        this.x, this.y,
                        this.x + this.len * Math.cos(this.angle),
                        this.y + this.len * Math.sin(this.angle)
                    );
                    const color = document.documentElement.getAttribute('data-theme') === 'dark' ? '243, 156, 18' : '230, 126, 34';
                    gradient.addColorStop(0, `rgba(${color}, ${this.life * 0.8})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(
                        this.x + this.len * Math.cos(this.angle),
                        this.y + this.len * Math.sin(this.angle)
                    );
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }

            function setup() {
                resize();
                raindrops = Array.from({ length: RAINDROP_COUNT }, () => new Raindrop());
                shootingStars.push(new ShootingStar());
            }

            raindropUpdateFn = function() {
                ctx.clearRect(0, 0, width, height);

                // Update and draw raindrops
                raindrops.forEach(drop => {
                    drop.update();
                    drop.draw();
                });

                // Update and draw ripples
                ripples = ripples.filter(ripple => ripple.opacity > 0);
                ripples.forEach(ripple => {
                    ripple.update();
                    ripple.draw();
                });

                // Update and draw shooting stars
                if (Math.random() < SHOOTING_STAR_CHANCE && shootingStars.length < 3) {
                    shootingStars.push(new ShootingStar());
                }
                shootingStars = shootingStars.filter(star => star.life > 0);
                shootingStars.forEach(star => {
                    star.update();
                    star.draw();
                });
            };

            createRippleFn = function(x, y) {
                if (ripples.length < 10) { // Limit ripples for performance
                    ripples.push(new Ripple(x, y));
                }
            };

            setup();
            window.addEventListener('resize', resize);
        }

        // Constellation effect
        function initConstellation() {
            const svg = document.getElementById('constellation-svg');
            const links = Array.from(document.querySelectorAll('.link-card'));
            if (!svg || links.length < 2) return;

            let lines = [];

            function getCenter(el) {
                const rect = el.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                };
            }

            function draw() {
                svg.innerHTML = '';
                lines = [];
                const points = links.map(getCenter);

                for (let i = 0; i < points.length; i++) {
                    for (let j = i + 1; j < points.length; j++) {
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', points[i].x);
                        line.setAttribute('y1', points[i].y);
                        line.setAttribute('x2', points[j].x);
                        line.setAttribute('y2', points[j].y);
                        line.dataset.from = i;
                        line.dataset.to = j;
                        svg.appendChild(line);
                        lines.push(line);
                    }
                }
            }

            links.forEach((link, index) => {
                link.addEventListener('mouseenter', () => {
                    lines.forEach(line => {
                        if (line.dataset.from == index || line.dataset.to == index) {
                            line.classList.add('is-active');
                        }
                    });
                });
                link.addEventListener('mouseleave', () => {
                    lines.forEach(line => line.classList.remove('is-active'));
                });
            });

            draw();
            const observer = new ResizeObserver(draw);
            observer.observe(document.body);
        }
        
        initRaindrops();
        initConstellation();
    }
});
