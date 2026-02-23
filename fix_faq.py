import os

style_css_path = 'css/style.css'
with open(style_css_path, 'a', encoding='utf-8') as f:
    f.write('''
/* ========================================= */
/* FAQ Accordion Component */
/* ========================================= */

.faq-item {
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-md);
    overflow: hidden;
    transition: all 0.3s ease;
}

.faq-question {
    padding: var(--space-md) var(--space-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-weight: 600;
    color: var(--text-primary);
    user-select: none;
    transition: background 0.2s;
}

.faq-question:hover {
    background: var(--surface-2);
}

.faq-icon {
    font-size: 1.5rem;
    font-weight: 400;
    color: var(--text-secondary);
    transition: transform 0.3s ease;
}

.faq-item.active {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
}

.faq-item.active .faq-icon {
    transform: rotate(45deg);
    color: var(--primary);
}

.faq-answer {
    padding: 0 var(--space-lg);
    max-height: 0;
    overflow: hidden;
    color: var(--text-secondary);
    line-height: 1.6;
    opacity: 0;
    transition: max-height 0.4s ease, padding 0.4s ease, opacity 0.3s ease;
}

.faq-item.active .faq-answer {
    padding: 0 var(--space-lg) var(--space-md);
    max-height: 500px;
    opacity: 1;
}
''')

app_js_path = 'js/app.js'
with open(app_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

faq_js = '''
        // FAQ Accordion
        const faqItems = document.querySelectorAll('.faq-item');
        if (faqItems.length > 0) {
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question');
                if (question) {
                    question.addEventListener('click', () => {
                        const isActive = item.classList.contains('active');
                        
                        // Close all others
                        faqItems.forEach(i => i.classList.remove('active'));
                        
                        // Toggle current
                        if (!isActive) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }
'''

if '        // Global Search Setup' in content:
    content = content.replace('        // Global Search Setup', faq_js + '\n        // Global Search Setup')
    with open(app_js_path, 'w', encoding='utf-8') as f:
        f.write(content)
        print("Injected FAQ JS logic into app.js")

print("Appended FAQ CSS rules to css/style.css")
