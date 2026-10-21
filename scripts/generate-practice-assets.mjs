#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = path.join(root, 'src', 'assets', 'examples');

async function createSampleAdmitCard() {
    const doc = await PDFDocument.create();
    doc.setTitle('Sample Admit Card - Fictional Exam Hall Ticket');
    doc.setAuthor('OnlinePDFPro');
    doc.setSubject('Fictional test fixture for Split PDF and PDF Tools');
    doc.setCreationDate(new Date('2026-10-21T00:00:00Z'));
    doc.setModificationDate(new Date('2026-10-21T00:00:00Z'));

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    // Page 1: Admit Card (Candidate Copy)
    const page1 = doc.addPage([595.28, 841.89]);
    const { width, height } = page1.getSize();

    // Background tint
    page1.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.97, 0.96, 0.94)
    });

    // Header Kicker
    page1.drawText('ONLINEPDFPRO / FICTIONAL TEST FIXTURE', {
        x: 48,
        y: height - 55,
        size: 10,
        font: bold,
        color: rgb(0.55, 0.41, 0.08)
    });

    // Title
    page1.drawText('Examination Admit Card', {
        x: 48,
        y: height - 100,
        size: 24,
        font: bold,
        color: rgb(0.15, 0.12, 0.1)
    });
    page1.drawText('Page 1 of 2 · Candidate Copy (Present at Exam Entry)', {
        x: 48,
        y: height - 124,
        size: 12,
        font,
        color: rgb(0.42, 0.37, 0.31)
    });

    // Dividing rule
    page1.drawLine({
        start: { x: 48, y: height - 142 },
        end: { x: width - 48, y: height - 142 },
        thickness: 1,
        color: rgb(0.85, 0.82, 0.77)
    });

    // Candidate Details Box
    page1.drawRectangle({
        x: 48,
        y: height - 370,
        width: 340,
        height: 210,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.8, 0.78, 0.72),
        borderWidth: 1
    });

    const details = [
        ['Candidate Name:', 'Alex Taylor (Fictional)'],
        ['Roll Number:', '2026-ENG-49102'],
        ['Application Ref:', 'APP-9982-X7'],
        ['Examination:', 'National Technical Aptitude 2026'],
        ['Exam Date & Time:', '15 November 2026, 09:30 AM'],
        ['Reporting Time:', '08:45 AM (Gates close at 09:15 AM)'],
        ['Test Centre:', 'Hall B, Desk 42, Metro Campus']
    ];

    details.forEach(([label, value], i) => {
        const rowY = height - 180 - i * 26;
        page1.drawText(label, {
            x: 64,
            y: rowY,
            size: 10,
            font: bold,
            color: rgb(0.3, 0.28, 0.24)
        });
        page1.drawText(value, {
            x: 180,
            y: rowY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1)
        });
    });

    // Photo Box Placeholder
    page1.drawRectangle({
        x: 410,
        y: height - 330,
        width: 135,
        height: 170,
        color: rgb(0.93, 0.94, 0.96),
        borderColor: rgb(0.7, 0.75, 0.8),
        borderWidth: 1
    });
    page1.drawText('PASSPORT PHOTO', {
        x: 422,
        y: height - 230,
        size: 9,
        font: bold,
        color: rgb(0.4, 0.45, 0.5)
    });
    page1.drawText('(Sample Box)', {
        x: 444,
        y: height - 248,
        size: 8,
        font,
        color: rgb(0.5, 0.55, 0.6)
    });

    // Barcode Simulation Area
    page1.drawRectangle({
        x: 410,
        y: height - 370,
        width: 135,
        height: 28,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0.75, 0.75, 0.75),
        borderWidth: 1
    });
    page1.drawText('* 2026-ENG-49102 *', {
        x: 424,
        y: height - 362,
        size: 9,
        font: bold,
        color: rgb(0.2, 0.2, 0.2)
    });

    // Important Notice
    page1.drawText('IMPORTANT CANDIDATE INSTRUCTIONS (SUMMARY)', {
        x: 48,
        y: height - 400,
        size: 11,
        font: bold,
        color: rgb(0.15, 0.12, 0.1)
    });

    const summaries = [
        '1. Bring this printed Candidate Copy along with an original government photo ID.',
        '2. Electronic devices, smartwatches, and loose study notes are prohibited.',
        '3. Do not detach or damage the candidate barcode or candidate copy signature.',
        '4. To submit just this page to a university upload portal, use Split PDF to select Page 1.'
    ];

    summaries.forEach((line, i) => {
        page1.drawText(line, {
            x: 48,
            y: height - 425 - i * 22,
            size: 9.5,
            font,
            color: rgb(0.25, 0.25, 0.25)
        });
    });

    // Signature boxes
    page1.drawRectangle({
        x: 48,
        y: height - 560,
        width: 220,
        height: 45,
        borderColor: rgb(0.75, 0.75, 0.75),
        borderWidth: 1
    });
    page1.drawText('Candidate Signature (in presence of invigilator)', {
        x: 54,
        y: height - 552,
        size: 7.5,
        font,
        color: rgb(0.4, 0.4, 0.4)
    });

    page1.drawRectangle({
        x: 325,
        y: height - 560,
        width: 220,
        height: 45,
        borderColor: rgb(0.75, 0.75, 0.75),
        borderWidth: 1
    });
    page1.drawText('Invigilator Signature & Centre Seal', {
        x: 345,
        y: height - 552,
        size: 7.5,
        font,
        color: rgb(0.4, 0.4, 0.4)
    });

    // Footer
    page1.drawText('Fictional test fixture. Contains no actual candidate data or legal credentials.', {
        x: 48,
        y: 45,
        size: 9,
        font,
        color: rgb(0.45, 0.42, 0.38)
    });
    page1.drawText('Page 1 of 2', {
        x: width - 105,
        y: 45,
        size: 9,
        font: bold,
        color: rgb(0.45, 0.42, 0.38)
    });

    // Page 2: Instructions Sheet
    const page2 = doc.addPage([595.28, 841.89]);
    page2.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.97, 0.96, 0.94)
    });

    page2.drawText('ONLINEPDFPRO / FICTIONAL TEST FIXTURE', {
        x: 48,
        y: height - 55,
        size: 10,
        font: bold,
        color: rgb(0.55, 0.41, 0.08)
    });

    page2.drawText('General Examination Guidelines & Rules', {
        x: 48,
        y: height - 100,
        size: 22,
        font: bold,
        color: rgb(0.15, 0.12, 0.1)
    });
    page2.drawText('Page 2 of 2 · Information & Advisory Sheet (Keep for Reference)', {
        x: 48,
        y: height - 124,
        size: 12,
        font,
        color: rgb(0.42, 0.37, 0.31)
    });

    page2.drawLine({
        start: { x: 48, y: height - 142 },
        end: { x: width - 48, y: height - 142 },
        thickness: 1,
        color: rgb(0.85, 0.82, 0.77)
    });

    const rules = [
        'A. REPORTING & IDENTIFICATION',
        'Candidates must arrive at the test centre 45 minutes prior to commencement. Late entry after',
        'the closing bell is strictly barred. Present an original photo ID (Passport, Driving License, or Student Card).',
        '',
        'B. PROHIBITED ARTICLES',
        'No mobile phones, programmable calculators, smart devices, bags, or papers are permitted in the exam hall.',
        'The examination centre does not provide secure storage for personal belongings.',
        '',
        'C. TEST PROCEDURE & ROUGH WORK',
        'Rough sheets will be provided by the invigilator and must be surrendered before leaving the desk.',
        'Mark your responses clearly on the computer console / optical answer sheet.',
        '',
        'D. WORKFLOW PRACTICE TIP',
        'University and job portals often require uploading only the Candidate Copy (Page 1) without these guidelines.',
        'Open Split PDF, enter page range "1", and download the single-page PDF to meet portal size limits.'
    ];

    let currentY = height - 180;
    rules.forEach(line => {
        if (!line) {
            currentY -= 12;
            return;
        }
        const isHeader = line.startsWith('A.') || line.startsWith('B.') || line.startsWith('C.') || line.startsWith('D.');
        page2.drawText(line, {
            x: 48,
            y: currentY,
            size: isHeader ? 11 : 9.5,
            font: isHeader ? bold : font,
            color: isHeader ? rgb(0.15, 0.12, 0.1) : rgb(0.25, 0.25, 0.25)
        });
        currentY -= (isHeader ? 22 : 18);
    });

    page2.drawText('Fictional test fixture. Free to use when trying PDF Split, Merge and Compression.', {
        x: 48,
        y: 45,
        size: 9,
        font,
        color: rgb(0.45, 0.42, 0.38)
    });
    page2.drawText('Page 2 of 2', {
        x: width - 105,
        y: 45,
        size: 9,
        font: bold,
        color: rgb(0.45, 0.42, 0.38)
    });

    const admitBytes = await doc.save();
    const admitPath = path.join(examplesDir, 'sample-admit-card.pdf');
    fs.writeFileSync(admitPath, admitBytes);
    console.log(`Created sample admit card: ${admitPath} (${admitBytes.length} bytes)`);
}

