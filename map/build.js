// map/build.js
// Map build pipeline entry point
// Usage: node map/build.js [--skip-fetch]
//   --skip-fetch   Use existing raw_osm.json (skip Overpass API call)
// Output: map/data/map.json

const path = require('path');
const fs = require('fs');
const { parseOSMData } = require('./src/parse');

const RAW_PATH = path.join(__dirname, 'data', 'raw_osm.json');
const OUT_PATH = path.join(__dirname, 'data', 'map.json');
const SKIP_FETCH = process.argv.includes('--skip-fetch');

async function main() {
  console.log('=== Elmwood Drift — Map Build Pipeline ===\n');

  // Step 1: Fetch
  if (!SKIP_FETCH) {
    console.log('Step 1/2: Fetching OSM data...');
    const { execSync } = require('child_process');
    try {
      execSync('node ' + path.join(__dirname, 'src', 'fetch.js'), { stdio: 'inherit' });
    } catch (err) {
      console.error('Fetch step failed:', err.message);
      process.exit(1);
    }
  } else {
    console.log('Step 1/2: Skipping fetch (--skip-fetch)');
    if (!fs.existsSync(RAW_PATH)) {
      console.error(`raw_osm.json not found at ${RAW_PATH}`);
      process.exit(1);
    }
  }

  // Step 2: Parse
  console.log('\nStep 2/2: Parsing OSM data → tile grid...');
  const rawData = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));
  console.log(`Input: ${rawData.elements?.length ?? 0} OSM elements`);

  const mapData = parseOSMData(rawData);
  const { gridWidth, gridHeight } = mapData.meta;
  const total = gridWidth * gridHeight;

  // Stats
  const tileCounts = {};
  for (const t of mapData.tiles) tileCounts[t] = (tileCounts[t] || 0) + 1;
  console.log('Tile distribution:');
  for (const [id, count] of Object.entries(tileCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  Tile ${String(id).padStart(2)}: ${String(count).padStart(6)} (${((count / total) * 100).toFixed(1)}%)`);
  }
  console.log(`\nGrid: ${gridWidth}×${gridHeight} = ${total} tiles`);
  console.log(`Collidable: ${mapData.collision.filter(Boolean).length}`);
  console.log(`Marked: ${mapData.markings.filter(Boolean).length}`);

  // Write output
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(mapData), 'utf8');
  const sizeKB = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
  console.log(`\nOutput: ${OUT_PATH} (${sizeKB} KB)`);
  console.log('\nBuild complete! Copy map/data/map.json contents to replace the hardcoded MAP in index.html.');
}

main().catch(err => { console.error('Build failed:', err); process.exit(1); });
