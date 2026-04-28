# Presentation Maker - Technical Documentation

## Architecture Overview

The application follows a single-page application (SPA) architecture with the following layers:

```
┌─────────────────────────────────────┐
│     HTML Structure (UI Layout)       │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│    CSS Styling (Design System)      │
│    - CSS Variables for theming      │
│    - Responsive grid layout         │
│    - Modal styling                  │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   JavaScript Engine                 │
│   - State Management (app object)   │
│   - Canvas rendering                │
│   - Event handling                  │
│   - Data persistence                │
│   - Export functionality            │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   External Libraries (CDN)          │
│   - PptxGenJS (export to PPTX)      │
│   - jsPDF (export to PDF)           │
│   - html2canvas (render to image)   │
└─────────────────────────────────────┘
```

## State Management

### App Object
The entire application state is stored in a single `app` object:

```javascript
app = {
    presentation: {              // Current presentation data
        name: string,            // Presentation title
        slides: Array<Slide>     // Array of slide objects
    },
    currentSlideIndex: number,   // Index of selected slide
    selectedElement: number|null,// Index of selected element on current slide
    history: Array,              // Undo/redo history
    historyIndex: number,        // Current position in history
    isDragging: boolean,         // User dragging element
    // ... other state variables
}
```

### Slide Data Structure
```javascript
Slide = {
    background: string,          // Color or gradient string
    elements: Array<Element>
}

Element (Text) = {
    type: 'text',
    x: number,                   // X position in pixels
    y: number,                   // Y position in pixels
    width: number,               // Width in pixels
    height: number,              // Height in pixels
    text: string,                // Text content
    font: string,                // Font family
    size: number,                // Font size in px
    color: string,               // Text color (hex)
    bold: boolean,
    italic: boolean,
    underline: boolean
}

Element (Image) = {
    type: 'image',
    x: number,
    y: number,
    width: number,
    height: number,
    src: string                  // Data URL or file path
}
```

## Key Functions

### Initialization & Data Management

#### `init()`
- Entry point when DOM loads
- Calls `loadPresentation()` and `setupEventListeners()`
- Sets up canvas listeners

#### `loadPresentation()`
- Loads presentation from localStorage or creates default
- Initializes app.presentation if no saved data exists

#### `savePresentation()`
- Serializes app.presentation to JSON
- Stores in localStorage
- Integrates with undo/redo history

#### `saveHistory()`
- Saves current presentation state to history array
- Implements linear undo/redo (future branches replace old branches)

### Slide Management

#### `addSlide()`
- Creates new slide with default text elements
- Appends to slides array
- Sets as current slide

#### `deleteSlide()`
- Removes slide from array
- Prevents deletion of last slide
- Adjusts currentSlideIndex if needed

#### `duplicateSlide()`
- Deep clones current slide
- Inserts after current slide
- Sets as active slide

#### `selectSlide(index)`
- Updates currentSlideIndex
- Re-renders thumbnails
- Updates counter

### Canvas Rendering

#### `renderCurrentSlide()`
- Gets current slide from app.presentation
- Clears HTML5 canvas
- Draws background (color or gradient)
- Calls drawing functions for each element

#### `drawTextElement(ctx, elem, isSelected)`
- Applies text styles (font, size, color)
- Implements word wrapping
- Draws selection border if selected
- Handles bold/italic/underline rendering

#### `wrapText(ctx, text, maxWidth)`
- Splits text into lines based on maxWidth
- Used for multi-line text rendering
- Returns array of wrapped lines

#### `renderSlides()`
- Renders all slide thumbnails in left panel
- Creates mini canvas for each thumbnail
- Sets up drag/drop listeners
- Highlights current slide

### Element Editing

#### `addTextBox()`
- Creates new text element with default properties
- Adds to current slide's elements array
- Sets as selected element

#### `addImage()`
- Triggers file input dialog
- Reads file as data URL
- Creates image element at default position

#### `deleteElement()`
- Removes selected element from current slide
- Updates canvas
- Saves history

#### `bringForward() / sendBackward()`
- Swaps element position in elements array
- Implements z-index layering
- Updates selection index

