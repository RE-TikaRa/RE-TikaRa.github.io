(async function initProjects() {
    if (window.TikaAccessGuardState?.blocked) return;

    const container = document.getElementById('project-container');
    if (!container) return;
    const loadConfig = window.TikaConfigLoader?.fetchConfigJSON;
    if (typeof loadConfig !== 'function') {
        console.error('config loader unavailable');
        return;
    }

    const normalizeExternalUrl = typeof window.TikaShared?.normalizeExternalUrl === 'function'
        ? window.TikaShared.normalizeExternalUrl
        : (value) => {
            if (typeof value !== 'string') return '#';
            try {
                const url = new URL(value, window.location.href);
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                    return url.href;
                }
                return '#';
            } catch {
                return '#';
            }
        };

    const createProjectCard = (project) => {
        const card = document.createElement('a');
        card.href = normalizeExternalUrl(project?.link);
        card.className = 'card card--secondary glass tilt-card project-card';
        if (card.href !== '#') {
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
        }

        const header = document.createElement('div');
        header.className = 'project-card-header';

        const title = document.createElement('span');
        title.className = 'project-title';
        title.textContent = typeof project?.title === 'string' ? project.title : '未命名项目';
        header.appendChild(title);

        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-arrow-up-right-from-square';
        icon.style.fontSize = '0.8rem';
        icon.style.opacity = '0.6';
        header.appendChild(icon);

        const desc = document.createElement('div');
        desc.className = 'project-desc';
        desc.textContent = typeof project?.description === 'string' ? project.description : '';

        const tags = document.createElement('div');
        tags.className = 'project-tags';
        const projectTags = Array.isArray(project?.tags) ? project.tags : [];
        projectTags.forEach((tag) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'project-tag';
            tagEl.textContent = String(tag);
            tags.appendChild(tagEl);
        });

        card.appendChild(header);
        card.appendChild(desc);
        card.appendChild(tags);
        return card;
    };

    const renderError = (error) => {
        container.textContent = '';

        const errorBox = document.createElement('div');
        errorBox.style.color = '#ff6a3d';
        errorBox.style.textAlign = 'center';
        errorBox.style.padding = '20px';

        const head = document.createElement('div');
        const headIcon = document.createElement('i');
        headIcon.className = 'fa-solid fa-triangle-exclamation';
        head.appendChild(headIcon);
        head.appendChild(document.createTextNode(' 加载失败'));

        const detail = document.createElement('div');
        detail.style.fontSize = '0.8em';
        detail.style.opacity = '0.8';
        detail.style.marginTop = '6px';
        detail.textContent = error instanceof Error ? error.message : String(error);

        const hint = document.createElement('div');
        hint.style.fontSize = '0.7em';
        hint.style.opacity = '0.6';
        hint.style.marginTop = '12px';
        hint.textContent = '请确保使用 http://localhost 访问，而不是 file://';

        errorBox.appendChild(head);
        errorBox.appendChild(detail);
        errorBox.appendChild(hint);
        container.appendChild(errorBox);
    };

    try {
        const config = await loadConfig();
        const projects = Array.isArray(config?.projects) ? config.projects : [];
        container.textContent = '';

        if (projects.length === 0) {
            const empty = document.createElement('div');
            empty.style.gridColumn = '1/-1';
            empty.style.textAlign = 'center';
            empty.style.padding = '40px';
            empty.textContent = '暂无项目';
            container.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();
        projects.forEach((project) => {
            fragment.appendChild(createProjectCard(project));
        });
        container.appendChild(fragment);
    } catch (error) {
        console.error('Error loading projects:', error);
        renderError(error);
    }
})();
