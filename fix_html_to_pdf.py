import re

with open('tools/html-to-pdf.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove the completely accidental copy-pasted batch compression script block
target_script_to_remove = r'<script>\s*\(\s*function\s*\(\)\s*\{\s*const\s*\{\s*PDFDocument\s*\}\s*=\s*PDFLib;[\s\S]*?\}\s*\)\(\);\s*</script>'
text = re.sub(target_script_to_remove, '', text)

# 2. Fix the downloadPDF() function to append the container off-screen
fixed_download_script = '''        function downloadPDF() {
            const html = document.getElementById('codeArea').value;
            if (!html.trim()) return alert('Write or paste some HTML first!');

            const container = document.createElement('div');
            container.innerHTML = html;
            container.style.fontFamily = 'Calibri, Arial, sans-serif';
            container.style.lineHeight = '1.8';
            container.style.color = '#333';
            container.style.padding = '10px';
            
            // html2canvas requires the element to be in the DOM to measure and render it
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '800px'; 
            container.style.background = '#fff';
            document.body.appendChild(container);

            const margin = parseInt(document.getElementById('margin').value);
            const orientation = document.getElementById('orientation').value;
            const pageSize = document.getElementById('pageSize').value;

            const options = {
                margin: [margin, margin, margin, margin],
                filename: 'HTML-to-PDF-OnlinePDFPro.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: pageSize, orientation: orientation },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            html2pdf().set(options).from(container).save().then(() => {
                document.body.removeChild(container);
            });
        }'''

text = re.sub(r'function downloadPDF\(\)\s*\{[\s\S]*?html2pdf\(\)\.set\(options\)\.from\(container\)\.save\(\);\s*\}', fixed_download_script, text)

with open('tools/html-to-pdf.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed HTML to PDF rendering bug!')
