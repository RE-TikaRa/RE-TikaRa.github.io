(function () {
    function parseCssColor(value, fallback) {
        if (typeof value !== 'string') return fallback;
        const color = value.trim();
        if (color.startsWith('#')) {
            let hex = color.slice(1);
            if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('');
            if (hex.length === 6) {
                return [
                    parseInt(hex.slice(0, 2), 16),
                    parseInt(hex.slice(2, 4), 16),
                    parseInt(hex.slice(4, 6), 16),
                ];
            }
            return fallback;
        }

        const rgbMatch = color.match(/rgba?\(([^)]+)\)/i);
        if (!rgbMatch) return fallback;
        const parts = rgbMatch[1]
            .split(',')
            .slice(0, 3)
            .map((part) => Number.parseFloat(part.trim()))
            .filter((num) => Number.isFinite(num));
        if (parts.length !== 3) return fallback;
        return parts.map((num) => Math.max(0, Math.min(255, Math.round(num))));
    }

    function mixRgb(a, b, t, lift = 0) {
        return a.map((value, index) => {
            const mixed = value + (b[index] - value) * t + lift;
            return Math.max(0, Math.min(255, Math.round(mixed)));
        });
    }

    function playWelcomeLowPolyDissolve(welcomeScreen, options = {}) {
        return new Promise((resolve) => {
            const { onDissolveStart } = options;
            if (!welcomeScreen || typeof window.requestAnimationFrame !== 'function') {
                resolve();
                return;
            }

            const width = welcomeScreen.clientWidth || window.innerWidth;
            const height = welcomeScreen.clientHeight || window.innerHeight;
            if (width <= 0 || height <= 0) {
                resolve();
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.className = 'welcome-poly-canvas';
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve();
                return;
            }

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
            welcomeScreen.appendChild(canvas);

            const rootStyles = getComputedStyle(document.documentElement);
            const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
            const baseColor = parseCssColor(
                rootStyles.getPropertyValue('--bg-color'),
                isDarkTheme ? [11, 17, 25] : [242, 239, 232]
            );
            const accentColor = parseCssColor(
                rootStyles.getPropertyValue('--accent-color'),
                isDarkTheme ? [107, 220, 255] : [255, 106, 61]
            );
            const crackDuration = 760;
            const crackHold = 180;
            const fragmentGrowDuration = 520;
            const fragmentRevealStart = crackDuration + crackHold;
            const dissolveStart = fragmentRevealStart + fragmentGrowDuration;

            const step = Math.max(86, Math.min(132, Math.round(width / 11)));
            const jitter = step * 0.34;
            const columns = Math.ceil(width / step) + 2;
            const rows = Math.ceil(height / step) + 2;
            const points = [];

            for (let y = 0; y < rows; y++) {
                const row = [];
                for (let x = 0; x < columns; x++) {
                    const isBoundaryX = x === 0 || x === columns - 1;
                    const isBoundaryY = y === 0 || y === rows - 1;
                    const px = x * step + (isBoundaryX ? 0 : (Math.random() - 0.5) * jitter);
                    const py = y * step + (isBoundaryY ? 0 : (Math.random() - 0.5) * jitter);
                    row.push({
                        id: y * columns + x,
                        x: Math.max(0, Math.min(width, px)),
                        y: Math.max(0, Math.min(height, py)),
                    });
                }
                points.push(row);
            }

            const triangles = [];
            for (let y = 0; y < rows - 1; y++) {
                for (let x = 0; x < columns - 1; x++) {
                    const p00 = points[y][x];
                    const p10 = points[y][x + 1];
                    const p01 = points[y + 1][x];
                    const p11 = points[y + 1][x + 1];
                    const useForward = Math.random() > 0.5;
                    if (useForward) {
                        triangles.push([p00, p10, p11], [p00, p11, p01]);
                    } else {
                        triangles.push([p00, p10, p01], [p10, p11, p01]);
                    }
                }
            }

            const fragments = triangles.map((triangle) => {
                const cx = (triangle[0].x + triangle[1].x + triangle[2].x) / 3;
                const cy = (triangle[0].y + triangle[1].y + triangle[2].y) / 3;
                const depth = Math.min(1, cy / Math.max(1, height));
                const mixFactor = 0.04 + Math.random() * 0.22 + depth * 0.12;
                const lightShift = isDarkTheme ? Math.random() * 12 : Math.random() * 7;
                const rgb = mixRgb(baseColor, accentColor, mixFactor, lightShift);
                const revealDelay = fragmentRevealStart + Math.random() * 360 + depth * 180;
                const revealDuration = 360 + Math.random() * 320;
                const dissolveDelay = 110 + Math.random() * 300 + depth * 180;
                const dissolveDuration = 520 + Math.random() * 320 + depth * 150;
                return {
                    triangle,
                    cx,
                    cy,
                    dx: (Math.random() - 0.5) * (140 + depth * 130),
                    dy: 70 + Math.random() * 220 + depth * 100,
                    rotate: (Math.random() - 0.5) * 0.56,
                    startScale: 0.8 + Math.random() * 0.16,
                    revealDelay,
                    revealDuration,
                    dissolveDelay,
                    dissolveDuration,
                    alpha: 0.55 + Math.random() * 0.24,
                    fill: `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`,
                };
            });

            const dustParticles = fragments
                .filter(() => Math.random() > 0.52)
                .map((fragment) => {
                    const count = 1 + Math.floor(Math.random() * 2);
                    return Array.from({ length: count }, () => ({
                        x: fragment.cx + (Math.random() - 0.5) * 18,
                        y: fragment.cy + (Math.random() - 0.5) * 14,
                        vx: fragment.dx * (0.003 + Math.random() * 0.004),
                        vy: -(20 + Math.random() * 30) - fragment.dy * (0.004 + Math.random() * 0.004),
                        drift: (Math.random() - 0.5) * 36,
                        size: 0.7 + Math.random() * 1.6,
                        alpha: 0.26 + Math.random() * 0.26,
                        start: dissolveStart + fragment.dissolveDelay * 0.7 + Math.random() * 180,
                        life: 520 + Math.random() * 420,
                    }));
                })
                .flat();

            const edgeMap = new Map();
            const addEdge = (a, b) => {
                const minId = Math.min(a.id, b.id);
                const maxId = Math.max(a.id, b.id);
                const key = `${minId}-${maxId}`;
                if (edgeMap.has(key)) return;
                const depth = Math.min(1, ((a.y + b.y) * 0.5) / Math.max(1, height));
                edgeMap.set(key, {
                    a,
                    b,
                    delay: Math.random() * (crackDuration * 0.58) + depth * (crackDuration * 0.35),
                    duration: 150 + Math.random() * 210,
                    alpha: 0.42 + Math.random() * 0.26,
                });
            };
            triangles.forEach(([a, b, c]) => {
                addEdge(a, b);
                addEdge(b, c);
                addEdge(c, a);
            });
            const edges = [...edgeMap.values()];

            const finishAt = fragments.reduce(
                (max, fragment) => Math.max(max, dissolveStart + fragment.dissolveDelay + fragment.dissolveDuration),
                dissolveStart
            );
            const dustFinishAt = dustParticles.reduce(
                (max, dust) => Math.max(max, dust.start + dust.life),
                dissolveStart
            );
            const totalFinishAt = Math.max(finishAt, dustFinishAt) + 160;
            const dissolveSpan = Math.max(280, finishAt - dissolveStart);

            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
            const polyStrokeColor = isDarkTheme ? 'rgba(255, 255, 255, 0.045)' : 'rgba(255, 255, 255, 0.08)';
            const crackStrokeColor = isDarkTheme ? [214, 236, 248] : [72, 64, 55];
            const start = performance.now();
            let fragmentPhaseActivated = false;
            let dissolveActivated = false;

            const cleanup = () => {
                if (canvas.isConnected) canvas.remove();
                resolve();
            };

            const render = (now) => {
                const elapsed = now - start;
                ctx.clearRect(0, 0, width, height);
                if (!fragmentPhaseActivated && elapsed >= fragmentRevealStart) {
                    fragmentPhaseActivated = true;
                    welcomeScreen.classList.add('is-dissolving');
                }
                if (!dissolveActivated && elapsed >= dissolveStart) {
                    dissolveActivated = true;
                    welcomeScreen.classList.remove('is-cracking');
                    if (typeof onDissolveStart === 'function') {
                        onDissolveStart();
                    }
                }

                fragments.forEach((fragment) => {
                    const revealRaw = (elapsed - fragment.revealDelay) / fragment.revealDuration;
                    const reveal = Math.max(0, Math.min(1, revealRaw));
                    if (reveal <= 0.001) return;
                    const revealEase = easeOutCubic(reveal);

                    const dissolveRaw = (elapsed - (dissolveStart + fragment.dissolveDelay)) / fragment.dissolveDuration;
                    const dissolve = Math.max(0, Math.min(1, dissolveRaw));
                    const dissolveEase = easeOutCubic(dissolve);
                    const alpha = fragment.alpha * revealEase * (1 - dissolveEase);
                    if (alpha <= 0.005) return;
                    const growScale = fragment.startScale + (1 - fragment.startScale) * revealEase;
                    const popLift = (1 - revealEase) * 7;

                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.translate(
                        fragment.cx + fragment.dx * dissolveEase,
                        fragment.cy + fragment.dy * dissolveEase - popLift
                    );
                    ctx.rotate(fragment.rotate * dissolveEase);
                    ctx.scale(growScale, growScale);
                    ctx.translate(-fragment.cx, -fragment.cy);
                    ctx.beginPath();
                    ctx.moveTo(fragment.triangle[0].x, fragment.triangle[0].y);
                    ctx.lineTo(fragment.triangle[1].x, fragment.triangle[1].y);
                    ctx.lineTo(fragment.triangle[2].x, fragment.triangle[2].y);
                    ctx.closePath();
                    ctx.fillStyle = fragment.fill;
                    ctx.fill();
                    ctx.strokeStyle = polyStrokeColor;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();
                });

                const crackFade = elapsed <= dissolveStart
                    ? 1
                    : Math.max(0, 1 - ((elapsed - dissolveStart) / dissolveSpan) * 1.05);
                edges.forEach((edge) => {
                    const raw = (elapsed - edge.delay) / edge.duration;
                    const progress = Math.max(0, Math.min(1, raw));
                    if (progress <= 0.001) return;
                    const ex = edge.a.x + (edge.b.x - edge.a.x) * progress;
                    const ey = edge.a.y + (edge.b.y - edge.a.y) * progress;
                    const alpha = edge.alpha * crackFade * (0.45 + progress * 0.55);
                    if (alpha <= 0.003) return;

                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.moveTo(edge.a.x, edge.a.y);
                    ctx.lineTo(ex, ey);
                    ctx.strokeStyle = `rgb(${crackStrokeColor[0]} ${crackStrokeColor[1]} ${crackStrokeColor[2]})`;
                    ctx.lineWidth = 1.05;
                    ctx.stroke();
                    ctx.restore();
                });

                dustParticles.forEach((dust) => {
                    const raw = (elapsed - dust.start) / dust.life;
                    const progress = Math.max(0, Math.min(1, raw));
                    if (progress <= 0.001) return;
                    const fade = 1 - progress;
                    const dx = dust.vx * (progress * dust.life) + dust.drift * progress;
                    const dy = dust.vy * progress + progress * progress * 84;
                    const alpha = dust.alpha * fade * 0.95;
                    if (alpha <= 0.004) return;

                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = `rgba(${accentColor[0]}, ${accentColor[1]}, ${accentColor[2]}, 1)`;
                    ctx.beginPath();
                    ctx.arc(dust.x + dx, dust.y + dy, dust.size + progress * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });

                if (elapsed < totalFinishAt) {
                    requestAnimationFrame(render);
                } else {
                    cleanup();
                }
            };

            requestAnimationFrame(render);
        });
    }

    window.TikaWelcomeEffectsModule = {
        playWelcomeLowPolyDissolve,
    };
})();
