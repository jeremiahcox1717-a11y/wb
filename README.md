# WB

A private website only you can open, plus a studio where you tell it what to become.

Every page is locked behind `ADMIN_PASSWORD`. There is no public homepage. Search engines are told to skip the whole site.

## Two URLs (both require your password)

| URL | After you sign in |
| --- | --- |
| `/` | Your website |
| `/studio` | The designer |

Anyone else who opens the URL sees the login screen only.

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

- Login: [http://localhost:3000/studio/login](http://localhost:3000/studio/login)
- Your site: [http://localhost:3000](http://localhost:3000)
- Studio: [http://localhost:3000/studio](http://localhost:3000/studio)

`npm test`, `npm run lint`, and `npm run build` are the checks.

## Ask the designer

In `/studio`, type things like:

- “Turn this into a bakery called Hearth & Crumb”
- “Make a dark editorial portfolio”
- “Add pricing and an FAQ”
- “My email is you@example.com and I’m in Austin”

The preview on the right is the same data your private homepage reads.

Without an API key, a built-in designer still saves (business types, palettes, names, contact, extra sections). Paste an OpenAI-compatible key in **Settings** (or set `OPENAI_API_KEY`) for full language-model rewrites. That key is stored in `data/settings.json`, which is gitignored.

## Deploy

The site updates by writing `data/site.json` on the server. Use a host with a writable disk (Railway, Render, Fly.io, a VPS, or Docker with a volume). Serverless hosts that reset the filesystem will lose customizations after idle.

Required environment variable: `ADMIN_PASSWORD` (8+ characters). Optional: `SESSION_SECRET`, `OPENAI_API_KEY`.

```bash
docker build -t wb .
docker run --rm -p 3000:3000 \
  -e ADMIN_PASSWORD=pick-a-long-private-password \
  -v wb-data:/app/data \
  wb
```

Keep the GitHub repository private if it contains your pages. Bookmark the login URL. Do not share the password.

## Lock

- Login is rate-limited and checks a password only you set on the server. Nobody can invent that password from the browser.
- Every response sends `X-Robots-Tag: noindex`.
- `robots.txt` disallows the whole site.
- Do not commit `.env.local` or `data/settings.json`.
