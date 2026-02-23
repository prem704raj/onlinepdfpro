import re

files = [
    'tools/pdf-to-word.html',
    'tools/word-to-pdf.html',
    'tools/excel-to-pdf.html',
    'tools/ppt-to-pdf.html'
]

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()

    # 1. Replace Upload Area
    
    upload_pattern = re.compile(
        r'<div class="upload-area" id="dropArea"[\s\S]*?<input type="file" id="fileInput" accept="([^"]*)" hidden />\s*</div>',
        re.MULTILINE
    )
    
    new_upload = r'''
        <div class="upload-zone glass-card fade-in" id="dropArea" style="margin-top: 40px; cursor: pointer; display: flex; flex-direction: column; align-items: center; padding: 60px 20px;">
            <span class="upload-icon" style="font-size: 3rem; margin-bottom: 20px;">📄</span>
            <p class="upload-text" style="font-size: 1.25rem; font-weight: 600; margin-bottom: 15px;">Drop your file here or Click to Upload</p>
            <p class="upload-hint" style="display: flex; gap: 12px; justify-content: center; align-items: center; color: var(--text-secondary); margin-bottom: 20px;">
                <span style="display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> 100% Local
                </span> 
                <span>•</span> 
                <span>Max: 100MB</span> 
                <span>•</span> 
                <span style="display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Instant
                </span>
            </p>
            <input type="file" id="fileInput" accept="\1" hidden />
            <button class="btn btn-primary" style="pointer-events: none; padding: 12px 32px; font-size: 1rem;">Choose File</button>
        </div>
    '''
    
    content = upload_pattern.sub(new_upload, content)

    # 2. Replace File Info
    content = re.sub(
        r'<div class="file-info" id="fileInfo"></div>',
        r'<div class="file-info glass-card" id="fileInfo" style="display: none; margin: 20px auto; text-align: center; font-weight: 600; color: var(--text-primary); border: 2px solid var(--primary); max-width: 500px; padding: 15px 20px;"></div>',
        content
    )

    # 3. Replace Progress Section
    progress_pattern = re.compile(
        r'<div class="progress-section" id="progressSection">[\s\S]*?<div class="progress-bar">[\s\S]*?<div class="progress-fill" id="progressFill"></div>\s*</div>\s*(?:<p id="progressText"[^>]*>.*?</p>\s*)?</div>',
        re.MULTILINE
    )
    
    new_progress = r'''
        <div class="progress-section glass-card" id="progressSection" style="display:none; margin: 40px auto; max-width: 600px; text-align:center; padding: 30px;">
            <h3 style="margin-bottom: 20px;">Processing Document...</h3>
            <div class="progress-bar" style="width: 100%; height: 12px; background: var(--border); border-radius: 10px; margin: 0 auto; overflow: hidden;">
                <div class="progress-fill" id="progressFill" style="width: 0%; height: 100%; background: var(--primary); border-radius: 10px; transition: width 0.3s;"></div>
            </div>
            <p id="progressText" style="color: var(--text-secondary); margin-top: 15px;"></p>
        </div>
    '''
    
    content = progress_pattern.sub(new_progress, content)

    # 4. Replace Result Box wrapper
    content = content.replace(
        '<div class="result-box" id="resultBox" style="display:none;">',
        '<div class="result-box glass-card" id="resultBox" style="display:none; margin: 40px auto; padding: 40px; text-align: center; max-width: 800px; width: 100%;">'
    )

    # 5. Fix download buttons to use global styles
    content = content.replace('class="dl-btn"', 'class="btn btn-primary btn-lg" style="margin-top: 20px;"')
    
    # Specific buttons for pdf-to-word
    content = content.replace('class="dl-btn word"', 'class="btn btn-primary" style="margin-top: 20px;"')
    content = content.replace('class="dl-btn txt"', 'class="btn btn-secondary" style="margin-top: 20px;"')
    content = content.replace('class="dl-btn copy"', 'class="btn btn-secondary" style="margin-top: 20px;"')

    # Remove the generic <style> block from the user to avoid conflicts
    content = re.sub(r'<style>.*?</style>', '', content, flags=re.DOTALL)

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
        print(f"Designed {f}")
