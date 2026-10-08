const ytpl = require('ytpl');
const fs = require('fs');

async function run() {
  try {
    const p1 = await ytpl('PLYIuEc8dUeUCC_L1m1zo4De4sIclgf4fm');
    const p2 = await ytpl('PLUMlPznumOdU').catch(() => ({ items: [] })); // PLUMlPznumOdU might be invalid
    
    fs.writeFileSync('videos.json', JSON.stringify({
      p1: p1.items.map(i => ({title: i.title, url: i.shortUrl})),
      p2: p2.items.map(i => ({title: i.title, url: i.shortUrl}))
    }, null, 2));
    console.log("Done");
  } catch(e) {
    console.error(e);
  }
}
run();
