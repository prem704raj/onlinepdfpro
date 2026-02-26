import os
import glob

directory = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

style_block = """    <!-- MOBILE FIX - Add this RIGHT BEFORE </head> tag -->
    <style id="mobile-emergency-fix">

        /* This runs on ALL screens but only changes mobile */
        @media screen and (max-width: 900px) {

            /* NUCLEAR: Force EVERYTHING to be full width */
            html, body {
                width: 100% !important;
                max-width: 100% !important;
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            /* Target literally every element on the page */
            body > *,
            body > * > *,
            body > * > * > *,
            header, nav, main, footer, section, article, aside, div,
            .container, .wrapper, .content, .main, .page {
                max-width: 100% !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
            }

            /* ===== NAVBAR FIX ===== */
            /* Your navbar: Online... | Search tools... | 🌐 🌙 ☀️ ☰ */
            header, header > *, header > * > *,
            nav, nav > *, nav > * > * {
                width: 100% !important;
                max-width: 100% !important;
                padding-left: 10px !important;
                padding-right: 10px !important;
                box-sizing: border-box !important;
            }

            /* Navbar flex container */
            header > div, header > nav,
            nav > div, nav > ul,
            header > * > div {
                display: flex !important;
                width: 100% !important;
                max-width: 100% !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 4px !important;
                flex-wrap: nowrap !important;
                padding: 8px 10px !important;
                box-sizing: border-box !important;
            }

            /* Logo text "Online..." - let it shrink */
            header a:first-child,
            header > * > a:first-child,
            header > * > * > a:first-child,
            nav a:first-child {
                font-size: 14px !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                max-width: 90px !important;
                flex-shrink: 1 !important;
            }

            /* Search input */
            header input, nav input,
            header input[type="text"],
            header input[type="search"],
            input[placeholder*="Search"],
            input[placeholder*="search"] {
                max-width: 90px !important;
                width: 90px !important;
                padding: 6px 8px !important;
                font-size: 12px !important;
                flex-shrink: 1 !important;
                min-width: 60px !important;
            }

            /* Icons (globe, moon, sun, hamburger) */
            header button, nav button,
            header a[role="button"],
            header span, nav span {
                width: 32px !important;
                height: 32px !important;
                min-width: 32px !important;
                max-width: 32px !important;
                padding: 2px !important;
                font-size: 16px !important;
                flex-shrink: 0 !important;
            }


            /* ===== HERO SECTION FIX ===== */
            /* Blue/purple gradient area with "Privacy-First PDF Tools" */
            section:first-of-type,
            main > *:first-child,
            .hero, [class*="hero"],
            [style*="gradient"] {
                width: 100vw !important;
                max-width: 100vw !important;
                margin-left: calc(-50vw + 50%) !important;
                margin-right: calc(-50vw + 50%) !important;
                padding: 50px 24px !important;
                box-sizing: border-box !important;
            }

            /* Hero text */
            section:first-of-type h1,
            section:first-of-type h2,
            .hero h1, .hero h2,
            [class*="hero"] h1,
            [class*="hero"] h2 {
                font-size: 28px !important;
                line-height: 1.3 !important;
                text-align: center !important;
            }

            /* Hero buttons "Process PDFs" and "Privacy Policy" */
            section:first-of-type a,
            section:first-of-type button,
            .hero a, .hero button,
            [class*="hero"] a,
            [class*="hero"] button {
                display: block !important;
                width: calc(100% - 40px) !important;
                margin: 10px 20px !important;
                padding: 16px !important;
                text-align: center !important;
                font-size: 16px !important;
                box-sizing: border-box !important;
            }


            /* ===== STATS SECTION FIX ===== */
            /* "127,844 PDFs Processed" and "30+ Free Tools" */
            .stats, [class*="stats"],
            [class*="counter"],
            [class*="number"] {
                width: 100% !important;
                max-width: 100% !important;
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 16px !important;
                padding: 20px 16px !important;
                box-sizing: border-box !important;
            }


            /* ===== BADGE BAR FIX ===== */
            /* "Works Offline" / "Free &..." strip */
            [class*="badge"], [class*="trust"],
            [class*="feature-bar"],
            [class*="strip"] {
                width: 100% !important;
                max-width: 100% !important;
                display: flex !important;
                flex-wrap: wrap !important;
                justify-content: center !important;
                gap: 8px !important;
                padding: 12px !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
            }

            [class*="badge"] > *,
            [class*="trust"] > * {
                font-size: 11px !important;
                padding: 6px 10px !important;
                flex-shrink: 0 !important;
            }


            /* ===== TOOL CARDS FIX ===== */
            /* "Compress PDF" / "Merge PDF" / "Split PDF" cards */
            /* Currently 1 column but with gap on right */

            [class*="grid"],
            [class*="tools"],
            [class*="cards"] {
                display: grid !important;
                grid-template-columns: 1fr !important;
                gap: 16px !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 16px !important;
                box-sizing: border-box !important;
            }

            /* Individual cards */
            [class*="grid"] > *,
            [class*="tools"] > a,
            [class*="tools"] > div,
            [class*="cards"] > * {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 28px 20px !important;
                border-radius: 16px !important;
                box-sizing: border-box !important;
                text-align: center !important;
            }

            /* Card icons */
            [class*="grid"] > * img,
            [class*="tools"] > * img,
            [class*="cards"] > * img {
                width: 48px !important;
                height: 48px !important;
                margin: 0 auto 12px !important;
            }

            /* Card titles */
            [class*="grid"] > * h3,
            [class*="tools"] > * h3,
            [class*="cards"] > * h3 {
                font-size: 18px !important;
                margin-bottom: 6px !important;
            }

            /* Card descriptions */
            [class*="grid"] > * p,
            [class*="tools"] > * p,
            [class*="cards"] > * p {
                font-size: 14px !important;
                color: #94a3b8 !important;
            }


            /* ===== SECTION HEADERS FIX ===== */
            /* "Essential PDF Tools CORE" / "Resources LEARN" */
            [class*="section"] > h2,
            [class*="category"] > h2,
            main > * > h2 {
                font-size: 22px !important;
                padding: 0 16px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }


            /* ===== "VIEW ALL 30+ TOOLS" BUTTON FIX ===== */
            a[href*="tools"],
            [class*="view-all"],
            [class*="see-all"] {
                display: block !important;
                width: calc(100% - 32px) !important;
                margin: 20px 16px !important;
                padding: 18px !important;
                text-align: center !important;
                border-radius: 50px !important;
                font-size: 16px !important;
                box-sizing: border-box !important;
            }


            /* ===== COMPARISON TABLE FIX ===== */
            /* "How We're Different" table */
            table, [class*="comparison"],
            [class*="compare"],
            [class*="different"] {
                width: calc(100% - 32px) !important;
                max-width: calc(100% - 32px) !important;
                margin: 20px 16px !important;
                box-sizing: border-box !important;
                border-radius: 16px !important;
                overflow: hidden !important;
            }

            table td, table th {
                padding: 14px 12px !important;
                font-size: 14px !important;
            }


            /* ===== "WHY WE BUILT THIS" SECTION FIX ===== */
            [class*="why"], [class*="story"],
            [class*="about-card"],
            [class*="mission"] {
                width: calc(100% - 32px) !important;
                max-width: calc(100% - 32px) !important;
                margin: 20px 16px !important;
                padding: 28px 20px !important;
                border-radius: 16px !important;
                box-sizing: border-box !important;
            }


            /* ===== NEWSLETTER BOX FIX ===== */
            [class*="newsletter"],
            [class*="subscribe"],
            [class*="signup"] {
                width: calc(100% - 32px) !important;
                max-width: calc(100% - 32px) !important;
                margin: 20px 16px !important;
                padding: 28px 20px !important;
                border-radius: 16px !important;
                box-sizing: border-box !important;
            }

            [class*="newsletter"] input,
            [class*="subscribe"] input {
                width: 100% !important;
                padding: 14px !important;
                font-size: 16px !important;
                margin-bottom: 12px !important;
                box-sizing: border-box !important;
            }

            [class*="newsletter"] button,
            [class*="subscribe"] button {
                width: 100% !important;
                padding: 14px !important;
                font-size: 16px !important;
            }


            /* ===== FOOTER FIX ===== */
            footer, [class*="footer"] {
                width: 100% !important;
                max-width: 100% !important;
                padding: 32px 16px !important;
                box-sizing: border-box !important;
            }

            footer > *, footer > * > *,
            [class*="footer"] > *,
            [class*="footer"] > * > * {
                width: 100% !important;
                max-width: 100% !important;
            }

            /* Footer grid to single column */
            footer > div, [class*="footer"] > div {
                display: grid !important;
                grid-template-columns: 1fr !important;
                gap: 24px !important;
                width: 100% !important;
            }

            /* Footer links */
            footer h3, footer h4,
            [class*="footer"] h3,
            [class*="footer"] h4 {
                font-size: 16px !important;
                margin-bottom: 12px !important;
            }

            footer a, [class*="footer"] a {
                display: block !important;
                padding: 8px 0 !important;
                font-size: 14px !important;
            }

            footer p, [class*="footer"] p {
                font-size: 13px !important;
            }


            /* ===== GLOBAL OVERFLOW PREVENTION ===== */
            img, video, iframe, canvas, svg,
            pre, code, table {
                max-width: 100% !important;
                height: auto !important;
            }

            /* Typography */
            h1 { font-size: 28px !important; }
            h2 { font-size: 22px !important; }
            h3 { font-size: 18px !important; }

            p, li, a, span, label {
                font-size: 15px !important;
                line-height: 1.6 !important;
            }

            /* Touch targets */
            a, button, input, select {
                min-height: 44px !important;
            }

            /* All inputs prevent iOS zoom */
            input, select, textarea {
                font-size: 16px !important;
            }
        }
    </style>
</head>"""

for filepath in glob.glob(os.path.join(directory, "**", "*.html"), recursive=True):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if 'id="mobile-emergency-fix"' in content:
        continue
        
    if "</head>" in content:
        # We replace the first occurrence of </head> with the style block + </head>
        new_content = content.replace("</head>", style_block, 1)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")
