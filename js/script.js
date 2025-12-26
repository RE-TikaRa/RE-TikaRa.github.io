/**
 *
 *  Tika's Personal Homepage - Interactive Script
 *  Version: 2.2 (Re-introducing Shooting Stars)
 *  Tika 的个人主页 - 交互脚本
 *  版本: 2.2 (重新引入流星效果)
 *
 */

/**
 * 用于各种效果和设置的配置对象。
 * @const {object}
 */
let visualSettings = {}; // 全局视觉设置

/**
 * 用于各种效果和设置的配置对象。
 * @const {object}
 */
const CONFIG = {
    // 欢迎屏幕设置
    WELCOME_TEXT: "正在唤醒情绪体接口…", // 欢迎语文本
    WELCOME_TYPE_SPEED: 120, // 打字速度 (毫秒)
    WELCOME_FADE_DELAY: 1000, // 打字结束后淡出延迟 (毫秒)

    // 动画插值因子 (用于平滑动画)
    LERP_FACTOR_FAST: 0.1, // 快速插值
    LERP_FACTOR_NORMAL: 0.08, // 普通插值

    // 全局视差效果
    GLOBAL_TILT_STRENGTH: 8, // 全局倾斜强度 (度)

    // 背景视差效果
    PARALLAX_STRENGTH_X: -14, // X轴视差强度
    PARALLAX_STRENGTH_Y: -10, // Y轴视差强度

    // 卡片倾斜效果
    TILT_MAX_ANGLE: 3.2, // 最大倾斜角度 (度)

    // 卡片磁性吸附效果
    MAGNETIC_STRENGTH: 12, // 磁性强度，值越大吸力越强
    MAGNETIC_MAX_DIST: 150, // 磁性最大响应距离

    // 头像光环效果
    HALO_PROXIMITY_MAX_DIST: 400, // 鼠标接近头像触发光环效果的最大距离 (像素)

    // 星空背景效果
    STAR_COUNT_LAYER1: 300, // 第1层星星数量
    STAR_COUNT_LAYER2: 200, // 第2层星星数量
    STAR_COUNT_LAYER3: 100, // 第3层星星数量
    STAR_PARALLAX_FACTOR1: 0.1, // 第1层星星视差因子
    STAR_PARALLAX_FACTOR2: 0.3, // 第2层星星视差因子
    STAR_PARALLAX_FACTOR3: 0.6, // 第3层星星视差因子

    // 流星效果
    SHOOTING_STAR_COUNT: 3, // 流星数量
    SHOOTING_STAR_RESPAWN_DELAY: 2000, // 流星重生延迟 (毫秒)

    // 文字打乱效果所用的字符集
    SCRAMBLE_CHARS: 'ĀČĘĢĪĶĻŅŌŖŠŪŽdħĕįŏŧș⇋⇌⇟⇞⌆⌅⌄⍰⍞⍯⎈⎔⎚☍⚿⛶⛯⛮⛻⛼⛾⛿',

    // 雨滴效果
    RAINDROP_COUNT: 150, // 雨滴数量
};

// --- Mobile-specific overrides / 移动端专属配置覆盖 ---
if (window.matchMedia('(max-width: 960px)').matches) {
    CONFIG.RAINDROP_COUNT = 50; // 在移动端减少雨滴数量以提升性能
}


/* --- 1. EFFECT CLASSES / 效果类 --- */
/* ---------------------------------- */

/**
 * 在元素上创建文本打乱动画效果。
 */
class TextScramble {
    constructor(el) {
        this.el = el; // 目标元素
        this.chars = CONFIG.SCRAMBLE_CHARS; // 字符集
        this.update = this.update.bind(this); // 绑定 update 方法的 this 上下文
        this.isRunning = false; // 动画是否正在运行的标志
    }

    setText(newText) {
        if (this.isRunning) return Promise.resolve(); // 如果正在运行，则直接返回
        this.isRunning = true;

        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => (this.resolve = resolve));
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40); // 随机开始帧
            const end = start + Math.floor(Math.random() * 40); // 随机结束帧
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest); // 取消之前的动画帧
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
                output += to; // 动画结束，显示最终字符
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar(); // 随机选择一个字符
                    this.queue[i].char = char;
                }
                output += `<span class="dud">${char}</span>`; // 显示随机字符
            } else {
                output += from; // 动画开始前，显示原始字符
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve(); // 所有字符动画完成
            this.isRunning = false;
        } else {
            this.frameRequest = requestAnimationFrame(this.update); // 请求下一帧
            this.frame++;
        }
    }

    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

