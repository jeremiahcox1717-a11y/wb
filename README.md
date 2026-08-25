# Unlisted

Jordan’s private desk for finding local businesses that still have no Google profile, no real website, or an Instagram page with nowhere to book.

## What it does

- **Hunt a postcode** you type, or let the generator hand you one.
- The generator **remembers every postcode it has given you** and will not issue that neighbourhood again until you restore it.
- It looks up shops, trades, cafes, clinics, and similar places around the code, then keeps the ones with **no website**, **only a booking link**, or **Instagram / social and nothing else**.
- If they are **on Google but the listing has no website**, they still show up — those are good too.
- Instagram “DM to book” searches are generated for the current area, because most Instagram businesses are not on the public map.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: paste a Google Maps API key (Places API) in the sidebar so Unlisted can mark “not on Google” vs “on Google, no website” automatically. Without a key, every lead still has a **Check Google profile** button.

Used postcodes and saved leads live in `data/` on this machine and stay private to you.
