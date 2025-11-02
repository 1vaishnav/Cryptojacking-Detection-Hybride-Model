// collect_dataset.js
const fs = require('fs');
const { monitor } = require('./monitor');  // Import monitor function

// List of sites to collect dataset
const sites = [
/*'https://www.google.com',
'https://www.wikipedia.org',
'https://www.github.com',
'https://www.bing.com',
'https://duckduckgo.com',
'https://www.facebook.com',
'https://twitter.com',
'https://www.linkedin.com',
'https://www.reddit.com',
'https://www.bbc.com',
'http://localhost:8000/index.html',
'https://share.google/RhdTR7CJk9ajPAKjL',
'https://share.google/mvj18Yz1xW15EUcnx',       //yes
'https://www.cineby.app',
'https://popcorntime.app',
'https://1manfactory.com',
'https://20khvylyn.com',
'https://24kmusic.com',
'https://50bitcoin.com',
'https://6pc9.com',
'https://abortoseguro.com',
'https://abundalife.com',
'https://accionpoetica.com',
'https://accroforum.com',
'https://ad-skins.com'
'https://billybets2.com',
'https://casino-luckygames.be',*/
'https://cazeus-3678.com'
  // add more known benign & cryptojacking sites
];

(async () => {
  const results = [];
  for (let url of sites) {
    console.log(`\nCollecting metrics for ${url} ...`);
    try {
      const metrics = await monitor(url);
      results.push({ url, ...metrics });
    } catch (e) {
      console.error(`Failed for ${url}:`, e.message || e);
      results.push({ url, error: e.message || e });
    }
  }

  // Save results as JSON
  fs.writeFileSync('dataset_enriched.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Dataset saved to dataset_enriched.json');
})();
