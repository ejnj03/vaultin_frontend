// Runs on every request Cloudflare Pages serves, for every hostname the
// project answers on — including vaultin-frontend.pages.dev and the
// per-branch <hash>.vaultin-frontend.pages.dev preview URLs.
//
// Cloudflare provides no way to switch the pages.dev hostname off, so the
// production site is reachable there without passing the Cloudflare Access
// gate that protects vaultin.app (PLT-7). This redirects any non-canonical
// host to the apex so there is exactly one way into the app.

const CANONICAL_HOST = 'vaultin.app';

// Hosts allowed to serve the app directly. www is listed so it is not
// caught by the redirect below and bounced twice.
const ALLOWED_HOSTS = new Set([CANONICAL_HOST, `www.${CANONICAL_HOST}`]);

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (ALLOWED_HOSTS.has(url.hostname)) {
    return context.next();
  }

  // Preserve path and query so a deep link still lands in the right place.
  url.hostname = CANONICAL_HOST;
  url.protocol = 'https:';
  url.port = '';

  // 302 rather than 301: browsers cache permanent redirects aggressively and
  // per-host, which would make re-enabling preview URLs painful to undo.
  return Response.redirect(url.toString(), 302);
}
