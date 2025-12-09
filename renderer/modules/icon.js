export async function generateMacIcon() {
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.src = 'assets/logo - v2.png';
    
    img.onload = async () => {
        // Clear
        ctx.clearRect(0, 0, size, size);

        // Scale down to match visual weight of other icons (approx 90% size)
        const scale = 0.9;
        const scaledSize = size * scale;
        const offset = (size - scaledSize) / 2;
        const radius = scaledSize * 0.2237; // Adjust radius for scaled size

        ctx.beginPath();
        ctx.roundRect(offset, offset, scaledSize, scaledSize, radius);
        ctx.clip();

        // Draw Image Scaled
        ctx.drawImage(img, offset, offset, scaledSize, scaledSize);

        // Convert to Buffer
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const buffer = await blob.arrayBuffer();
        
        // Save
        await window.electronAPI.saveIcon(buffer);
        console.log('Icon generated and saved to assets/icon_mac.png');
    };
}
