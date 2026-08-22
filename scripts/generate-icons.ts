import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width: number, height: number, drawFn: (x: number, y: number) => [number, number, number, number]): Buffer {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc32(body), 0);

    return Buffer.concat([len, body, crcBuf]);
  }

  // Simple CRC32 implementation
  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    return (c ^ 0xffffffff) | 0;
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // No interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressedData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

// Generate icon with a purple gradient, rounded aesthetic, and a white quill / spark / studio badge
function generateIcon(size: number): Buffer {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;

  return createPNG(size, size, (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Gradient background: #7c3aed to #4f46e5 (Purple to Indigo)
    const t = (x + y) / (size * 2);
    const bgR = Math.round(124 * (1 - t) + 79 * t);
    const bgG = Math.round(58 * (1 - t) + 70 * t);
    const bgB = Math.round(237 * (1 - t) + 229 * t);

    // Icon glyph: Rounded box with central stylized document & sparkle
    // Normalize coordinates -1 to 1
    const nx = (x - cx) / (size * 0.5);
    const ny = (y - cy) / (size * 0.5);

    // Document base rect: -0.45 <= nx <= 0.45, -0.55 <= ny <= 0.55
    const inDocX = Math.abs(nx) <= 0.46;
    const inDocY = Math.abs(ny) <= 0.54;
    const isDoc = inDocX && inDocY;

    // Horizontal lines in document
    const isLine1 = isDoc && ny >= -0.25 && ny <= -0.15 && nx >= -0.32 && nx <= 0.32;
    const isLine2 = isDoc && ny >= -0.05 && ny <= 0.05 && nx >= -0.32 && nx <= 0.15;
    const isLine3 = isDoc && ny >= 0.15 && ny <= 0.25 && nx >= -0.32 && nx <= 0.25;

    // Sparkle star at top right: center at (0.35, -0.4)
    const sx = nx - 0.32;
    const sy = ny - (-0.38);
    const starDist = Math.sqrt(sx * sx + sy * sy);
    const inStar = starDist < 0.22 && (Math.abs(sx * sy) < 0.008 || (Math.abs(sx) < 0.04 && Math.abs(sy) < 0.2) || (Math.abs(sy) < 0.04 && Math.abs(sx) < 0.2));

    // Outer maskable canvas (full bleed for maskable PWA icons)
    let r = bgR;
    let g = bgG;
    let b = bgB;
    let a = 255;

    // Drawing the glyph in white & semi-transparent white
    if (inStar) {
      r = 255; g = 255; b = 255; a = 255;
    } else if (isLine1 || isLine2 || isLine3) {
      r = 255; g = 255; b = 255; a = 255;
    } else if (isDoc) {
      // Document frame background: subtle frosted white overlay
      r = Math.round(bgR * 0.75 + 255 * 0.25);
      g = Math.round(bgG * 0.75 + 255 * 0.25);
      b = Math.round(bgB * 0.75 + 255 * 0.25);
      // Border of doc
      if (Math.abs(nx) >= 0.42 || Math.abs(ny) >= 0.50) {
        r = 255; g = 255; b = 255; a = 255;
      }
    }

    return [r, g, b, a];
  });
}

const publicDir = path.join(process.cwd(), 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const png192 = generateIcon(192);
const png512 = generateIcon(512);

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), png192);

console.log('Icons generated successfully in /public/icons');
