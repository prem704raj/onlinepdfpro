"""
Bulk SEO updater for OnlinePDFPro tool pages.
Replaces generic title/description/OG/Twitter tags with unique, per-tool SEO metadata.
"""
import re, os

TOOLS_DIR = os.path.join(os.path.dirname(__file__), 'tools')

# Per-tool SEO metadata
SEO_DATA = {
    'compress-pdf.html': {
        'title': 'Compress PDF Online Free - Reduce PDF File Size | OnlinePDFPro',
        'description': 'Compress PDF files online for free. Reduce PDF size up to 90% without losing quality. No upload, 100% private, works on mobile. Batch compress multiple PDFs.',
        'keywords': 'compress pdf, reduce pdf size, shrink pdf online free, pdf compressor, compress pdf without losing quality, reduce pdf file size',
        'og_title': 'Compress PDF Online Free - Reduce Size Instantly',
        'og_description': 'Shrink your PDFs up to 90% smaller. Free, private, no upload required.',
        'og_url': 'https://onlinepdfpro.com/tools/compress-pdf.html',
        'twitter_title': 'Compress PDF Free - No Upload Required',
        'twitter_description': 'Reduce PDF file size instantly. 100% free, works offline.',
    },
    'merge-pdf.html': {
        'title': 'Merge PDF Online Free - Combine PDF Files | OnlinePDFPro',
        'description': 'Merge multiple PDF files into one document for free. Drag and drop to reorder pages. No upload, 100% private, works on mobile.',
        'keywords': 'merge pdf, combine pdf files, join pdf online free, pdf merger, merge pdf pages, combine pdf documents',
        'og_title': 'Merge PDF Online Free - Combine Multiple PDFs',
        'og_description': 'Combine PDF files into one document. Drag to reorder. Free and private.',
        'og_url': 'https://onlinepdfpro.com/tools/merge-pdf.html',
        'twitter_title': 'Merge PDF Free - Combine Files Instantly',
        'twitter_description': 'Join multiple PDFs into one. Drag to reorder. No upload needed.',
    },
    'split-pdf.html': {
        'title': 'Split PDF Online Free - Extract Pages from PDF | OnlinePDFPro',
        'description': 'Split PDF files into separate pages or custom ranges for free. Extract specific pages from any PDF. No upload, 100% private.',
        'keywords': 'split pdf, extract pdf pages, separate pdf pages, pdf splitter online free, split pdf by pages',
        'og_title': 'Split PDF Online Free - Extract Pages Easily',
        'og_description': 'Split PDFs into individual pages or custom ranges. Free and private.',
        'og_url': 'https://onlinepdfpro.com/tools/split-pdf.html',
        'twitter_title': 'Split PDF Free - Extract Pages Online',
        'twitter_description': 'Separate PDF pages instantly. No upload required.',
    },
    'sign-pdf.html': {
        'title': 'Sign PDF Online Free - Add Digital Signature to PDF | OnlinePDFPro',
        'description': 'Sign PDF documents online for free. Draw your signature, drag and resize on any page. No upload, 100% private, legally valid e-signature.',
        'keywords': 'sign pdf online free, add signature to pdf, digital signature pdf, e-sign pdf, pdf signature tool, sign document online',
        'og_title': 'Sign PDF Online Free - Add E-Signature',
        'og_description': 'Draw and place your signature on any PDF page. Free and 100% private.',
        'og_url': 'https://onlinepdfpro.com/tools/sign-pdf.html',
        'twitter_title': 'Sign PDF Free - Digital Signature Tool',
        'twitter_description': 'Add your signature to PDF documents. Free, private, no upload.',
    },
    'ocr.html': {
        'title': 'OCR PDF Online Free - Extract Text from Images & PDFs | OnlinePDFPro',
        'description': 'Extract text from scanned PDFs and images using free OCR. Supports Hindi, English, and 100+ languages. No upload, 100% private.',
        'keywords': 'ocr pdf, extract text from pdf, ocr online free, text recognition, ocr hindi, image to text, scanned pdf to text',
        'og_title': 'OCR PDF Free - Extract Text from Scanned Documents',
        'og_description': 'Convert scanned PDFs and images to editable text. Supports 100+ languages.',
        'og_url': 'https://onlinepdfpro.com/tools/ocr.html',
        'twitter_title': 'OCR PDF Free - Text Extraction Tool',
        'twitter_description': 'Extract text from scanned PDFs. Supports Hindi & 100+ languages.',
    },
    'images-to-pdf.html': {
        'title': 'Images to PDF Online Free - Convert JPG/PNG to PDF | OnlinePDFPro',
        'description': 'Convert images to PDF for free. Supports JPG, PNG, WEBP. Combine multiple images into a single PDF document. No upload, 100% private.',
        'keywords': 'images to pdf, jpg to pdf, png to pdf, convert image to pdf, photo to pdf online free, picture to pdf',
        'og_title': 'Images to PDF Free - Convert JPG/PNG to PDF',
        'og_description': 'Convert and combine images into a PDF. Supports JPG, PNG, WEBP.',
        'og_url': 'https://onlinepdfpro.com/tools/images-to-pdf.html',
        'twitter_title': 'Images to PDF Free - JPG/PNG Converter',
        'twitter_description': 'Convert multiple images to a single PDF. Free and private.',
    },
    'pdf-to-images.html': {
        'title': 'PDF to Images Online Free - Convert PDF to JPG/PNG | OnlinePDFPro',
        'description': 'Convert PDF pages to high-quality images for free. Export as JPG or PNG. No upload, 100% private, works on mobile.',
        'keywords': 'pdf to image, pdf to jpg, pdf to png, convert pdf to image, pdf to picture online free',
        'og_title': 'PDF to Images Free - Convert PDF to JPG/PNG',
        'og_description': 'Export PDF pages as high-quality JPG or PNG images. Free and private.',
        'og_url': 'https://onlinepdfpro.com/tools/pdf-to-images.html',
        'twitter_title': 'PDF to Images Free - Export Pages as JPG',
        'twitter_description': 'Convert PDF to images instantly. No upload needed.',
    },
    'pdf-to-excel.html': {
        'title': 'PDF to Excel Online Free - Convert PDF to XLSX | OnlinePDFPro',
        'description': 'Convert PDF tables to Excel spreadsheets for free. Extract data from PDF to XLSX format. No upload, 100% private.',
        'keywords': 'pdf to excel, pdf to xlsx, convert pdf to spreadsheet, extract table from pdf, pdf to excel online free',
        'og_title': 'PDF to Excel Free - Convert Tables to XLSX',
        'og_description': 'Extract tables from PDF and convert to Excel spreadsheets. Free.',
        'og_url': 'https://onlinepdfpro.com/tools/pdf-to-excel.html',
        'twitter_title': 'PDF to Excel Free - Table Extractor',
        'twitter_description': 'Convert PDF tables to Excel. No upload, 100% private.',
    },
    'pdf-to-ppt.html': {
        'title': 'PDF to PowerPoint Online Free - Convert PDF to PPTX | OnlinePDFPro',
        'description': 'Convert PDF to PowerPoint presentations for free. Transform PDF slides to editable PPTX format. No upload, 100% private.',
        'keywords': 'pdf to ppt, pdf to powerpoint, convert pdf to pptx, pdf to presentation online free',
        'og_title': 'PDF to PowerPoint Free - Convert PDF to PPTX',
        'og_description': 'Transform PDF documents into editable PowerPoint slides. Free.',
        'og_url': 'https://onlinepdfpro.com/tools/pdf-to-ppt.html',
        'twitter_title': 'PDF to PPT Free - Presentation Converter',
        'twitter_description': 'Convert PDF to PowerPoint slides. Free and private.',
    },
    'pdf-lock.html': {
        'title': 'Lock PDF Online Free - Password Protect PDF | OnlinePDFPro',
        'description': 'Add password protection to your PDF files for free. Encrypt PDFs with AES-128 security. No upload, 100% private.',
        'keywords': 'lock pdf, password protect pdf, encrypt pdf online free, secure pdf, pdf password, protect pdf file',
        'og_title': 'Lock PDF Free - Password Protect Your Documents',
        'og_description': 'Add password encryption to PDFs. AES-128 security, 100% private.',
        'og_url': 'https://onlinepdfpro.com/tools/pdf-lock.html',
        'twitter_title': 'Lock PDF Free - Encrypt with Password',
        'twitter_description': 'Password protect your PDFs instantly. No upload needed.',
    },
    'add-page-numbers.html': {
        'title': 'Add Page Numbers to PDF Online Free | OnlinePDFPro',
        'description': 'Add page numbers to PDF documents for free. Customize position, font, and starting number. No upload, 100% private.',
        'keywords': 'add page numbers to pdf, pdf page numbering, number pdf pages online free, insert page numbers pdf',
        'og_title': 'Add Page Numbers to PDF Free',
        'og_description': 'Insert customizable page numbers into any PDF. Free and private.',
        'og_url': 'https://onlinepdfpro.com/tools/add-page-numbers.html',
        'twitter_title': 'Add Page Numbers to PDF Free',
        'twitter_description': 'Number your PDF pages instantly. No upload required.',
    },
    'rotate-pdf.html': {
        'title': 'Rotate PDF Online Free - Turn PDF Pages | OnlinePDFPro',
        'description': 'Rotate PDF pages 90°, 180°, or 270° for free. Fix upside-down or sideways scans. No upload, 100% private.',
        'keywords': 'rotate pdf, turn pdf pages, rotate pdf 90 degrees, fix pdf orientation, rotate pdf online free',
        'og_title': 'Rotate PDF Free - Fix Page Orientation',
        'og_description': 'Rotate PDF pages to any angle. Fix upside-down scans. Free.',
        'og_url': 'https://onlinepdfpro.com/tools/rotate-pdf.html',
        'twitter_title': 'Rotate PDF Free - Turn Pages Easily',
        'twitter_description': 'Fix PDF page rotation instantly. No upload needed.',
    },
    'rotate-pdf-godmode.html': {
        'title': 'Rotate PDF Advanced - Individual Page Rotation | OnlinePDFPro',
        'description': 'Rotate individual PDF pages with advanced controls. Preview and rotate each page separately. No upload, 100% private.',
        'keywords': 'rotate pdf pages individually, advanced pdf rotation, rotate single pdf page, pdf page rotator',
        'og_title': 'Rotate PDF Advanced - Per-Page Rotation',
        'og_description': 'Rotate individual pages in your PDF with full control. Free.',
        'og_url': 'https://onlinepdfpro.com/tools/rotate-pdf-godmode.html',
        'twitter_title': 'Advanced PDF Rotation - Per Page',
        'twitter_description': 'Rotate each PDF page individually. Free and private.',
    },
    'pdf-watermark.html': {
        'title': 'Add Watermark to PDF Online Free | OnlinePDFPro',
        'description': 'Add text or image watermarks to PDF documents for free. Customize opacity, position, and rotation. No upload, 100% private.',
        'keywords': 'add watermark to pdf, pdf watermark online free, stamp pdf, watermark pdf pages, text watermark pdf',
        'og_title': 'Add Watermark to PDF Free',
        'og_description': 'Stamp custom text or image watermarks on PDFs. Free and private.',
        'og_url': 'https://onlinepdfpro.com/tools/pdf-watermark.html',
        'twitter_title': 'PDF Watermark Free - Add Stamps',
        'twitter_description': 'Add custom watermarks to your PDFs. No upload required.',
    },
    'repair-pdf.html': {
        'title': 'Repair PDF Online Free - Fix Corrupted PDF | OnlinePDFPro',
        'description': 'Repair broken or corrupted PDF files for free. Recover data from damaged PDFs. No upload, 100% private.',
        'keywords': 'repair pdf, fix corrupted pdf, recover pdf file, broken pdf repair, pdf fixer online free',
        'og_title': 'Repair PDF Free - Fix Corrupted Files',
        'og_description': 'Recover and fix broken PDF documents. Free and private.',
        'og_url': 'https://onlinepdfpro.com/tools/repair-pdf.html',
        'twitter_title': 'Repair PDF Free - Fix Broken Files',
        'twitter_description': 'Fix corrupted PDFs instantly. No upload needed.',
    },
    'image-compress.html': {
        'title': 'Compress Images Online Free - Reduce Image Size | OnlinePDFPro',
        'description': 'Compress JPG, PNG, and WEBP images for free. Reduce file size up to 80% without losing quality. No upload, 100% private.',
        'keywords': 'compress image, reduce image size, image compressor online free, compress jpg, compress png, shrink image',
        'og_title': 'Compress Images Free - Reduce Size Instantly',
        'og_description': 'Shrink images up to 80% smaller. Supports JPG, PNG, WEBP. Free.',
        'og_url': 'https://onlinepdfpro.com/tools/image-compress.html',
        'twitter_title': 'Image Compressor Free - Reduce Size',
        'twitter_description': 'Compress images without quality loss. Free and private.',
    },
    'image-crop.html': {
        'title': 'Crop Images Online Free - Image Cropper Tool | OnlinePDFPro',
        'description': 'Crop images online for free. Custom aspect ratios, precise cropping. Supports JPG, PNG, WEBP. No upload, 100% private.',
        'keywords': 'crop image online, image cropper free, resize crop image, cut image, trim image online',
        'og_title': 'Crop Images Free - Custom Aspect Ratios',
        'og_description': 'Crop and trim images with precision. Supports all formats. Free.',
        'og_url': 'https://onlinepdfpro.com/tools/image-crop.html',
        'twitter_title': 'Image Cropper Free - Crop Online',
        'twitter_description': 'Crop images with custom ratios. Free and private.',
    },
    'image-resize.html': {
        'title': 'Resize Images Online Free - Change Image Dimensions | OnlinePDFPro',
        'description': 'Resize images to any dimension for free. Maintain aspect ratio. Supports JPG, PNG, WEBP. No upload, 100% private.',
        'keywords': 'resize image online, change image size, image resizer free, scale image, resize photo online',
        'og_title': 'Resize Images Free - Change Dimensions',
        'og_description': 'Resize images to exact dimensions. Maintain quality. Free.',
        'og_url': 'https://onlinepdfpro.com/tools/image-resize.html',
        'twitter_title': 'Image Resizer Free - Scale Images',
        'twitter_description': 'Resize images to any size. Free and private.',
    },
    'csv-to-xlsx.html': {
        'title': 'CSV to Excel Online Free - Convert CSV to XLSX | OnlinePDFPro',
        'description': 'Convert CSV files to Excel XLSX format for free. Preserve formatting and data types. No upload, 100% private.',
        'keywords': 'csv to excel, csv to xlsx, convert csv to spreadsheet, csv converter online free',
        'og_title': 'CSV to Excel Free - Convert to XLSX',
        'og_description': 'Transform CSV files into Excel spreadsheets. Free and private.',
        'og_url': 'https://onlinepdfpro.com/tools/csv-to-xlsx.html',
        'twitter_title': 'CSV to Excel Free - Format Converter',
        'twitter_description': 'Convert CSV to XLSX instantly. No upload needed.',
    },
    'xlsx-to-csv.html': {
        'title': 'Excel to CSV Online Free - Convert XLSX to CSV | OnlinePDFPro',
        'description': 'Convert Excel spreadsheets to CSV format for free. Export XLSX data as comma-separated values. No upload, 100% private.',
        'keywords': 'excel to csv, xlsx to csv, convert spreadsheet to csv, excel converter online free',
        'og_title': 'Excel to CSV Free - Convert XLSX',
        'og_description': 'Export Excel data as CSV files. Free and private.',
        'og_url': 'https://onlinepdfpro.com/tools/xlsx-to-csv.html',
        'twitter_title': 'Excel to CSV Free - Data Converter',
        'twitter_description': 'Convert XLSX to CSV instantly. No upload needed.',
    },
}

