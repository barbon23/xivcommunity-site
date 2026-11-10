/**
 * debug-env.js — TEMPORARY diagnostic endpoint (GET /api/debug-env).
 * Data files env vars should remain separate and properly documented in README.
 *
 * Reports ONLY whether the OAuth variables are present (booleans) — never their
 * values — plus which deployment is serving the request. This settles the
 * "dashboard says saved but the function says missing" dispute.
 *
 * DELETE THIS FILE after OAuth setup is verified working.
 */

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;

  // Booleans + deployment identity only. No secret values, ever.
  res.end(
    JSON.stringify(
      {
        deployment: process.env.VERCEL_URL ?? null,
        target: process.env.VERCEL_ENV ?? null,
        hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
        hasGithubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
        hasAllowedDomains: !!process.env.ALLOWED_DOMAINS,
      },
      null,
      2
    )
  );
};
