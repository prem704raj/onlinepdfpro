import os

filepath = "tools/images-to-pdf.html"
with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Replace width styles with !important overriding rules
new_text = text.replace("width: 100%;", "width: 100% !important; margin: 0 !important; max-width: 100% !important; min-width: 100% !important;")
new_text = new_text.replace("height: 240px;", "height: 240px !important;")
new_text = new_text.replace("object-fit: cover;", "object-fit: cover !important;")

new_text = new_text.replace("display: flex;", "display: flex !important;")
new_text = new_text.replace("flex-wrap: wrap;", "flex-wrap: wrap !important;")

# Re-save
with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_text)

print("Injected CSS overrides successfully.")
