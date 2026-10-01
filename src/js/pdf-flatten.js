// Local PDF flattening. Form mode preserves the document catalog and text;
// image mode is an explicit destructive choice and never reuses transferred data.
window.flattenLocalPdf = async function (bytes, { mode, removeMetadata, onProgress }) {
    const { PDFDocument, PDFName } = PDFLib;
    let pdf;
    let fieldsFlattened = 0;
    if (mode === 'forms') {
        pdf = await PDFDocument.load(bytes.slice(0), { updateMetadata: false });
        const form = pdf.getForm();
        fieldsFlattened = form.getFields().length;
        const widgetDictionaries = new Set(form.getFields().flatMap(field => field.acroField.getWidgets().map(widget => widget.dict)));
        form.flatten();
        // pdf-lib 1.17.1 can leave references to deleted widgets in Annots.
        // Remove only flattened widgets/dangling refs; keep unrelated links
        // and annotations instead of rebuilding the page from an image.
        for (const page of pdf.getPages()) {
            const annotations = page.node.Annots();
            if (!annotations) continue;
            const remaining = annotations.asArray().filter(ref => {
                const annotation = pdf.context.lookup(ref);
                return annotation && !widgetDictionaries.has(annotation);
            });
            page.node.set(PDFName.of('Annots'), pdf.context.obj(remaining));
        }
        onProgress(90, 'Saving form appearances...');
    } else if (mode === 'images') {
        pdf = await PDFDocument.create();
        const rendered = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        try {
            for (let pageNumber = 1; pageNumber <= rendered.numPages; pageNumber++) {
                onProgress(20 + 70 * pageNumber / rendered.numPages, `Rendering page ${pageNumber} of ${rendered.numPages}...`);
                const source = await rendered.getPage(pageNumber);
                const viewport = source.getViewport({ scale: 2 });
                if (viewport.width * viewport.height > 24_000_000) throw new Error('This page is too large to render safely. Use form-only mode.');
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                try {
                    await source.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                    const imageBytes = Uint8Array.from(atob(canvas.toDataURL('image/jpeg', 0.95).split(',')[1]), c => c.charCodeAt(0));
                    const image = await pdf.embedJpg(imageBytes);
                    const dimensions = source.getViewport({ scale: 1 });
                    const page = pdf.addPage([dimensions.width, dimensions.height]);
                    page.drawImage(image, { x: 0, y: 0, width: dimensions.width, height: dimensions.height });
                } finally {
                    canvas.width = 0;
                    canvas.height = 0;
                    source.cleanup();
                }
            }
        } finally {
            await rendered.destroy();
        }
    } else {
        throw new Error('Choose a supported flattening mode.');
    }
    // This removes the standard document information dictionary, not hidden
    // content, attachments, XMP metadata or other recoverable document data.
    if (removeMetadata) {
        if (pdf.context.trailerInfo.Info) pdf.context.delete(pdf.context.trailerInfo.Info);
        pdf.context.trailerInfo.Info = undefined;
    }
    const output = await pdf.save({ useObjectStreams: true });
    const reopened = await PDFDocument.load(output, { updateMetadata: false });
    if (reopened.getPageCount() !== pdf.getPageCount()) throw new Error('The output did not pass its page-count check.');
    return { bytes: output, pageCount: pdf.getPageCount(), fieldsFlattened };
};
