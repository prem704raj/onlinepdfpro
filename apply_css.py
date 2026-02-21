import os

filepath = "tools/images-to-pdf.html"
with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

css_injection = """
    /* STRICT ISOLATION FOR GOD LEVEL GRID UI */
    .preview-container {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: wrap !important;
      gap: 20px !important;
      justify-content: center !important;
      align-items: flex-start !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .image-item {
      position: relative !important;
      width: 180px !important;
      max-width: 180px !important;
      min-width: 180px !important;
      height: 240px !important;
      text-align: center !important;
      cursor: move !important;
      transition: all 0.3s !important;
      margin: 0 !important;
      padding: 0 !important;
      display: block !important;
    }
    .image-item img {
      width: 180px !important;
      max-width: 180px !important;
      height: 240px !important;
      object-fit: cover !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
      margin: 0 !important;
      padding: 0 !important;
      display: block !important;
    }
    .add-more {
      width: 180px !important;
      max-width: 180px !important;
      min-width: 180px !important;
      height: 240px !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  </style>
"""

new_text = text.replace("</style>", css_injection)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_text)

print("God Level CSS appended successfully.")
