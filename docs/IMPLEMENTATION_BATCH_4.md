# AI document scope and recovery — implementation batch 4

Prepared on 1 October 2026. Chat with PDF and PDF Summarizer now show their limits before upload and the actual supplied scope after extraction. Text is bounded to 25,000 characters; scanned OCR is limited to the first five pages. Vision chat explicitly uses the first three captured pages and up to 8,000 characters. Page labels are supplied to the model, and prompts require answers about the provided portion rather than claiming the whole document was read.

The optional OCR.space choice is visible before chat upload. Failed extraction or summarization restores the upload controls, hides the misleading spinner and supports retry. String and object API errors are displayed correctly. AI requests have a 60-second client timeout. Vision failure reports that no automatic text fallback request was made.

Chat supplies up to three previous successful turns for follow-up questions, with bounded assistant text, instead of discarding every earlier message. Questions are limited to 2,000 characters, and repeated Send/Enter while a request is pending cannot start another request.

Synthetic 20-page and seven-page scanned fixtures verify character limits, partial-coverage reporting, string-error recovery, OCR consent and five-page bounds, three-image vision requests and bounded conversation history. All provider requests are intercepted in these tests; they do not validate the deployed AI/OCR providers, consume inference quota or upload customer documents.

Real inference quality, provider availability, mixed scanned/text PDFs and the missing production runtime configuration still require the deployment and acceptance steps in batch 1. This change does not add full-document retrieval or promise complete long-document coverage.
