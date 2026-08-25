# WB

A private website only you can open, plus a studio where you tell it what to become.

Every page is locked behind `ADMIN_PASSWORD`. There is no public homepage. Search engines are told to skip the whole site.

## Two URLs (both require your password)

| URL | After you sign in |
| --- | --- |
| `/` | Your website, with the AI builder bot on the page |
| `/studio` | Full designer plus optional AI key |

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

On the homepage you also get:

- **URL maker** — type a name, get a .com address
- **URL scanner** — paste a link, get YES or NO
- **Name scanner** — check if someone else already uses a name
- **Currency calculator** — pick any from/to pair, swap directions, and see all live rates
- **Notebook** — save a person’s name, business, phone number, and email

`npm test`, `npm run lint`, and `npm run build` are the checks.

## Ask the builder bot

After you sign in, the **Website builder** chat sits on the site. Type things like:

- “Make a URL for Jordan Bennett”
- “How does the URL scanner work?”
- “Turn this into a bakery called Hearth & Crumb”
- “Make a dark editorial portfolio”
- “Add pricing and an FAQ”
- “My email is you@example.com and I’m in Austin”

Ask a question and you get an answer — the page stays put. Tell it what to build and the site on the left (or above, on a phone) updates as soon as the bot replies. You can also type `100 CAD to EUR` in the chat, or use the currency section to pick any two currencies and convert both ways.

Without an API key, the built-in designer still builds bakeries, coffee shops, restaurants, gyms, portfolios, and studios, and the bot still answers questions about this site. Paste an OpenAI-compatible key in **Studio → Settings** (or set `OPENAI_API_KEY`) for full language-model answers and rewrites. That key is stored in `data/settings.json`, which is gitignored.

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
