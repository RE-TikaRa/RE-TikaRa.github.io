const OVERLAY_ID = 'access-guard-overlay';
const MOBILE_HINT_KEY = 'tika-mobile-desktop-hint';

export interface GuardResult {
  blocked: boolean;
  reason?: string;
}

function detectWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent || '');
}

function detectMobileDevice(): boolean {
  const ua = navigator.userAgent || '';
  const uaData = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = `${navigator.platform || ''} ${uaData.userAgentData?.platform || ''}`;
  const isMobileUA = /Android|iPhone|iPod|iPad|Windows Phone|BlackBerry|Opera Mini|IEMobile|Mobile/i.test(ua);
  const hasMobilePlatformHint = /Android|iPhone|iPod|iPad|Windows Phone|Linux arm|armv8|armv7/i.test(`${ua} ${platform}`);
  const isCoarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const shortEdge = Math.min(window.screen?.width || 0, window.screen?.height || 0);
  const isSmallPhysicalScreen = shortEdge > 0 && shortEdge <= 1100;
  return isMobileUA || (hasMobilePlatformHint && isCoarsePointer) || (isCoarsePointer && isSmallPhysicalScreen);
}

function createBaseOverlay(): { overlay: HTMLDivElement; dialog: HTMLElement } {
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'access-guard-overlay';
  const dialog = document.createElement('section');
  dialog.className = 'access-guard-dialog card glass';
  overlay.appendChild(dialog);
  return { overlay, dialog };
}

function showWeChatBlock(): void {
  if (document.getElementById(OVERLAY_ID)) return;
  const { overlay, dialog } = createBaseOverlay();
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.innerHTML = [
    '<p class="access-guard-kicker">访问受限</p>',
    '<h2 class="access-guard-title">暂不支持微信内置浏览器访问</h2>',
    '<p class="access-guard-desc">请点击右上角菜单，选择“在浏览器打开”。推荐使用手机系统浏览器继续访问。</p>',
    '<button type="button" class="access-guard-btn access-guard-btn-primary" id="access-guard-reload">我已切换，刷新重试</button>',
  ].join('');
  dialog.querySelector('#access-guard-reload')?.addEventListener('click', () => window.location.reload());
  document.body.classList.add('is-access-guard-active', 'is-access-guard-blocked');
  document.body.appendChild(overlay);
}

function showMobileHint(): void {
  if (document.getElementById(OVERLAY_ID)) return;
  const { overlay, dialog } = createBaseOverlay();
  const closeHint = () => {
    try {
      sessionStorage.setItem(MOBILE_HINT_KEY, '1');
    } catch {}
    overlay.remove();
    document.body.classList.remove('is-access-guard-active');
  };
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.innerHTML = [
    '<p class="access-guard-kicker">访问提示</p>',
    '<h2 class="access-guard-title">推荐使用电脑端访问</h2>',
    '<p class="access-guard-desc">当前为移动端访问，桌面端显示效果和交互更完整。不过你仍可继续在手机上访问。</p>',
    '<button type="button" class="access-guard-btn access-guard-btn-primary" id="access-guard-continue">继续在手机上访问</button>',
  ].join('');
  dialog.querySelector('#access-guard-continue')?.addEventListener('click', closeHint);
  document.body.classList.add('is-access-guard-active');
  document.body.appendChild(overlay);
}

function hasSeenMobileHint(): boolean {
  try {
    return sessionStorage.getItem(MOBILE_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export function initAccessGuard(): GuardResult {
  if (!document.body) return { blocked: false };
  if (detectWeChatBrowser()) {
    showWeChatBlock();
    return { blocked: true, reason: 'wechat' };
  }
  if (detectMobileDevice() && !hasSeenMobileHint()) {
    showMobileHint();
    return { blocked: false, reason: 'mobile-hint' };
  }
  return { blocked: false, reason: 'normal' };
}
