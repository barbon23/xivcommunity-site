/**
 * reveal.js — Gentle fade-up on scroll using IntersectionObserver.
 * Respects prefers-reduced-motion. No dependencies.
 *
 * Usage: add `data-reveal` to any element you want to fade in.
 * Optional: `data-reveal-delay="200"` for staggered children.
 */

const THRESHOLD = 0.12;
const BASE_DURATION = 500; // ms

/** CSS injected once into <head> */
const REVEAL_STYLES = `
  [data-reveal] {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity ${BASE_DURATION}ms ease, transform ${BASE_DURATION}ms ease;
  }
  [data-reveal].is-visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * Initialise scroll-reveal for all [data-reveal] elements.
 * Safe to call multiple times (guard on dataset.revealInit).
 */
export function initReveal() {
  // Respect user preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Make everything visible immediately, no animation
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // Inject styles once
  if (!document.getElementById('reveal-styles')) {
    const style = document.createElement('style');
    style.id = 'reveal-styles';
    style.textContent = REVEAL_STYLES;
    document.head.appendChild(style);
  }

  const targets = document.querySelectorAll('[data-reveal]:not([data-reveal-init])');

  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el     = entry.target;
      const delay  = Number(el.dataset.revealDelay || 0);

      setTimeout(() => {
        el.classList.add('is-visible');
      }, delay);

      observer.unobserve(el);
    });
  }, { threshold: THRESHOLD });

  targets.forEach(el => {
    el.setAttribute('data-reveal-init', '');
    observer.observe(el);
  });
}

/**
 * Stagger child [data-reveal] items inside a container.
 * Call after dynamically injected content is added to the DOM.
 *
 * @param {Element} container
 * @param {number}  [step=80]  — ms between each child's delay
 */
export function staggerReveal(container, step = 80) {
  const children = Array.from(container.querySelectorAll('[data-reveal]'));
  children.forEach((child, i) => {
    child.dataset.revealDelay = String(i * step);
  });
  initReveal();
}
