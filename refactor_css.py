import re
import os

html_file = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools\index.html'

with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. CSS Updates

# Update dark mode body bg
content = re.sub(
    r'(\[data-theme="dark"\] body,\s*html:not\(\[data-theme="light"\]\) body\s*\{\s*background:\s*)#[0-9a-fA-F]+',
    r'\1#0a0a0a',
    content
)

# Update dark mode card bg to #1a1a2e
content = re.sub(
    r'(\[data-theme="dark"\] \.hp-tool-card,\s*html:not\(\[data-theme="light"\]\) \.hp-tool-card\s*\{\s*background:\s*)#[0-9a-fA-F]+',
    r'\1#1a1a2e',
    content
)

# Update card text colors
content = re.sub(
    r'(\[data-theme="dark"\] \.hp-tool-card h3,\s*html:not\(\[data-theme="light"\]\) \.hp-tool-card h3\s*\{\s*color:\s*)#[0-9a-fA-F]+',
    r'\1rgba(255,255,255,0.95)',
    content
)
content = re.sub(
    r'(\[data-theme="dark"\] \.hp-tool-card p,\s*html:not\(\[data-theme="light"\]\) \.hp-tool-card p\s*\{\s*color:\s*)#[0-9a-fA-F]+',
    r'\1rgba(255,255,255,0.55)',
    content
)

# Replace existing hover states
hover_css_pattern = r'(\[data-theme="dark"\] \.hp-tool-card:hover,\s*html:not\(\[data-theme="light"\]\) \.hp-tool-card:hover\s*\{)([^\}]+)(\})'
new_hover_css = r'\1\n            transform: translateY(-2px);\n            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);\n            border-color: rgba(99, 102, 241, 0.3);\n            background: #1a1a2e;\n        \3'
content = re.sub(hover_css_pattern, new_hover_css, content)

# Card border transition
base_card_css_pattern = r'(\[data-theme="dark"\] \.hp-tool-card,\s*html:not\(\[data-theme="light"\]\) \.hp-tool-card\s*\{)([^\}]+)(\})'
def add_border_transition(m):
    inner = m.group(2)
    if 'transition' not in inner:
        inner += '            transition: all 0.2s ease;\n'
    if 'border:' not in inner:
        inner += '            border: 1px solid rgba(255,255,255,0.06);\n'
    return m.group(1) + inner + m.group(3)
content = re.sub(base_card_css_pattern, add_border_transition, content)

# Make sure .hp-tool-card is position: relative
base_light_dark_card = r'(\.hp-tool-card\s*\{)([^\}]+)(\})'
def add_position_relative(m):
    inner = m.group(2)
    if 'position: relative' not in inner:
        inner += '            position: relative;\n'
    return m.group(1) + inner + m.group(3)
content = re.sub(base_light_dark_card, add_position_relative, content)

# Inject new CSS classes just before </style>
new_classes = """
        .hp-badge-new {
            position: absolute;
            top: 16px;
            right: 16px;
            background: #7c3aed;
            color: white;
            font-size: 10px;
            border-radius: 4px;
            padding: 2px 6px;
            font-weight: 600;
        }

        .hp-icon-container {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
        }

        .hp-section-head-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            margin-right: 10px;
        }

        .hp-tool-card.coming-soon {
            opacity: 0.5;
            cursor: default;
            pointer-events: none;
        }
        
        .hp-tool-card.coming-soon:hover {
            transform: none;
            box-shadow: none;
            border-color: rgba(255,255,255,0.06);
        }
"""
if '.hp-badge-new' not in content:
    content = content.replace('</style>', new_classes + '\n    </style>')

# Update section head line
content = re.sub(
    r'(\.hp-section-head-line\s*\{)([^\}]+)(\})',
    r'\1\n            flex: 1;\n            height: 1px;\n            background: linear-gradient(to right, #3b82f6, transparent);\n            margin-left: 16px;\n        \3',
    content
)

# Update View All button
content = re.sub(
    r'(\.hp-tools-more a\s*\{)([^\}]+)(\})',
    r'\1\n            display: inline-flex;\n            align-items: center;\n            justify-content: center;\n            background: linear-gradient(135deg, #3b82f6, #8b5cf6);\n            color: white;\n            border-radius: 12px;\n            padding: 14px 32px;\n            font-weight: 600;\n            text-decoration: none;\n            border: none;\n            transition: opacity 0.2s;\n        \3',
    content
)


with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS updates complete!")
