/**
 * Sitemap Generation Script
 * Generates sitemap.xml and robots.txt for the application
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://cybersec-toolkit-pro.vercel.app';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Static routes
const routes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/login', priority: '0.6', changefreq: 'monthly' },
  { path: '/signup', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools', priority: '0.9', changefreq: 'daily' },
  { path: '/reports', priority: '0.8', changefreq: 'daily' },
];

// Generate sitemap.xml
function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log('✅ Generated sitemap.xml');
}

// Generate robots.txt
function generateRobots() {
  const robots = `User-agent: *
Allow: /
Disallow: /reports
Disallow: /profile

Sitemap: ${BASE_URL}/sitemap.xml
`;

  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robots, 'utf8');
  console.log('✅ Generated robots.txt');
}

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Generate files
try {
  generateSitemap();
  generateRobots();
  console.log('✅ Sitemap generation complete!');
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}

