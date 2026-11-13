const CACHE="mayank-gaming-ai-v1";
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/","/styles.css","/app.js","/manifest.webmanifest","/icon.svg"]))));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).pathname.startsWith("/api/"))return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)))});
