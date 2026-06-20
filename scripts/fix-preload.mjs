#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);
const preloadJsPath = path.join(rootDir, 'dist-electron', 'electron', 'preload.js');
const preloadCjsPath = path.join(rootDir, 'dist-electron', 'electron', 'preload.cjs');

// Read the ESM preload.js
let content = fs.readFileSync(preloadJsPath, 'utf8');

// Convert ESM to CommonJS
// Remove ESM imports and add require
content = content.replace(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]electron['"]/g, 
  "const { $1 } = require('electron')");

// Change export default to module.exports
content = content.replace(/export\s+default\s+{/, 'module.exports = {');

// Remove remaining export statements
content = content.replace(/export\s+function\s+/g, 'function ');
content = content.replace(/export\s+const\s+/g, 'const ');

// Write as CommonJS .cjs file
fs.writeFileSync(preloadCjsPath, content);

console.log('✓ Created preload.cjs from preload.js');
