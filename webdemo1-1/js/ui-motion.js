/* Visual effects only. Existing modules own their visibility and all actions. */
(() => {
  function start() {
    if (!document.body.matches('[class*="ui-"]')) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const activeAnimations = new Set();
    const elementAnimations = new WeakMap();
    const visibility = new WeakMap();
    const panels = '.main-container > .module, #purchase-modal, [role="dialog"], dialog, .modal, [id$="-modal"]';
    const controls = 'button, input[type="button"], input[type="submit"], [role="button"], a.login-button, .index-button-container a, a.btn, a.cta-button, .tools';
    let held = null;

    function shown(element) {
      return element.isConnected && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
    }

    function animate(element, frames, options = {}) {
      if (reduced.matches || !element.animate || !shown(element)) return null;
      elementAnimations.get(element)?.cancel();
      const animation = element.animate(frames, {
        duration: 360,
        easing: 'cubic-bezier(.2,.75,.25,1)',
        ...options
      });
      activeAnimations.add(animation);
      elementAnimations.set(element, animation);
      const forget = () => {
        activeAnimations.delete(animation);
        if (elementAnimations.get(element) === animation) elementAnimations.delete(element);
      };
      animation.addEventListener('finish', () => {
        if (options.fill !== 'forwards') forget();
      }, { once: true });
      animation.addEventListener('cancel', forget, { once: true });
      return animation;
    }

    function enterPanel(element) {
      const visible = shown(element);
      if (visibility.get(element) === visible) return;
      visibility.set(element, visible);
      if (!visible) {
        activeAnimations.forEach(animation => {
          const target = animation.effect?.target;
          if (target === element || (target instanceof Element && element.contains(target))) animation.cancel();
        });
        return;
      }
      if (element.matches('.module')) {
        const cards = [...element.querySelectorAll('.practice-layout > *, .profile-stats-container > *, .exam-features-grid > *, .AllTools > .tools')]
          .filter(shown).slice(0, 4);
        if (cards.length > 1) {
          cards.forEach((card, index) => animate(card,
            [{ opacity: .82, translate: '0 6px' }, { opacity: 1, translate: '0 0' }],
            { duration: 260, delay: index * 24 }));
        } else {
          animate(element, [{ opacity: .85, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 260 });
        }
      } else {
        const content = element.querySelector('.modal-content, .dialog-content, [role="document"]') || element;
        animate(content, [
          { opacity: .6, translate: '0 16px', scale: '.97' },
          { opacity: 1, translate: '0 0', scale: '1' }
        ], { duration: 330 });
        const overlay = element.querySelector('.modal-overlay');
        if (overlay) animate(overlay, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      }
    }

    function collectPanels(node, collection) {
      if (!(node instanceof Element)) return;
      if (node.matches(panels)) collection.add(node);
      node.querySelectorAll(panels).forEach(element => collection.add(element));
    }

    document.querySelectorAll(panels).forEach(enterPanel);
    const observer = new MutationObserver(records => {
      const changed = new Set();
      for (const record of records) {
        if (record.type === 'attributes') {
          if (record.target.matches(panels)) changed.add(record.target);
        } else {
          record.addedNodes.forEach(node => collectPanels(node, changed));
          const parent = record.target.closest(panels);
          if (parent && !visibility.has(parent)) changed.add(parent);
        }
      }
      changed.forEach(enterPanel);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open']
    });

    const header = document.querySelector('.ui-entry .header-container');
    if (header) {
      let compact;
      const updateHeader = () => {
        const next = window.scrollY > 32;
        if (next !== compact) {
          compact = next;
          header.classList.toggle('ui-header-scrolled', next);
        }
      };
      updateHeader();
      window.addEventListener('scroll', updateHeader, { passive: true });
    }

    if ('IntersectionObserver' in window) {
      const reveal = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          reveal.unobserve(entry.target);
          animate(entry.target, [
            { opacity: .55, translate: '0 22px' },
            { opacity: 1, translate: '0 0' }
          ], { duration: 580 });
        });
      }, { threshold: .08, rootMargin: '0px 0px -28px 0px' });
      document.querySelectorAll('.ui-entry > .video, .ui-entry > .bottom-block, .ui-entry > .testimonial-container, .ui-entry > .login-container')
        .forEach(element => reveal.observe(element));
    }

    function controlAt(target) {
      const element = target instanceof Element ? target.closest(controls) : null;
      if (!element || element.closest('#sidebar') || element.matches(':disabled, [aria-disabled="true"], [aria-busy="true"]') || element.closest('[inert]')) return null;
      return element;
    }

    function release(rebound = true) {
      if (!held) return;
      const { element, animation } = held;
      const scale = getComputedStyle(element).scale;
      held = null;
      animation?.cancel();
      if (rebound) animate(element, [
        { scale: scale === 'none' ? '1' : scale },
        { scale: '1' }
      ], { duration: 180 });
    }

    function press(element) {
      if (reduced.matches) return;
      release(false);
      const scale = element.matches('.tools') ? '.993' : '.98';
      held = { element, animation: animate(element, [{ scale: '1' }, { scale }], { duration: 105, fill: 'forwards' }) };
    }

    document.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const element = controlAt(event.target);
      if (element) press(element);
    }, { passive: true });
    document.addEventListener('pointerup', () => release(), { passive: true });
    document.addEventListener('pointercancel', () => release(false), { passive: true });
    document.addEventListener('keydown', event => {
      if (event.repeat || !['Enter', ' '].includes(event.key)) return;
      const element = controlAt(event.target);
      if (element && (event.key === 'Enter' || !element.matches('a'))) press(element);
    });
    document.addEventListener('keyup', event => {
      if (['Enter', ' '].includes(event.key)) release();
    });
    window.addEventListener('blur', () => release(false));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) release(false);
    });
    reduced.addEventListener('change', () => {
      if (!reduced.matches) return;
      release(false);
      activeAnimations.forEach(animation => animation.cancel());
      activeAnimations.clear();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
