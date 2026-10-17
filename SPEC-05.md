# SPEC 05: AI Ingestion & RAG Pipeline

## 1. Engine & SDK
- **Provider:** Google GenAI SDK (`@google/genai`)
- **Extraction Model:** `gemini-2.5-flash`
- **Embedding Model:** `text-embedding-004` (Dimension: 768)

## 2. Extraction Prompt Invariant
The model prompt MUST instruct the model to:
1. Strip all leading/trailing Markdown code blocks and respond with raw RFC-8259 compliant JSON.
2. Mask all Social Security Numbers (SSNs) and Employer Identification Numbers (EINs) to show only the last 4 digits (e.g., `***-**-1234`).
3. Explicitly compare document visual headers against `expectedType` and mark `complianceStatus = "REJECT"` if they do not match.

## 3. Vector Ingestion Pipeline
- Chunk parsed text using a recursive character text splitter: Chunk size 1000 characters, overlap 200 characters.
- Generate vector embeddings for each chunk via `text-embedding-004`.
- Store chunks in `DocumentEmbedding` linking back to `documentId` and `tenantId`.
