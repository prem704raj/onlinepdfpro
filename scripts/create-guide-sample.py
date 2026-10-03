"""Create the site's original, fictional PDF walkthrough sample.

Run with reportlab installed. The file is committed; builds do not need Python.
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor

output = Path(__file__).resolve().parents[1] / "src/assets/examples"
output.mkdir(parents=True, exist_ok=True)
document = canvas.Canvas(str(output / "sample-assignment.pdf"), pagesize=A4, invariant=1)
document.setTitle("Sample assignment - fictional example for PDF tools")
document.setAuthor("OnlinePDFPro")
width, height = A4
pages = [
    ("Assignment cover", "1. Cover page", [
        "Student: Example Student (fictional)",
        "Subject: Document workflows",
        "Assignment: Prepare a readable submission",
        "This original sample contains three A4 pages.",
        "Use it to practise selecting, splitting and merging pages.",
        "It contains no personal records or official certificate."]),
    ("Revision notes", "2. Notes page", [
        "MERGE combines selected files in the chosen file order.",
        "SPLIT extracts selected source pages into a new document.",
        "JPG TO PDF turns page images into a document.",
        "COMPRESS may retain the original when it is already small.",
        "CROP hides an area; it does not remove sensitive data.",
        "Review the downloaded file before submitting it."]),
    ("Submission checklist", "3. Checklist page", [
        "[ ] Page order matches the application's instructions.",
        "[ ] All required pages are present and readable.",
        "[ ] The file size is below the actual upload limit.",
        "[ ] Signatures, links and fields still look correct.",
        "[ ] Private information has been inspected on every page.",
        "[ ] The downloaded PDF opens in a separate viewer."]),
]
for index, (title, subtitle, lines) in enumerate(pages, 1):
    document.setFillColor(HexColor("#f6f5f0"))
    document.rect(0, 0, width, height, fill=1, stroke=0)
    document.setFillColor(HexColor("#8b6914"))
    document.setFont("Helvetica-Bold", 10)
    document.drawString(48, height - 55, "ONLINEPDFPRO  /  ORIGINAL EXAMPLE")
    document.setFillColor(HexColor("#2c2418"))
    document.setFont("Helvetica-Bold", 26)
    document.drawString(48, height - 112, title)
    document.setFont("Helvetica", 13)
    document.drawString(48, height - 142, subtitle)
    document.setStrokeColor(HexColor("#d9d0c3"))
    document.line(48, height - 166, width - 48, height - 166)
    document.setFont("Helvetica", 12)
    for n, line in enumerate(lines):
        document.drawString(48, height - 210 - n * 35, line)
    document.setFillColor(HexColor("#6b5e4f"))
    document.setFont("Helvetica", 10)
    document.drawString(48, 45, "Fictional example. Free to use when trying these tools.")
    document.drawRightString(width - 48, 45, f"Page {index} of 3")
    document.showPage()
document.save()
print(output / "sample-assignment.pdf")
