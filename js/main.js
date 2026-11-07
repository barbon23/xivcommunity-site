/**
 * main.js — Shared bootstrapper included on every page.
 * Initialises navbar, footer and scroll reveal.
 */

import { initNavbar } from './components/navbar.js';
import { initFooter } from './components/footer.js';
import { initReveal } from './features/reveal.js';

initNavbar();
initFooter();
initReveal();
