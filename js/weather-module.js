(function () {
    function classifyWeatherMood(weatherCode) {
        if (weatherCode === 0 || weatherCode === 1) return 'clear';
        if (weatherCode === 2 || weatherCode === 3) return 'cloudy';
        if (weatherCode === 45 || weatherCode === 48) return 'fog';
        if (weatherCode === 95) return 'storm';
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) return 'rain';
        return 'neutral';
    }

    function applyWeatherAtmosphere(weatherCode) {
        const root = document.documentElement;
        const mood = classifyWeatherMood(weatherCode);
        root.setAttribute('data-weather', mood);

        const rainOpacityMap = {
            clear: '0.06',
            cloudy: '0.1',
            fog: '0.14',
            rain: '0.24',
            storm: '0.32',
            neutral: '0.12',
        };
        root.style.setProperty('--weather-rain-opacity', rainOpacityMap[mood] || '0.12');
    }

    async function initWeather() {
        const weatherCard = document.getElementById('weather-card');
        if (!weatherCard) return;

        const locationEl = weatherCard.querySelector('.weather-location');
        const tempEl = weatherCard.querySelector('.weather-temp');
        const iconEl = weatherCard.querySelector('.weather-icon i');
        const descriptionEl = weatherCard.querySelector('.weather-description');
        const sourceEl = weatherCard.querySelector('#weather-source');

        const weatherCodeMap = {
            0: { icon: 'fa-solid fa-sun', description: '晴' },
            1: { icon: 'fa-solid fa-cloud-sun', description: '基本晴朗' },
            2: { icon: 'fa-solid fa-cloud', description: '部分多云' },
            3: { icon: 'fa-solid fa-cloud', description: '阴天' },
            45: { icon: 'fa-solid fa-smog', description: '雾' },
            48: { icon: 'fa-solid fa-smog', description: '冻雾' },
            51: { icon: 'fa-solid fa-cloud-rain', description: '小雨' },
            53: { icon: 'fa-solid fa-cloud-rain', description: '中雨' },
            55: { icon: 'fa-solid fa-cloud-showers-heavy', description: '大雨' },
            61: { icon: 'fa-solid fa-cloud-rain', description: '小雨' },
            63: { icon: 'fa-solid fa-cloud-rain', description: '中雨' },
            65: { icon: 'fa-solid fa-cloud-showers-heavy', description: '大雨' },
            80: { icon: 'fa-solid fa-cloud-showers-heavy', description: '阵雨' },
            81: { icon: 'fa-solid fa-cloud-showers-heavy', description: '中度阵雨' },
            82: { icon: 'fa-solid fa-cloud-showers-heavy', description: '猛烈阵雨' },
            95: { icon: 'fa-solid fa-bolt', description: '雷暴' },
        };

        function updateWeatherUI(location, temperature, weatherInfo, sourceText, weatherCode) {
            if (tempEl) tempEl.textContent = `${Math.round(temperature)}°`;
            if (descriptionEl) descriptionEl.textContent = weatherInfo.description;
            if (iconEl) iconEl.className = weatherInfo.icon;
            if (locationEl) locationEl.textContent = location;
            if (sourceEl) sourceEl.textContent = sourceText;
            applyWeatherAtmosphere(weatherCode);
            weatherCard.hidden = false;
        }

        async function reverseGeocode(lat, lon) {
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&accept-language=zh-CN`;
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) throw new Error('reverse geocode failed');
                const data = await response.json();
                const address = data?.address || {};
                const city = address.city || address.town || address.village || address.county || '';
                const state = address.state || address.region || '';
                const country = address.country || '';
                const parts = [city, state].filter(Boolean);
                const label = parts.length ? parts.join(' · ') : country;
                return label || '当前位置';
            } catch (error) {
                console.warn('获取位置名称失败:', error);
                return '当前位置';
            }
        }

        function showVirtualWeather() {
            console.log('加载虚拟天气数据...');
            const weatherCodes = Object.keys(weatherCodeMap);
            const randomCode = weatherCodes[Math.floor(Math.random() * weatherCodes.length)];
            const virtualWeatherInfo = weatherCodeMap[randomCode];
            const virtualTemperature = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
            updateWeatherUI('ALp_Studio', virtualTemperature, virtualWeatherInfo, '模拟', Number(randomCode));
        }

        function isGeolocationPermissionDenied(error) {
            if (!error) return false;
            if (typeof error.code === 'number' && error.code === 1) return true;
            const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
            return message.includes('geolocation') && message.includes('denied');
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
            });
            const { latitude, longitude } = position.coords;
            const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP 错误! 状态: ${response.status}`);
            const data = await response.json();
            const weatherInfo = weatherCodeMap[data.current.weather_code] || { icon: 'fa-solid fa-question', description: '未知' };
            const locationLabel = await reverseGeocode(latitude, longitude);
            updateWeatherUI(locationLabel, data.current.temperature_2m, weatherInfo, '定位', Number(data.current.weather_code));
        } catch (error) {
            if (!isGeolocationPermissionDenied(error)) {
                console.error('获取天气失败:', error.message || error);
            }
            showVirtualWeather();
        }
    }

    window.TikaWeatherModule = {
        initWeather,
    };
})();
