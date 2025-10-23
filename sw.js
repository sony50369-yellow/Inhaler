
const CACHE='inhaler-flat-v2';
const ASSETS=[
  './','./index.html','./styles.css','./app.js','./drugs.json','./drug_image_map.json',
  './icon-180.png','./icon-192.png','./icon-256.png','./icon-384.png','./icon-512.png'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})