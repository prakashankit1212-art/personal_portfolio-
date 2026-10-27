# blood

**Audit date:** October 21, 2026  
**Repository:** `https://github.com/prakashankit1212-art/blood`  
**Listed demo:** `https://blood-4fmx.vercel.app`

## Verified facts

- Blood donor/request application.
- The supplied project note identifies a React/Vite frontend and Node/Express/MongoDB-related backend.
- The README credits Moazam Ali.
- The listed Vercel demo is recorded in the supplied audit notes as returning 404.
- Attribution and ownership are unresolved.

## Unverified facts and open questions

- Confirm whether the backend is in this repository or a separate service and whether it actually uses MongoDB.
- Resolve the Moazam Ali credit and document the candidate's individual work.
- Confirm registration, donor search, request creation, matching, admin, and notification flows.
- Confirm whether the Vercel URL is still intended, whether it maps to this repository, and whether its backend is available.

## Deployment/demo status

The listed URL is `https://blood-4fmx.vercel.app`. The supplied verification records a 404 response, so it should not be presented as a working demo. A later fetch exposed a landing page, making availability inconsistent; the full donor/request flow remains unverified.

## Contribution questions

- What did the candidate implement versus the README-credit author, Moazam Ali?
- Which frontend screens, API routes, database models, and deployment configuration are attributable to the candidate?
- Can the candidate explain data validation, privacy, authentication, and failure handling for blood requests?

## Build/test gaps

- No verified working deployment or end-to-end donor/request test.
- Verify frontend/backend configuration, database connection, authentication, validation, empty states, and deployment routing.
- Add tests for donor registration, request creation, matching/search, permissions, and backend failures.
- No local build or test was run on the remote repository for this audit.

## Portfolio suitability

**Hold pending attribution and deployment clarification.** The problem domain is understandable, but the README credit and unreliable demo status create too much evidence debt for current feature placement.

## Source URLs

- `https://github.com/prakashankit1212-art/blood`
- `https://raw.githubusercontent.com/prakashankit1212-art/blood/main/README.md`
- `https://blood-4fmx.vercel.app`
