/**
 * callback.js — Second step of the Sveltia CMS OAuth flow (GET /api/callback).
 * GitHub redirects here with the authorization code; validates the CSRF state
 * cookie, exchanges the code for an access token, and answers with the HTML
 * postMessage handshake Sveltia CMS expects in the popup. Adapted from the
 * official sveltia-cms-auth worker (MIT License,
 * https://github.com/sveltia/sveltia-cms-auth).
 */

const {
  supportedProviders,
  outputHTML,
  sendHTML,
  errorHTML,
} = require('./_shared.js');

/**
 * @param {object} req - Vercel Node request.
 * @param {object} res - Vercel Node response.
 */
module.exports = async (req, res) => {
  const env = process.env;
  const { searchParams } = new URL(req.url, 'http://localhost');
  const { code, state } = Object.fromEntries(searchParams);

  const [, provider, csrfToken] =
    req.headers.cookie?.match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b/) ?? [];

  if (!provider || !supportedProviders.includes(provider)) {
    return sendHTML(res, errorHTML('unknown', 'Your Git backend is not supported by the authenticator.', 'UNSUPPORTED_BACKEND'));
  }

  if (!code || !state) {
    return sendHTML(res, errorHTML(provider, 'Failed to receive an authorization code. Please try again later.', 'AUTH_CODE_REQUEST_FAILED'));
  }

  if (!csrfToken || state !== csrfToken) {
    return sendHTML(res, errorHTML(provider, 'Potential CSRF attack detected. Authentication flow aborted.', 'CSRF_DETECTED'));
  }

  const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_HOSTNAME = 'github.com',
    GITLAB_CLIENT_ID,
    GITLAB_CLIENT_SECRET,
    GITLAB_HOSTNAME = 'gitlab.com',
  } = env;

  let tokenURL = '';
  let requestBody = {};

  // GitHub
  if (provider === 'github') {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return sendHTML(res, errorHTML(provider, 'OAuth app client ID or secret is not configured.', 'MISCONFIGURED_CLIENT'));
    }

    tokenURL = `https://${GITHUB_HOSTNAME}/login/oauth/access_token`;
    requestBody = {
      code,
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
    };
  }

  if (provider === 'gitlab') {
    if (!GITLAB_CLIENT_ID || !GITLAB_CLIENT_SECRET) {
      return sendHTML(res, errorHTML(provider, 'OAuth app client ID or secret is not configured.', 'MISCONFIGURED_CLIENT'));
    }

    const { origin } = new URL(req.url, `https://${req.headers.host ?? 'localhost'}`);

    tokenURL = `https://${GITLAB_HOSTNAME}/oauth/token`;
    requestBody = {
      code,
      client_id: GITLAB_CLIENT_ID,
      client_secret: GITLAB_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: `${origin}/api/callback`,
    };
  }

  let response;
  let token = '';
  let error = '';

  try {
    response = await fetch(tokenURL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    // Handled below
  }

  if (!response) {
    return sendHTML(res, errorHTML(provider, 'Failed to request an access token. Please try again later.', 'TOKEN_REQUEST_FAILED'));
  }

  try {
    ({ access_token: token, error } = await response.json());
  } catch {
    return sendHTML(res, errorHTML(provider, 'Server responded with malformed data. Please try again later.', 'MALFORMED_RESPONSE'));
  }

  return sendHTML(res, outputHTML({ env, provider, token, error }));
};
