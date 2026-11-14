/**
 * main.js — Shared bootstrapper included on every page.
 * Loads the editor-managed content first (data/config.json +
 * data/content.json), then renders the navbar, footer, page text slots
 * and homepage blocks, and finally the scroll reveal.
 */

import { loadConfig } from './config.js';
import { loadSiteContent, initSiteContent } from './features/site-content.js';
import { initPageContent } from './features/page-content.js';
import { initNavbar } from './components/navbar.js';
import { initFooter } from './components/footer.js';
import { initReveal } from './features/reveal.js';
import { initAnniversaryIntro } from './features/anniversary-intro.js';

// The one-time anniversary greeting runs first, so the logo and confetti
// are already on screen while the page content loads underneath. It only
// acts when the inline guard in index.html added `intro-pending`.
initAnniversaryIntro();

async function bootstrap() {
  const config = await loadConfig();
  const content = await loadSiteContent();

  initNavbar();
  initFooter(content);
  initPageContent(config, content);
  initSiteContent(content);
  initReveal();
}

bootstrap();
