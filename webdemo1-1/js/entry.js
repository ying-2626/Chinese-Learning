// 首页交互：导航、测评示意动画、滚动进入、反馈大图
(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 导航：滚动阴影与窄屏菜单
    const nav = document.getElementById('site-nav');
    const toggle = nav.querySelector('.nav-toggle');
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
    nav.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    }));

    // 测评示意：逐字着色、分数滚动
    const card = document.getElementById('demo-card');
    card.querySelectorAll('.demo-sentence li').forEach((li, i) => li.style.setProperty('--i', i));

    function countUp(el) {
        const target = Number(el.dataset.count);
        if (reduced) { el.textContent = target; return; }
        const start = performance.now();
        const step = now => {
            const t = Math.min(1, (now - start) / 1300);
            el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    setTimeout(() => {
        card.classList.add('scored');
        card.querySelectorAll('[data-count]').forEach(countUp);
    }, reduced ? 0 : 900);

    // 滚动进入
    const items = document.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('in'));
    } else {
        const io = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in');
            io.unobserve(entry.target);
        }), { rootMargin: '0px 0px -8% 0px' });
        items.forEach(el => io.observe(el));
    }

    // 反馈图大图查看
    const box = document.getElementById('lightbox');
    const boxImg = box.querySelector('img');
    document.querySelectorAll('.shot').forEach(shot => shot.addEventListener('click', () => {
        boxImg.src = shot.dataset.full;
        boxImg.alt = shot.querySelector('img').alt;
        box.showModal();
    }));
    box.querySelector('.lightbox-close').addEventListener('click', () => box.close());
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
})();
