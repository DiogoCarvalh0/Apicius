const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_ICON = path.join(__dirname, '../assets/logo - v2.png');
const ICONSET_DIR = path.join(__dirname, '../assets/icon.iconset');
const ICNS_PATH = path.join(__dirname, '../assets/icon.icns');

// Ensure iconset directory exists
if (!fs.existsSync(ICONSET_DIR)) {
    fs.mkdirSync(ICONSET_DIR);
}

const sizes = [16, 32, 128, 256, 512];

async function generateIcons() {
    console.log('Loading source image...');
    const image = await Jimp.read(SOURCE_ICON);

    // Create a squircle mask
    // macOS icons are rounded squares. A corner radius of ~22% is standard.
    // We'll apply this mask to the largest size and then resize.
    
    // Resize to 1024x1024 first for the master
    image.resize({ w: 1024, h: 1024 });
    
    const mask = new Jimp({ width: 1024, height: 1024, color: 0x00000000 });
    
    // Draw a rounded rectangle on the mask
    // Jimp doesn't have a native rounded rect drawing for masks easily, 
    // but we can scan pixels or use a pre-made mask. 
    // For simplicity in this script without external assets, we'll use a pixel scanner 
    // to clear corners, approximating a squircle.
    // Actually, let's just use a simple resize for now and let the user know 
    // strict squircle generation might need a proper SVG mask. 
    // BUT, the user specifically complained about the shape.
    // Let's try to make a rounded mask.
    
    // Better approach: Create a rounded mask using a loop
    const radius = 225; // approx 22% of 1024
    const center = 512;
    
    // We will just iterate and create a mask. 
    // Equation for superellipse: |x/a|^n + |y/b|^n = 1. Apple uses n ~ 4.
    // Let's implement a simple superellipse mask.
    
    const n = 4.0; // Apple squircle-ish
    const a = 512;
    const b = 512;
    
    mask.scan(0, 0, 1024, 1024, function(x, y, idx) {
        const dx = Math.abs(x - center);
        const dy = Math.abs(y - center);
        const dist = Math.pow(dx / (a - 20), n) + Math.pow(dy / (b - 20), n); // -20 for padding
        
        if (dist <= 1) {
            this.bitmap.data[idx + 0] = 255; // R
            this.bitmap.data[idx + 1] = 255; // G
            this.bitmap.data[idx + 2] = 255; // B
            this.bitmap.data[idx + 3] = 255; // Alpha
        } else {
            this.bitmap.data[idx + 3] = 0;   // Transparent
        }
    });

    image.mask(mask, 0, 0);

    console.log('Generating iconset...');

    for (const size of sizes) {
        // Standard size
        const file1 = path.join(ICONSET_DIR, `icon_${size}x${size}.png`);
        const clone1 = image.clone().resize({ w: size, h: size });
        await clone1.write(file1);
        console.log(`Created ${file1}`);

        // Retina size (@2x)
        const file2 = path.join(ICONSET_DIR, `icon_${size}x${size}@2x.png`);
        const clone2 = image.clone().resize({ w: size * 2, h: size * 2 });
        await clone2.write(file2);
        console.log(`Created ${file2}`);
    }

    console.log('Running iconutil...');
    try {
        execSync(`iconutil -c icns "${ICONSET_DIR}" -o "${ICNS_PATH}"`);
        console.log(`Successfully created ${ICNS_PATH}`);
        
        // Cleanup iconset dir
        // fs.rmSync(ICONSET_DIR, { recursive: true, force: true });
    } catch (error) {
        console.error('Error running iconutil:', error.message);
    }
}

generateIcons().catch(console.error);
