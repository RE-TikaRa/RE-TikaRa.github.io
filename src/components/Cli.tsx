import { useEffect, useRef } from 'react';
import { fetchConfigJSON } from '../lib/config';

const BANNER = `   █████████   █████       ███████████             █████████  ███████████ █████  █████ ██████████   █████    ███████
  ███░░░░░███ ░░███       ░░███░░░░░███           ███░░░░░███░█░░░███░░░█░░███  ░░███ ░░███░░░░███ ░░███   ███░░░░░███
 ░███    ░███  ░███        ░███    ░███          ░███    ░░░ ░   ░███  ░  ░███   ░███  ░███   ░░███ ░███  ███     ░░███
 ░███████████  ░███        ░██████████           ░░█████████     ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███░░░░░███  ░███        ░███░░░░░░             ░░░░░░░░███    ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███    ░███  ░███      █ ░███                   ███    ░███    ░███     ░███   ░███  ░███    ███  ░███ ░░███     ███
 █████   █████ ███████████ █████        █████████░░█████████     █████    ░░████████   ██████████   █████ ░░░███████░
░░░░░   ░░░░░ ░░░░░░░░░░░ ░░░░░        ░░░░░░░░░  ░░░░░░░░░     ░░░░░      ░░░░░░░░   ░░░░░░░░░░   ░░░░░    ░░░░░░░    `;

const UPTIME_START = Date.parse('2020-06-21T01:39:45Z');

function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return char;
    }
  });
}

