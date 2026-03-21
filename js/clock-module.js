(function () {
    function initClockAndGreeting() {
        const hourEl = document.getElementById('hour');
        const minuteEl = document.getElementById('minute');
        const secondEl = document.getElementById('second');
        const greetingEl = document.getElementById('greeting');
        const todayEl = document.getElementById('today');
        const timezoneEl = document.getElementById('clock-timezone');
        if (!hourEl && !minuteEl && !secondEl && !greetingEl && !todayEl) return;

        let clockTimer = null;
        let lastGreetingKey = '';
        let lastDateKey = '';
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const timeZoneLabel = (() => {
            const offsetMinutes = -new Date().getTimezoneOffset();
            const sign = offsetMinutes >= 0 ? '+' : '-';
            const absMinutes = Math.abs(offsetMinutes);
            const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
            const minutes = String(absMinutes % 60).padStart(2, '0');
            const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const offsetLabel = `UTC${sign}${hours}:${minutes}`;
            return tzName ? `${offsetLabel} · ${tzName}` : offsetLabel;
        })();

        if (timezoneEl) timezoneEl.textContent = timeZoneLabel;

        function updateGreeting(now) {
            if (!greetingEl && !todayEl) return;
            const hours = now.getHours();
            const greetingKey = String(hours);

            if (greetingKey !== lastGreetingKey) {
                let greetingText = '你好，实验体';
                if (hours >= 5 && hours <= 8) greetingText = '早上好，开始今天的计划吧。';
                else if (hours >= 9 && hours <= 11) greetingText = '上午好，来开始今天的计划吧。';
                else if (hours >= 12 && hours <= 13) greetingText = '中午好，来享用午饭吧~';
                else if (hours >= 14 && hours <= 17) greetingText = '下午好，来杯咖啡吧~';
                else if (hours >= 18 && hours <= 22) greetingText = '晚上好，还在忙碌么？';
                else greetingText = '夜深了，还不睡么？';

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
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const dateKey = `${year}-${month}-${day}-${hours}-${minutes}`;
                if (dateKey !== lastDateKey) {
                    todayEl.textContent = `${year}年${month}月${day}日 ${hours}点${minutes}分`;
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
            const delay = 1000 - (Date.now() % 1000);
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

    window.TikaClockModule = {
        initClockAndGreeting,
    };
})();