function createChecklistTxt() {
    const content = `ONLINEPDFPRO DOCUMENT VERIFICATION CHECKLIST
============================================
Non-sensitive test instructions for validating PDF workflows.

1. SPLIT PDF VERIFICATION
   [ ] Upload 'sample-admit-card.pdf' (2 pages).
   [ ] Select Page 1 only (Candidate Copy).
   [ ] Download extracted PDF and verify it has exactly 1 page.
   [ ] Confirm Roll Number '2026-ENG-49102' is sharp and readable.

2. MERGE PDF VERIFICATION
   [ ] Upload extracted Page 1 and 'sample-assignment.pdf'.
   [ ] Check file ordering in the draggable queue.
   [ ] Merge and download. Verify total page count matches expected sum.
   [ ] Verify vector text remains sharp in independent viewer.

3. COMPRESS PDF VERIFICATION
   [ ] Upload 'sample-assignment.pdf'.
   [ ] Set target size to 200 KB or 1 MB.
   [ ] Test default Structural Mode (keeps searchable text and vector lines).
   [ ] Confirm tool reports actual size outcome honestly.

4. PRIVACY CHECK
   [ ] Confirm tool execution remains local in your browser.
   [ ] No document bytes are uploaded to remote servers for local tools.
   [ ] Check network tab in dev tools to verify 0 document egress.

(Fictional test pack by OnlinePDFPro. All fixtures contain 0 personal data.)
`;
    const txtPath = path.join(examplesDir, 'DOCUMENT-CHECKLIST.txt');
    fs.writeFileSync(txtPath, content.trim(), 'utf8');
    console.log(`Created checklist: ${txtPath}`);
}