# Generic patterns to find and replace
GENERIC_TITLE = r'<title>Online PDF Pro - Free PDF Tools: Merge, Compress, Sign, OCR & More</title>'
GENERIC_DESC = r'<meta name="description" content="100% Free PDF tools: Merge, Split, Compress, Convert, Unlock, Watermark, Sign PDF, OCR text extractor\. No registration, No watermark, Works on mobile\.">'
GENERIC_KEYWORDS = r'<meta name="keywords" content="free pdf tools, merge pdf online free, compress pdf online, sign pdf online free, ocr pdf hindi, pdf to word free, unlock pdf online, online pdf editor">'
GENERIC_OG_TITLE = r'<meta property="og:title" content="Online PDF Pro - All PDF Tools 100% Free Forever">'
GENERIC_OG_DESC = r'<meta property="og:description" content="Merge, Compress, Sign, OCR, Convert - Sab free hai bhai! No login, No limit">'
GENERIC_OG_URL = r'<meta property="og:url" content="https://onlinepdfpro\.com">'
GENERIC_TW_TITLE = r'<meta name="twitter:title" content="Online PDF Pro - Free PDF Tools India">'
GENERIC_TW_DESC = r'<meta name="twitter:description" content="Best free PDF tools used by 100K\+ students">'

updated = 0
skipped = 0

