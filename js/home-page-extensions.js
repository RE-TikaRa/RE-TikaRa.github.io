(function () {
    async function initLatestArticles(options = {}) {
        const { fetchConfig, normalizeExternalUrl } = options;
        if (typeof fetchConfig !== 'function' || typeof normalizeExternalUrl !== 'function') return;

        const container = document.getElementById('latest-articles-card');
        const list = document.getElementById('article-list');
        if (!container || !list) return;

        const renderPlaceholder = (text) => {
            list.textContent = '';
            const item = document.createElement('li');
            item.className = 'article-item';
            const title = document.createElement('span');
            title.className = 'article-title';
            title.textContent = text;
            item.appendChild(title);
            list.appendChild(item);
            container.hidden = false;
        };

        try {
            const config = await fetchConfig();
            const articles = Array.isArray(config?.latest_articles) ? config.latest_articles : [];

            if (articles.length === 0) {
                renderPlaceholder('暂无文章');
                return;
            }

            list.textContent = '';
            const fragment = document.createDocumentFragment();

            articles.forEach((article) => {
                const item = document.createElement('li');
                item.className = 'article-item';

                const link = document.createElement('a');
                link.className = 'article-link';
                link.href = normalizeExternalUrl(article?.link);
                link.target = '_blank';
                link.rel = 'noopener noreferrer';

                const title = document.createElement('span');
                title.className = 'article-title';
                title.textContent = typeof article?.title === 'string' ? article.title : '未命名文章';
                link.appendChild(title);

                if (article?.date) {
                    const date = document.createElement('span');
                    date.className = 'article-date';
                    date.textContent = String(article.date);
                    link.appendChild(date);
                }

                const action = document.createElement('span');
                action.className = 'article-action';
                action.textContent = '点击查看';
                link.appendChild(action);

                item.appendChild(link);
                fragment.appendChild(item);
            });

            list.appendChild(fragment);
            container.hidden = false;
        } catch (error) {
            console.error('Failed to load articles:', error);
            renderPlaceholder('文章加载失败');
        }
    }

    function initScrollLayout() {
        const backToTopBtn = document.getElementById('back-to-top');
        const isMobile = window.matchMedia('(max-width: 960px)').matches;

        const handleScroll = () => {
            const scrollY = window.scrollY;
            const threshold = 100;
            const showBackToTop = isMobile ? 460 : 300;

            if (!isMobile) {
                if (scrollY > threshold) {
                    document.body.classList.add('is-scrolled');
                } else {
                    document.body.classList.remove('is-scrolled');
                }
            } else {
                document.body.classList.remove('is-scrolled');
            }

            if (backToTopBtn) {
                backToTopBtn.hidden = scrollY < showBackToTop;
            }
        };

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                handleScroll();
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        handleScroll();

        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    function initScrollProgress() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.matchMedia('(max-width: 960px)').matches) return;
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);

        const updateProgress = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll <= 0) {
                progressBar.hidden = true;
                progressBar.style.setProperty('--scroll-progress', '0');
                return;
            }
            progressBar.hidden = false;
            const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
            progressBar.style.setProperty('--scroll-progress', progress.toFixed(4));
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
        updateProgress();
    }

    
    function initHiddenStatusNavigation() {
        const homeBtn = document.getElementById('nav-home-btn');
        if (!homeBtn) return;

        let clickCount = 0;
        let clickTimer = null;

        homeBtn.addEventListener('click', (event) => {
            event.preventDefault();
            clickCount += 1;

            if (clickTimer) {
                clearTimeout(clickTimer);
            }
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 500);

            if (clickCount >= 5) {
                window.location.href = 'status/';
                clickCount = 0;
            }
        });
    }

    window.TikaHomePageExtensions = {
        initLatestArticles,
        initScrollLayout,
        initScrollProgress,
        initHiddenStatusNavigation,
    };
})();
