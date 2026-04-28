# Online Presentation Maker - User Guide

## Overview
A fully functional, browser-based presentation maker built with pure HTML, CSS, and JavaScript. Create professional presentations with no server upload, no login required, and complete offline functionality.

## Quick Start

### Starting Your Presentation
1. Open `presentation-maker.html` in any modern web browser
2. The tool loads with a default blank presentation with one slide
3. Your presentation is automatically saved to browser storage every 30 seconds

### Creating Your First Slide

#### Add a Slide
- Click the **➕ Add** button in the left Slides panel to create a new slide
- Each new slide includes title and subtitle text boxes by default

#### Edit Text
1. Click on any text element in the canvas to select it
2. Use the Properties panel on the right to:
   - Change **Font Family** (14 professional fonts available)
   - Adjust **Font Size** (8-120px)
   - Pick **Text Color** with color picker
   - Apply **Bold**, **Italic**, or **Underline** formatting

#### Customize Slide Background
In the Properties panel:
- Use **Background Color** for solid colors
- Select **Background Gradient** mode and choose:
  - **Linear**: Diagonal gradient
  - **Radial**: Centered gradient
- Pick **Color 1** and **Color 2** for gradient effect

#### Add an Image
1. Click **🖼️ Image** in the toolbar
2. Select an image from your device
3. Drag to reposition, resize by dragging corners (CSS resize)
4. Use element properties to layer it above/below other elements

#### Add More Text
1. Click **📝 Text** to add a new text box
2. Position it anywhere on the canvas
3. Edit the text content directly in properties
4. Format using font controls

## Features

### Slide Management
| Feature | How to Use |
|---------|-----------|
| **Add Slide** | Click ➕ button in left panel |
| **Delete Slide** | Click 🗑️ button (keeps at least 1 slide) |
| **Duplicate Slide** | Click 📋 button to copy current slide |
| **Reorder Slides** | Drag slide thumbnail to new position |
| **Slide Counter** | View current/total slides at top-left |

### Element Editing
| Feature | How to Use |
|---------|-----------|
| **Select Element** | Click on any element in canvas |
| **Move Element** | Drag selected element to new position |
| **Delete Element** | Click 🗑️ button after selecting |
| **Bring Forward** | Click ⬆️ to layer above others |
| **Send Backward** | Click ⬇️ to layer below others |
| **Edit Text Properties** | Use Properties panel when text selected |

### Templates
1. Click **🎨 Templates** in toolbar
2. Browse 10 professional templates:
   - Blank (clean white background)
   - Blue Modern
   - Purple Gradient
   - Dark Professional
   - Green Energy
   - Red Bold
   - Minimalist Light
   - Ocean Blue
   - Sunset Orange
   - Elegant Black
3. Click template name to apply
4. Edit template as needed

### Undo & Redo
- **Undo**: Click ↶ button or press **Ctrl+Z**
- **Redo**: Click ↷ button or press **Ctrl+Y**
- Full history of all edits saved in memory

### Export

#### Export as PPTX (PowerPoint)
1. Click **💾 PPTX** button
2. Enter presentation name when prompted
3. `.pptx` file downloads to your computer
4. Compatible with Microsoft PowerPoint, Google Slides, LibreOffice

#### Export as PDF
1. Click **📄 PDF** button
2. Enter presentation name when prompted
3. `.pdf` file downloads to your computer
4. Each slide becomes one PDF page

## Text Formatting Controls

| Property | Options |
|----------|---------|
| **Font Family** | Arial, Helvetica, Times New Roman, Georgia, Courier New, Trebuchet MS, Verdana, Comic Sans MS, Inter, Poppins, Roboto, Open Sans, Playfair Display, Merriweather |
| **Font Size** | 8px to 120px |
| **Text Color** | Full color picker (RGB) |
| **Bold** | Checkbox toggle |
| **Italic** | Checkbox toggle |
| **Underline** | Checkbox toggle |

## Gradient Background Options

### Linear Gradient
- Creates diagonal gradient from top-left to bottom-right
- Specify two colors for smooth transition
- Perfect for modern, dynamic slides

### Radial Gradient
- Creates circular gradient from center outward
- Specify two colors for center-to-edge transition
- Great for focus-point designs

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Delete** | Delete selected element |

## Data Storage & Privacy

✅ **Fully Offline**: Works without internet connection  
✅ **Browser Storage**: All presentations saved to browser's localStorage  
✅ **No Server Upload**: Data never leaves your device  
✅ **100% Private**: No analytics, no tracking, no data collection  
✅ **Auto-Save**: Updates saved every 30 seconds automatically  

### Persistent Storage
- Presentations stored in browser localStorage
- Automatically loads when you return
- Survives browser refresh (Ctrl+R)
- Persists across browser sessions (until you clear cache)

### Clear Cache Warning
⚠️ Clearing your browser's cache/cookies will delete saved presentations

## Mobile/Responsive

The tool adapts to smaller screens:
- **Tablet**: All panels visible, optimized spacing
- **Mobile**: Left/right panels collapse, horizontal scrolling for thumbnails
- **Touch Support**: Drag and resize work with touch input
- **Full Features**: All features available on mobile

## Canvas Specifications

- **Slide Dimensions**: 960x540 pixels (16:9 aspect ratio)
- **Resolution**: Optimized for screen viewing and PDF export
- **PPTX Export**: Automatically scales to standard PowerPoint dimensions

## Tips for Better Presentations

1. **Typography**: Use bold fonts for titles, regular for body text
2. **Color Contrast**: Ensure text is readable against background colors
3. **Spacing**: Leave margins around edges for better composition
4. **Templates**: Start with a template to ensure consistent styling
5. **Images**: Use high-quality images for professional look
6. **Layering**: Use bring forward/send backward for complex layouts

## Browser Compatibility

Works on all modern browsers:
- ✅ Chrome/Chromium 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile Chrome/Firefox/Safari

## Troubleshooting

### Presentation Not Saving
- Check if browser allows localStorage (not in private mode)
- Try clearing browser cache and reload
- Ensure you have enough storage space

### Export Not Working
- Check internet connection (needed for CDN libraries)
- Try different browser
- Ensure JavaScript is enabled

### Elements Not Dragging
- Click element first to select it
- Drag from center of element
- Ensure zoom level is normal (100%)

### Text Not Visible
- Check text color matches background
- Increase font size
- Try adding text shadow (in advanced formatting if available)

## Advanced Usage

### Creating Consistent Branding
1. Create a master slide with your logo/colors
2. Use Duplicate to copy this slide
3. Edit content while keeping branding consistent

### Complex Layouts
- Use multiple text boxes for different sections
- Layer elements with Bring Forward/Send Backward
- Use gradients for visual interest
- Add images as backgrounds or elements

### Presentation Flow
- Use templates as starting point
- Add slides in presentation order
- Test export to see how it looks in PowerPoint/PDF
- Rearrange slides as needed by dragging thumbnails

## Performance Notes

- Tool works smoothly with up to 100 slides
- Large images may impact performance slightly
- Undo history limited to last ~100 edits
- Export may take 5-10 seconds for large presentations

## File Size

- Typical presentation with 10 slides: 50-500KB (localStorage)
- Exported PPTX: 200KB-2MB depending on image size
- Exported PDF: 100KB-5MB depending on content

---

**Created with OnlinePDFPro** - Your complete suite of online document tools.
