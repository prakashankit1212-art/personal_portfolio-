# Important Links Audit

**Audit date:** October 21, 2026  
**Scope:** public profile links and seven candidate repositories for portfolio selection.  
**Evidence boundary:** this is a remote-repository audit. No local clone, local build, local test suite, or full production flow was run against the candidate repositories.

## Profile and exact repository links

- GitHub profile: `https://github.com/prakashankit1212-art`
- LinkedIn profile: `https://www.linkedin.com/in/ankit-prakash-1a049131b/`
- Scribble Arena: `https://github.com/prakashankit1212-art/scribble-arena`
- LLM_projects: `https://github.com/prakashankit1212-art/LLM_projects`
- pneumoscan-ai: `https://github.com/prakashankit1212-art/pneumoscan-ai`
- society: `https://github.com/prakashankit1212-art/society`
- potfolio: `https://github.com/prakashankit1212-art/potfolio`
- blood: `https://github.com/prakashankit1212-art/blood`
- playwright: `https://github.com/prakashankit1212-art/playwright`

## Personal contact details supplied by Ankit

- Email: `prakashankit1212@gmail.com`
- Phone: `8235193006`
- Location: `Raigarh, Chhattisgarh, India`

These details are user-supplied identity content, not repository-audit evidence.

## Evidence labels

- **Verified facts** are supported by the supplied audit notes and the public repository/profile metadata or README material reviewed on October 21, 2026.
- **Unverified facts** are claims that still need owner confirmation, a contribution-history review, a working deployment check, or a reproducible local run.
- A public URL, repository README, or listed technology is not proof of personal authorship, production readiness, or end-to-end functionality.

## Verified facts

### Scribble Arena

- React/TypeScript/Vite frontend with Node/Express/Socket.IO/Zod backend.
- README describes rooms, drawing synchronization, guessing, timers, hints, and scoring.
- The server stores rooms in memory; rooms are lost when the backend stops.
- The repository's test script is only an echo placeholder, so it is not meaningful automated coverage.
- The repository lists `https://scribble-arena.vercel.app` as its Vercel demo.

### LLM_projects

- Streamlit/Google Gemini/Pydantic multi-agent chatbot.
- The design separates agents from a conversation manager.
- It requires `GOOGLE_API_KEY` to exercise the Gemini integration.
- The README is described as work in progress; no verified public demo or meaningful test run is available.

### pneumoscan-ai

- The supplied project note identifies a React + FastAPI pneumonia/X-ray application with a documented Render deployment.
- The project covers chest X-ray prediction and needs confirmation of its model metrics, dataset provenance, and personal contribution.
- No clearly provided public demo URL was found in the reviewed material.
- The public README currently describes a Flask-based implementation, so the intended React/FastAPI versus Flask version should be reconciled before publication.

### society

- React/Vite client plus Node/Express server with Socket.IO, covering mess/society management features.
- The README credits Ankit Prakash.
- The full user flow, deployment, and tests are not verified.
- The current public README also presents a React/Vite SocietyConnect client with local data-store language; confirm the repository version and backend boundary before using the stack claim in public copy.

### potfolio

- Simple static portfolio prototype.
- The repository contains a `resume` path with no meaningful resume content.
- No deployment is verified.
- The repository name is `potfolio`, preserving the spelling used by the public URL.

### blood

- Blood donor/request application with a React/Vite frontend and Node/Express/MongoDB-related backend evidence in the candidate notes.
- The README credits Moazam Ali, so attribution and ownership are unresolved.
- The listed Vercel demo is `https://blood-4fmx.vercel.app`; the supplied audit record reports a 404 response, so it is not a verified working demo.

### playwright

- Fork of Microsoft Playwright.
- The repository is upstream Playwright-scale source, not an identified personal application.
- No meaningful personal contribution is verified.
- It should not be featured as a portfolio project unless a specific, attributable contribution is documented.

## Unverified facts

- **Authorship:** confirm the candidate's role, commits, collaborators, and ownership for Scribble Arena, pneumoscan-ai, society, and blood. Repository ownership alone is insufficient.
- **Scribble Arena:** confirm whether the deployed frontend is connected to a reachable multiplayer backend, whether two-client play works, and whether the placeholder test command is the complete test story.
- **LLM_projects:** confirm whether the Streamlit UI exists in the current branch, whether the Gemini agents produce useful responses, and what evaluation or safety checks exist.
- **pneumoscan-ai:** confirm the actual deployed framework, model file and training provenance, dataset/license, fixed evaluation metrics, and whether the Render deployment is still reachable. Do not publish medical-performance claims without evidence.
- **society:** confirm whether the Node/Express/Socket.IO server is part of this repository/version, whether the mess-management features are functional, and whether README credit reflects sole or shared work.
- **potfolio:** replace or confirm the empty resume asset, identify any live URL, and confirm whether this is a prototype or a maintained portfolio site.
- **blood:** resolve the Moazam Ali credit, identify the backend repository or API, explain the Vercel deployment status, and confirm whether the app can complete donor/request flows.
- **playwright:** identify a specific upstream commit, patch, pull request, or feature authored by the candidate before considering any mention.

## Deployment/demo status

