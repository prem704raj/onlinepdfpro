# PDF↔Word Conversion — Test Report

Generated: 2026-07-28 22:00:31

## Results

| Fixture | Metric | Result | Value | Time (s) |
|---------|--------|--------|-------|----------|
| F1 | valid_docx | ✅ PASS | 73 paragraphs | 9.79 |
| F2 | valid_docx | ✅ PASS | 15 paragraphs | 5.94 |
| F3 | valid_docx | ✅ PASS | 3 paragraphs | 9.14 |
| F4 | valid_docx | ✅ PASS | 73 paragraphs | 69.67 |
| F5 | valid_docx | ✅ PASS | 13 paragraphs | 5.80 |
| F6 | valid_docx | ✅ PASS | 9 paragraphs | 6.31 |
| F7 | valid_docx | ✅ PASS | 751 paragraphs | 134.48 |
| F1 | text_fidelity | ✅ PASS | 0.997 (threshold: 0.9) | 9.93 |
| F2 | text_fidelity | ✅ PASS | 0.998 (threshold: 0.9) | 5.78 |
| F4 | text_fidelity | ✅ PASS | 0.997 (threshold: 0.8) | 26.29 |
| F5 | text_fidelity | ✅ PASS | 0.908 (threshold: 0.8) | 5.75 |
| F3 | table_count | ✅ PASS | expected=2, actual=2 | 8.95 |
| F3 | table1_dims | ✅ PASS | expected 5×3, got 5×3 |  |
| F3 | table2_dims | ✅ PASS | expected 6×4, got 6×4 |  |
| F6 | hindi_unicode | ✅ PASS | found=['नमस्ते', 'दुनिया', 'परीक्षण'] |  |
| F6 | cjk_unicode | ✅ PASS | found=['你好', '世界', '测试'] |  |
| F6 | no_mojibake | ✅ PASS | replacement_chars=0 |  |
| F2 | reading_order | ✅ PASS | key_sentence_contiguous=True | 6.04 |
| F1 | round_trip | ✅ PASS | similarity=1.000 | 12.83 |
| F7 | performance | ✅ PASS | total=130.7s, ~0.70s/page, ~187 pages | 130.73 |
| F8a | robustness | ✅ PASS | status=422, has_error=True | 2.31 |
| F8b | robustness | ✅ PASS | status=422, has_error=True | 2.31 |
| F1 | memory_no_leak | ✅ PASS | first_5_avg=9.74s, last_5_avg=9.94s, degradation=2.0% | 197.41 |
| F1 | idempotency | ✅ PASS | texts_match=True |  |

## Verdict

_(Auto-generated after full suite execution)_

**24/24 checks passed.**