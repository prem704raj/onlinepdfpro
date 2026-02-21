import re
import os

filepath = "tools/images-to-pdf.html"
with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

new_css = """
    /* LUXURY GOD LEVEL CSS WITH !IMPORTANT LOCKS */
    .preview-grid {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 30px !important;
      justify-content: center !important;
      align-items: flex-start !important;
      margin: 40px 0 !important;
      padding: 20px !important;
    }
    .image-block {
      position: relative !important;
      width: 200px !important;
      min-width: 200px !important;
      max-width: 200px !important;
      background: white !important;
      border-radius: 20px !important;
      overflow: hidden !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
      transition: all 0.3s !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .image-block:hover {
      transform: translateY(-8px) !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.22) !important;
    }
    .image-block img {
      width: 200px !important;
      max-width: 200px !important;
      min-width: 200px !important;
      height: 280px !important;
      object-fit: cover !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      border-radius: 0 !important;
    }
    .page-label {
      position: absolute !important;
      top: 12px !important;
      left: 12px !important;
      background: rgba(0,0,0,0.8) !important;
      color: white !important;
      padding: 8px 14px !important;
      border-radius: 12px !important;
      font-weight: bold !important;
      font-size: 14px !important;
      z-index: 10 !important;
    }
    .remove-btn {
      position: absolute !important;
      top: 12px !important;
      right: 12px !important;
      background: #ef4444 !important;
      color: white !important;
      width: 36px !important;
      height: 36px !important;
      border-radius: 50% !important;
      font-size: 20px !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 4px 15px rgba(239,68,68,0.4) !important;
      z-index: 10 !important;
      line-height: 36px !important;
    }
    .add-button {
      width: 200px !important;
      min-width: 200px !important;
      max-width: 200px !important;
      height: 352px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border-radius: 20px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      color: white !important;
      font-size: 64px !important;
      font-weight: bold !important;
      cursor: pointer !important;
      box-shadow: 0 15px 35px rgba(102,126,234,0.4) !important;
      transition: all 0.3s !important;
      user-select: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .add-button:hover {
      transform: translateY(-8px) !important;
      box-shadow: 0 25px 50px rgba(102,126,234,0.6) !important;
    }
    .add-button span {
      font-size: 18px !important;
      margin-top: 12px !important;
      font-weight: normal !important;
    }
"""

text = re.sub(r'<style>.*?</style>', f'<style>\n{new_css}\n  </style>', text, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)

print("God Level CSS appended successfully.")
