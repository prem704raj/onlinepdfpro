# Presentation Maker - API Reference

Quick reference for all public functions and properties.

## Global Objects

### `app` (Global Application State)

```javascript
app.presentation {
    name: string,
    slides: Array<Slide>
}
app.currentSlideIndex: number         // Current slide (0-indexed)
app.selectedElement: number | null    // Selected element index or null
app.history: Array                    // Undo/redo history
app.historyIndex: number              // Current history position
app.isDragging: boolean               // Drag in progress
```

### `TEMPLATES` (Pre-defined Templates Array)

```javascript
TEMPLATES[0] // Blank
TEMPLATES[1] // Blue Modern
TEMPLATES[2] // Purple Gradient
TEMPLATES[3] // Dark Professional
TEMPLATES[4] // Green Energy
TEMPLATES[5] // Red Bold
TEMPLATES[6] // Minimalist Light
TEMPLATES[7] // Ocean Blue
TEMPLATES[8] // Sunset Orange
TEMPLATES[9] // Elegant Black
```

## Core Functions

### Initialization
```javascript
init()                    // Initialize application
loadPresentation()        // Load from localStorage or create new
savePresentation()        // Save to localStorage
```

### History Management
```javascript
saveHistory()            // Add current state to history
undo()                   // Go back one step
redo()                   // Go forward one step
```

### Slide Operations
```javascript
addSlide()              // Add new slide at end
deleteSlide()           // Delete current slide
duplicateSlide()        // Duplicate current slide
selectSlide(index)      // Select slide by index
renderSlides()          // Render all thumbnails
updateSlideCounter()    // Update slide counter display
```

### Drag & Drop (Slides)
```javascript
handleDragStart(e, index)   // Start dragging slide
handleDrop(e, targetIndex)  // Drop slide at new position
```

### Canvas Rendering
```javascript
renderCurrentSlide()                          // Render current slide
drawTextElement(ctx, elem, isSelected)       // Draw text element
drawImageElement(ctx, elem, isSelected)      // Draw image element
wrapText(ctx, text, maxWidth)                // Wrap text to width
```

### Element Operations
```javascript
addTextBox()            // Add text element
addImage()              // Show image upload dialog
deleteElement()         // Delete selected element
bringForward()          // Move element up in z-order
sendBackward()          // Move element down in z-order
```

### Canvas Interaction
```javascript
handleCanvasClick(e)        // Handle click on canvas
handleCanvasMouseDown(e)    // Handle mouse down
handleCanvasMouseMove(e)    // Handle mouse move
handleCanvasMouseUp(e)      // Handle mouse up
```

### Properties
```javascript
updateElementProperties()    // Update properties panel from selection
updateSlideBackground()      // Update slide background from controls
```

### Templates
```javascript
showTemplates()             // Display template modal
applyTemplate(index)        // Apply template by index
```

### Export
```javascript
exportPptx()               // Export as .pptx file
exportPdf()                // Export as .pdf file
```

### UI Utilities
```javascript
openModal(modalId)         // Open modal by ID
closeModal(modalId)        // Close modal by ID
setupEventListeners()      // Attach all event handlers
setupCanvasListeners()     // Attach canvas-specific handlers
```

## Event Listeners

Automatically attached in `setupEventListeners()`:

### Slide Management Buttons
```javascript
#addSlideBtn        → addSlide()
#duplicateSlideBtn  → duplicateSlide()
#deleteSlideBtn     → deleteSlide()
```

### Edit Buttons
```javascript
#undoBtn            → undo()
#redoBtn            → redo()
```

### Element Buttons
```javascript
#addTextBtn         → addTextBox()
#addImageBtn        → addImage()
#templateBtn        → showTemplates()
#deleteElementBtn   → deleteElement()
#bringForwardBtn    → bringForward()
#sendBackwardBtn    → sendBackward()
```

### Export Buttons
```javascript
#exportPptxBtn      → exportPptx()
#exportPdfBtn       → exportPdf()
```

