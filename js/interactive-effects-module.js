(function () {
    class TextScramble {
        constructor(el, chars) {
            this.el = el;
            this.chars = chars;
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
        constructor(width, height, config) {
            this.width = width;
            this.height = height;
            this.config = config;
            this.reset();
        }
        reset() {
            this.x = Math.random() * this.width;
            this.y = 0;
            this.len = Math.random() * 80 + 10;
            this.speed = Math.random() * 10 + 6;
            this.size = Math.random() * 1 + 0.1;
            this.waitTime = new Date().getTime() + Math.random() * this.config.SHOOTING_STAR_RESPAWN_DELAY;
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

    function initStarfield(config) {
        const layers = [
            { canvas: document.getElementById('starfield-layer1'), count: config.STAR_COUNT_LAYER1, factor: config.STAR_PARALLAX_FACTOR1 },
            { canvas: document.getElementById('starfield-layer2'), count: config.STAR_COUNT_LAYER2, factor: config.STAR_PARALLAX_FACTOR2 },
            { canvas: document.getElementById('starfield-layer3'), count: config.STAR_COUNT_LAYER3, factor: config.STAR_PARALLAX_FACTOR3 },
        ];
        let width;
        let height;
        let dpr;
        const starLayers = [];

        function resize() {
            dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            starLayers.length = 0;
            layers.forEach((layerConfig) => {
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
                stars.forEach((star) => star.draw(ctx));
                ctx.restore();
            });
        };
    }

    function initShootingStars(config) {
        const canvas = document.getElementById('shooting-star-canvas');
        if (!canvas) return () => {};
        let width;
        let height;
        let dpr;
        let shootingStars = [];
        const ctx = canvas.getContext('2d');

        function resize() {
            dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            shootingStars = Array.from({ length: config.SHOOTING_STAR_COUNT }, () => new ShootingStar(width, height, config));
        }
        resize();
        window.addEventListener('resize', resize);

        return function updateShootingStars() {
            ctx.clearRect(0, 0, width, height);
            shootingStars.forEach((star) => {
                star.update();
                star.draw(ctx);
            });
        };
    }

    function initRaindrops(config) {
        const canvas = document.getElementById('raindrop-canvas');
        if (!canvas) return () => {};
        let width;
        let height;
        let dpr;
        let raindrops = [];
        const ctx = canvas.getContext('2d');

        function resize() {
            dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            raindrops = Array.from({ length: config.RAINDROP_COUNT }, () => new Raindrop(width, height));
        }
        resize();
        window.addEventListener('resize', resize);

        return function updateRaindrops() {
            ctx.clearRect(0, 0, width, height);
            raindrops.forEach((drop) => {
                drop.update();
                drop.draw(ctx);
            });
        };
    }

    function initInteractiveEffects(options = {}) {
        const { config, getVisualSettings } = options;
        if (!config || typeof getVisualSettings !== 'function') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const bg = document.querySelector('.background-gradient');
        const gridContainer = document.querySelector('.main-panel');
        const profileCard = document.querySelector('.profile-card');
        const avatarHalo = profileCard?.querySelector('.avatar-large');
        const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const auraLayer = hasFinePointer ? document.createElement('div') : null;
        const spawnCursorRipple = (x, y) => {
            if (!auraLayer) return;
            const ripple = document.createElement('span');
            ripple.className = 'cursor-ripple';
            ripple.style.setProperty('--ripple-x', `${x}px`);
            ripple.style.setProperty('--ripple-y', `${y}px`);
            auraLayer.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
        };
        if (auraLayer) {
            auraLayer.className = 'cursor-aura-layer';
            auraLayer.innerHTML = '<span class="cursor-aura cursor-aura--outer"></span><span class="cursor-aura cursor-aura--inner"></span>';
            document.body.appendChild(auraLayer);
        }
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
            lastMouseX: window.innerWidth / 2,
            lastMouseY: window.innerHeight / 2,
            targetCursorX: window.innerWidth / 2,
            currentCursorX: window.innerWidth / 2,
            targetCursorY: window.innerHeight / 2,
            currentCursorY: window.innerHeight / 2,
            targetCursorScale: 1,
            currentCursorScale: 1,
            targetCursorOpacity: config.CURSOR_AURA_BASE_OPACITY,
            currentCursorOpacity: config.CURSOR_AURA_BASE_OPACITY,
            magneticElements: [],
            floatingElements: [],
            starfieldUpdate: () => {},
            shootingStarUpdate: () => {},
            raindropUpdate: () => {},
        };
        let animationFrameId = null;
        let loopRunning = false;

        function stopTickLoop() {
            loopRunning = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        function requestNextTick() {
            if (!loopRunning) return;
            animationFrameId = requestAnimationFrame(tick);
        }

        function startTickLoop() {
            if (loopRunning) return;
            loopRunning = true;
            requestNextTick();
        }

        function tick() {
            if (!loopRunning) return;
            const { LERP_FACTOR_NORMAL, LERP_FACTOR_FAST } = config;
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

            const settings = getVisualSettings() || {};
            const liteModeEnabled = settings.liteMode || document.documentElement.getAttribute('data-lite') === 'true';
            if (auraLayer) {
                animationState.currentCursorX += (animationState.targetCursorX - animationState.currentCursorX) * LERP_FACTOR_FAST;
                animationState.currentCursorY += (animationState.targetCursorY - animationState.currentCursorY) * LERP_FACTOR_FAST;
                animationState.currentCursorScale += (animationState.targetCursorScale - animationState.currentCursorScale) * LERP_FACTOR_FAST;
                animationState.currentCursorOpacity += (animationState.targetCursorOpacity - animationState.currentCursorOpacity) * LERP_FACTOR_FAST;
                auraLayer.classList.toggle('is-hidden', liteModeEnabled);
                if (!liteModeEnabled) {
                    auraLayer.style.setProperty('--cursor-x', `${animationState.currentCursorX.toFixed(2)}px`);
                    auraLayer.style.setProperty('--cursor-y', `${animationState.currentCursorY.toFixed(2)}px`);
                    auraLayer.style.setProperty('--cursor-scale', animationState.currentCursorScale.toFixed(3));
                    auraLayer.style.setProperty('--cursor-opacity', animationState.currentCursorOpacity.toFixed(3));
                }
            }

            animationState.magneticElements.forEach((item) => {
                item.currentX += (item.targetX - item.currentX) * LERP_FACTOR_FAST;
                item.currentY += (item.targetY - item.currentY) * LERP_FACTOR_FAST;
                item.el.style.setProperty('--magnetic-x', `${item.currentX.toFixed(2)}px`);
                item.el.style.setProperty('--magnetic-y', `${item.currentY.toFixed(2)}px`);
            });

            const now = performance.now();
            if (settings.cardFloat) {
                animationState.floatingElements.forEach((item) => {
                    const floatY = Math.sin(item.phase + now * item.speed) * item.amplitude;
                    item.el.style.setProperty('--float-y', `${floatY.toFixed(2)}px`);
                });
            } else {
                animationState.floatingElements.forEach((item) => {
                    if (item.el.style.getPropertyValue('--float-y') !== '0px') {
                        item.el.style.setProperty('--float-y', '0px');
                    }
                });
            }
            if (!liteModeEnabled && settings.starfield) {
                animationState.starfieldUpdate(animationState.currentX, animationState.currentY);
            }
            if (!liteModeEnabled && settings.shootingStars) {
                animationState.shootingStarUpdate();
            }
            if (!liteModeEnabled && settings.raindrops) {
                animationState.raindropUpdate();
            }
            requestNextTick();
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
            animationState.targetCursorScale = 1;
            animationState.targetCursorOpacity = config.CURSOR_AURA_BASE_OPACITY;
        };

        window.addEventListener('mousemove', (e) => {
            const { clientX: mouseX, clientY: mouseY } = e;
            const { innerWidth, innerHeight } = window;
            const dx = mouseX / innerWidth - 0.5;
            const dy = mouseY / innerHeight - 0.5;

            animationState.targetX = dx * config.PARALLAX_STRENGTH_X;
            animationState.targetY = dy * config.PARALLAX_STRENGTH_Y;
            animationState.targetGlobalTiltX = -dy * config.GLOBAL_TILT_STRENGTH;
            animationState.targetGlobalTiltY = dx * config.GLOBAL_TILT_STRENGTH;
            animationState.targetSpotX = (mouseX / innerWidth) * 100;
            animationState.targetSpotY = (mouseY / innerHeight) * 100;
            animationState.targetSpotA = 0.18;
            animationState.targetCursorX = mouseX;
            animationState.targetCursorY = mouseY;

            if (profileCard) {
                const rect = profileCard.getBoundingClientRect();
                const dist = Math.hypot(mouseX - (rect.left + rect.width / 2), mouseY - (rect.top + rect.height / 2));
                const proximity = Math.max(0, 1 - dist / config.HALO_PROXIMITY_MAX_DIST);
                animationState.targetHaloScale = 1 + proximity * 0.05;
                animationState.targetHaloOpacity = 0.72 + proximity * 0.28;
            }
            const speed = Math.hypot(mouseX - animationState.lastMouseX, mouseY - animationState.lastMouseY);
            const speedFactor = Math.min(1, speed / 34);
            animationState.targetCursorScale = 1 + speedFactor * config.CURSOR_AURA_SCALE_RANGE;
            animationState.targetCursorOpacity = config.CURSOR_AURA_BASE_OPACITY + speedFactor * (config.CURSOR_AURA_MAX_OPACITY - config.CURSOR_AURA_BASE_OPACITY);
            animationState.lastMouseX = mouseX;
            animationState.lastMouseY = mouseY;

            animationState.magneticElements.forEach((item) => {
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
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopTickLoop();
                return;
            }
            startTickLoop();
        });
        window.addEventListener('pointerdown', (event) => {
            if (!auraLayer || event.pointerType !== 'mouse') return;
            const settings = getVisualSettings() || {};
            if (settings.liteMode || document.documentElement.getAttribute('data-lite') === 'true') return;
            spawnCursorRipple(event.clientX, event.clientY);
        });

        if (hasFinePointer) {
            document.querySelectorAll('.card.tilt-card').forEach((card) => {
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
                        strength: config.MAGNETIC_STRENGTH,
                        maxDist: config.MAGNETIC_MAX_DIST,
                    });

                    const textEl = card.querySelector('.link-text');
                    if (textEl) {
                        const fx = new TextScramble(textEl, config.SCRAMBLE_CHARS);
                        const originalText = textEl.textContent;
                        card.addEventListener('mouseenter', () => {
                            const textWidth = textEl.getBoundingClientRect().width;
                            textEl.style.setProperty('--scramble-width', `${textWidth}px`);
                            textEl.classList.add('is-scrambling');
                            fx.setText(originalText).then(() => {
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
                    card.style.setProperty('--tilt-y', `${px * config.TILT_MAX_ANGLE}deg`);
                    card.style.setProperty('--tilt-x', `${-py * config.TILT_MAX_ANGLE}deg`);
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

        animationState.starfieldUpdate = initStarfield(config);
        animationState.shootingStarUpdate = initShootingStars(config);
        animationState.raindropUpdate = initRaindrops(config);
        if (!document.hidden) {
            startTickLoop();
        }
    }

    window.TikaInteractiveEffectsModule = {
        initInteractiveEffects,
    };
})();
