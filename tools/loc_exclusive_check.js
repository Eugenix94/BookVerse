const fetch = require('node-fetch');
const fs = require('fs');

// Usage: node tools/loc_exclusive_check.js "LCCN_OR_TITLE"
const arg = process.argv.slice(2).join(' ');
if (!arg) {
  console.error('Usage: node tools/loc_exclusive_check.js "LCCN or Title"');
  process.exit(2);
}

async function fetchLoCByLccn(lccn) {
  const url = `https://id.loc.gov/resources/bibs/${encodeURIComponent(lccn)}.json`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

async function searchOpenLibraryByTitle(title) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.docs || [];
  } catch (e) { return []; }
}

async function searchInternetArchive(title) {
  const url = `https://archive.org/advancedsearch.php?q=title:("${encodeURIComponent(title)}")&output=json&rows=5`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.response.docs || [];
  } catch (e) { return []; }
}

(async () => {
  const input = arg;
  let lccn = null;
  // crude LCCN pattern: starts with 'n' or digits and has 8-10 chars
  if (/^[nN]?\d{2,9}/.test(input)) lccn = input;

  let loc = null;
  if (lccn) loc = await fetchLoCByLccn(lccn);

  // if no LoC by LCCN, try searching LoC by title via catalog link (best-effort)
  const title = lccn ? (loc && (loc['http://purl.org/dc/terms/title'] ? loc['http://purl.org/dc/terms/title'][0]['@value'] : null)) : input;

  console.log('Checking exclusivity for:', input);
  if (loc) console.log('- LoC record found (LCCN).'); else console.log('- No LoC record by LCCN.');

  const olMatches = title ? await searchOpenLibraryByTitle(title) : [];
  console.log(`- Open Library matches: ${olMatches.length}`);

  const iaMatches = title ? await searchInternetArchive(title) : [];
  console.log(`- Internet Archive matches: ${iaMatches.length}`);

  const gutMatches = [];
  try {
    const gut = await (await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`)).json();
    gutMatches.push(...(gut.results || []));
  } catch (e) {}
  console.log(`- Gutenberg matches: ${gutMatches.length}`);

  const likelyExclusive = (loc && olMatches.length === 0 && iaMatches.length === 0 && gutMatches.length === 0);
  if (likelyExclusive) {
    console.log('\nThis title appears to be available only at the Library of Congress (candidate).');
    console.log('LoC record:', loc ? Object.keys(loc).slice(0,10) : 'N/A');
  } else {
    console.log('\nNot exclusive to LoC based on quick checks.');
  }
})();
