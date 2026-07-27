import { registerTicker, motionLevel, isMobile } from './motion';

type Vec3 = [number, number, number];

interface Skin {
  stroke: string;
  glow: number;
  jitter: number;
  lineWidth: number;
}

const PHI = (1 + Math.sqrt(5)) / 2;

// 二十面体 12 顶点
const VERTICES: Vec3[] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];

// 30 条边(顶点索引对)
const EDGES: [number, number][] = [
  [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
  [1, 5], [1, 7], [1, 8], [1, 9],
  [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
  [3, 4], [3, 6], [3, 8], [3, 9],
  [4, 5], [4, 9], [4, 11],
  [5, 9], [5, 11],
  [6, 7], [6, 8], [6, 10],
  [7, 8], [7, 10],
  [8, 9], [10, 11],
];

function resolveSkin(): Skin {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue('--color-accent').trim();
  const ink = styles.getPropertyValue('--color-ink-dim').trim();
  if (dark) {
    return { stroke: accent || '#2dd4bf', glow: 8, jitter: 0, lineWidth: 1 };
  }
  return { stroke: ink || '#6b5d47', glow: 0, jitter: 1.4, lineWidth: 1.2 };
}

export function initWireframe(): (() => void) | void {
  const canvas = document.getElementById('blueprint-wireframe-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const level = motionLevel();
  const mobile = isMobile();
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

  let width = 0;
  let height = 0;
  let radius = 0;
  let skin = resolveSkin();
  let angleX = 0.4;
  let angleY = 0.2;

  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    radius = Math.min(width, height) * (mobile ? 0.28 : 0.22);
  };

  const project = (v: Vec3): [number, number] => {
    const [x, y, z] = v;
    // 绕 Y 轴
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    // 绕 X 轴
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    // 透视投影
    const perspective = 4;
    const scale = perspective / (perspective + z2);
    const jitter = skin.jitter;
    const jx = jitter ? (Math.random() - 0.5) * jitter : 0;
    const jy = jitter ? (Math.random() - 0.5) * jitter : 0;
    return [
      width / 2 + x1 * radius * scale + jx,
      height / 2 + y2 * radius * scale + jy,
    ];
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth = skin.lineWidth;
    ctx.lineCap = 'round';
    if (skin.glow > 0) {
      ctx.shadowBlur = skin.glow;
      ctx.shadowColor = skin.stroke;
    } else {
      ctx.shadowBlur = 0;
    }
    const projected = VERTICES.map(project);
    ctx.beginPath();
    for (const [a, b] of EDGES) {
      const pa = projected[a];
      const pb = projected[b];
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
    }
    ctx.stroke();
  };

  const tick = () => {
    angleY += 0.0016;
    angleX += 0.0009;
    draw();
  };

  resize();
  window.addEventListener('resize', resize);

  const themeObserver = new MutationObserver(() => {
    skin = resolveSkin();
    if (level === 'reduced' || level === 'lite') draw();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-contrast'] });

  // reduced/lite: 静态单帧,不注册 ticker
  if (level === 'reduced' || level === 'lite') {
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      themeObserver.disconnect();
    };
  }

  const stop = registerTicker(tick);
  return () => {
    stop();
    window.removeEventListener('resize', resize);
    themeObserver.disconnect();
  };
}
