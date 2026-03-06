// map/src/fetch.js
// Fetches raw OSM data from Overpass API for UNO/Elmwood area
// Run: node map/src/fetch.js
// Output: map/data/raw_osm.json

const https = require('https');
const fs = require('fs');
const path = require('path');

const BBOX = {
  south: 41.2490,
  west: -96.0660,
  north: 41.2650,
  east: -96.0460,
};

const QUERY = `
[out:json][timeout:60];
(
  way["highway"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["building"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["landuse"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["natural"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["leisure"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["amenity"="parking"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out body;
>;
out skel qt;
`;

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'raw_osm.json');

function fetchOSMData() {
  return new Promise((resolve, reject) => {
    const body = 'data=' + encodeURIComponent(QUERY);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'elmwood-drift-game/1.0',
      },
    };

    const req = https.request(OVERPASS_URL, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        resolve(data);
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Fetching OSM data for UNO/Elmwood area...');
  console.log(`Bounding box: ${BBOX.south},${BBOX.west} → ${BBOX.north},${BBOX.east}`);

  try {
    const rawJson = await fetchOSMData();
    const parsed = JSON.parse(rawJson);
    console.log(`Received ${parsed.elements?.length ?? 0} elements`);
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, rawJson, 'utf8');
    console.log(`Saved to ${OUTPUT_PATH}`);
  } catch (err) {
    console.error('Fetch failed:', err.message);
    process.exit(1);
  }
}

main();