### Property Controls
```javascript
#bgColor            → updateSlideBackground()
#gradientType       → updateSlideBackground()
#gradientColor1     → updateSlideBackground()
#gradientColor2     → updateSlideBackground()
#fontFamily         → Update element property
#fontSize           → Update element property
#textColor          → Update element property
#boldCheckbox       → Update element property
#italicCheckbox     → Update element property
#underlineCheckbox  → Update element property
```

### Keyboard Shortcuts
```
Ctrl+Z              → undo()
Ctrl+Y              → redo()
Delete              → deleteElement() (if element selected)
```

## Data Structures

### Slide
```typescript
interface Slide {
    background: string;     // Color (hex) or gradient CSS
    elements: Element[];    // Array of elements
}
```

### Text Element
```typescript
interface TextElement {
    type: 'text';
    x: number;              // X position (px)
    y: number;              // Y position (px)
    width: number;          // Width (px)
    height: number;         // Height (px)
    text: string;           // Text content
    font: string;           // Font family
    size: number;           // Font size (px)
    color: string;          // Text color (hex)
    bold: boolean;
    italic: boolean;
    underline: boolean;
}
```

### Image Element
```typescript
interface ImageElement {
    type: 'image';
    x: number;              // X position (px)
    y: number;              // Y position (px)
    width: number;          // Width (px)
    height: number;         // Height (px)
    src: string;            // Image data URL
}
```

## HTML Elements (by ID)

### Containers
```
#slideCanvas          Canvas for slide editing
#slidesContainer      Container for slide thumbnails
#templateModal        Modal for template selection
#exportModal          Modal for export options
```

### Buttons - Slides
```
#addSlideBtn          Add new slide
#deleteSlideBtn       Delete current slide
#duplicateSlideBtn    Duplicate current slide
```

### Buttons - Edit
```
#undoBtn              Undo last action
#redoBtn              Redo last action
```

### Buttons - Elements
```
#addTextBtn           Add text box
#addImageBtn          Add image
#templateBtn          Show templates
#deleteElementBtn     Delete selected element
#bringForwardBtn      Bring element forward
#sendBackwardBtn      Send element backward
```

### Buttons - Export
```
#exportPptxBtn        Export as PPTX
#exportPdfBtn         Export as PDF
```

### Properties - Slide
```
#bgColor              Background color picker
#gradientType         Gradient type selector
#gradientColor1       Gradient first color
#gradientColor2       Gradient second color
```

### Properties - Element
```
#fontFamily           Font family selector
#fontSize             Font size input
#textColor            Text color picker
#boldCheckbox         Bold toggle
#italicCheckbox       Italic toggle
#underlineCheckbox    Underline toggle
```

### Other
```
#slideCounter         Slide counter display
#elementProperties    Properties panel for elements
#templateGrid         Container for template options
#imageFile            Hidden file input for images
#imageInput           File input in modal
#exportName           Export name input
```

## CSS Classes

### Layout
```
.presentation-editor   Main editor container
.slides-panel         Left slide thumbnails panel
.editor-panel         Center editor panel
.canvas-container     Canvas area container
.properties-panel     Right properties panel
```

### Slides
```
.slide-thumbnail      Individual slide thumbnail
.slide-thumbnail.active   Currently selected slide
.slide-number-badge   Badge showing slide number
```

### Toolbar
```
.editor-toolbar       Main toolbar
.toolbar-btn          Toolbar button
.toolbar-btn.active   Active toolbar button
.toolbar-section      Toolbar section group
```

### Properties
```
.property-group       Property group container
.property-label       Property label
.property-input       Text input
.property-select      Select dropdown
.property-color       Color picker
.property-checkbox    Checkbox label
```

### Modals
```
.modal-overlay        Modal background overlay
.modal-overlay.active   Visible modal
.modal               Modal dialog
.modal-header        Modal header
.modal-body          Modal content
.modal-footer        Modal footer
.modal-close         Close button
```

