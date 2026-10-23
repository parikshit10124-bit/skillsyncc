# SkillSync AI — Resume & Job Matcher

A presentation-ready, responsive resume-to-job description analyzer. The main matcher runs in the browser and works without an API key. The optional AI feedback route runs on the Node server so provider keys never enter browser code.

## Run locally

1. Install Node.js 18 or newer.
2. From this project folder, run `npm start` (or `node server.js`).
3. Open <http://localhost:3000>.
4. Choose **Try a sample**, then **Analyze my match** to see the complete workflow.

There are no npm dependencies to install. Google Fonts, Lucide icons, PDF.js, Mammoth, and jsPDF (when exporting a tailored PDF) are loaded from CDNs. The matching analyzer itself has no external runtime dependency. PDF and DOCX imports need an internet connection to load their parsing libraries; TXT imports work directly.

## Optional AI feedback

Copy `.env.example` to `.env`, then set `LLM_API_KEY`. Optionally set `LLM_API_URL` to an OpenAI-compatible chat-completions endpoint and `LLM_MODEL` to a model supported by that endpoint. Restart the server. Never place a secret in `app.js` or another browser file. The resume and job description are sent to the configured AI provider only when the key is present; the interface says when this is active. The deterministic score and skill matching remain rule based.

## How the matcher works

- A built-in alias map normalizes common names (for example, `ML` and `machine learning`) to the same skill.
- Skills appearing in the job description are compared against the resume.
- Frequent non-stopword terms in the job description become keywords, excluding recognized skills.
- Score = **70% detected skill coverage + 30% frequent keyword coverage**. If no dictionary skills are found in the job description, keyword coverage alone is used. It is a transparent text signal, not an assessment of ability or a hiring prediction.
- Suggestions are built from detected gaps and resume sections. Bullet cleanup uses only existing bullet text; it does not add metrics or claims.
- After analysis, create a professional resume PDF in one click. The draft orders sections (summary, skills, education, experience, projects, certifications, coursework, then additional sections), promotes already matched skills within the skills list, and brings relevant bullets forward. It also professionalizes common wording (for example, “Used Python to build a model” becomes “Built a model with Python”) and rephrases project-title bullets into action-first wording. Missing skills remain separate evidence prompts and are never inserted as claims.
- Export the tailored draft as PDF. The PDF uses the selected accent and template, with a colored candidate header, section bands, skill chips, readable spacing, page numbers, and preserved text headings and bullets. It cannot copy the exact design of an uploaded file because uploads are extracted to text.
- Report download exports a readable `.txt` report with the analysis and input snapshots.

## Files

- `index.html` — page structure and panels.
- `styles.css` — responsive theme and dashboard styling.
- `resume-builder.css` — interactive resume template preview and style options.
- `app.js` — skill matching, file import, report generation, and UI behavior.
- `server.js` — static server and optional protected LLM proxy.
- `.env.example` — optional server configuration template.
