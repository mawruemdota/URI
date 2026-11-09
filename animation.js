/* URI Animation Manager 1.0
 * Progressive enhancement: the invitations remain visible without scripts,
 * GSAP, IntersectionObserver, or animation permissions.
 */
(function () {
  'use strict';
  const U = window.URIBuilder;
  if (!U) return;
  const presets = ['none', 'elegant', 'cinematic', 'playful'];
  const flags = ['entrance', 'scroll', 'photos', 'hover', 'decorations'];
  const defaults = Object.freeze({
    preset: 'none', speed: 1, entrance: true, scroll: true,
    photos: true, hover: true, decorations: false
  });
  const instances = new WeakMap();
  const safe = value => typeof esc === 'function' ? esc(String(value)) : String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normalize(input) {
    const v = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const candidate = Number(v.speed);
    const speed = Number.isFinite(candidate) && candidate >= 0.5 && candidate <= 1.5
      ? Math.round(candidate * 4) / 4 : defaults.speed;
    const output = {
      preset: presets.includes(v.preset) ? v.preset : defaults.preset,
      speed
    };
    for (const key of flags) output[key] = typeof v[key] === 'boolean' ? v[key] : defaults[key];
    return output;
  }
  const read = e => normalize(e?.animation);
  const model = U.model;
  U.model = function (e) {
    const result = model(e);
    e.animation = normalize(e.animation);
    return result;
  };
  const originalRender = U.render;
  U.render = function (e) {
    const cfg = read(e);
    const attrs = ' data-uri-preset="' + cfg.preset + '"' +
      flags.map(k => ' data-uri-' + k + '="' + (cfg[k] ? 'on' : 'off') + '"').join('');
    return originalRender(e)
      .replace(' data-visible-features=', attrs + ' data-visible-features=')
      .replace(' style="--wb-bg:', ' style="--uri-anim-duration:' + Math.round(720 / cfg.speed) + 'ms;--wb-bg:');
  };
  const originalPayload = U.payload;
  U.payload = e => ({ ...originalPayload(e), animation: read(e) });

  function field(label, markup) {
    return '<label class="uri-anim-field"><span>' + label + '</span>' + markup + '</label>';
  }
  function manager(e) {
    const a = read(e);
    const options = [
      ['none', 'None — no animations'],
      ['elegant', 'Elegant — gentle transitions'],
      ['cinematic', 'Cinematic — bold reveals'],
      ['playful', 'Playful — lively movement']
    ];
    const pick = field('Animation style', '<select data-uri-animation-preset onchange="uriAnimationSet(\'preset\',this.value)">' +
      options.map(([key,label]) => '<option value="' + key + '"' + (a.preset === key ? ' selected' : '') + '>' + label + '</option>').join('') + '</select>');
    const speed = field('Animation speed',
      '<input type="range" min="0.5" max="1.5" step="0.25" value="' + a.speed +
      '" oninput="uriAnimationSet(\'speed\',this.value)" aria-label="Animation speed">' +
      '<small id="uriAnimationSpeed">' + a.speed.toFixed(2) + '× speed</small>');
    const labels = [
      ['entrance', 'Page entrance'], ['scroll', 'Scroll reveals'],
      ['photos', 'Photo movement'], ['hover', 'Button interactions'],
      ['decorations', 'Animated decorations']
    ];
    const switches = labels.map(([key,label]) =>
      '<label class="uri-anim-switch"><span>' + label + '</span><input type="checkbox" ' +
      (a[key] ? 'checked ' : '') + 'onchange="uriAnimationSet(\'' + key + '\',this.checked)"></label>'
    ).join('');
    return '<section class="uri-animation-manager" aria-labelledby="uriAnimTitle">' +
      '<div class="uri-animation-heading"><h4 id="uriAnimTitle">Animation Manager</h4><p>Make your invitation feel more alive.</p></div>' +
      '<div class="uri-animation-fields">' + pick + speed + '</div>' +
      '<fieldset class="uri-animation-toggles"><legend>Animated elements</legend>' + switches + '</fieldset>' +
      '<div class="uri-animation-actions"><button type="button" class="btn small" onclick="uriAnimationReplay()">Play animations in preview</button>' +
      '<span>Preview is static until you press Play. Guests see the enabled effects.</span></div>' +
      '<p class="uri-animation-accessibility">Reduced-motion preferences are always respected. Photos and content stay visible when animation support is unavailable.</p></section>';
  }
  window.uriAnimationSet = function (key, value) {
    const e = typeof current === 'function' ? current() : null;
    if (!e || e.type !== 'Wedding' || !['preset', 'speed', ...flags].includes(key)) return;
    const old = read(e), next = { ...old };
    if (key === 'preset') {
      if (!presets.includes(value)) return;
      next.preset = value;
    } else if (key === 'speed') {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0.5 || n > 1.5) return;
      next.speed = Math.round(n * 4) / 4;
    } else {
      next[key] = value === true;
    }
    e.animation = normalize(next);
    if (!U.persist()) {
      e.animation = old;
      if (typeof eventPage === 'function') eventPage();
      return;
    }
    const counter = document.getElementById?.('uriAnimationSpeed');
    if (counter) counter.textContent = e.animation.speed.toFixed(2) + '× speed';
    U.refresh?.();
  };
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function reveal(node, cfg, instance) {
    if (!node || node.dataset.uriReveal !== 'pending') return;
    node.dataset.uriReveal = 'shown';
    if (cfg.preset === 'cinematic' && window.gsap?.fromTo && !reducedMotion()) {
      const tween = window.gsap.fromTo(node, {opacity: 0, y: 24},
        {opacity: 1, y: 0, duration: 0.75 / cfg.speed, ease: 'power2.out', overwrite: 'auto'});
      instance.tweens.push(tween);
    }
  }
  function dispose(article) {
    const previous = instances.get(article);
    if (!previous) return;
    previous.observer?.disconnect();
    for (const tween of previous.tweens) tween?.kill?.();
    article.querySelectorAll?.('[data-uri-reveal]').forEach(n => {
      n.dataset.uriReveal = 'shown';
      n.classList.remove('uri-anim-target');
      n.style.removeProperty?.('opacity');
      n.style.removeProperty?.('transform');
    });
    article.classList.remove('uri-anim-active');
    instances.delete(article);
  }
  function animate(article, options = {}) {
    if (!article || !article.dataset?.uriPreset) return false;
    if (article.closest?.('#wbLivePreview') && !options.preview) return false;
    if (article.closest?.('.template-preview, .wb-cover-mini')) return false;
    if (instances.has(article)) {
      if (!options.replay) return true;
      dispose(article);
    }
    const cfg = normalize({
      preset: article.dataset.uriPreset,
      speed: Number((article.style.getPropertyValue?.('--uri-anim-duration') || '').replace('ms','')) > 0
        ? 720 / Number(article.style.getPropertyValue('--uri-anim-duration').replace('ms','')) : 1,
      ...Object.fromEntries(flags.map(k => [k, article.dataset['uri' + k[0].toUpperCase() + k.slice(1)] === 'on']))
    });
    if (cfg.preset === 'none' || reducedMotion()) return false;
    const sectionNodes = [...article.querySelectorAll('.wb-flow > [data-feature]')];
    const instance = { observer: null, tweens: [] };
    instances.set(article, instance);
    article.classList.add('uri-anim-active');
    const targets = sectionNodes.filter((_, i) => i === 0 ? cfg.entrance : cfg.scroll);
    targets.forEach(section => {
      section.classList.add('uri-anim-target');
      section.dataset.uriReveal = 'pending';
    });
    if (targets.length) {
      const first = targets[0];
      if (sectionNodes[0] === first && cfg.entrance) {
        window.requestAnimationFrame ? window.requestAnimationFrame(() => reveal(first, cfg, instance))
          : setTimeout(() => reveal(first, cfg, instance), 0);
      }
      const scrollTargets = targets.filter(n => n !== first || !cfg.entrance || sectionNodes[0] !== first);
      if (scrollTargets.length && typeof window.IntersectionObserver === 'function') {
        instance.observer = new window.IntersectionObserver(entries => entries.forEach(entry => {
          if (entry.isIntersecting) {
            reveal(entry.target, cfg, instance);
            instance.observer?.unobserve(entry.target);
          }
        }), {threshold: 0.06, rootMargin: '0px 0px -5% 0px'});
        scrollTargets.forEach(n => instance.observer.observe(n));
      } else scrollTargets.forEach(n => reveal(n, cfg, instance));
    }
    return true;
  }
  function mount(root = document, options = {}) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    if (root.matches?.('.uri-builder-site')) animate(root, options);
    root.querySelectorAll('.uri-builder-site[data-uri-preset]').forEach(article => animate(article, options));
  }
  window.uriAnimationReplay = () => {
    const preview = document.getElementById('wbLivePreview');
    if (preview) mount(preview, {preview: true, replay: true});
  };
  window.URIAnimation = { normalize, read, manager, mount, animate, reducedMotion };

  // Public pages and full-page previews are mounted after their HTML is inserted.
  // Only child-list changes are watched, preventing animation class updates from looping.
  function init() {
    const app = document.getElementById?.('app');
    if (!app) return;
    const queue = () => window.requestAnimationFrame ?
      window.requestAnimationFrame(() => mount(app)) : setTimeout(() => mount(app), 0);
    queue();
    if (typeof window.MutationObserver === 'function') {
      const observer = new window.MutationObserver(queue);
      observer.observe(app, {childList: true, subtree: true});
    }
    if (window.matchMedia) {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      media.addEventListener?.('change', () => {
        app.querySelectorAll?.('.uri-builder-site.uri-anim-active').forEach(article => dispose(article));
        if (!media.matches) queue();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener?.('DOMContentLoaded', init, {once: true});
  else init();
})();