### Canvas
```
#slideCanvas          Canvas element
.slide-element        Canvas element (text/image)
.slide-element.selected   Selected element
.slide-element-text   Text element style
.slide-element-image  Image element style
```

## Color Palette

### Dark Mode (Default)
```
--bg:              #0F172A  (Deep background)
--surface-1:       #1E293B  (Card background)
--surface-2:       #334155  (Hover background)
--surface-3:       #475569  (Nested background)
--accent:          #818cf8  (Primary action - indigo)
--accent-subtle:   rgba(129, 140, 248, 0.12)
--text-primary:    #E2E8F0  (Main text)
--text-secondary:  #94A3B8  (Secondary text)
--border:          rgba(148, 163, 184, 0.15)
```

### Light Mode
```
--bg:              #fafafa  (Light background)
--surface-1:       #ffffff  (White surface)
--surface-2:       #f4f4f5  (Light gray)
--surface-3:       #e4e4e7  (Medium gray)
--text-primary:    #09090b  (Dark text)
--text-secondary:  #52525b  (Gray text)
```

## External Library APIs

### PptxGenJS
```javascript
const pres = new PptxGenJS();
pres.defineLayout({ name, width, height });
const slide = pres.addSlide(layoutName);
slide.background = { fill: hexColor };
slide.addText(text, { x, y, w, h, fontSize, ... });
slide.addImage({ path, x, y, w, h });
pres.save({ fileName });
```

### jsPDF
```javascript
const pdf = new jsPDF({ orientation, unit, format });
pdf.addImage(imageData, format, x, y, width, height);
pdf.addPage();
pdf.save(filename);
```

## Common Patterns

### Select Element and Update
```javascript
app.selectedElement = index;
updateElementProperties();  // Update UI
renderCurrentSlide();       // Redraw
```

### Modify Element and Save
```javascript
const elem = app.presentation.slides[app.currentSlideIndex].elements[app.selectedElement];
elem.property = newValue;
saveHistory();              // Save state
renderCurrentSlide();       // Redraw
```

### Add Element and Select
```javascript
const elem = { type, x, y, ... };
app.presentation.slides[app.currentSlideIndex].elements.push(elem);
app.selectedElement = app.presentation.slides[app.currentSlideIndex].elements.length - 1;
saveHistory();
renderCurrentSlide();
```

### Undo Changes
```javascript
saveHistory();              // Before making changes
// ... make changes ...
// If user presses Ctrl+Z:
undo();                     // Restore from history
```

## Performance Tips

1. **Minimize Redraws**: Call `renderCurrentSlide()` only when needed
2. **Batch Updates**: Make multiple changes before calling `saveHistory()`
3. **Lazy Loading**: Don't render all thumbnails in viewport during scroll
4. **Canvas Context**: Reuse canvas context instead of getting it multiple times
5. **Image Compression**: Consider compressing images before adding to presentation

## Debugging Tips

```javascript
// Check presentation structure
console.log(JSON.stringify(app.presentation, null, 2));

// Get current slide
const slide = app.presentation.slides[app.currentSlideIndex];
console.log(slide);

// Get selected element
const elem = slide.elements[app.selectedElement];
console.log(elem);

// Check history
console.log(`History: ${app.historyIndex + 1}/${app.history.length}`);

// Get canvas context
const canvas = document.getElementById('slideCanvas');
const ctx = canvas.getContext('2d');
console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
```

## Browser Storage

```javascript
// Get saved presentation from storage
const saved = localStorage.getItem('presentation-maker-data');
const data = JSON.parse(saved);

// Clear presentation (starts fresh on reload)
localStorage.removeItem('presentation-maker-data');

// Check storage size
const data = JSON.stringify(app.presentation);
console.log(`Size: ${data.length} bytes`);
```

---

**Quick Reference Version**: 1.0  
**Last Updated**: 2026-04-28