function formatUptime(): string {
  const diffMs = Math.max(0, Date.now() - UPTIME_START);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days} 天, ${hours} 小时, ${minutes} 分钟, ${seconds} 秒`;
}

function getDisplayWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    width += /[^\x00-\xff]/.test(ch) ? 2 : 1;
  }
  return width;
}

function padToWidth(text: string, width: number): string {
  const pad = Math.max(0, width - getDisplayWidth(text));
  return `${text}${' '.repeat(pad)}`;
}

function formatKvLines(items: { label: string; value: string }[]): string[] {
  const labelWidth = Math.max(...items.map((item) => getDisplayWidth(item.label)));
  return items.map((item) => `${padToWidth(item.label, labelWidth)}: ${item.value}`);
}

function buildBoxText(lines: string[]): string {
  const contentWidth = Math.max(...lines.map((line) => getDisplayWidth(line)));
  const prefix = ' ';
  const border = '#'.repeat(contentWidth + getDisplayWidth(prefix));
  const body = lines.map((line) => `${prefix}${padToWidth(line, contentWidth)}`).join('\n');
  return `${border}\n${body}\n${border}`;
}

function renderInfoBoxText(): string {
  const items = [
    { label: '用户', value: 'tika@lab' },
    { label: '操作系统', value: 'TikaOS 情绪体接口' },
    { label: '主机', value: 'Project_Emotion V4' },
    { label: '内核', value: 'ALp_Studio v4' },
    { label: '运行时间', value: formatUptime() },
    { label: '主题', value: document.documentElement.getAttribute('data-theme') === 'dark' ? '深色' : '浅色' },
  ];
  return buildBoxText(formatKvLines(items));
}

export default function Cli() {
  const containerRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cliContainer = containerRef.current;
    const cliOutput = outputRef.current;
    const cliInput = inputRef.current;
    if (!cliContainer || !cliOutput || !cliInput) return;

    let commandHistory: string[] = [];
    let historyIndex = -1;
    let uptimeTimer: number | null = null;

    const stopUptimeTicker = () => {
      if (!uptimeTimer) return;
      clearInterval(uptimeTimer);
      uptimeTimer = null;
    };

    const printToCLI = (text: string) => {
      const line = document.createElement('div');
      line.innerHTML = text;
      cliOutput.appendChild(line);
      setTimeout(() => {
        cliOutput.scrollTop = cliOutput.scrollHeight;
      }, 0);
    };

    const startUptimeTicker = () => {
      const boxes = cliOutput.querySelectorAll('.cli-box-info');
      const box = boxes[boxes.length - 1] as HTMLElement | undefined;
      if (!box) return;
      stopUptimeTicker();
      const update = () => {
        box.textContent = renderInfoBoxText();
      };
      update();
      uptimeTimer = window.setInterval(update, 1000);
    };

    const commands: Record<string, (args: string[]) => string | Promise<string>> = {
      help: () => {
        const helpItems = [
          { label: 'help', value: '显示此帮助信息' },
          { label: 'clear', value: '清空终端屏幕' },
          { label: 'theme', value: '切换亮/暗主题' },
          { label: 'info', value: '显示系统和版本信息' },
          { label: 'status', value: '查看系统服务状态' },
          { label: 'date', value: '显示当前时间' },
          { label: 'fortune', value: '随机输出一言' },
          { label: 'say', value: '说点什么' },
          { label: 'exit', value: '关闭 CLI 窗口' },
        ];
        const helpBox = buildBoxText(formatKvLines(helpItems));
        return `<div class="cli-section">\n<pre class="cli-banner">${escapeHTML(BANNER)}</pre>\n<pre class="cli-box">${escapeHTML(helpBox)}</pre>\n</div>`;
      },
      clear: () => {
        cliOutput.innerHTML = '';
        stopUptimeTicker();
        return '';
      },
      theme: () => {
        (document.getElementById('theme-toggle') as HTMLButtonElement | null)?.click();
        const currentTheme = document.documentElement.getAttribute('data-theme');
        return `主题已切换为 ${currentTheme === 'dark' ? '深色' : '浅色'} 模式。`;
      },
      status: (args) => {
        if (args && args[0] === 'web') {
          window.location.href = `${import.meta.env.BASE_URL}status/`.replace(/\/{2,}/g, '/');
          return '正在跳转到系统状态页面...';
        }
        fetchConfigJSON()
          .then((fullConfig) => {
            const config = fullConfig.status_checks || {};
            if (!config.dataUrl) throw new Error('No dataUrl');
            return fetch(config.dataUrl);
          })
          .then((res) => res.json())
          .then((data) => {
            const lines: string[] = [];
            lines.push(`最后更新: ${new Date(data.generatedAt).toLocaleString('zh-CN')}`);
            lines.push('-'.repeat(35));
            if (Array.isArray(data.targets) && data.targets.length > 0) {
              const normalized = data.targets.map((target: { name?: string; status?: string; responseTime?: number }) => ({
                ...target,
                name: typeof target?.name === 'string' && target.name.trim() ? target.name : 'unknown',
              }));
              const maxNameLen = Math.max(...normalized.map((t: { name: string }) => getDisplayWidth(t.name)));
              normalized.forEach((target: { name: string; status?: string; responseTime?: number }) => {
                const statusMark = target.status === 'ok' ? 'OK ' : 'ERR';
                const name = padToWidth(target.name, maxNameLen);
                const time = target.responseTime ? `${target.responseTime}ms` : '';
                lines.push(`${statusMark} ${name}  ${time}`.trimEnd());
              });
            }
            lines.push('-'.repeat(35));
            lines.push('输入 "status web" 跳转到详细页面');
            printToCLI(`<pre style="margin:0">${escapeHTML(lines.join('\n'))}</pre>`);
          })
          .catch((err) => {
            console.error(err);
            printToCLI('获取状态数据失败，请尝试 "status web"');
          });
        return '正在获取系统状态...';
      },
      info: () => {
        const infoBox = renderInfoBoxText();
        return `<div class="cli-section">\n<pre class="cli-banner">${escapeHTML(BANNER)}</pre>\n<pre class="cli-box cli-box-info">${escapeHTML(infoBox)}</pre>\n</div>`;
      },
      date: () => new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).format(new Date()),
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
            const src = typeof data?.from === 'string' ? data.from.trim() : '';
            const suffixParts: string[] = [];
            if (fromWho) suffixParts.push(fromWho);
            if (src) suffixParts.push(`《${src}》`);
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
      },
    };

    const executeCommand = (command: string) => {
      const trimmed = command.trim();
      if (trimmed === '') return;
      printToCLI(`<span class="cli-prompt">[tika@lab ~]$</span> <span class="cli-command-input">${escapeHTML(trimmed)}</span>`);
      if (commandHistory[0] !== trimmed) commandHistory.unshift(trimmed);
      historyIndex = -1;
      const parts = trimmed.split(' ');
      const cmd = (parts.shift() || '').toLowerCase();
      const handler = commands[cmd];
      if (handler) {
        const result = handler(parts);
        if (result && typeof (result as Promise<string>).then === 'function') {
          (result as Promise<string>)
            .then((text) => {
              if (text) {
                printToCLI(text);
                if (text.includes('cli-box-info')) startUptimeTicker();
              }
            })
            .catch(() => printToCLI('抱歉，该实验体权限不足'));
        } else if (result) {
          printToCLI(result as string);
          if ((result as string).includes('cli-box-info')) startUptimeTicker();
        }
      } else {
        printToCLI('抱歉，该实验体权限不足');
      }
    };

    function toggleCLI(show?: boolean) {
      const isVisible = !cliContainer.hidden;
      if (show === undefined) show = !isVisible;
      if (show) {
        cliContainer.hidden = false;
        cliInput.focus();
        cliOutput.scrollTop = cliOutput.scrollHeight;
        if (cliOutput.innerHTML === '') {
          executeCommand('info');
        } else if (cliOutput.querySelector('.cli-box-info')) {
          startUptimeTicker();
        }
      } else {
        stopUptimeTicker();
        cliContainer.hidden = true;
        cliInput.blur();
      }
    }

    const onContainerClick = () => {
      const selection = window.getSelection();
      if (selection && selection.type !== 'Range') cliInput.focus();
    };
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        toggleCLI();
      }
      if (e.key === 'Escape' && !cliContainer.hidden) toggleCLI(false);
    };
    const onInputKey = (e: KeyboardEvent) => {
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
    };

    cliContainer.addEventListener('click', onContainerClick);
    document.addEventListener('keydown', onDocKey);
    cliInput.addEventListener('keydown', onInputKey);

    return () => {
      stopUptimeTicker();
      cliContainer.removeEventListener('click', onContainerClick);
      document.removeEventListener('keydown', onDocKey);
      cliInput.removeEventListener('keydown', onInputKey);
    };
  }, []);

  return (
    <div id="cli-container" ref={containerRef} hidden>
      <div id="cli-output" ref={outputRef}></div>
      <div id="cli-input-line">
        <span className="cli-prompt">[tika@lab ~]$</span>
        <input type="text" id="cli-input" ref={inputRef} autoComplete="off" spellCheck="false" />
      </div>
    </div>
  );
}
