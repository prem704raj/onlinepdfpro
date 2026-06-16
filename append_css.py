import os

css_content = """
/* =========================================
   Adsterra Ad Layout System
   ========================================= */

main.tool-page {
    display: flex;
    flex-direction: column;
    position: relative; 
}

main.tool-page > .container {
    order: 1;
    width: 100%;
    margin-bottom: 30px;
}

main.tool-page > section {
    order: 2;
    width: 100%;
}

.adsterra-left-sidebar {
    order: 3;
    text-align: center;
    margin: 30px auto;
    width: 100%;
    overflow: hidden;
    min-height: 250px;
}

.adsterra-bottom-banner {
    order: 4;
    text-align: center;
    margin: 30px auto;
    width: 100%;
    overflow: hidden;
    min-height: 90px;
}

@media (min-width: 1250px) {
    .adsterra-left-sidebar {
        position: absolute;
        left: 10px; 
        top: 20px; 
        width: 160px; 
        margin: 0;
    }
}
"""

with open(r"c:\Users\prem7\.gemini\antigravity\scratch\doctools\css\style.css", "a", encoding="utf-8") as f:
    f.write("\n" + css_content + "\n")
