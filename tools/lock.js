#!/usr/bin/env node
// Encrypts every game in pages/ with an 8-digit PIN.
//
//   node tools/lock.js <8-digit-pin>
//
// For each <pagedir>/index.html under pages/:
//   - if <pagedir>/index.source.html does not exist, it copies index.html there first
//   - reads index.source.html, encrypts with PBKDF2-SHA256 (500k iter) + AES-GCM
//   - overwrites index.html with a tiny loader that contains the ciphertext
//
// The loader pulls in pages/_lib/lock.js, which shows the PIN pad,
// decrypts, and rewrites the document with the original HTML.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PBKDF2_ITERATIONS = 500000;
const PAGES_DIR = path.resolve(__dirname, '..', 'pages');

const pin = process.argv[2];
if (!/^\d{8}$/.test(pin || '')) {
  console.error('Usage: node tools/lock.js <8-digit-pin>');
  process.exit(1);
}

function stripOldAuthScript(html) {
  return html.replace(/<script src="\.\.?\/(?:\.\.\/)?auth\.js"><\/script>\s*\n?/g, '');
}

function encrypt(plaintext, pin) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(pin, salt, PBKDF2_ITERATIONS, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    data: Buffer.concat([ct, tag]).toString('base64'),
  };
}

function buildLoader(depth, params) {
  const up = depth === 1 ? '../' : '../../';
  const sib = depth === 1 ? './' : '../';
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>Locked</title>',
    '<link rel="icon" type="image/jpeg" href="' + up + 'assets/images/logo-blue.jpeg">',
    '<link rel="apple-touch-icon" href="' + up + 'assets/images/icon-192.png">',
    '<link rel="manifest" href="' + sib + 'manifest.webmanifest">',
    '<meta name="theme-color" content="#0d1b35">',
    '<script src="' + sib + '_lib/lock.js"></' + 'script>',
    '</head>',
    '<body>',
    '<script>LOCK.boot(' + JSON.stringify(params) + ');</' + 'script>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

function findIndexes(dir, depth, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findIndexes(full, depth + 1, out);
    } else if (entry.name === 'index.html') {
      out.push({ dir, depth });
    }
  }
}

const targets = [];
findIndexes(PAGES_DIR, 1, targets);

let count = 0;
for (const { dir, depth } of targets) {
  const sourcePath = path.join(dir, 'index.source.html');
  const currentPath = path.join(dir, 'index.html');

  if (!fs.existsSync(sourcePath)) {
    let currentText = fs.readFileSync(currentPath, 'utf8');
    if (/LOCK\.boot\(/.test(currentText)) {
      console.warn('SKIP ' + currentPath + ' (already locked, no source)');
      continue;
    }
    currentText = stripOldAuthScript(currentText);
    fs.writeFileSync(sourcePath, currentText);
    console.log('SAVED ' + sourcePath + ' (first-run backup)');
  }

  const src = fs.readFileSync(sourcePath, 'utf8');

  const params = encrypt(src, pin);
  fs.writeFileSync(currentPath, buildLoader(depth, params));
  console.log('LOCKED ' + currentPath);
  count++;
}

console.log('\nDone. Locked ' + count + ' page(s).');