for filename, seo in SEO_DATA.items():
    filepath = os.path.join(TOOLS_DIR, filename)
    if not os.path.exists(filepath):
        print(f'⚠️  SKIP (not found): {filename}')
        skipped += 1
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Replace title
    content = re.sub(GENERIC_TITLE, f'<title>{seo["title"]}</title>', content)

    # Replace meta description
    content = re.sub(GENERIC_DESC, f'<meta name="description" content="{seo["description"]}">', content)

    # Replace keywords
    content = re.sub(GENERIC_KEYWORDS, f'<meta name="keywords" content="{seo["keywords"]}">', content)

    # Replace OG tags
    content = re.sub(GENERIC_OG_TITLE, f'<meta property="og:title" content="{seo["og_title"]}">', content)
    content = re.sub(GENERIC_OG_DESC, f'<meta property="og:description" content="{seo["og_description"]}">', content)
    content = re.sub(GENERIC_OG_URL, f'<meta property="og:url" content="{seo["og_url"]}">', content)

    # Replace Twitter tags
    content = re.sub(GENERIC_TW_TITLE, f'<meta name="twitter:title" content="{seo["twitter_title"]}">', content)
    content = re.sub(GENERIC_TW_DESC, f'<meta name="twitter:description" content="{seo["twitter_description"]}">', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'✅ Updated: {filename}')
        updated += 1
    else:
        print(f'⚠️  No changes: {filename}')
        skipped += 1

print(f'\n📊 Done! Updated: {updated}, Skipped: {skipped}')
print(f'\n🔗 URLs for Google Search Console (copy-paste these):')
print('=' * 60)
for filename in sorted(SEO_DATA.keys()):
    print(f'https://onlinepdfpro.com/tools/{filename}')