function createZipArchive() {
    const pyScript = `
import zipfile, os
examples_dir = r"${examplesDir}"
zip_path = os.path.join(examples_dir, "onlinepdfpro-practice-pack.zip")
files_to_zip = [
    ("sample-assignment.pdf", "sample-assignment.pdf"),
    ("sample-assignment.docx", "sample-assignment.docx"),
    ("sample-admit-card.pdf", "sample-admit-card.pdf"),
    ("notes-page.jpg", "notes-page.jpg"),
    ("checklist-page.jpg", "checklist-page.jpg"),
    ("DOCUMENT-CHECKLIST.txt", "DOCUMENT-CHECKLIST.txt")
]
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for filename, arcname in files_to_zip:
        p = os.path.join(examples_dir, filename)
        if not os.path.exists(p):
            raise FileNotFoundError(p)
        info = zipfile.ZipInfo(arcname, date_time=(2026, 10, 21, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        with open(p, "rb") as source:
            zf.writestr(info, source.read(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
size = os.path.getsize(zip_path)
print(f"Created {zip_path}: {size} bytes")
`;
    execFileSync('python', ['-c', pyScript]);
}

async function main() {
    execFileSync('python', [path.join(root, 'scripts', 'generate-sample-word.py')]);
    await createSampleAdmitCard();
    createChecklistTxt();
    createZipArchive();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
