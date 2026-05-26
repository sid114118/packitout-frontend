// Bulk-upload all images in ./images-to-upload/ to Cloudinary and print
// a ready-to-paste mapping of filename -> secure URL.
//
// Usage:
//   1. Put your images in:  ./images-to-upload/
//   2. Run:                  node scripts/upload-to-cloudinary.mjs
//   3. Copy the printed URLs into src/Categories.jsx

import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Look for images-to-upload/ first next to this script, then at project root.
const __dirname = dirname(fileURLToPath(import.meta.url));
const CANDIDATES = [
  resolve(__dirname, 'images-to-upload'),
  resolve(__dirname, '..', 'images-to-upload'),
];
const FOLDER = CANDIDATES.find(existsSync) || CANDIDATES[0];
const VALID = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const CLOUDINARY_FOLDER = 'packitout/categories'; // shows up in your Media Library

const files = readdirSync(FOLDER)
  .filter(f => VALID.has(extname(f).toLowerCase()))
  .filter(f => statSync(join(FOLDER, f)).isFile());

if (files.length === 0) {
  console.log(`No images found in ${FOLDER}  — drop some files in and rerun.`);
  process.exit(0);
}

console.log(`Reading from: ${FOLDER}`);
console.log(`Uploading ${files.length} image(s) to Cloudinary...\n`);

const results = [];
for (const file of files) {
  const path = join(FOLDER, file);
  const publicId = basename(file, extname(file)).replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    const res = await cloudinary.uploader.upload(path, {
      folder: CLOUDINARY_FOLDER,
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
    });
    results.push({ file, url: res.secure_url });
    console.log(`OK  ${file}`);
  } catch (err) {
    console.log(`ERR ${file} -> ${err.message}`);
  }
}

console.log('\n--- Paste these into src/Categories.jsx ---\n');
for (const { file, url } of results) {
  console.log(`${file}\n  image: "${url}",\n`);
}
