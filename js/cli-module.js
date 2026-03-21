(function () {
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

        function getDisplayWidth(text) {
            let width = 0;
            for (const ch of text) {
                width += /[^\x00-\xff]/.test(ch) ? 2 : 1;
            }
            return width;
        }

        function padToWidth(text, width) {
            const pad = Math.max(0, width - getDisplayWidth(text));
            return `${text}${' '.repeat(pad)}`;
        }

        function formatKvLines(items) {
            const labelWidth = Math.max(...items.map((item) => getDisplayWidth(item.label)));
            return items.map((item) => {
                const label = padToWidth(item.label, labelWidth);
                return `${label}: ${item.value}`;
            });
        }

        function buildBoxText(lines) {
            const contentWidth = Math.max(...lines.map((line) => getDisplayWidth(line)));
            const prefix = ' ';
            const border = '#'.repeat(contentWidth + getDisplayWidth(prefix));
            const body = lines
                .map((line) => `${prefix}${padToWidth(line, contentWidth)}`)
                .join('\n');
            return `${border}\n${body}\n${border}`;
        }

        function renderInfoBoxText() {
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

        let commandHistory = [];
        let historyIndex = -1;
        let uptimeTimer = null;

        const commands = {
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
                return `<div class="cli-section">
<pre class="cli-banner">   █████████   █████       ███████████             █████████  ███████████ █████  █████ ██████████   █████    ███████   
  ███░░░░░███ ░░███       ░░███░░░░░███           ███░░░░░███░█░░░███░░░█░░███  ░░███ ░░███░░░░███ ░░███   ███░░░░░███ 
 ░███    ░███  ░███        ░███    ░███          ░███    ░░░ ░   ░███  ░  ░███   ░███  ░███   ░░███ ░███  ███     ░░███
 ░███████████  ░███        ░██████████           ░░█████████     ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███░░░░░███  ░███        ░███░░░░░░             ░░░░░░░░███    ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███    ░███  ░███      █ ░███                   ███    ░███    ░███     ░███   ░███  ░███    ███  ░███ ░░███     ███ 
 █████   █████ ███████████ █████        █████████░░█████████     █████    ░░████████   ██████████   █████ ░░░███████░  
░░░░░   ░░░░░ ░░░░░░░░░░░ ░░░░░        ░░░░░░░░░  ░░░░░░░░░     ░░░░░      ░░░░░░░░   ░░░░░░░░░░   ░░░░░    ░░░░░░░    </pre>
<pre class="cli-box">${escapeHTML(helpBox)}</pre>
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
            status: (args) => {
                if (args && args[0] === 'web') {
                    window.location.href = 'status/';
                    return '正在跳转到系统状态页面...';
                }

                fetch('config.json')
                    .then((res) => res.json())
                    .then((fullConfig) => {
                        const config = fullConfig.status_checks || {};
                        if (!config.dataUrl) throw new Error('No dataUrl');
                        return fetch(config.dataUrl);
                    })
                    .then((res) => res.json())
                    .then((data) => {
                        const lines = [];
                        lines.push(`最后更新: ${new Date(data.generatedAt).toLocaleString('zh-CN')}`);
                        lines.push('-'.repeat(35));

                        if (Array.isArray(data.targets) && data.targets.length > 0) {
                            const normalizedTargets = data.targets.map((target) => ({
                                ...target,
                                name: typeof target?.name === 'string' && target.name.trim() ? target.name : 'unknown',
                            }));
                            const maxNameLen = Math.max(...normalizedTargets.map((target) => getDisplayWidth(target.name)));
                            normalizedTargets.forEach((target) => {
                                const isOk = target.status === 'ok';
                                const statusMark = isOk ? 'OK ' : 'ERR';
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
                return `<div class="cli-section">
<pre class="cli-banner">   █████████   █████       ███████████             █████████  ███████████ █████  █████ ██████████   █████    ███████   
  ███░░░░░███ ░░███       ░░███░░░░░███           ███░░░░░███░█░░░███░░░█░░███  ░░███ ░░███░░░░███ ░░███   ███░░░░░███ 
 ░███    ░███  ░███        ░███    ░███          ░███    ░░░ ░   ░███  ░  ░███   ░███  ░███   ░░███ ░███  ███     ░░███
 ░███████████  ░███        ░██████████           ░░█████████     ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███░░░░░███  ░███        ░███░░░░░░             ░░░░░░░░███    ░███     ░███   ░███  ░███    ░███ ░███ ░███      ░███
 ░███    ░███  ░███      █ ░███                   ███    ░███    ░███     ░███   ░███  ░███    ███  ░███ ░░███     ███ 
 █████   █████ ███████████ █████        █████████░░█████████     █████    ░░████████   ██████████   █████ ░░░███████░  
░░░░░   ░░░░░ ░░░░░░░░░░░ ░░░░░        ░░░░░░░░░  ░░░░░░░░░     ░░░░░      ░░░░░░░░   ░░░░░░░░░░   ░░░░░    ░░░░░░░    </pre>
<pre class="cli-box cli-box-info">${escapeHTML(infoBox)}</pre>
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
            },
        };

        function toggleCLI(show) {
            const isVisible = !cliContainer.hidden;
            if (show === undefined) show = !isVisible;

            if (show) {
                cliContainer.hidden = false;
                cliInput.focus();
                cliOutput.scrollTop = cliOutput.scrollHeight;
                if (cliOutput.innerHTML === '') {
                    executeCommand('info');
                }
            } else {
                cliContainer.hidden = true;
                cliInput.blur();
            }
        }

        function printToCLI(text) {
            const line = document.createElement('div');
            line.innerHTML = text;
            cliOutput.appendChild(line);
            setTimeout(() => {
                cliOutput.scrollTop = cliOutput.scrollHeight;
            }, 0);
        }

        function startUptimeTicker() {
            const boxes = cliOutput.querySelectorAll('.cli-box-info');
            const box = boxes[boxes.length - 1];
            if (!box) return;
            if (uptimeTimer) clearInterval(uptimeTimer);
            const update = () => {
                box.textContent = renderInfoBoxText();
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
                    if (result.includes('cli-box-info')) startUptimeTicker();
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

    window.TikaCliModule = {
        initCLI,
    };
})();
