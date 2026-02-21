import sys

filepath = "tools/images-to-pdf.html"
with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

start_idx = text.find("const imgBytes = Uint8Array.from(atob(imgData.split(',')[1]), c => c.charCodeAt(0));")
end_idx = text.find("                    // A4 size page with image fitted inside")

if start_idx != -1 and end_idx != -1:
    new_block = """// UNIVERSAL SANITIZER: Always draw to Canvas to strip metadata, unsupported formats, and memory-crashing ultra-high resolutions before giving it to pdf-lib.
                    const cleanBytes = await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let w = img.width;
                            let h = img.height;
                            
                            // Safe scaling to prevent RAM crashes on mobile devices
                            const MAX_DIM = 2500;
                            if (w > h && w > MAX_DIM) {
                                h = Math.round(h * MAX_DIM / w);
                                w = MAX_DIM;
                            } else if (h > w && h > MAX_DIM) {
                                w = Math.round(w * MAX_DIM / h);
                                h = MAX_DIM;
                            }
                            
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            
                            // Fill white background (protects transparent PNGs/WebPs turning black)
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, w, h);
                            ctx.drawImage(img, 0, 0, w, h);
                            
                            // Export as high-quality standard JPEG
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                            const b64 = dataUrl.split(',')[1];
                            const binaryString = window.atob(b64);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            // Avoid 'Uint8Array.from' for huge arrays on mobile Webkit - iteration is mathematically safer
                            for (let i = 0; i < len; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            resolve(bytes);
                        };
                        img.onerror = () => reject(new Error("Failed to load image into canvas"));
                        img.src = imgData;
                    });

                    // It will guarantee to be a valid baseline JPEG byte stream now
                    const image = await pdfDoc.embedJpg(cleanBytes);

"""
    new_text = text[:start_idx] + new_block + text[end_idx:]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_text)
    print("Canvas preprocessor injected successfully")
else:
    print("Could not find Javascript markers in " + filepath)