### Canvas Interaction

#### `handleCanvasClick(e)`
- Calculates click position in canvas coordinate space
- Tests collision with all elements (reverse order for layering)
- Sets selectedElement
- Updates properties panel

#### `handleCanvasMouseDown(e), handleCanvasMouseMove(e), handleCanvasMouseUp(e)`
- Implements drag functionality
- Calculates delta movement
- Updates element position in real-time
- Saves history on mouse up

### Export Functions

#### `exportPptx()`
- Creates new PptxGenJS presentation
- Iterates through all slides
- Converts each slide to PPTX slide with:
  - Background color/gradient
  - Text elements with formatting
  - Image elements with positioning
- Downloads .pptx file

#### `exportPdf()`
- Creates new jsPDF document in landscape
- For each slide:
  - Renders to canvas
  - Converts canvas to image
  - Adds image to PDF as page
- Downloads .pdf file

### Undo/Redo System

#### `undo()`
- Decrements historyIndex
- Restores presentation from history array
- Re-renders all views

#### `redo()`
- Increments historyIndex
- Restores presentation from history array
- Re-renders all views

The history system works by:
1. Storing complete presentation snapshots in history array
2. Tracking current position with historyIndex
3. When making changes, slice off future history (forward branches)
4. Adding new snapshot to history

### Properties Panel

#### `updateElementProperties()`
- Called when element selected/deselected
- Shows/hides element properties div
- Populates property controls with element data

#### `updateSlideBackground()`
- Reads background color/gradient inputs
- Updates slide.background
- Saves history
- Re-renders slide

## Events

### Mouse Events on Canvas
- `click`: Select element at click position
- `mousedown`: Start drag if element selected
- `mousemove`: Update element position while dragging
- `mouseup`: End drag, save history

### Keyboard Events
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Delete`: Delete selected element

### UI Button Events
All toolbar buttons connected via `setupEventListeners()`
- Click handlers trigger corresponding functions
- Selected elements update via checkbox change events
- Select inputs trigger text property updates

### File Input Events
- Image file selection triggers FileReader
- Converts to data URL
- Creates image element

### Drag and Drop (Slides)
- Slide thumbnails have `draggable` attribute
- `dragstart`: Store dragged slide index
- `dragover`: Allow drop by preventing default
- `drop`: Reorder slides in array

## External Libraries

### PptxGenJS
- **Purpose**: Export to PowerPoint format (.pptx)
- **Usage**: 
  ```javascript
  const pres = new PptxGenJS();
  pres.defineLayout({ name: 'LAYOUT1', width: 10, height: 5.625 });
  const slide = pres.addSlide('LAYOUT1');
  slide.addText('Text', {...});
  pres.save({ fileName: 'presentation.pptx' });
  ```
- **Documentation**: https://gitbrent.github.io/PptxGenJS/

### jsPDF
- **Purpose**: Export to PDF format
- **Usage**:
  ```javascript
  const pdf = new jsPDF({ orientation: 'landscape' });
  pdf.addImage(imageData, 'PNG', x, y, width, height);
  pdf.save('presentation.pdf');
  ```
- **Documentation**: https://github.com/parallax/jsPDF

### html2canvas
- **Purpose**: Convert canvas elements to images
- **Usage**: Used indirectly by jsPDF for image generation
- **Documentation**: https://html2canvas.hertzen.com/

## CSS Architecture

### Design System Variables
All styling uses CSS custom properties from main stylesheet:

```css
--bg: #0F172A;              /* Primary background */
--surface-1: #1E293B;       /* Card/panel background */
--surface-2: #334155;       /* Hover/nested background */
--accent: #818cf8;          /* Primary action color */
--text-primary: #E2E8F0;    /* Main text */
--text-secondary: #94A3B8;  /* Secondary text */
--border: rgba(..., 0.15);  /* Border color */
```

### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 600px) { }

/* Tablet */
@media (max-width: 900px) { }

/* Desktop */
@media (min-width: 1200px) { }
```

### Custom Scrollbars
```css
.slides-container::-webkit-scrollbar {
    width: 6px;
}
/* ... styling for scrollbar track and thumb */
```

