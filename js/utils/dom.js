/**
 * dom.js — Lightweight DOM helpers
 * Pure utility functions, no side effects.
 */

/**
 * querySelector with a required element assertion.
 * @param {string} selector
 * @param {Document|Element} [root=document]
 * @returns {Element|null}
 */
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * querySelectorAll returning a real Array.
 * @param {string} selector
 * @param {Document|Element} [root=document]
 * @returns {Element[]}
 */
export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/**
 * Create an element with optional attributes and children.
 * @param {string} tag
 * @param {Object} [attrs={}]
 * @param {...(string|Node)} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      node.className = val;
    } else if (key.startsWith('on') && typeof val === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (val !== null && val !== undefined && val !== false) {
      node.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(
      typeof child === 'string' ? document.createTextNode(child) : child
    );
  }
  return node;
}

/**
 * Inject an HTML string into a container element.
 * @param {Element} container
 * @param {string} html
 */
export function setHTML(container, html) {
  container.innerHTML = html;
}

/**
 * Show/hide an element using a data attribute.
 * @param {Element} el
 * @param {boolean} visible
 */
export function toggle(element, visible) {
  element.hidden = !visible;
}

/**
 * Add event listener and return a cleanup function.
 * @param {EventTarget} target
 * @param {string} event
 * @param {Function} handler
 * @param {object} [opts]
 * @returns {Function} cleanup
 */
export function on(target, event, handler, opts) {
  target.addEventListener(event, handler, opts);
  return () => target.removeEventListener(event, handler, opts);
}

/**
 * Emit a custom event on an element.
 * @param {Element} element
 * @param {string} name
 * @param {*} [detail]
 */
export function emit(element, name, detail) {
  element.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
}
