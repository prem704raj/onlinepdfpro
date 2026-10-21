"""Build a small, fictional Word fixture for the Word to PDF tool."""

from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src" / "assets" / "examples" / "sample-assignment.docx"


def paragraph(text, style=None):
    properties = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    return f"<w:p>{properties}<w:r><w:t>{escape(text)}</w:t></w:r></w:p>"


body = "".join(
    [
        paragraph("Sample Assignment Document", "Title"),
        paragraph("Fictional practice file for Word to PDF conversion."),
        paragraph("Purpose", "Heading1"),
        paragraph(
            "Use this document to test a Word to PDF export. It contains no real student or customer information."
        ),
        paragraph("Revision Notes", "Heading1"),
        paragraph("1. Check the converted PDF title and paragraph order."),
        paragraph("2. Confirm the text remains selectable after conversion."),
        paragraph("3. Reopen the PDF and inspect the page margins."),
        paragraph("Submission Checklist", "Heading1"),
        paragraph("The output should contain one readable page and no missing lines."),
    ]
)

document = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>{body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>
<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
</w:sectPr></w:body></w:document>"""

styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>
<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/>
<w:pPr><w:spacing w:after="280"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
<w:color w:val="000000"/><w:b/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/>
<w:pPr><w:spacing w:before="240" w:after="100"/></w:pPr><w:rPr>
<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="000000"/>
<w:b/><w:sz w:val="26"/></w:rPr></w:style>
</w:styles>"""

content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

document_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

parts = {
    "[Content_Types].xml": content_types,
    "_rels/.rels": root_rels,
    "word/document.xml": document,
    "word/_rels/document.xml.rels": document_rels,
    "word/styles.xml": styles,
}

with ZipFile(OUTPUT, "w", ZIP_DEFLATED, compresslevel=9) as archive:
    for name, value in parts.items():
        entry = ZipInfo(name, date_time=(2026, 10, 21, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        entry.external_attr = 0o644 << 16
        archive.writestr(entry, value.encode('utf8'), compress_type=ZIP_DEFLATED, compresslevel=9)

print(f"Created {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
