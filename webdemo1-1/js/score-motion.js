/* Real score text stays readable and selectable; only its visual copy moves. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map();
  const numberPattern = /^[-+]?\d+(?:\.\d+)?$/;
  const timing = { duration: 460, easing: 'cubic-bezier(.2,.75,.2,1)', fill: 'both' };

  function visible(element) {
    return !document.hidden && element.isConnected && element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden';
  }

  function positions(element, text) {
    const bounds = element.getBoundingClientRect();
    const node = element.firstChild;
    const range = document.createRange();
    const decimal = text.includes('.') ? text.indexOf('.') : text.length;
    const result = new Map();
    [...text].forEach((character, index) => {
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const rect = range.getBoundingClientRect();
      const key = character === '.' ? 'decimal' : index < decimal ? `whole:${decimal - index - 1}` : `fraction:${index - decimal}`;
      result.set(key, { character, x: rect.left - bounds.left, width: rect.width });
    });
    return { width: bounds.width, characters: result };
  }

  function finish(element) {
    const state = running.get(element);
    if (!state) return;
    running.delete(element);
    state.animations.forEach(animation => animation.cancel());
    state.overlay.remove();
    element.classList.remove('score-motion-running');
    state.observer?.disconnect();
    // Restore a single text node for selection, translation and existing callers.
    element.replaceChildren(document.createTextNode(state.value));
  }

  function glyph(character) {
    const span = document.createElement('span');
    span.className = 'score-motion-glyph';
    span.dataset.character = character;
    return span;
  }

  function set(element, formattedValue) {
    if (!element) return;
    const value = String(formattedValue);
    const previous = element.textContent.trim();
    finish(element);
    if (previous === value) return;

    element.classList.add('score-motion');
    const canAnimate = numberPattern.test(previous) && numberPattern.test(value) &&
      !reducedMotion.matches && visible(element) && typeof element.animate === 'function';
    if (!canAnimate) {
      element.textContent = value;
      return;
    }

    const oldValue = positions(element, previous);
    const readable = document.createElement('span');
    readable.className = 'score-motion-value';
    readable.textContent = value;
    element.replaceChildren(readable);
    const nextValue = positions(readable, value);
    const overlay = document.createElement('span');
    overlay.className = 'score-motion-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.width = `${nextValue.width}px`;
    const state = { value, overlay, animations: [], observer: null };
    running.set(element, state);
    const direction = Number(value) >= Number(previous) ? 1 : -1;
    const keys = new Set([...oldValue.characters.keys(), ...nextValue.characters.keys()]);

    keys.forEach(key => {
      const before = oldValue.characters.get(key);
      const after = nextValue.characters.get(key);
      const slot = document.createElement('span');
      slot.className = 'score-motion-slot';
      const targetX = after?.x ?? before.x - oldValue.width + nextValue.width;
      const startX = before ? before.x - oldValue.width + nextValue.width : targetX;
      slot.style.left = `${targetX}px`;
      slot.style.width = `${after?.width ?? before.width}px`;
      overlay.append(slot);

      if (startX !== targetX) {
        state.animations.push(slot.animate([
          { transform: `translateX(${startX - targetX}px)` }, { transform: 'translateX(0)' }
        ], timing));
      }
      if (before?.character === after?.character) {
        slot.append(glyph(after.character));
        return;
      }
      if (before) {
        const outgoing = glyph(before.character);
        slot.append(outgoing);
        state.animations.push(outgoing.animate([
          { transform: 'translateY(0)', opacity: 1 },
          { transform: `translateY(${-direction * 105}%)`, opacity: 0 }
        ], timing));
      }
      if (after) {
        const incoming = glyph(after.character);
        slot.append(incoming);
        state.animations.push(incoming.animate([
          { transform: `translateY(${direction * 105}%)`, opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ], timing));
      }
    });

    element.append(overlay);
    element.classList.add('score-motion-running');
    if (oldValue.width !== nextValue.width) {
      state.animations.push(element.animate([
        { width: `${oldValue.width}px` }, { width: `${nextValue.width}px` }
      ], timing));
    }
    // A tab switch in the workspace should settle scores immediately.
    state.observer = new MutationObserver(() => {
      if (!visible(element)) finish(element);
    });
    let ancestor = element.parentElement;
    while (ancestor) {
      state.observer.observe(ancestor, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
      ancestor = ancestor.parentElement;
    }
    Promise.all(state.animations.map(animation => animation.finished.catch(() => {}))).then(() => {
      if (running.get(element) === state) finish(element);
    });
  }

  function settleAll() {
    [...running.keys()].forEach(finish);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) settleAll();
  });
  window.addEventListener('pagehide', settleAll);
  window.addEventListener('resize', settleAll, { passive: true });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) settleAll();
  });

  window.ScoreMotion = { set };
})();
