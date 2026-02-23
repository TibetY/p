/**
 * Netlify Edge Function — password gate
 *
 * Set the env var APP_PASSWORD in your Netlify site settings.
 * If it is not set the site is open to everyone.
 *
 * A correct password sets an HttpOnly cookie valid for 7 days.
 */

const COOKIE_NAME = 'quiz_auth';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getCookie(cookieHeader, name) {
  const entry = (cookieHeader || '')
    .split(';')
    .find((c) => c.trim().startsWith(name + '='));
  if (!entry) return null;
  // slice past "name=" — handles base64 padding "=" chars in the value
  return entry.trim().slice(name.length + 1);
}

function loginPage(error = false, redirect = '/') {
  const errorMsg = error
    ? `<p class="error">Incorrect password — try again.</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Speech Quiz — Login</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f1117; --surface: #1a1d27; --surface2: #23263a;
      --accent: #6c63ff; --accent2: #a78bfa;
      --red: #f87171; --text: #e2e8f0; --muted: #94a3b8;
    }
    html, body {
      height: 100%; background: var(--bg); color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    body { display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card {
      width: 100%; max-width: 360px;
      background: var(--surface);
      border-radius: 20px;
      padding: 40px 32px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
      display: flex; flex-direction: column; gap: 20px; align-items: center;
    }
    .icon { font-size: 3rem; }
    h1 {
      font-size: 1.4rem; font-weight: 700; text-align: center;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    input[type="password"] {
      width: 100%; padding: 14px 16px;
      background: var(--surface2); border: 1px solid #333; border-radius: 12px;
      color: var(--text); font-size: 1rem; outline: none;
    }
    input[type="password"]:focus { border-color: var(--accent); }
    button {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #fff; border: none; border-radius: 99px;
      font-size: 1rem; font-weight: 600; cursor: pointer;
      box-shadow: 0 4px 20px rgba(108,99,255,0.4);
    }
    .error { color: var(--red); font-size: 0.85rem; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h1>Speech Quiz</h1>
    <form method="POST" action="/_auth?redirect=${encodeURIComponent(redirect)}" style="width:100%;display:flex;flex-direction:column;gap:16px;">
      <input type="password" name="password" placeholder="Enter password" autofocus autocomplete="current-password" />
      <button type="submit">Enter</button>
    </form>
    ${errorMsg}
  </div>
</body>
</html>`;
}

export default async (request, context) => {
  const password = Deno.env.get('APP_PASSWORD');

  // No password configured → site is public
  if (!password) return context.next();

  const url = new URL(request.url);

  // Let Netlify internals pass through
  if (url.pathname.startsWith('/_netlify')) return context.next();

  // ── Handle login form POST ──────────────────────────────────────────────
  if (request.method === 'POST' && url.pathname === '/_auth') {
    let submitted = '';
    try {
      const form = await request.formData();
      submitted = form.get('password') ?? '';
    } catch {
      // malformed body — fall through to show login page
    }

    const redirect = url.searchParams.get('redirect') || '/';

    if (submitted === password) {
      const token = btoa(password);
      return new Response(null, {
        status: 302,
        headers: {
          Location: redirect,
          'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`,
        },
      });
    }

    return new Response(loginPage(true, redirect), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // ── Check auth cookie ───────────────────────────────────────────────────
  const cookieHeader = request.headers.get('cookie');
  const token = getCookie(cookieHeader, COOKIE_NAME);

  if (token && token === btoa(password)) {
    return context.next();
  }

  // ── Not authenticated — show login page ─────────────────────────────────
  const redirect = url.pathname + url.search;
  return new Response(loginPage(false, redirect), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
