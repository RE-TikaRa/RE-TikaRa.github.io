import { gsap } from './motion';
import { motionLevel } from './motion';

function finish(el: HTMLElement): void {
  el.remove();
  document.body.classList.remove('is-welcome-active');
  document.documentElement.classList.remove('is-intro-pending');
}

function isDark(): boolean {
  return document.documentElement.getAttribute('data-theme') !== 'light';
}

export function playWelcome(): Promise<void> {
  const el = document.getElementById('welcome-screen');
  if (!el) return Promise.resolve();

  if (motionLevel() === 'reduced') {
    finish(el);
    return Promise.resolve();
  }

  document.body.classList.add('is-welcome-active');

  const frame = el.querySelector('.welcome-mark__frame') as SVGRectElement | null;
  const axes = el.querySelectorAll('.welcome-mark__axis');
  const node = el.querySelector('.welcome-mark__node');
  const emblem = el.querySelector('#welcome-emblem') as HTMLElement | null;
  const brand = el.querySelector('.welcome-brand');
  const line = el.querySelector('.welcome-line');
  const barFill = el.querySelector('#welcome-bar-fill');

  const bgGrid = document.querySelector('.blueprint-grid') as HTMLElement | null;
  const bgEmblem = document.querySelector('.bg-emblem') as HTMLElement | null;
  const canvas = document.getElementById('blueprint-wireframe-canvas') as HTMLElement | null;

  return new Promise((resolve) => {
    const tl = gsap.timeline();

    // ---- 加载阶段:徽标描绘 → 对角擦成图 → 品牌/进度 ----
    if (frame) {
      const len = frame.getTotalLength?.() ?? 700;
      gsap.set(frame, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(frame, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' });
    }
    tl.fromTo(axes, { autoAlpha: 0, scaleX: 0.6, scaleY: 0.6, transformOrigin: 'center' },
      { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, '-=0.3');
    tl.fromTo(node, { scale: 0, autoAlpha: 0, transformOrigin: 'center' },
      { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(2)' }, '-=0.15');
    if (emblem) {
      gsap.set(emblem, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 0%)' });
      tl.to(emblem, {
        clipPath: 'polygon(0% 0%, 200% 0%, 0% 200%)',
        duration: 0.6,
        ease: 'power2.inOut',
      }, '+=0.1');
      tl.to([frame, ...axes, node], {
        autoAlpha: 0,
        duration: 0.45,
        ease: 'power1.inOut',
      }, '<');
    }
    tl.fromTo(brand, { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power1.out' }, '-=0.1');
    tl.fromTo(line, { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.3, ease: 'none' }, '-=0.2');
    if (barFill) {
      const bar = barFill.parentElement;
      if (bar) {
        tl.fromTo(bar, { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, ease: 'none' }, '-=0.15');
      }
      tl.to(barFill, { width: '100%', duration: 0.6, ease: 'power1.inOut' }, '-=0.1');
    }

    // ---- 转场:图放大归位 → 遮罩交接 → 网格擦出 + 二十面体浮现 ----
    tl.add(() => playTransition(), '+=0.2');

    function playTransition(): void {
      const t2 = gsap.timeline({
        onComplete: () => {
          finish(el);
          resolve();
        },
      });

      // 0. 品牌/提示/进度先淡出,让位给图放大
      const texts = [brand, line, barFill?.parentElement].filter(Boolean);
      if (texts.length) {
        t2.to(texts, { autoAlpha: 0, duration: 0.35, ease: 'power1.in' });
      }

      // 1. welcome 图从徽标位放大平移到背景 emblem 的最终位置(字淡出中途启动)
      if (emblem && bgEmblem) {
        const ea = emblem.getBoundingClientRect();
        const ba = bgEmblem.getBoundingClientRect();
        const dx = (ba.left + ba.width / 2) - (ea.left + ea.width / 2);
        const dy = (ba.top + ba.height / 2) - (ea.top + ea.height / 2);
        const scale = ba.width / ea.width;
        t2.to(emblem, {
          x: dx, y: dy, scale,
          transformOrigin: 'center',
          duration: 0.8,
          ease: 'power2.inOut',
        }, '>-0.15');
      }

      // 2. 背景 emblem 淡入接替 + 欢迎遮罩淡出(两图此刻位置尺寸重合,无缝交接)
      if (bgEmblem) {
        t2.to(bgEmblem, {
          autoAlpha: isDark() ? 0.6 : 0.5,
          duration: 0.5,
          ease: 'power1.out',
        }, '>-0.1');
      }
      t2.to(el, { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, '<');

      // 3. 网格从左下向右上擦出
      if (bgGrid) {
        t2.to(bgGrid, {
          clipPath: 'polygon(0% 100%, 0% -100%, 200% 100%)',
          duration: 0.9,
          ease: 'power2.inOut',
        }, '>-0.15');
      }

      // 4. 二十面体缩放旋转浮现
      if (canvas) {
        t2.fromTo(canvas,
          { autoAlpha: 0, scale: 0.6, rotation: -22, transformOrigin: 'center' },
          {
            autoAlpha: isDark() ? 0.65 : 0.5,
            scale: 1,
            rotation: 0,
            duration: 0.85,
            ease: 'back.out(1.4)',
          }, '<0.2');
      }
    }
  });
}