/**
 * 代表星空背景中的一颗星星。
 */
class Star {
    constructor(width, height) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.5; // 星星大小
        this.opacity = Math.random() * 0.5 + 0.2; // 星星透明度
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * 代表一颗流星。
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
        this.len = Math.random() * 80 + 10; // 流星长度
        this.speed = Math.random() * 10 + 6; // 流星速度
        this.size = Math.random() * 1 + 0.1; // 流星粗细
        this.waitTime = new Date().getTime() + Math.random() * CONFIG.SHOOTING_STAR_RESPAWN_DELAY; // 下次出现的时间
        this.active = false; // 是否可见
    }

    update() {
        if (this.active) {
            this.x -= this.speed;
            this.y += this.speed;
            if (this.x < 0 || this.y >= this.height) {
                this.reset(); // 飞出屏幕后重置
            }
        } else if (new Date().getTime() > this.waitTime) {
            this.active = true; // 等待时间结束后激活
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
 * 代表一个雨滴。
 */
class Raindrop {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.width;
        this.y = Math.random() * -this.height; // 从屏幕外开始
        this.speed = Math.random() * 6 + 2; // 雨滴速度
        this.length = Math.random() * 20 + 10; // 雨滴长度
        this.opacity = Math.random() * 0.3 + 0.2; // 雨滴透明度
    }

    update() {
        this.y += this.speed;
        if (this.y > this.height) {
            this.reset(); // 落出屏幕后重置
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


/* --- 2. INITIALIZATION FUNCTIONS / 初始化函数 --- */
/* ----------------------------------------------- */

/**
 * 初始化欢迎屏幕的打字动画。
 */
function initWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const welcomeTextEl = document.getElementById('welcome-text');
    if (!welcomeScreen || !welcomeTextEl) {
        document.body.classList.add('is-ready'); // 如果元素不存在，直接标记为准备就绪
        return;
    }

    let charIndex = 0;
    function typeChar() {
        if (charIndex < CONFIG.WELCOME_TEXT.length) {
            welcomeTextEl.textContent += CONFIG.WELCOME_TEXT.charAt(charIndex);
            charIndex++;
            setTimeout(typeChar, CONFIG.WELCOME_TYPE_SPEED);
        } else {
            // 打字结束后，延迟一段时间再隐藏欢迎屏幕
            setTimeout(() => {
                welcomeScreen.classList.add('hidden');
                document.body.classList.add('is-ready');
            }, CONFIG.WELCOME_FADE_DELAY);
        }
    }
    setTimeout(typeChar, 500); // 延迟开始打字
}

/**
 * 初始化时钟、问候语和日期显示。
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

        // 仅在小时变化时更新问候语，避免不必要的 DOM 操作
        if (greetingKey !== lastGreetingKey) {
            let greetingText = '你好';
            if (hours >= 5 && hours <= 8) greetingText = '早上好';
            else if (hours >= 9 && hours <= 11) greetingText = '上午好';
            else if (hours >= 12 && hours <= 13) greetingText = '中午好';
            else if (hours >= 14 && hours <= 17) greetingText = '下午好';
            else if (hours >= 18 && hours <= 22) greetingText = '晚上好';
            else greetingText = '夜深了';

            if (greetingEl && !reduceMotion) {
                // 使用字符动画更新问候语
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
            // 仅在日期变化时更新日期显示
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
        // 计算到下一秒开始的延迟，以实现精准更新
        const delay = 1000 - (Date.now() % 1000);
        clockTimer = window.setTimeout(scheduleClock, delay);
    }

    scheduleClock();
    // 当页面从后台切回前台时，重新同步时钟
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            if (clockTimer) window.clearTimeout(clockTimer);
            scheduleClock();
        }
    });
}

/**
 * 初始化日历小工具。
 */
function initCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarMonthEl = document.getElementById('calendar-month');
    if (!calendarGrid) return;

    calendarGrid.textContent = ''; // 清空日历
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    if (calendarMonthEl) {
        calendarMonthEl.textContent = `${year}年${month + 1}月`;
    }

    // 添加星期标题
    const shortWeekDays = ['一', '二', '三', '四', '五', '六', '日'];
    shortWeekDays.forEach((day, index) => {
        const el = document.createElement('div');
        el.className = 'calendar-day-name';
        if (index >= 5) el.classList.add('weekend'); // 标记周末
        el.textContent = day;
        calendarGrid.appendChild(el);
    });

    // 计算当月第一天是星期几，并填充空白
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    let startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // 周一为0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startOffset; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-day empty';
        calendarGrid.appendChild(el);
    }

    // 填充当月所有日期
    for (let i = 1; i <= daysInMonth; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = i;
        const dayOfWeek = new Date(year, month, i).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) el.classList.add('weekend');
        if (i === today) el.classList.add('current'); // 标记当天
        calendarGrid.appendChild(el);
    }
}

