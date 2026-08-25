# WB

A public website plus a private AI studio that only you can open.

Visitors see `/`. You are the only person who can open `/studio`, talk to the designer, and publish. Each message writes the live site immediately — there is no separate “go live” step.

## Two URLs

| URL | Who can open it |
| --- | --- |
| `/` | Everyone. This is the website. |
| `/studio` | Only you, with `ADMIN_PASSWORD`. Search engines are told to skip it. |

The studio is not linked from the public site.

## Run it

```bash
cp .env.example .env.local
```

Set a password only you know (8+ characters):

```
ADMIN_PASSWORD=pick-a-long-private-password
```

Then:

```bash
npm install
npm run dev
```

- Public site: [http://localhost:3000](http://localhost:3000)
- Private studio: [http://localhost:3000/studio](http://localhost:3000/studio)

`npm test`, `npm run lint`, and `npm run build` are the checks.

## Ask the designer, it goes public

In `/studio`, type things like:

- “Turn this into a bakery called Hearth & Crumb”
- “Make a dark editorial portfolio”
- “Add pricing and an FAQ”
- “My email is you@example.com and I’m in Austin”

The preview on the right is the same data the public homepage reads. Refresh `/` in another tab and it already matches.

Without an API key, a built-in designer still publishes (business types, palettes, names, contact, extra sections). Paste an OpenAI-compatible key in **Settings** (or set `OPENAI_API_KEY`) for full language-model rewrites. That key is stored in `data/settings.json`, which is gitignored and never rendered on the public site.

## Deploy

The public site updates by writing `data/site.json` on the server. Use a host with a writable disk (Railway, Render, Fly.io, a VPS, or Docker with a volume). Serverless hosts that reset the filesystem will lose customizations after idle.

Required environment variable: `ADMIN_PASSWORD` (8+ characters). Optional: `SESSION_SECRET`, `OPENAI_API_KEY`.

```bash
docker build -t wb .
docker run --rm -p 3000:3000 \
  -e ADMIN_PASSWORD=pick-a-long-private-password \
  -v wb-data:/app/data \
  wb
```

Put the app on a domain you own. `/` is the public website. Bookmark `/studio` privately.

## Lock

- Studio login is rate-limited and checks a password only you set on the server. Nobody can invent that password from the browser.
- Studio responses send `X-Robots-Tag: noindex`.
- `robots.txt` disallows `/studio` and `/api`.
- Do not commit `.env.local` or `data/settings.json`.
