/* Decorative glass only. The existing page owns navigation and button behavior. */
(() => {
    'use strict';

    const panelSelector = [
        'body.ui-entry .header-container',
        'body.ui-workspace #sidebar',
        'body.ui-exam #sidebar',
        'body.ui-learning .sidebar'
    ].join(',');
    const buttonSelector = [
        'body.ui-entry .login-button',
        'body.ui-entry .index-button-container > div > span',
        'body.ui-workspace #btn_control',
        'body.ui-workspace .float-buy-btn',
        'body.ui-workspace .card-btn',
        'body.ui-workspace .modal-buy-btn',
        'body.ui-workspace .feedback-float-btn',
        'body.ui-learning .btn-upgrade',
        'body.ui-exam .course-button',
        'body.ui-pricing .pricing-plan .btn',
        'body.ui-auth .button',
        'body.ui-entry-test .next-button',
        'body.ui-entry-test .complete-button'
    ].join(',');
    const navSelector = [
        'body.ui-workspace #sidebar .side-content',
        'body.ui-exam #sidebar .side-content',
        'body.ui-learning .nav-menu'
    ].join(',');
    const modeSelector = 'body.ui-workspace .practice-modes';

    function start() {
        const reduceTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const chromium = /(?:Chrome|Chromium|Edg)\//.test(navigator.userAgent)
            && !/(?:Firefox|FxiOS|CriOS|EdgiOS)\//.test(navigator.userAgent);
        const canRefract = chromium && CSS.supports('backdrop-filter', 'blur(1px)');
        const ns = 'http://www.w3.org/2000/svg';
        const surfaces = new Map();
        const navs = new Map();
        let filterHost;
        let serial = 0;
        let pending = false;

        function svgElement(name, attributes) {
            const element = document.createElementNS(ns, name);
            for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
            return element;
        }

        function updateLens(surface, width, height, radius) {
            if (!canRefract || reduceTransparency.matches || width < 1 || height < 1) return;
            const geometry = `${Math.round(width)}:${Math.round(height)}:${Math.round(radius)}`;
            if (surface.geometry === geometry) return;
            surface.geometry = geometry;
            if (!filterHost) {
                filterHost = svgElement('svg', { width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' });
                filterHost.classList.add('ui-glass-definitions');
                document.body.append(filterHost);
            }
            if (!surface.filter) {
                surface.filter = svgElement('filter', {
                    id: `ui-glass-lens-${++serial}`,
                    filterUnits: 'userSpaceOnUse',
                    'color-interpolation-filters': 'sRGB'
                });
                surface.map = svgElement('feImage', { x: 0, y: 0, preserveAspectRatio: 'none', result: 'lens-map' });
                const displacement = svgElement('feDisplacementMap', {
                    in: 'SourceGraphic', in2: 'lens-map', scale: ['button', 'mode'].includes(surface.kind) ? 3 : 11,
                    xChannelSelector: 'R', yChannelSelector: 'G'
                });
                surface.filter.append(surface.map, displacement);
                filterHost.append(surface.filter);
                surface.layer.style.setProperty('--ui-glass-refraction', `url("#${surface.filter.id}")`);
                surface.layer.classList.add('ui-glass-refracts');
            }

            // Only the rounded rim bends; the center of the displacement map is neutral.
            // This small map is regenerated on size changes, never in an animation loop.
            const ratio = Math.min(1, 384 / Math.max(width, height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(width * ratio));
            canvas.height = Math.max(1, Math.round(height * ratio));
            const context = canvas.getContext('2d');
            if (!context) return;
            const pixels = context.createImageData(canvas.width, canvas.height);
            const r = Math.min(radius, width / 2, height / 2);
            const rim = Math.min(16, Math.min(width, height) / 3);
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const px = (x + 0.5) / ratio - width / 2;
                    const py = (y + 0.5) / ratio - height / 2;
                    const qx = Math.abs(px) - width / 2 + r;
                    const qy = Math.abs(py) - height / 2 + r;
                    const dx = Math.max(qx, 0);
                    const dy = Math.max(qy, 0);
                    const length = Math.hypot(dx, dy);
                    const depth = r - length - Math.min(Math.max(qx, qy), 0);
                    const bend = Math.pow(Math.max(0, 1 - Math.max(0, depth) / rim), 2) * 92;
                    const nx = length ? dx / length : (qx > qy ? 1 : 0);
                    const ny = length ? dy / length : (qy >= qx ? 1 : 0);
                    const offset = (y * canvas.width + x) * 4;
                    pixels.data[offset] = 128 + Math.sign(px) * nx * bend;
                    pixels.data[offset + 1] = 128 + Math.sign(py) * ny * bend;
                    pixels.data[offset + 2] = 128;
                    pixels.data[offset + 3] = 255;
                }
            }
            context.putImageData(pixels, 0, 0);
            surface.filter.setAttribute('x', '-20');
            surface.filter.setAttribute('y', '-20');
            surface.filter.setAttribute('width', String(width + 40));
            surface.filter.setAttribute('height', String(height + 40));
            surface.map.setAttribute('width', String(width));
            surface.map.setAttribute('height', String(height));
            surface.map.setAttribute('href', canvas.toDataURL());
        }

        function addSurface(host, kind) {
            if (surfaces.has(host)) {
                const existing = surfaces.get(host);
                if (existing.layer.parentElement !== host) host.append(existing.layer);
                return;
            }
            const layer = document.createElement('i');
            layer.className = 'ui-glass-surface';
            layer.setAttribute('aria-hidden', 'true');
            host.dataset.uiGlass = kind;
            if (getComputedStyle(host).position === 'static') host.classList.add('ui-glass-anchor');
            host.append(layer);
            const surface = { layer, kind };
            surfaces.set(host, surface);
            resizeObserver.observe(host);
        }

        function addNav(nav, kind = 'navigation') {
            if (navs.has(nav)) {
                const state = navs.get(nav);
                if (state.indicator.parentElement !== nav) nav.append(state.indicator);
                return;
            }
            const indicator = document.createElement('span');
            indicator.className = 'ui-glass-indicator';
            indicator.setAttribute('aria-hidden', 'true');
            const layer = document.createElement('i');
            layer.className = 'ui-glass-surface';
            indicator.append(layer);
            nav.dataset.uiGlassNav = kind === 'mode' ? 'mode' : document.body.classList.contains('ui-learning') ? 'light' : 'blue';
            nav.append(indicator);
            const itemSelector = kind === 'mode' ? 'label:has(input[name="group"])' : '.side-footer, .nav-item';
            const activeSelector = kind === 'mode' ? 'label:has(input[name="group"]:checked)' : '.side-footer.active, .nav-item.active';
            const items = new Set(nav.querySelectorAll(itemSelector));
            navs.set(nav, { indicator, surface: { layer, kind }, itemSelector, activeSelector, items, active: null, geometry: '' });
            resizeObserver.observe(nav);
            items.forEach(item => resizeObserver.observe(item));
        }

        function refresh() {
            pending = false;
            document.querySelectorAll(panelSelector).forEach(host => addSurface(host, 'panel'));
            document.querySelectorAll(buttonSelector).forEach(host => addSurface(host, 'button'));
            document.querySelectorAll(modeSelector).forEach(nav => addNav(nav, 'mode'));
            document.querySelectorAll(navSelector).forEach(nav => addNav(nav));
            for (const [host, surface] of surfaces) {
                if (!host.isConnected) {
                    resizeObserver.unobserve(host);
                    surface.filter?.remove();
                    surfaces.delete(host);
                    continue;
                }
                if (!host.getClientRects().length) continue;
                updateLens(surface, surface.layer.offsetWidth, surface.layer.offsetHeight, parseFloat(getComputedStyle(surface.layer).borderTopLeftRadius) || 18);
            }
            for (const [nav, state] of navs) {
                if (!nav.isConnected) {
                    resizeObserver.unobserve(nav);
                    state.items.forEach(item => resizeObserver.unobserve(item));
                    state.surface.filter?.remove();
                    navs.delete(nav);
                    continue;
                }
                const items = new Set(nav.querySelectorAll(state.itemSelector));
                state.items.forEach(item => { if (!items.has(item)) resizeObserver.unobserve(item); });
                items.forEach(item => { if (!state.items.has(item)) resizeObserver.observe(item); });
                state.items = items;
                const active = nav.querySelector(state.activeSelector);
                if (!active || !active.getClientRects().length) {
                    state.indicator.hidden = true;
                    state.active = null;
                    continue;
                }
                state.indicator.hidden = false;
                const rect = active.getBoundingClientRect();
                const container = nav.getBoundingClientRect();
                const x = rect.left - container.left + nav.scrollLeft - nav.clientLeft;
                const y = rect.top - container.top + nav.scrollTop - nav.clientTop;
                const geometry = [x, y, rect.width, rect.height].map(Math.round).join(':');
                if (state.geometry === geometry) {
                    state.active = active;
                    continue;
                }
                // Animate a new selection; resizing and revealing a panel should align immediately.
                state.indicator.classList.toggle('ui-glass-settled', Boolean(state.active) && state.active !== active && !reduceMotion.matches);
                state.indicator.style.transform = `translate(${x}px, ${y}px)`;
                state.indicator.style.width = `${rect.width}px`;
                state.indicator.style.height = `${rect.height}px`;
                state.indicator.style.borderRadius = getComputedStyle(active).borderTopLeftRadius;
                state.geometry = geometry;
                state.active = active;
                updateLens(state.surface, rect.width, rect.height, parseFloat(getComputedStyle(active).borderTopLeftRadius) || 16);
            }
        }

        // One scheduled frame per DOM/geometry change, not a continuous render loop.
        function schedule() {
            if (pending) return;
            pending = true;
            requestAnimationFrame(refresh);
        }

        const resizeObserver = new ResizeObserver(schedule);
        const observer = new MutationObserver(records => {
            if (records.some(record => {
                if (record.target.closest?.('.ui-glass-surface, .ui-glass-indicator, .ui-glass-definitions')) return false;
                if (record.type === 'attributes') {
                    return record.target.matches('.side-footer, .nav-item, .module, input[name="group"]');
                }
                const surface = surfaces.get(record.target);
                if (surface && record.target.isConnected && surface.layer.parentElement !== record.target) {
                    // SpeechEval replaces innerText. Restore only our empty layer before the next paint.
                    record.target.append(surface.layer);
                    return true;
                }
                return [...record.addedNodes].some(node => node.nodeType === 1 && !node.matches('.ui-glass-surface, .ui-glass-indicator, .ui-glass-definitions'));
            })) schedule();
        });
        observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'checked'] });
        document.addEventListener('change', event => {
            if (event.target.matches('input[name="group"]') && event.target.closest(modeSelector)) schedule();
        });
        reduceTransparency.addEventListener('change', () => {
            navs.forEach(state => { state.geometry = ''; });
            schedule();
        });
        reduceMotion.addEventListener('change', () => {
            navs.forEach(state => state.indicator.classList.remove('ui-glass-settled'));
        });
        window.addEventListener('resize', schedule, { passive: true });
        refresh();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
