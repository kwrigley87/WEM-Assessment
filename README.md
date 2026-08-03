# WEM-Assessment

# WEM Maturity Snapshot — Setup Guide

A lightweight, static web app for the Genesys Xperience booth monitor. Visitors pick which WEM areas they care about, tap through icon-tile questions (business goals, contact centre operations, current challenges), rate a handful of statements per module, unlock a bespoke maturity snapshot with an email address, and can download a branded, Gartner-style PDF report. Every submission is captured as a "lead" you can export as a CSV.

No server, database, or build step is required — it's plain HTML/CSS/JS and runs anywhere static files can be hosted, including GitHub Pages.

### What's in this version

- **Six-level maturity model** (0 Zero Usage → 5 AI-Orchestrated) scored per module (WFM, Quality Management, Speech & Text Analytics, Employee Performance) from Likert-style statement ratings, plus a **combined score**.
- **AI Readiness** scored as its own, separate dimension (never tied to WEM process maturity), framed around a Detect → Assist → Validate → Automate progression.
- **Business goals** (pick up to 3) and **current challenges** (pick any) tailor the recommended services, quick wins, and roadmap.
- **Industry benchmarking** — each module's score is compared against a blended, directional peer estimate for the visitor's industry (see the sourcing note in section 9 — this is deliberately not presented as a literal published statistic).
- **Spider/radar chart** (Chart.js) comparing "Today" vs. a 12-month target across every assessed dimension, embedded in both the on-screen results and the downloadable PDF.
- **Quantified benefit narratives, real customer case-study stats (with disclaimer), a "Next Best Workshop" recommendation, a 3-phase roadmap, and quick wins** — all generated dynamically from the visitor's actual answers, not a generic template.

## 1. Try it locally

Open `index.html` directly in a browser, or serve the folder so relative paths behave exactly like on the web:

```bash
cd wem-maturity-assessment
python3 -m http.server 8080
# then visit http://localhost:8080
```

## 2. Deploy on GitHub Pages

1. Create a new GitHub repo (public or private+Pages-enabled) and push the contents of this folder to it.
2. In the repo, go to **Settings → Pages**, set **Source** to the branch you pushed (e.g. `main`) and folder `/ (root)`.
3. GitHub will give you a URL like `https://<your-org>.github.io/<repo-name>/` — that's what you put on the booth monitor. It usually takes 1–2 minutes to go live after the first push.
4. For the event, open that URL in a browser in full-screen/kiosk mode on the booth monitor (most browsers: `F11` or a kiosk-mode launch flag).

No CI, secrets, or backend config is needed for the basic (download-PDF) experience — it works the moment Pages is enabled.

## 3. Booth leads: how they're captured

Every time someone unlocks their results, their details are saved **in that browser's local storage** on the booth device. This works even with no internet connection.

To see or export leads during/after the event:

1. On the booth device, go to the app URL and add `#admin` to the end (e.g. `https://your-url/#admin`).
2. A panel opens showing how many leads have been captured, with buttons to **Download leads CSV** or **Clear all leads**.
3. Do this at the end of each day to back up the CSV — local storage is tied to that one browser/device and could be cleared if someone clears browser data.

If you want leads to also land in a shared Google Sheet, or committed straight to this GitHub repo, in real time (recommended if multiple laptops/monitors will be running the app at once), see the optional steps in sections 5 and 6.

## 4. Emailing the PDF automatically (optional)

GitHub Pages can't run server code, so it can't send email on its own. The app uses **EmailJS** (a free service that sends email through your own mailbox from client-side JavaScript) so the report can be emailed from your Genesys address without any backend.

**Important — check with Genesys IT first.** Connecting a third-party service like EmailJS to a corporate Microsoft 365/Outlook mailbox may need admin approval (OAuth app consent) or may be blocked entirely by tenant policy. If it's blocked or you'd rather not wait, skip this section — the app already works fully with the **"download PDF" fallback**: results are always downloadable on-screen as a PDF, and you can email leads manually afterward using the exported CSV.

If you do want to try it:

1. Create a free account at [emailjs.com](https://www.emailjs.com).
2. Add an **Email Service** and connect it to your Genesys mailbox (Outlook/Office 365 or Gmail, depending on what Genesys uses). This is the step that may require IT/admin consent.
3. Create an **Email Template**. In the template body, add a field that renders raw HTML, e.g.:
   ```
   {{{html_content}}}
   ```
   (EmailJS uses triple braces to insert HTML instead of escaped text.) Set the "To email" field to `{{to_email}}`, "To name" to `{{to_name}}`, "Reply to" to `{{reply_to}}`, and "Subject" to `{{subject}}`.
4. Grab your **Public Key** (Account → API Keys), your **Service ID**, and your **Template ID**.
5. Open `js/config.js` and fill them in:
   ```js
   EMAILJS: {
     enabled: true,
     publicKey: "your public key",
     serviceId: "your service id",
     templateId: "your template id"
   }
   ```
6. Re-deploy (push the change to GitHub).

**What the visitor actually receives:** because there's nowhere to host a generated PDF file for the email to link to, and free email-sending plans generally can't attach a freshly generated binary file, the email itself contains the full report as clean, branded HTML (same content as the PDF). The literal PDF file is always available as an instant, in-browser download at the end of the assessment — that part never depends on EmailJS. If your EmailJS plan supports file attachments and you want to explore attaching the actual PDF, EmailJS's docs cover sending attachments as base64 — happy to wire that up once you've confirmed the account tier supports it.

If EmailJS isn't configured, or a send ever fails (e.g. no wifi at that moment), the app quietly falls back to the download-only message — visitors are never blocked.

## 5. Optional: mirror leads to a Google Sheet

If several devices will be running the app during the event, local storage alone means each device holds its own leads separately. To combine them automatically:

1. Create a Google Sheet with a header row matching: `timestamp, firstName, company, email, industry, orgSize, journeyStage, modulesAssessed, combinedLevel, aiReadinessLevel, goals, challenges`.
2. In the Sheet, go to **Extensions → Apps Script**, and add a small script that accepts POST requests and appends a row (Google has a standard pattern for this — search "Apps Script web app append row to sheet" for a template).
3. Deploy it as a **Web App**, copy the URL it gives you.
4. Paste that URL into `js/config.js`:
   ```js
   LEADS_WEBHOOK_URL: "https://script.google.com/macros/s/xxxxx/exec"
   ```
5. Redeploy. Every lead will now be saved locally *and* posted to the sheet. If the webhook is unreachable (no wifi), the local save still succeeds — nothing is lost.

## 6. Optional: auto-commit leads to this GitHub repo as leads.csv

If you'd rather not stand up a Google Sheet, leads can instead be appended directly to a `leads.csv` file committed to this repo — useful if you want the leads list to live alongside the code and be viewable/downloadable from GitHub itself, or picked up by another automation later.

Because GitHub Pages is static, this needs one small piece of server-side glue to hold a repo-write-scoped token safely (it can never live in client-side JS, since anyone can view page source). A [Cloudflare Worker](https://workers.cloudflare.com) — free tier is enough for booth traffic — does that job. The ready-to-deploy script is at `worker/github-leads-worker.js`.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Worker**.
2. Paste the contents of `worker/github-leads-worker.js` in as the Worker's code, and deploy.
3. In the Worker's **Settings → Variables**, add these as *encrypted* secrets:
   - `GITHUB_TOKEN` — a fine-grained GitHub PAT scoped to **only this repo**, with just "Contents: Read and write" permission (Settings → Developer settings → Fine-grained tokens on GitHub).
   - `GITHUB_OWNER` — your GitHub username/org, e.g. `kieron-wrigley`.
   - `GITHUB_REPO` — this repo's name, e.g. `wem-maturity-assessment`.
   - `GITHUB_BRANCH` — the branch to commit to, e.g. `main`.
   - `GITHUB_PATH` — the file path in the repo, e.g. `leads.csv`.
4. Copy the Worker's URL (looks like `https://wem-leads.<your-subdomain>.workers.dev`).
5. In `js/config.js`, set:
   ```js
   GITHUB_LEADS: {
     enabled: true,
     workerUrl: "https://wem-leads.<your-subdomain>.workers.dev"
   }
   ```
6. Redeploy the booth app (push to GitHub Pages).

From then on, every visitor submission also lands as a new row in `leads.csv`, committed directly to the repo — in addition to (not instead of) the always-on local-storage save. If the Worker is briefly unreachable, nothing is lost; the local copy is still the source of truth.

## 7. Branding

The app currently uses a text-based Genesys wordmark (no image file) styled in Genesys orange/navy, since we didn't have your official logo asset on hand. To swap in the real logo:

1. Drop your logo file into `assets/` (e.g. `assets/genesys-logo.svg`).
2. In `index.html`, replace the `<span class="brand-mark">Genesys</span>` element with an `<img>` tag pointing at it, and adjust `.brand-mark` styling in `css/styles.css` as needed.

Colors used (from Genesys brand color references): Orange `#FF4F1F`, Navy `#233950`. Swap these in `css/styles.css` (`:root` variables) and `js/pdf.js` (`BRAND` constant) if your current guidelines specify different values.

## 8. Running the automated checks (optional)

Two test scripts guard against regressions:

- `test/run-flow-test.js` — walks the entire visitor flow (module selection, business goals, ops questions, every module's Likert screen, AI readiness, challenges, paywall, results, PDF download, CSV export) in a simulated browser (jsdom), including the "new to Genesys" path that skips detailed questions and scores Level 0.
- `test/fuzz-report-test.js` — calls the recommendation engine directly across every combination of module subset, journey stage, industry, and answer pattern (all-low, all-high, mixed, partial, missing), asserting the report is always well-formed — no crashes, no out-of-range scores, AI Readiness never 0.

If you change the questions, scoring, or content in `js/data.js` / `js/recommend.js`, it's worth re-running both:

```bash
npm install    # one-time, installs jsdom for the tests only
npm test
```

This isn't required to deploy or use the app — it's a safety net for future edits.

## 9. Content notes and sourcing

All maturity-model descriptions, benefits, best practices, and recommended Professional Services engagements live in `js/data.js` and `js/recommend.js` — nothing is hard-coded into the HTML. That means you (or anyone on the team) can tweak wording, add a question, or adjust which service gets recommended without touching the UI code. Only public-facing service names and descriptions from the WEM Advisory Services Catalogue were used — internal-only pricing, hours, and sales-positioning content was intentionally left out since this runs on a public booth screen.

Numbers and comparisons shown to visitors fall into three deliberately distinct categories — worth keeping separate if you extend the content, so nothing is ever overstated as a guarantee:

- **`BENEFIT_STATS`** — directional percentage ranges (e.g. "typically 22–48%, commonly around 35%") derived from the Genesys WEM value-calculator figures in `WEM Benefits.pdf`. These are framed as typical ranges, not promises, and the sample figures used are illustrative — not an exhaustive list of every benefit Genesys WEM can deliver.
- **`CASE_STUDY_STATS`** — real, named-customer outcomes pulled from the Deep Dive Roadmap deck, always shown alongside `CASE_STUDY_DISCLAIMER` ("Based on results reported by specific, selected Genesys customers. Individual results vary and are not guaranteed.").
- **`FUN_FACTS`** — general third-party research stats (e.g. Forrester, Gallup) used only on the light interstitial "fun fact" screen between question blocks, each attributed to its source.
- **`INDUSTRY_BENCHMARK`** — hand-authored, modest peer-level estimates per industry, explicitly a *blended, directional estimate* rather than a literal figure from any single named source (no universal WEM maturity benchmark actually exists publicly at this level of granularity — COPC, ContactBabel, SQM, and APQC all publish adjacent but not directly equivalent contact-centre benchmarks). If you'd rather cite one of those directly for a specific stat, replace the relevant `INDUSTRY_BENCHMARK` entry's copy with an attributed line instead of the blended estimate.
