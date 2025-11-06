/**
 * Sitemap Generator for Votelytics
 * Generates sitemap.xml with all 254+ pages
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://votelytics.in';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Get current date in ISO format
const currentDate = new Date().toISOString().split('T')[0];

// Static pages
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/analysis', priority: '0.8', changefreq: 'monthly' },
  { url: '/analysis/swing', priority: '0.8', changefreq: 'monthly' },
  { url: '/about', priority: '0.5', changefreq: 'yearly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
];

// Generate constituency pages (1-234)
const constituencyPages = [];
for (let i = 1; i <= 234; i++) {
  constituencyPages.push({
    url: `/constituency/${i}`,
    priority: '0.8',
    changefreq: 'monthly'
  });
}

// Common party names (add more as needed)
const parties = ['DMK', 'ADMK', 'BJP', 'INC', 'PMK', 'MDMK', 'CPI', 'CPM', 'DMDK', 'VCK', 'IUML', 'PT', 'TMC', 'AMMK', 'NTK'];
const partyPages = parties.map(party => ({
  url: `/party/${party}`,
  priority: '0.7',
  changefreq: 'monthly'
}));

// Combine all pages
const allPages = [...staticPages, ...constituencyPages, ...partyPages];

// Generate XML
function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  allPages.forEach(page => {
    xml += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  xml += `</urlset>`;

  return xml;
}

// Write sitemap to file
try {
  const sitemap = generateSitemap();
  fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf8');
  console.log(`✅ Sitemap generated successfully!`);
  console.log(`📊 Total pages: ${allPages.length}`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Constituency pages: ${constituencyPages.length}`);
  console.log(`   - Party pages: ${partyPages.length}`);
  console.log(`📄 Output: ${OUTPUT_PATH}`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