/**
 * 初始化主题切换功能，并使用 View Transitions API 实现创意过渡效果。
 */
function initTheme() {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const toggleBtn = document.getElementById('theme-toggle');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    // 同步切换按钮的图标和文本
    function syncThemeToggle(theme) {
        if (!toggleBtn) return;
        const iconEl = toggleBtn.querySelector('i');
        const textEl = toggleBtn.querySelector('.theme-toggle-text');
        const isDark = theme === 'dark';
        if (iconEl) iconEl.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        if (textEl) textEl.textContent = isDark ? '深色' : '浅色';
        toggleBtn.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
    }

    // 页面加载时，根据已设置的 data-theme 同步切换按钮状态
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    syncThemeToggle(initialTheme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (event) => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

            // 如果浏览器不支持 View Transitions API，则使用回退方案
            if (!document.startViewTransition) {
                setTheme(nextTheme);
                localStorage.setItem('theme', nextTheme);
                syncThemeToggle(nextTheme);
                return;
            }

            // 获取点击坐标，用于圆形揭示动画
            const x = event.clientX;
            const y = event.clientY;
            const endRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );

            // 开始视图过渡
            const transition = document.startViewTransition(() => {
                setTheme(nextTheme);
                localStorage.setItem('theme', nextTheme);
                syncThemeToggle(nextTheme);
            });

            // 仅在桌面端应用耗性能的圆形揭示动画
            if (window.matchMedia('(min-width: 961px)').matches) {
                // 为新视图添加动画
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
                            pseudoElement: '::view-transition-new(root)', // 动画作用于新视图的根伪元素
                        }
                    );
                });
            }
        });
    }

    // 监听系统颜色方案变化
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) { // 仅当用户未手动设置主题时才跟随系统
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
 * 初始化所有交互式视觉效果。
 */
function initInteractiveEffects() {
    // 如果用户偏好减少动画，则不初始化效果
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bg = document.querySelector('.background-gradient');
    const gridContainer = document.querySelector('.grid-container');
    const profileCard = document.querySelector('.profile-card');
    const avatarHalo = profileCard?.querySelector('.avatar-large');

    // 动画状态变量
    const animationState = {
        targetX: 0, currentX: 0, // 视差 X 轴目标值和当前值
        targetY: 0, currentY: 0, // 视差 Y 轴目标值和当前值
        targetSpotX: 50, currentSpotX: 50, // 鼠标光斑 X 轴
        targetSpotY: 28, currentSpotY: 28, // 鼠标光斑 Y 轴
        targetSpotA: 0.1, currentSpotA: 0.1, // 鼠标光斑透明度
        targetHaloScale: 1, currentHaloScale: 1, // 头像光环缩放
        targetHaloOpacity: 0.72, currentHaloOpacity: 0.72, // 头像光环透明度
        targetGlobalTiltX: 0, currentGlobalTiltX: 0, // 全局倾斜 X 轴
        targetGlobalTiltY: 0, currentGlobalTiltY: 0, // 全局倾斜 Y 轴
        magneticElements: [], // 存储所有需要磁性效果的元素
        floatingElements: [], // 存储所有需要浮动效果的元素
        starfieldUpdate: () => {}, // 星空更新函数
        shootingStarUpdate: () => {}, // 流星更新函数
        raindropUpdate: () => {}, // 雨滴更新函数
    };

    // 主动画循环
    function tick() {
        const { LERP_FACTOR_NORMAL, LERP_FACTOR_FAST } = CONFIG;
        // 使用线性插值 (Lerp) 实现平滑动画
        animationState.currentX += (animationState.targetX - animationState.currentX) * LERP_FACTOR_NORMAL;
        animationState.currentY += (animationState.targetY - animationState.currentY) * LERP_FACTOR_NORMAL;
        animationState.currentSpotX += (animationState.targetSpotX - animationState.currentSpotX) * LERP_FACTOR_NORMAL;
        animationState.currentSpotY += (animationState.targetSpotY - animationState.currentSpotY) * LERP_FACTOR_NORMAL;
        animationState.currentSpotA += (animationState.targetSpotA - animationState.currentSpotA) * LERP_FACTOR_FAST;
        animationState.currentHaloScale += (animationState.targetHaloScale - animationState.currentHaloScale) * LERP_FACTOR_FAST;
        animationState.currentHaloOpacity += (animationState.targetHaloOpacity - animationState.currentHaloOpacity) * LERP_FACTOR_FAST;
        animationState.currentGlobalTiltX += (animationState.targetGlobalTiltX - animationState.currentGlobalTiltX) * LERP_FACTOR_NORMAL;
        animationState.currentGlobalTiltY += (animationState.targetGlobalTiltY - animationState.currentGlobalTiltY) * LERP_FACTOR_NORMAL;

        // 更新 DOM 元素的样式
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

        // 更新磁性元素的位移
        animationState.magneticElements.forEach(item => {
            item.currentX += (item.targetX - item.currentX) * LERP_FACTOR_FAST;
            item.currentY += (item.targetY - item.currentY) * LERP_FACTOR_FAST;
            item.el.style.setProperty('--magnetic-x', `${item.currentX.toFixed(2)}px`);
            item.el.style.setProperty('--magnetic-y', `${item.currentY.toFixed(2)}px`);
        });

        // 根据设置更新浮动元素的位移
        const now = performance.now();
        if (visualSettings.cardFloat) {
            animationState.floatingElements.forEach(item => {
                const floatY = Math.sin(item.phase + now * item.speed) * item.amplitude;
                item.el.style.setProperty('--float-y', `${floatY.toFixed(2)}px`);
            });
        } else {
            // 如果禁用了浮动，则将所有卡片的浮动效果重置为0
            animationState.floatingElements.forEach(item => {
                if (item.el.style.getPropertyValue('--float-y') !== '0px') {
                    item.el.style.setProperty('--float-y', '0px');
                }
            });
        }
        
        // 更新背景效果
        animationState.starfieldUpdate(animationState.currentX, animationState.currentY);
        animationState.shootingStarUpdate();
        animationState.raindropUpdate();
        requestAnimationFrame(tick); // 请求下一帧
    }

    // 鼠标移出窗口时重置动画目标值
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

    // 监听鼠标移动事件
    window.addEventListener('mousemove', (e) => {
        const { clientX: mouseX, clientY: mouseY } = e;
        const { innerWidth, innerHeight } = window;
        const dx = mouseX / innerWidth - 0.5; // 鼠标 X 坐标归一化到 [-0.5, 0.5]
        const dy = mouseY / innerHeight - 0.5; // 鼠标 Y 坐标归一化到 [-0.5, 0.5]

        // 更新视差和全局倾斜的目标值
        animationState.targetX = dx * CONFIG.PARALLAX_STRENGTH_X;
        animationState.targetY = dy * CONFIG.PARALLAX_STRENGTH_Y;
        animationState.targetGlobalTiltX = -dy * CONFIG.GLOBAL_TILT_STRENGTH;
        animationState.targetGlobalTiltY = dx * CONFIG.GLOBAL_TILT_STRENGTH;

        // 更新鼠标光斑的目标值
        animationState.targetSpotX = (mouseX / innerWidth) * 100;
        animationState.targetSpotY = (mouseY / innerHeight) * 100;
        animationState.targetSpotA = 0.18;

        // 更新头像光环的目标值
        if (profileCard) {
            const rect = profileCard.getBoundingClientRect();
            const dist = Math.hypot(mouseX - (rect.left + rect.width / 2), mouseY - (rect.top + rect.height / 2));
            const proximity = Math.max(0, 1 - dist / CONFIG.HALO_PROXIMITY_MAX_DIST);
            animationState.targetHaloScale = 1 + proximity * 0.05;
            animationState.targetHaloOpacity = 0.72 + proximity * 0.28;
        }

        // 更新磁性元素的目标值
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

    // 为卡片设置倾斜、磁性和文字打乱效果
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) { // 仅在支持悬停的设备上启用
        document.querySelectorAll('.card').forEach((card, index) => {
            // 为每个卡片添加浮动动画属性，无论设置如何，都先填充数组
            const floatItem = {
                el: card,
                phase: Math.random() * Math.PI * 2, // 随机初始相位，使浮动看起来更自然
                amplitude: 2 + Math.random() * 2, // 浮动振幅
                speed: 0.005 + Math.random() * 0.005, // 浮动速度
            };
            animationState.floatingElements.push(floatItem);

            // 为链接卡片添加磁性效果
            if (card.classList.contains('link-card')) {
                animationState.magneticElements.push({
                    el: card,
                    targetX: 0, currentX: 0,
                    targetY: 0, currentY: 0,
                    strength: CONFIG.MAGNETIC_STRENGTH,
                    maxDist: CONFIG.MAGNETIC_MAX_DIST,
                });

                // 为链接卡片添加文字打乱效果
                const textEl = card.querySelector('.link-text');
                if (textEl) {
                    const fx = new TextScramble(textEl);
                    const originalText = textEl.textContent;
                    card.addEventListener('mouseenter', () => fx.setText(originalText));
                }
            }

            // 监听卡片上的鼠标移动以实现倾斜效果
            card.addEventListener('pointermove', (e) => {
                const rect = card.getBoundingClientRect();
                const px = (e.clientX - rect.left) / rect.width - 0.5;
                const py = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.setProperty('--tilt-y', `${px * CONFIG.TILT_MAX_ANGLE}deg`);
                card.style.setProperty('--tilt-x', `${-py * CONFIG.TILT_MAX_ANGLE}deg`);
                card.style.setProperty('--mx', `${Math.round((px + 0.5) * 100)}%`);
                card.style.setProperty('--my', `${Math.round((py + 0.5) * 100)}%`);
            });

            // 鼠标离开卡片时重置倾斜
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
                card.style.setProperty('--mx', '50%');
                card.style.setProperty('--my', '15%');
            });
        });
    }

    // 初始化背景效果
    animationState.starfieldUpdate = initStarfield();
    animationState.shootingStarUpdate = initShootingStars();
    animationState.raindropUpdate = initRaindrops();
    
    // 启动动画循环
    tick();
}

