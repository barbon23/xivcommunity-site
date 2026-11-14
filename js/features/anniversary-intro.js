/**
 * anniversary-intro.js — One-time 1st-anniversary greeting on the homepage.
 *
 * The inline guard script in index.html decides BEFORE first paint whether
 * the intro should run: it checks the once-per-visitor flag and the
 * November 17, 2026 expiry date, adds the `intro-pending` class to <html>
 * and saves the flag. This module only acts when that class is present, so
 * on repeat visits (or after expiry, or without JavaScript) it does nothing
 * and the page loads normally.
 *
 * Confetti: pure CSS animations (no library). 14 pieces burst from behind
 * the logo, 30 more drift down the screen. Skipped entirely for visitors
 * with "reduce motion" enabled.
 *
 * TO REMOVE THE INTRO FOR GOOD (after it retires), delete every piece marked
 * ANNIVERSARY: the guard script + #anniv-intro markup in index.html, the
 * intro section in css/pages/home.css, the import + call in js/main.js and
 * this file.
 */

const AUTO_FINISH_MS = 5600; // how long the greeting shows before auto-fade
const FADE_MS = 520;         // must match the CSS fade duration

const CONFETTI_COLORS = ['#E8B64C', '#E0484D', '#EDEDED', '#F3D27A'];
const BURST_COUNT = 14;  // pieces fired from behind the logo
const SHOWER_COUNT = 30; // pieces drifting down the whole screen

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function makePiece(colors) {
  const piece = document.createElement('span');
  piece.className = 'anniv-piece';
  piece.style.setProperty(
    '--anniv-color',
    colors[Math.floor(Math.random() * colors.length)]
  );
  return piece;
}

/** Pieces fired outward from behind the logo. */
function buildBurst(container) {
  for (let i = 0; i < BURST_COUNT; i++) {
    const piece = makePiece(CONFETTI_COLORS);
    const angle = rand(0, Math.PI * 2);
    const dist = rand(130, 340);
    piece.classList.add('anniv-piece--burst');
    piece.style.left = '50%';
    piece.style.top = '38%';
    piece.style.setProperty('--tx', `${Math.round(Math.cos(angle) * dist)}px`);
    piece.style.setProperty('--ty', `${Math.round(Math.sin(angle) * dist)}px`);
    piece.style.setProperty('--rot', `${Math.round(rand(-540, 540))}deg`);
    piece.style.animationDelay = `${Math.round(rand(0, 220))}ms`;
    container.appendChild(piece);
  }
}

/** Pieces drifting down across the full width. */
function buildShower(container) {
  for (let i = 0; i < SHOWER_COUNT; i++) {
    const piece = makePiece(CONFETTI_COLORS);
    piece.classList.add('anniv-piece--shower');
    piece.style.left = `${rand(2, 98).toFixed(1)}%`;
    piece.style.setProperty('--r0', `${Math.round(rand(-360, 360))}deg`);
    piece.style.setProperty('--r1', `${Math.round(rand(-720, 720))}deg`);
    piece.style.animationDelay = `${Math.round(rand(300, 2600))}ms`;
    piece.style.animationDuration = `${Math.round(rand(2400, 4000))}ms`;
    container.appendChild(piece);
  }
}

function finishIntro(overlay) {
  if (overlay.classList.contains('is-closing')) return;
  overlay.classList.add('is-closing');
  window.setTimeout(() => {
    overlay.remove();
    document.documentElement.classList.remove('intro-pending');
  }, FADE_MS);
}

export function initAnniversaryIntro() {
  const root = document.documentElement;
  if (!root.classList.contains('intro-pending')) return;

  const overlay = document.getElementById('anniv-intro');
  if (!overlay) {
    // Markup missing (partial cleanup): unhide the page immediately.
    root.classList.remove('intro-pending');
    return;
  }

  let reduceMotion = false;
  try {
    reduceMotion = Boolean(
      window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch (e) {
    reduceMotion = false;
  }

  if (!reduceMotion) {
    buildBurst(overlay.querySelector('.anniv-burst'));
    buildShower(overlay.querySelector('.anniv-confetti'));
  }

  const finish = () => finishIntro(overlay);

  // Tap or click anywhere ends it; keyboard users get Escape/Enter/Space.
  overlay.addEventListener('click', finish);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      finish();
    }
  });

  window.setTimeout(finish, AUTO_FINISH_MS);
}
