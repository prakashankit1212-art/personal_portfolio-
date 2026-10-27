# pneumoscan-ai

**Audit date:** October 21, 2026  
**Repository:** `https://github.com/prakashankit1212-art/pneumoscan-ai`  
**Demo/deployment:** Render deployment is documented; no clearly provided public URL is verified

## Verified facts

- The supplied project note identifies a React + FastAPI pneumonia/X-ray application.
- The project is intended to analyze chest X-rays and support pneumonia detection.
- Deployment on Render is documented, but a public URL is not clearly provided in the reviewed material.
- Model metrics, dataset provenance, and personal contribution require confirmation.
- The public README currently describes a Flask-based implementation, so the React/FastAPI note and public README need version/framework reconciliation.

## Unverified facts and open questions

- Confirm the actual production backend: FastAPI, Flask, or separate versions/branches.
- Confirm the model architecture, training data, dataset license, class balance, validation protocol, and fixed accuracy/precision/recall values.
- Confirm whether the deployment includes a real model artifact, usable inference endpoint, frontend/backend wiring, and report-generation flow.
- Confirm the candidate's contribution to the UI, API, model training, validation, and deployment.

## Deployment/demo status

Render deployment is documented, but no clearly provided public Render URL is available. Treat deployment as **documented but not publicly verified** until a working URL and an inference smoke test are supplied.

## Contribution questions

- Did the candidate train the model, integrate an existing model, or primarily build the web wrapper?
- Which image-validation and inference decisions are original work?
- What dataset and evaluation split support the published metrics?
- What limitations and non-clinical safeguards are communicated to users?

## Build/test gaps

- No local build or test was run on the remote repository for this audit.
- Reproduce the backend setup with pinned dependencies and a model artifact that is actually loadable.
- Test valid/invalid image uploads, missing model behavior, API response shape, frontend/backend connection, and deployment health.
- Reconcile the documented framework and file layout before claiming reproducible deployment.

## Portfolio suitability

**Strong technical candidate with evidence debt.** The applied ML and deployment angle could be compelling, but metrics, dataset, framework, model availability, and contribution must be verified before publication.

## Source URLs

- `https://github.com/prakashankit1212-art/pneumoscan-ai`
- `https://raw.githubusercontent.com/prakashankit1212-art/pneumoscan-ai/main/README.md`