## Storage

### localStorage Schema
```
Key: 'presentation-maker-data'
Value: JSON.stringify(app.presentation)
Size: Typically 50KB-500KB depending on image count
Persistence: Cleared only when user clears browser cache
```

### Auto-save
- Runs every 30 seconds via `setInterval`
- Calls `savePresentation()` automatically
- User can also export at any time for backup

## Performance Considerations

### Rendering
- Canvas rendering happens on every interaction
- Throttle updates for real-time operations
- Large presentations (50+ slides) may need optimization

### Memory
- Undo history stores full presentation snapshots
- Limit history to ~100 entries to save memory
- Image data URLs stored in memory

### Optimization Opportunities
- Implement virtual scrolling for thumbnails
- Cache canvas renders between edits
- Compress image data before storing
- Implement requestAnimationFrame for smooth dragging

## Extension Points

### Adding New Elements
1. Add new element type in data structure
2. Add rendering function (e.g., `drawShapeElement`)
3. Call from `renderCurrentSlide()`
4. Add properties controls in HTML
5. Add update handler in properties panel

### Adding New Export Formats
1. Create export function (e.g., `exportODP()`)
2. Use appropriate library (LibreOffice, etc.)
3. Add button to toolbar
4. Connect via `setupEventListeners()`

### Adding New Fonts
Fonts already loaded via Google Fonts import. Add to dropdown options:
```javascript
<option value="New Font Name">New Font Name</option>
```

### Custom Templates
Add to TEMPLATES array:
```javascript
{
    name: 'Template Name',
    slides: [
        {
            background: '#color or gradient',
            elements: [...]
        }
    ]
}
```

## Testing Recommendations

### Manual Testing Checklist
- [ ] Add/delete/duplicate slides
- [ ] Drag slide thumbnails to reorder
- [ ] Add text and format it
- [ ] Add image from device
- [ ] Drag elements on canvas
- [ ] Use undo/redo (Ctrl+Z, Ctrl+Y)
- [ ] Delete elements with Delete key
- [ ] Change background color/gradient
- [ ] Apply templates
- [ ] Export to PPTX
- [ ] Export to PDF
- [ ] Refresh browser and verify persistence
- [ ] Test on mobile/tablet
- [ ] Test keyboard shortcuts

### Automated Testing
Would need:
- Jest for unit tests
- Puppeteer/Playwright for E2E tests
- Test data generation for presentations
- Export validation (check PPTX/PDF files)

## Debugging

### Console Debugging
```javascript
// View current presentation state
console.log(app.presentation);

// View current slide
console.log(app.presentation.slides[app.currentSlideIndex]);

// View selected element
console.log(app.presentation.slides[app.currentSlideIndex].elements[app.selectedElement]);

// View history
console.log(app.history);
```

### Browser DevTools
- Use Elements tab to inspect DOM structure
- Use Console for direct state queries
- Use Network tab to verify CDN library loads
- Use Application tab to check localStorage

## Security Considerations

✅ **Strengths**
- No server backend (no injection attacks)
- All processing client-side
- No authentication needed
- No data transmission

⚠️ **Considerations**
- localStorage vulnerable if device compromised
- Image data URLs could contain sensitive info
- No built-in file encryption
- Browser history may contain temporary data

## Browser Support

- Requires ES6 JavaScript support
- HTML5 Canvas API
- File API for image upload
- localStorage API
- Modern CSS Grid/Flexbox

## Future Enhancement Ideas

1. **Drawing Tools**: Add pen/brush for annotations
2. **Themes**: Pre-built color schemes
3. **Master Slides**: Consistent branding across presentation
4. **Animations**: Slide transitions and element animations
5. **Comments**: Collaborative feedback system
6. **Version History**: Keep multiple presentation versions
7. **Export Formats**: ODP, Google Slides, HTML
8. **Table Support**: Insert and format tables
9. **Charts**: Simple chart/graph elements
10. **Accessibility**: ARIA labels, keyboard navigation improvements

---

**Last Updated**: 2026-04-28  
**Maintained by**: OnlinePDFPro Development Team
