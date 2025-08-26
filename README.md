BookVerse LoC Proxy

This small proxy avoids CORS issues when querying id.loc.gov from browser-based demos.

Quick start:

1. Install dependencies

```powershell
cd "e:\VCS Projects\BookVerse"
npm install
```

2. Start the proxy

```powershell
npm start
```

3. In the browser open `BookVerseMap.html` and search for a title that has an LCCN; the app will call `http://localhost:3000/loc/bib/:lccn` to verify holdings.

Notes:
- This server is intentionally minimal and only for local development.
- Do not expose it publicly without adding rate limits, auth, and logging.