/**
 * 初始化并管理多层星空背景。
 * @returns {function} 一个在主循环中调用的更新函数。
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
        dpr = window.devicePixelRatio || 1; // 获取设备像素比
        width = window.innerWidth;
        height = window.innerHeight;
        
        starLayers.length = 0; // 清空现有图层

        layers.forEach(layerConfig => {
            if (!layerConfig.canvas) return;
            const canvas = layerConfig.canvas;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            const ctx = canvas.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 根据 dpr 缩放画布，以适应高分屏

            const stars = Array.from({ length: layerConfig.count }, () => new Star(width, height));
            starLayers.push({ ctx, stars, factor: layerConfig.factor });
        });
    }

    resize();
    window.addEventListener('resize', resize); // 监听窗口大小变化

    return function updateStarfield(parallaxX, parallaxY) {
        starLayers.forEach(({ ctx, stars, factor }) => {
            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(parallaxX * factor, parallaxY * factor); // 根据视差因子移动图层
            stars.forEach(star => star.draw(ctx));
            ctx.restore();
        });
    };
}

/**
 * 初始化并管理流星效果。
 * @returns {function} 一个在主循环中调用的更新函数。
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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
 * 初始化并管理雨滴效果。
 * @returns {function} 一个在主循环中调用的更新函数。
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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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


/* --- 3. SETTINGS PANEL LOGIC / 设置面板逻辑 --- */
/* --------------------------------------------- */

