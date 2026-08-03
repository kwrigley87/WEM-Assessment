/* ==========================================================================
   Optional Cloudflare Worker: append each WEM Maturity Snapshot lead as a
   new row to leads.csv in a GitHub repo, using the GitHub Contents API.

   Why a Worker at all? The booth app itself is fully static (GitHub Pages
   can't run server code), and a GitHub token that can WRITE to your repo
   must never be embedded in client-side JavaScript — anyone viewing page
   source could extract it. This Worker holds that token as a server-side
   secret instead, and exposes one narrow, harmless endpoint: "append this
   one row to this one CSV file." That's the whole attack surface.

   This is entirely optional. Leads are always saved to the visitor's
   browser (localStorage) and exportable as CSV regardless — this Worker
   just additionally mirrors them into your repo in near real time.

   ---------------------------- Deploy steps -------------------------------
   1. Go to https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker.
   2. Paste this file's contents in as the Worker's code.
   3. Under Settings -> Variables, add these as *encrypted* secrets:
        GITHUB_TOKEN   - a fine-grained GitHub PAT scoped to ONLY this repo,
                         with just "Contents: Read and write" permission.
        GITHUB_OWNER   - your GitHub username or org, e.g. "kieron-wrigley"
        GITHUB_REPO    - the repo name, e.g. "wem-maturity-assessment"
        GITHUB_BRANCH  - the branch to commit to, e.g. "main"
        GITHUB_PATH    - the file path in the repo, e.g. "leads.csv"
   4. Deploy. Copy the Worker's URL (looks like
      https://wem-leads.<your-subdomain>.workers.dev).
   5. In js/config.js, set GITHUB_LEADS.enabled = true and paste that URL
      into GITHUB_LEADS.workerUrl.
   6. Redeploy the booth app (push to GitHub Pages).

   Every visitor submission will now also land as a new row in leads.csv,
   committed directly to your repo.
   ========================================================================== */

const CSV_COLUMNS = [
  "timestamp", "firstName", "company", "email", "industry", "orgSize",
  "journeyStage", "modulesAssessed", "combinedLevel", "aiReadinessLevel",
  "goals", "challenges"
];

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64Utf8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function githubRequest(env, method, body) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${env.GITHUB_PATH}?ref=${env.GITHUB_BRANCH}`;
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "wem-maturity-leads-worker",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

export default {
  async fetch(request, env) {
    // CORS: allow the booth app's origin to call this Worker.
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
      // Read as raw text and parse manually — browsers sending this fetch
      // with mode:"no-cors" may coerce the Content-Type header, so we don't
      // rely on it being exactly application/json.
      const raw = await request.text();
      const lead = JSON.parse(raw);
      const row = CSV_COLUMNS.map((c) => csvEscape(lead[c])).join(",");

      // 1. Fetch the current file (to get its SHA and existing content).
      const getResp = await githubRequest(env, "GET");
      let existingContent = "";
      let sha;
      if (getResp.status === 200) {
        const file = await getResp.json();
        sha = file.sha;
        existingContent = fromBase64Utf8(file.content.replace(/\n/g, ""));
      } else if (getResp.status !== 404) {
        const errText = await getResp.text();
        return new Response(`GitHub read failed: ${errText}`, { status: 502, headers: corsHeaders });
      }

      const header = CSV_COLUMNS.join(",");
      const newContent = existingContent && existingContent.trim().length
        ? existingContent.replace(/\n?$/, "\n") + row + "\n"
        : header + "\n" + row + "\n";

      // 2. Commit the updated file back to the repo.
      const putResp = await githubRequest(env, "PUT", {
        message: `Add lead: ${lead.firstName || "unknown"} (${lead.company || "no company"})`,
        content: toBase64Utf8(newContent),
        branch: env.GITHUB_BRANCH,
        ...(sha ? { sha } : {})
      });

      if (!putResp.ok) {
        const errText = await putResp.text();
        return new Response(`GitHub write failed: ${errText}`, { status: 502, headers: corsHeaders });
      }

      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (err) {
      return new Response(`Worker error: ${err.message}`, { status: 500, headers: corsHeaders });
    }
  }
};
