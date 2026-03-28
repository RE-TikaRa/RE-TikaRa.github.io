(function () {
    function initScrollReveal() {
        if (window.matchMedia('(max-width: 960px)').matches) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (!document.body.classList.contains('is-ready')) {
            window.addEventListener('welcome-ready', initScrollReveal, { once: true });
            return;
        }

        const cards = document.querySelectorAll('.side-panel .card, .hitokoto-panel .card, #latest-articles-card');
        if (cards.length === 0) return;

        cards.forEach((card) => card.classList.add('scroll-reveal'));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px',
        });

        cards.forEach((card) => observer.observe(card));
    }

    function initViewTransitions() {
        if (!document.startViewTransition) return;
        if (window.matchMedia('(max-width: 960px)').matches) return;

        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"], a[href^="index"], a[href^="ProjectList"], a[href^="status"]');

        internalLinks.forEach((link) => {
            if (link.target && link.target !== '_self') return;
            if (link.hasAttribute('download')) return;
            if (link.href.includes('#')) return;

            link.addEventListener('click', (e) => {
                const href = link.href;
                if (!href || href === window.location.href) return;
                if (e.defaultPrevented || e.button !== 0) return;
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

                let url;
                try {
                    url = new URL(href, window.location.href);
                } catch {
                    return;
                }
                if (url.origin !== window.location.origin) return;

                e.preventDefault();

                document.startViewTransition(() => {
                    window.location.href = url.href;
                });
            });
        });
    }

    window.TikaNavigationEffectsModule = {
        initScrollReveal,
        initViewTransitions,
    };
})();