- **Scribble Arena:** listed demo `https://scribble-arena.vercel.app` is reachable at fetch level. The full multiplayer flow, including backend connectivity and two-user synchronization, is not verified.
- **LLM_projects:** no verified public demo URL.
- **pneumoscan-ai:** deployment on Render is documented, but no clearly provided public Render URL is available in the reviewed material.
- **society:** no verified public demo URL; full flow is not verified.
- **potfolio:** no verified deployment.
- **blood:** listed demo `https://blood-4fmx.vercel.app` is recorded in the supplied audit notes as returning 404. A later fetch exposed a landing page, so availability is inconsistent; in either case, the complete application flow remains unverified.
- **playwright:** repository homepage `https://playwright.dev` is the upstream Playwright site, not a personal project demo.

## Contribution questions

Before publishing any project, answer:

1. What did the candidate personally design, implement, debug, or deploy?
2. Which commits or pull requests show that contribution?
3. Was the work individual, collaborative, copied, forked, or adapted from a tutorial/template?
4. Can the candidate explain the architecture, tradeoffs, failure modes, and next improvements?
5. Can the project be reproduced from documented setup steps without private credentials or unavailable services?

Project-specific attribution blockers are highest for **blood**, **playwright**, and any project whose README credits another person or does not explain contribution boundaries.

## Build/test gaps

- **Scribble Arena:** meaningful automated tests are missing because the test script is an echo placeholder; in-memory rooms and multiplayer reconnection still need an end-to-end check.
- **LLM_projects:** no verified demo or tests; `GOOGLE_API_KEY`, agent behavior, conversation-manager routing, and evaluation criteria are undocumented or unverified.
- **pneumoscan-ai:** deployment reproducibility, model/data availability, metrics, API contract, and backend framework need confirmation; no local build/test result is claimed here.
- **society:** client/server integration, Socket.IO behavior, role-based flows, deployment, and automated tests are not verified.
- **potfolio:** no meaningful resume content, deployment, or test evidence.
- **blood:** the listed demo status is unreliable, backend ownership is unclear, and donor/request flows and tests are not verified.
- **playwright:** upstream-scale build/test evidence cannot be treated as personal evidence; personal changes and their tests are not identified.

## Portfolio suitability

- **Scribble Arena — strongest current candidate:** distinctive real-time systems story, clear user-facing gameplay, and a reachable demo URL. It needs a real multiplayer smoke test, honest test documentation, and a concise personal-contribution statement.
- **pneumoscan-ai — strong technical candidate with evidence debt:** potentially compelling applied ML and deployment story. It needs verified metrics, dataset attribution, reproducible setup, framework clarification, and careful medical-demo wording.
- **society — strong product candidate pending flow verification:** useful role-based community-management scope and likely breadth across frontend/backend concerns. It needs a verified demo, working-flow walkthrough, tests, and contribution clarification.
- **LLM_projects — alternate AI/ML candidate:** relevant multi-agent/Gemini direction, but documentation and evaluation are too thin today. Promote it after a working demo, API setup, agent examples, and evaluation evidence exist.
- **blood — hold:** the product idea is understandable, but attribution and deployment status are unresolved.
- **potfolio — do not feature as a project:** it is a prototype with an empty resume path and no verified deployment.
- **playwright — exclude:** forked upstream repository with no meaningful personal contribution verified.

## Provisional strongest-three recommendation

1. **Scribble Arena** — lead with the real-time multiplayer engineering story and the listed demo, while labeling multiplayer behavior as pending verification.
2. **pneumoscan-ai** — use as the applied AI/ML project after confirming framework, metrics, dataset, model, deployment, and contribution.
3. **society** — use as the product/workflow project after verifying the full client/server flow and authorship.

**Alternate:** `LLM_projects` is the next candidate if its Streamlit/Gemini experience can be demonstrated and evaluated clearly. Do not replace one of the current three until its documentation and test/evaluation evidence improve.

## Sources consulted

- Profile: `https://github.com/prakashankit1212-art`
- Profile repository metadata: `https://api.github.com/users/prakashankit1212-art/repos?per_page=100&sort=updated`
- Scribble Arena repository: `https://github.com/prakashankit1212-art/scribble-arena`
- Scribble Arena README: `https://raw.githubusercontent.com/prakashankit1212-art/scribble-arena/main/README.md`
- Scribble Arena demo: `https://scribble-arena.vercel.app`
- LLM_projects repository: `https://github.com/prakashankit1212-art/LLM_projects`
- LLM_projects tree metadata: `https://api.github.com/repos/prakashankit1212-art/LLM_projects/git/trees/master?recursive=1`
- pneumoscan-ai repository: `https://github.com/prakashankit1212-art/pneumoscan-ai`
- pneumoscan-ai README: `https://raw.githubusercontent.com/prakashankit1212-art/pneumoscan-ai/main/README.md`
- society repository: `https://github.com/prakashankit1212-art/society`
- society README: `https://raw.githubusercontent.com/prakashankit1212-art/society/main/README.md`
- potfolio repository: `https://github.com/prakashankit1212-art/potfolio`
- blood repository: `https://github.com/prakashankit1212-art/blood`
- blood README: `https://raw.githubusercontent.com/prakashankit1212-art/blood/main/README.md`
- blood listed demo: `https://blood-4fmx.vercel.app`
- playwright repository: `https://github.com/prakashankit1212-art/playwright`
- upstream Playwright site: `https://playwright.dev`
