// Cloudflare Pages build script
// Stamps __BUILD_VERSION__ in sw.js with the git commit SHA (or a timestamp fallback).
// Run automatically via the build command configured in Cloudflare Pages dashboard.

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, 'pwa', 'sw.js');

// CF_PAGES_COMMIT_SHA is injected automatically by Cloudflare Pages on every deploy.
// The first 8 chars are enough to uniquely identify a deployment.
const version = (process.env.CF_PAGES_COMMIT_SHA || '').slice(0, 8)
  || Date.now().toString(36); // fallback for local testing

let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace('__BUILD_VERSION__', version);
fs.writeFileSync(swPath, sw);

console.log(`sw.js stamped with version: ${version}`);
