# WB

A private desk for Jordan Bennett, plus a factory that builds **new websites for other people**.

The homepage (`/`) stays yours. Clone a public page or build from scratch and the new site lives at its own public link (`/s/…`). Other people can open those links. They cannot open this desk.

## URLs

| URL | Who | What |
| --- | --- | --- |
| `/` | You, after password | Your Jordan Bennett homepage. Never replaced by the builder. |
| `/studio` | You, after password | Designer plus optional AI key |
| `/s/the-site-name` | Anyone with the link | A website built for someone else |

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
- Your desk: [http://localhost:3000](http://localhost:3000)
- Studio: [http://localhost:3000/studio](http://localhost:3000/studio)

On the desk you also get:

- **Website builder** — new sites for other people (clone or from scratch)
- **Sites** — list of those public pages
- **URL maker** — search a real public .com, then register it at GoDaddy
- **URL scanner** — paste a link, get YES or NO
- **Name scanner** — check if someone else already uses a name
- **Currency calculator** — convert any from/to pair
- **Notebook** — save a person’s name, business, phone, and email

`npm test`, `npm run lint`, and `npm run build` are the checks.

## Ask the builder bot

Type things like:

- “Clone https://example.com”
- “Build a website and make it white and blue”
- “Build a bakery called Hearth & Crumb”
- “What’s the time?”

A clone or a from-scratch build **does not change this homepage**. It creates a new site and gives you a `/s/…` link to send to the other person. Follow-up tweaks (“make the heading bigger”) edit the latest client site.

Without an API key, the built-in designer still clones public pages and builds from colors and words. Paste an OpenAI-compatible key in **Studio → Settings** (or set `OPENAI_API_KEY`) for full language-model rewrites. That key is stored in `data/settings.json`, which is gitignored.

## Deploy

The desk writes `data/site.json`. Client sites write `data/projects/`. Use a host with a writable disk (Railway, Render, Fly.io, a VPS, or Docker with a volume).

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

- The desk is rate-limited and checks a password only you set on the server.
- Client sites at `/s/…` are public so other people can open them.
- Do not commit `.env.local`, `data/settings.json`, or `data/projects/*.json`.
