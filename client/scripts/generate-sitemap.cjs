/**
 * Sitemap Generator for Votelytics
 * Generates sitemap.xml with all 254+ pages using SEO-friendly slug URLs
 * Supports both votelytics.com and votelytics.in domains
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Read site URL from .env file or use default
const envPath = path.join(__dirname, '../.env');
let BASE_URL = 'https://votelytics.com'; // Default fallback

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const siteUrlMatch = envContent.match(/VITE_SITE_URL=(.+)/);
  if (siteUrlMatch && siteUrlMatch[1]) {
    BASE_URL = siteUrlMatch[1].trim();
    console.log(`📍 Using site URL from .env: ${BASE_URL}`);
  }
} else {
  console.log(`⚠️  No .env file found, using default: ${BASE_URL}`);
}

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

// Read constituency slugs from JSON file
const slugsPath = path.join(__dirname, '../public/constituency-slugs.json');
let constituencyPages = [];

try {
  const slugsData = JSON.parse(fs.readFileSync(slugsPath, 'utf8'));
  constituencyPages = slugsData.slugs.map(slug => ({
    url: `/constituency/${slug}`,
    priority: '0.8',
    changefreq: 'monthly'
  }));
  console.log(`📋 Loaded ${constituencyPages.length} constituency slugs from JSON`);
} catch (error) {
  console.error('⚠️  Failed to load constituency slugs, using fallback');
  // Fallback: generate numeric URLs (will be redirected)
  for (let i = 1; i <= 234; i++) {
    constituencyPages.push({
      url: `/constituency/${i}`,
      priority: '0.8',
      changefreq: 'monthly'
    });
  }
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
