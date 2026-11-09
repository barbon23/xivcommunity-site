/**
 * auth.js — First step of the Sveltia CMS OAuth flow (GET /api/auth).
 * Verifies the backend/domain, then 302-redirects to GitHub's authorize
 * endpoint with a CSRF state cookie. Adapted from the official
 * sveltia-cms-auth worker (MIT License, https://github.com/sveltia/sveltia-cms-auth).
 */

const {
  supportedProviders,
  getScope,
  getDomainPatterns,
  outputHTML,
  sendHTML,
  errorHTML,
} = require('./_shared.js');

const { randomUUID } = require('node:crypto');

/**
 * @param {object} req - Vercel Node request.
 * @param {object} res - Vercel Node response.
 */
module.exports = async (req, res) => {
  const env = process.env;
  const { searchParams } = new URL(req.url, 'http://localhost');
  const { provider, site_id: domain, scope: requestedScope } = Object.fromEntries(searchParams);

  if (!provider || !supportedProviders.includes(provider)) {
    return sendHTML(
      res,
      errorHTML('unknown', 'Your Git backend is not supported by the authenticator.', 'UNSUPPORTED_BACKEND')
    );
  }

  const scope = getScope(provider, requestedScope, env);

  const {
    ALLOWED_DOMAINS,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_HOSTNAME = 'github.com',
    GITLAB_CLIENT_ID,
    GITLAB_CLIENT_SECRET,
    GITLAB_HOSTNAME = 'gitlab.com',
  } = env;

  const domainPatterns = getDomainPatterns(ALLOWED_DOMAINS);

  // Check if the domain is whitelisted
  if (
    domainPatterns.length &&
    !domainPatterns.some((pattern) => new RegExp(pattern).test(domain ?? ''))
  ) {
    return sendHTML(
      res,
      errorHTML(provider, 'Your domain is not allowed to use the authenticator.', 'UNSUPPORTED_DOMAIN')
    );
  }

  // Generate a random string for CSRF protection
  const csrfToken = randomUUID().replaceAll('-', '');
  let authURL = '';

  // GitHub
  if (provider === 'github') {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return sendHTML(res, errorHTML(provider, 'OAuth app client ID or secret is not configured.', 'MISCONFIGURED_CLIENT'));
    }

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope,
      state: csrfToken,
    });

    authURL = `https://${GITHUB_HOSTNAME}/login/oauth/authorize?${params.toString()}`;
  }

  // GitLab
  if (provider === 'gitlab') {
    if (!GITLAB_CLIENT_ID || !GITLAB_CLIENT_SECRET) {
      return sendHTML(res, errorHTML(provider, 'OAuth app client ID or secret is not configured.', 'MISCONFIGURED_CLIENT'));
    }

    const { origin } = new URL(req.url, `https://${req.headers.host ?? 'localhost'}`);

    const params = new URLSearchParams({
      client_id: GITLAB_CLIENT_ID,
      redirect_uri: `${origin}/api/callback`,
      response_type: 'code',
      scope,
      state: csrfToken,
    });

    authURL = `https://${GITLAB_HOSTNAME}/oauth/authorize?${params.toString()}`;
  }

  // Redirect to the authorization server
  res.statusCode = 302;
  res.setHeader('Location', authURL);
  // Cookie expires in 10 minutes; `SameSite=Lax` makes sure the cookie is sent by the browser
  // after the redirect
  res.setHeader(
    'Set-Cookie',
    `csrf-token=${provider}_${csrfToken}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`
  );
  res.end();
};
