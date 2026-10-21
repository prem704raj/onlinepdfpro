// Original walkthroughs tied to the site's supported workflows and example files.
module.exports = [
  {
    slug: 'merge-and-split-an-assignment',
    url: '/guides/merge-and-split-an-assignment/',
    title: 'Prepare an assignment with Merge and Split PDF',
    description: 'Practise page selection and document order with an original three-page sample, then check the downloaded PDF before submission.',
    tools: [{name: 'Split PDF',url: '/tools/split-pdf'}, {name: 'Merge PDF',url: '/tools/merge-pdf'}],
    body: `<p>An assignment often needs a cover, the main work and supporting pages in a particular order. Start by checking the submission instructions: one PDF or separate files, the required page order, and the maximum size. The sample below is fictional and has a cover, a notes page and a checklist. You can practise without uploading a private document.</p>
<p><a href="/assets/examples/sample-assignment.pdf" download>Download the three-page sample assignment PDF</a>. Page 1 is the cover, page 2 is the notes, and page 3 is the checklist. All three pages use A4 dimensions. The file has ordinary searchable text; it contains no signature, official certificate or personal record.</p>
<h2>Extract the notes and checklist</h2><ol><li>Open <a href="/tools/split-pdf">Split PDF</a> and choose the sample file.</li><li>Enter <strong>2-3</strong> in Page Range Selection. The selected count should be two. You can also tap page thumbnails.</li><li>Choose <strong>Extract &amp; Save</strong>, then download the result.</li><li>Open the download in a separate PDF viewer. It should have two pages: Revision notes followed by Submission checklist.</li></ol>
<p>The tool outputs selected pages in their original source order. Entering <code>3,2,2</code> still produces pages 2 and 3 once each; it does not reverse their order. Use <a href="/pdf-page-reorder">PDF Page Reorder</a> when the pages themselves need rearranging. Ranges such as <code>2junk</code>, <code>3-2</code> or <code>1-999</code> are invalid for this three-page example.</p>
<h2>Create the cover, then merge the two files</h2><ol><li>Return to Split PDF, select only page <strong>1</strong>, and download the cover.</li><li>Open <a href="/tools/merge-pdf">Merge PDF</a>. Choose the cover PDF and the two-page result from the first exercise.</li><li>Check the file list. Move the cover above the notes/checklist file if necessary. Merge uses file order, including every page within each file.</li><li>Merge and download. Reopen the result and confirm the sequence: cover, notes, checklist. There should be three pages.</li></ol>
<h2>What to inspect before a real submission</h2><ul><li>Confirm page count and order; an extra blank page can be easy to miss.</li><li>Zoom in on small text, diagrams, signatures and any scanned page.</li><li>Check form fields, links and bookmarks if you depend on them. Combining pages does not establish that every document-level interactive feature is preserved.</li><li>Check the resulting file size against the portal's actual limit. Merging is not compression.</li></ul>
<h2>If the file will not open or export</h2><p>Use a valid PDF that you can open in another viewer. A password-protected file may need <a href="/tools/pdf-unlock">PDF Unlock</a> with the correct password first. Very large documents can exceed a phone's memory; try fewer files or a desktop browser. Keep the originals so a failed or incorrect export can be retried.</p>
<p>Merge and Split perform this workflow in the browser. They do not turn photographed text into searchable text, and removing a page is different from removing private information within a retained page.</p>`,
  },
  {
    slug: 'choose-a-pdf-compression-mode',
    url: '/guides/choose-a-pdf-compression-mode/',
    title: 'Choose PDF compression for an upload limit',
    description: 'Understand structural and image-based compression, inspect actual results, and know when a requested size cannot be reached.',
    tools: [{name: 'Compress PDF',url: '/tools/compress-pdf'}],
    body: `<p>A portal's file limit is a requirement for the final download, not a promise a compression tool can always meet. A PDF with several large photographs behaves differently from a small text document. Check the exact limit and whether the portal expects KB or MB, then retain the original before trying changes.</p>
<h2>Start with the mode that keeps document features</h2><ol><li>Open <a href="/tools/compress-pdf">Compress PDF</a> and choose your document.</li><li>Enter a target and choose the matching unit. Leave <strong>Allow image-based compression</strong> unchecked for the first attempt.</li><li>Run compression and read the actual output size. The result may remain above the target.</li><li>Download and reopen the PDF. Check all required pages, searchable text, forms and links.</li></ol>
<p>The default structural mode optimizes how the PDF is stored while retaining text, links and form fields. It does not promise a fixed percentage reduction. An already optimized document may offer little or no saving; the tool keeps the original when the alternative is not smaller.</p>
<h2>Try an example that is already small</h2><p><a href="/assets/examples/sample-assignment.pdf" download>Download the original three-page sample assignment</a> and note its size in your device's file manager. Try structural compression. This is a simple text/vector file, so a dramatic reduction is not expected. A retained original is a useful result when further processing would only enlarge it.</p>
<h2>Understand the image-based tradeoff</h2><p>If structural compression misses the limit, the optional image mode renders pages into JPEG images. This may help a large scanned document, but it changes the output fundamentally:</p>
<ul><li>Text is no longer searchable or selectable as ordinary PDF text.</li><li>Links and interactive forms are lost.</li><li>Accessibility tags are not retained.</li><li>Small letters and diagrams may become blurry at stronger compression.</li></ul>
<p>Use this mode only when those losses are acceptable for the recipient. Check the feature-loss disclosure before enabling it. A completed export still does not guarantee the requested size. Inspect the actual download, especially its smallest text, rather than relying on a saving percentage.</p>
<h2>When the target remains impossible</h2><ul><li>If the portal permits separate uploads, <a href="/tools/split-pdf">split the document</a> into logical sections.</li><li>If unnecessary pages can be omitted under the submission rules, remove them before retrying. Do not remove required pages merely to fit a limit.</li><li>For photo-heavy documents, use clearer, smaller source images and avoid excessive empty borders when creating the PDF.</li><li>If readability would suffer, ask the recipient for an alternative submission method.</li></ul>
<h2>Final checks</h2><p>Open the final file independently, confirm its size and page count, and inspect signatures, diagrams and filled fields. Keep the original. These steps matter more than hitting an attractive compression percentage. The browser processes this tool's files locally; a phone can still run out of memory with a large document.</p>`,
  },
  {
    slug: 'turn-note-images-into-a-readable-pdf',
    url: '/guides/turn-note-images-into-a-readable-pdf/',
    title: 'Turn note images into a readable PDF on your phone',
    description: 'Practise a two-page A4 export using original example images, then check page order, orientation, readability and file size.',
    tools: [{name: 'JPG to PDF',url: '/tools/jpg-to-pdf'}, {name: 'Image Crop',url: '/tools/image-crop'}],
    body: `<p>Photographed notes are useful only if the final reader can see the writing. Capture one page at a time, keep the page flat, avoid shadows and include its edges. A sharp, well-lit photo usually needs less corrective work than a blurry one. Verify orientation before assembling the document.</p>
<h2>Practise with the example images</h2><p>These images come from our original fictional sample assignment. They are rendered page images, not photographs or personal records. They demonstrate page order and an A4 export without asking you to use private notes.</p>
<div class="guide-images"><a href="/assets/examples/notes-page.jpg" download><img src="/assets/examples/notes-page.jpg" alt="Original example image titled Revision notes" width="794" height="1123" loading="lazy"><span>Download notes page JPG</span></a><a href="/assets/examples/checklist-page.jpg" download><img src="/assets/examples/checklist-page.jpg" alt="Original example image titled Submission checklist" width="794" height="1123" loading="lazy"><span>Download checklist page JPG</span></a></div>
<ol><li>Save both JPG images, then open <a href="/tools/jpg-to-pdf">JPG to PDF</a>.</li><li>Select both files. Put the notes page before the checklist page in the image list.</li><li>Choose A4 for this exercise and create the PDF.</li><li>Download and reopen it. Confirm there are two pages in the selected order, with readable text and no missing edges.</li></ol>
<h2>Prepare your own photos</h2><p>Remove unnecessary desk/background borders with <a href="/tools/image-crop">Image Crop</a>, while leaving a margin around the writing. Rotate the source image if it is sideways. Save the cropped image and inspect it before conversion; cutting through a heading cannot be repaired by placing the image in a PDF.</p>
<p>Use JPG or PNG for this workflow. If your phone provides HEIC, <a href="/tools/heic-to-jpg">HEIC to JPG</a> can create a JPEG first. That converter uses the first image in multi-image files and does not retain camera metadata. If a file cannot be decoded, keep the original and try exporting a JPG from your device.</p>
<h2>Choose a page layout deliberately</h2><p>A4 is useful when the recipient expects standard pages, but it is not a requirement for every use. The converter places each image on a page; it cannot recover handwriting that was out of focus in the source. A long or unusually shaped image may have unused space when fitted onto A4.</p>
<h2>What the PDF contains</h2><p>The resulting document contains page images. It does not automatically create searchable text. If you need selectable text from an image, try <a href="/tools/image-to-text">Image to Text</a> and inspect the OCR result carefully. Language, resolution and handwriting affect recognition; formulas and names deserve special attention.</p>
<h2>Check before sending</h2><ul><li>Zoom into the smallest writing rather than judging only the thumbnail.</li><li>Check page count, orientation and order in another PDF viewer.</li><li>Check file size against the recipient's actual limit. Image-heavy files can be large.</li><li>Keep the original photos. If compression is needed, read <a href="/guides/choose-a-pdf-compression-mode/">the compression tradeoffs</a> before reducing quality.</li></ul>
<p>This image-to-PDF workflow runs in your browser. Older phones can struggle with many high-resolution pictures; process a smaller batch if the browser becomes unresponsive.</p>`,
  },
  {
    slug: 'split-admit-card-pages',
    url: '/guides/split-admit-card-pages/',
    title: 'Split an admit card or exam hall ticket',
    description: 'Extract the candidate copy while omitting multi-page instructions, inspect barcode clarity, and stay under strict portal upload limits.',
    tools: [{name: 'Split PDF',url: '/tools/split-pdf'}, {name: 'Compress PDF',url: '/tools/compress-pdf'}],
    body: `<p>Most examination boards and university admission systems issue multi-page admit cards. Typically, page 1 contains the candidate photo, roll number, desk assignment, and barcode, while pages 2 and 3 list general examination guidelines, prohibited items, and travel instructions. When submitting proof of registration to a verification portal, uploading the entire multi-page document often exceeds file limits or confuses document checkers.</p>
<h2>Practise with the sample admit card fixture</h2>
<p><a href="/assets/examples/sample-admit-card.pdf" download>Download the two-page sample admit card PDF</a>. Page 1 is the Candidate Copy and page 2 is the Instructions Sheet. The file uses standard A4 dimensions with vector text and barcode markers. It contains only fictional student data and no real personal records.</p>
<figure class="guide-figure"><img src="/assets/examples/admit-card-split.svg" alt="Before: candidate copy and instructions pages. After: candidate copy alone." width="320" height="470" loading="lazy"><figcaption>Select page 1 to leave the instructions sheet out of the downloaded PDF.</figcaption></figure>
<h2>Extract Page 1 (Candidate Copy)</h2>
<ol>
  <li>Open <a href="/tools/split-pdf">Split PDF</a> and choose <code>sample-admit-card.pdf</code>.</li>
  <li>Under Page Range Selection, enter <strong>1</strong>. The selected count will indicate 1 page. Alternatively, tap the first thumbnail directly.</li>
  <li>Select <strong>Extract &amp; Save</strong>, then download the resulting PDF.</li>
  <li>Open the downloaded file in a standalone viewer. Confirm that it contains only the candidate credentials, photo box, and barcode, without the instructions sheet.</li>
</ol>
<h2>Inspect the output before upload</h2>
<ul>
  <li><strong>Barcode &amp; QR readability:</strong> Zoom into the barcode and roll number to confirm crisp vector outlines.</li>
  <li><strong>Page dimensions:</strong> Verify that the page orientation is portrait and remains standard A4.</li>
  <li><strong>File size:</strong> Check the file size in your device's file manager. A single-page vector admit card is usually under 50 KB.</li>
</ul>
<h2>If the portal has a strict file size limit (e.g., under 200 KB)</h2>
<p>If your scanned admit card is an image capture rather than a digital vector PDF, it may exceed strict 100 KB–200 KB submission caps. If that happens, use <a href="/tools/compress-pdf">Compress PDF</a> with structural compression first to preserve text sharpness. Read our <a href="/guides/choose-a-pdf-compression-mode/">compression mode guide</a> before choosing image rasterization.</p>
<p>Split PDF runs locally in your web browser. Your private admit card and identity details are not uploaded to any remote server.</p>`,
  },
  {
    slug: 'compress-a-university-upload',
    url: '/guides/compress-a-university-upload/',
    title: 'Compress a university or employment portal upload',
    description: 'Meet 200 KB to 1 MB document caps for university and job portals without making roll numbers, grades, or signatures unreadable.',
    tools: [{name: 'Compress PDF',url: '/tools/compress-pdf'}, {name: 'Split PDF',url: '/tools/split-pdf'}],
    body: `<p>Online university portals and public recruitment boards commonly impose strict file size limits—often as small as 200 KB, 500 KB, or 1 MB. An applicant's document bundle may include degree certificates, semester marksheets, and identity cards that easily total several megabytes. The goal is reducing file size without rendering essential grades, dates, or signatures illegible.</p>
<h2>Practise with the sample documents</h2>
<p>You can test compression techniques using our <a href="/assets/examples/sample-assignment.pdf" download>3-page sample assignment PDF</a> or download the complete <a href="/assets/examples/onlinepdfpro-practice-pack.zip" download>practice pack (ZIP)</a>.</p>
<figure class="guide-figure"><img src="/assets/examples/compression-mode.svg" alt="Try structural compression first. Optional image mode may reduce size but removes searchable text and forms." width="320" height="525" loading="lazy"><figcaption>Start with structural compression, then compare the actual result with your upload limit.</figcaption></figure>
<h2>Step 1: Always try structural compression first</h2>
<ol>
  <li>Open <a href="/tools/compress-pdf">Compress PDF</a> and select your document.</li>
  <li>Enter your portal's required limit (for example, <strong>500 KB</strong> or <strong>1 MB</strong>).</li>
  <li>Leave <strong>Allow image-based compression</strong> unchecked for the first run.</li>
  <li>Click <strong>Compress PDF</strong> and examine the reported output size.</li>
</ol>
<p>Structural compression avoids rasterizing the pages, so ordinary text and vector lines remain sharp. Open the result and check forms, links, signatures, and page content before using it; some document features may not survive PDF rewriting.</p>
<h2>Step 2: What to do when structural compression is not enough</h2>
<p>If your original document consists of smartphone camera photos or high-DPI flatbed scans, structural compression may only yield modest savings because the embedded image pixels take up most of the file. You have two options:</p>
<ul>
  <li><strong>Separate your documents:</strong> Check if the application portal allows uploading individual files (for example, separate fields for Degree Certificate and Marksheet). If allowed, use <a href="/tools/split-pdf">Split PDF</a> to separate the pages into smaller individual files.</li>
  <li><strong>Controlled image compression:</strong> If the portal insists on a single consolidated file, enable <strong>Allow image-based compression</strong> in Compress PDF. This renders entire pages as JPEG images, removing searchable text, links, and interactive forms.</li>
</ul>
<h2>Essential verification checklist before submitting</h2>
<ul>
  <li>Zoom in to 200% on registration numbers, dates of birth, and official stamps. If numbers like 8 and 3 or 5 and 6 become ambiguous, reject the compressed output.</li>
  <li>Check every page in an independent PDF viewer to verify no pages were omitted or rotated.</li>
  <li>Check the exact file size on disk against the portal's stated ceiling. Target slightly below the maximum (e.g. 900 KB for a 1 MB limit).</li>
</ul>
<p>All compression operations in this tool occur locally in your browser memory. Your academic transcripts and personal credentials never leave your machine.</p>`,
  },
];
