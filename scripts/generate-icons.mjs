import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const svgPath = join(publicDir, 'logo.svg');

await mkdir(publicDir, { recursive: true });

const svg = await readFile(svgPath);

async function renderPng(size) {
  return sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer();
}

const pngSizes = [16, 32, 48, 180, 192, 512];
const buffers = new Map();

for (const size of pngSizes) {
  buffers.set(size, await renderPng(size));
}

await writeFile(join(publicDir, 'logo-192.png'), buffers.get(192));
await writeFile(join(publicDir, 'logo-512.png'), buffers.get(512));
await writeFile(join(publicDir, 'apple-touch-icon.png'), buffers.get(180));

const icoImages = [16, 32, 48].map((size) => ({
  size,
  data: buffers.get(size),
}));

const ico = createIco(icoImages);
await writeFile(join(publicDir, 'favicon.ico'), ico);

console.log('Generated favicon.ico, logo-192.png, logo-512.png, apple-touch-icon.png');

function createIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  const imageBuffers = [];
  let offset = 6 + count * 16;

  for (const image of images) {
    const { size, data } = image;
    const entry = Buffer.alloc(16);

    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);

    entries.push(entry);
    imageBuffers.push(data);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...imageBuffers]);
}