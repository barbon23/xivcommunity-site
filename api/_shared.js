/**
 * _shared.js — Helpers shared by the /api/auth and /api/callback functions,
 * adapted from the official sveltia-cms-auth worker (MIT License,
 * https://github.com/sveltia/sveltia-cms-auth). Only the GitHub parts of the
 * protocol matter for this site, but GitLab support is kept as-is.
 *
 * This file starts with `_` so Vercel does not deploy it as an endpoint.
 */

/** List of supported OAuth providers. */
const supportedProviders = ['github', 'gitlab'];

/**
 * OAuth scopes for each provider: the scope to request when the client doesn't ask for one, the
 * separator the provider expects between multiple scopes, and the scopes that may be requested.
 * Sveltia CMS can ask for a narrower scope via its `auth_scope` backend option; anything
 * unrecognized falls back to the default. GitHub's `workflow` scope only counts when the
 * GITHUB_ALLOW_WORKFLOW_SCOPE environment variable is `true`.
 */
const providerScopes = {
  github: {
    default: 'repo,user',
    separator: ',',
    allowed: ['repo', 'public_repo', 'user', 'read:user', 'user:email'],
  },
  gitlab: {
    default: 'api',
    separator: ' ',
    allowed: ['api', 'read_api', 'read_user', 'read_repository', 'write_repository'],
  },
};

/**
 * Work out the OAuth scope to request from the given provider.
 * @param {string} provider — Backend name, e.g. `github`.
 * @param {string} [requested] — The `scope` parameter from the request, if any.
 * @param {{ [key: string]: string }} env — Environment variables.
 * @returns {string} Scope to request.
 */
const getScope = (provider, requested, env) => {
  const { default: fallback, separator, allowed } = providerScopes[provider];
  let scopes = (requested ?? '').split(/[\s,]+/).filter(Boolean);
  const allowWorkflow = provider === 'github' && env.GITHUB_ALLOW_WORKFLOW_SCOPE === 'true';

  if (!allowWorkflow && scopes.includes('workflow')) {
    console.warn(
      `Ignoring the "workflow" scope for ${provider}; set GITHUB_ALLOW_WORKFLOW_SCOPE to "true" ` +
        'to allow it.'
    );

    scopes = scopes.filter((scope) => scope !== 'workflow');
  }

  if (!scopes.length) {
    return fallback;
  }

  if (scopes.every((scope) => allowed.includes(scope) || (allowWorkflow && scope === 'workflow'))) {
    return scopes.join(separator);
  }

  console.warn(
    `Ignoring the unsupported "${requested}" scope for ${provider}; requesting "${fallback}".`
  );

  return fallback;
};

/**
 * Escape the given string for safe use in a regular expression.
 * @param {string} str — Original string.
 * @returns {string} Escaped string.
 */
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Convert the `ALLOWED_DOMAINS` environment variable into a list of anchored regular expression
 * sources, used identically in the redirect handler and the embedded client-side script.
 * @param {string} [allowedDomains] — Comma-separated list of hostnames, which may contain `*`.
 * @returns {string[]} Regular expression sources. Empty if the variable is not configured.
 */
const getDomainPatterns = (allowedDomains) =>
  (allowedDomains ?? '')
    .split(/,/)
    .map((str) => str.trim())
    .filter(Boolean)
    // Escape the input, then replace a wildcard with a regex
    .map((str) => `^${escapeRegExp(str).replaceAll('\\*', '.+')}$`);

/**
 * Serialize the given value for safe use in an inline `<script>` block.
 * @param {string | boolean | string[]} value — Value to be serialized.
 * @returns {string} JavaScript literal.
 */
const serialize = (value) => JSON.stringify(value ?? null).replaceAll('<', '\\u003c');

/**
 * Build the HTML response that communicates with the popup opener, following the postMessage
 * protocol expected by Sveltia CMS:
 *   1. The page sends `authorizing:{provider}` once, on load, to wake up the opener.
 *   2. The opener echoes `authorizing:{provider}` back with its origin.
 *   3. If the origin is trusted, the page replies with
 *      `authorization:{provider}:{state}` where state is `success` or `error`, followed by
 *      a JSON payload with the token or the error.
 * @param {object} args — Options.
 * @param {string} [args.provider] — Backend name, e.g. `github`.
 * @param {string} [args.token] — OAuth token.
 * @param {string} [args.error] — Error message when an OAuth token is not available.
 * @param {string} [args.errorCode] — Error code to be localized in Sveltia CMS.
 * @param {{ [key: string]: string }} [args.env] — Environment variables.
 * @returns {{ body: string, headers: object }} HTML body + response headers.
 */
const outputHTML = ({ provider = 'unknown', token, error, errorCode, env = {} }) => {
  const state = error ? 'error' : 'success';
  const content = error ? { provider, error, errorCode } : { provider, token };

  const body = `
      <!doctype html><html><body><script>
        (() => {
          const trustedPatterns = ${serialize(getDomainPatterns(env.ALLOWED_DOMAINS))};
          const hasToken = ${serialize(!!token)};

          const isTrusted = (origin) => {
            try {
              const { hostname } = new URL(origin);

              return trustedPatterns.some((pattern) => new RegExp(pattern).test(hostname));
            } catch {
              return false;
            }
          };

          window.addEventListener('message', ({ data, origin }) => {
            if (data !== 'authorizing:${provider}') {
              return;
            }

            // The origin of a message event is set by the browser and cannot be forged by the
            // sender, so it is the only reliable indication of who opened this popup. An error
            // carries no secret, so it is always passed through to keep the sign-in screen
            // informative
            if (hasToken && trustedPatterns.length && !isTrusted(origin)) {
              return;
            }

            window.opener?.postMessage(
              'authorization:${provider}:${state}:${JSON.stringify(content)}',
              origin
            );
          });
          window.opener?.postMessage('authorizing:${provider}', '*');
        })();
      </script></body></html>
    `;

  return {
    body,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      // Delete CSRF token
      'Set-Cookie':
        'csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure',
    },
  };
};

/**
 * Helper to send an outputHTML result through a Vercel Node response.
 * Uses native methods (`statusCode`, `setHeader`, `end`) so it works on any
 * runtime version, with or without the injected response helpers.
 * @param {object} res - Node-style HTTP response.
 * @param {{ body: string, headers: object }} output - Result of outputHTML().
 */
const sendHTML = (res, output) => {
  for (const [key, value] of Object.entries(output.headers)) {
    res.setHeader(key, value);
  }

  res.statusCode = 200;
  res.end(output.body);
};

/**
 * Standard error HTML for the given provider (or `unknown` when not yet known).
 * @param {string} [provider]
 * @param {string} error
 * @param {string} errorCode
 * @returns {{ body: string, headers: object }}
 */
const errorHTML = (provider, error, errorCode) => outputHTML({ provider, error, errorCode });

module.exports = {
  supportedProviders,
  providerScopes,
  getScope,
  escapeRegExp,
  getDomainPatterns,
  serialize,
  outputHTML,
  sendHTML,
  errorHTML,
};
