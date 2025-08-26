const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Usage: node tools/loc_sync.js input.txt output.json
// input.txt contains one LCCN per line, or a single LCCN.

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node tools/loc_sync.js <input-file-or-lccn> <output.json>');
  process.exit(2);
}

const input = args[0];
const outFile = args[1];

async function fetchLoC(lccn) {
  const url = `https://id.loc.gov/resources/bibs/${encodeURIComponent(lccn)}.json`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

async function searchOpenLibrary(title) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.docs || [];
}

(async () => {
  let lccns = [];
  if (fs.existsSync(input) && fs.statSync(input).isFile()) {
    const txt = fs.readFileSync(input, 'utf8');
    lccns = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  } else {
    lccns = [input];
  }

  const results = [];
  for (const lccn of lccns) {
    console.log('Fetching LoC for', lccn);
    const loc = await fetchLoC(lccn);
    let title = null;
    if (loc) {
      // try to extract a title
      const titles = loc['http://purl.org/dc/terms/title'] || loc['http://purl.org/dc/elements/1.1/title'];
      if (titles && titles.length) title = titles[0]['@value'] || titles[0];
    }
    let ol = null;
    if (title) {
      console.log('Searching Open Library for', title);
      ol = await searchOpenLibrary(title);
    }

    results.push({ lccn, loc, openlibrary_matches: ol });
  }

  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');
  console.log('Wrote', outFile);
})();