/**
 * 初始化交互式设置面板。
 */
function initSettingsPanel() {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsClose = document.getElementById('settings-close');
    const toggles = document.querySelectorAll('.toggle-switch');

    if (!settingsPanel || !settingsToggle || !settingsClose) {
        return;
    }

    const defaultSettings = {
        starfield: true,
        shootingStars: true,
        raindrops: true,
        cardFloat: true,
    };

    let savedSettings = {};
    try {
        const rawSettings = localStorage.getItem('visualSettings');
        if (rawSettings) savedSettings = JSON.parse(rawSettings);
    } catch {}
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
    }

    toggles.forEach(toggle => {
        const key = toggle.dataset.setting;
        if (key in visualSettings) {
            toggle.checked = visualSettings[key];
            if (effectElements[key]) {
                effectElements[key].forEach(el => {
                    if (el) el.hidden = !visualSettings[key];
                });
            }
        }
        toggle.addEventListener('change', (e) => applySetting(key, e.target.checked));
    });

    settingsToggle.addEventListener('click', () => settingsPanel.hidden = false);
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


/* --- 4. CLI EASTER EGG / CLI 彩蛋 --- */
/* ------------------------------------ */

/**
 * 初始化命令行界面 (CLI) 彩蛋。
 */
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

    let commandHistory = [];
    let historyIndex = -1;

    const commands = {
        help: () => {
            return `<pre>
             █████╗ ██╗     ██████╗     ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗ 
            ██╔══██╗██║     ██╔══██╗    ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
            ███████║██║     ██████╔╝    ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
            ██╔══██║██║     ██╔═══╝     ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
            ██║  ██║███████╗██║         ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
            ╚═╝  ╚═╝╚══════╝╚═╝         ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝

可用命令:
  <span class="cli-command">help</span>      - 显示此帮助信息
  <span class="cli-command">clear</span>     - 清空终端屏幕
  <span class="cli-command">theme</span>     - 切换亮/暗主题
  <span class="cli-command">info</span>      - 显示系统和版本信息
  <span class="cli-command">date</span>      - 显示当前时间
  <span class="cli-command">fortune</span>   - 随机输出一言
  <span class="cli-command">say</span>       - 说点什么
  <span class="cli-command">exit</span>      - 关闭 CLI 窗口</pre>`;
        },
        clear: () => {
            cliOutput.innerHTML = '';
            return '';
        },
        theme: () => {
            document.getElementById('theme-toggle')?.click();
            const currentTheme = document.documentElement.getAttribute('data-theme');
            return `主题已切换为 ${currentTheme === 'dark' ? '深色' : '浅色'} 模式。`;
        },
        info: () => {
            return `<pre>
             █████╗ ██╗     ██████╗     ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗ 
            ██╔══██╗██║     ██╔══██╗    ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
            ███████║██║     ██████╔╝    ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
            ██╔══██║██║     ██╔═══╝     ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
            ██║  ██║███████╗██║         ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
            ╚═╝  ╚═╝╚══════╝╚═╝         ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝
            
    <span class="cli-user">tika</span>@<span class="cli-host">lab</span>
    --------------------
    <span class="cli-title">操作系统</span>:   TikaOS 情绪体接口
    <span class="cli-title">主机</span>:       个人主页 v2.2
    <span class="cli-title">内核</span>:       5.4.0-TikaRa
    <span class="cli-title">运行时间</span>:   42 天, 6 小时, 9 分钟
    <span class="cli-title">主题</span>:       ${document.documentElement.getAttribute('data-theme') === 'dark' ? '深色' : '浅色'}

</pre>`;
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
        if (show === undefined) show = !isVisible; // 如果未指定，则切换状态

        if (show) {
            cliContainer.hidden = false;
            cliInput.focus();
            if (cliOutput.innerHTML === '') { // 仅在首次打开时显示欢迎信息
                executeCommand('info');
            }
        } else {
            cliContainer.hidden = true;
            cliInput.blur();
        }
    }

    function printToCLI(text) {
        cliOutput.innerHTML += `<div>${text}</div>`;
        // 使用 setTimeout 确保 DOM 更新后再滚动
        setTimeout(() => {
            cliContainer.scrollTop = cliContainer.scrollHeight;
        }, 0);
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
                        if (text) printToCLI(text);
                    })
                    .catch(() => printToCLI('抱歉，该实验体权限不足'));
            } else if (result) {
                printToCLI(result);
            }
        } else {
            printToCLI('抱歉，该实验体权限不足');
        }
    }

    // --- Event Listeners ---
    cliContainer.addEventListener('click', () => {
        // 点击终端任何地方都聚焦输入框，除非正在选择文本
        const selection = window.getSelection();
        if (selection.type !== 'Range') {
          cliInput.focus();
        }
    });

    document.addEventListener('keydown', (e) => {
        // 使用 `~` 键或反引号键来切换 CLI
        if (e.key === '`' || e.key === '~') {
            e.preventDefault();
            toggleCLI();
        }
        // 使用 ESC 键关闭 CLI
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


/* --- 5. MAIN APPLICATION / 主应用 --- */
/* ------------------------------------ */

/**
 * 主函数，用于初始化整个应用。
 */
function main() {
    // 为卡片设置交错动画延迟
    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.setProperty('--stagger', String(index));
    });

    initWelcomeScreen();
    initClockAndGreeting();
    initCalendar();
    initTheme();
    initSettingsPanel(); // 初始化设置面板
    initCLI(); // 初始化 CLI 彩蛋

    // 仅在桌面端（宽度 > 960px）初始化耗费性能的交互式效果
    if (window.matchMedia('(min-width: 961px)').matches) {
        initInteractiveEffects();
    }
}

// 运行应用
document.addEventListener('DOMContentLoaded', main);
