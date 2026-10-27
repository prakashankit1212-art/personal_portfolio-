# Scribble Arena

**Audit date:** October 21, 2026  
**Repository:** `https://github.com/prakashankit1212-art/scribble-arena`  
**Listed demo:** `https://scribble-arena.vercel.app`

## Verified facts

- React/TypeScript/Vite frontend.
- Node/Express/Socket.IO/Zod backend.
- README describes rooms, drawing synchronization, guessing, timers, hints, and scoring.
- Rooms are stored in memory and are lost when the backend stops.
- The repository test script is only an echo placeholder.
- The listed Vercel demo is reachable at fetch level.

## Unverified facts and open questions

- Full multiplayer flow, backend connectivity, two-client synchronization, reconnect behavior, and production configuration are not verified.
- Confirm the candidate's personal architecture and implementation contribution, especially if the work was collaborative.
- Confirm whether the Vercel frontend has a separately deployed Socket.IO server and whether the public environment variables point to it.

## Deployment/demo status

The URL `https://scribble-arena.vercel.app` responds at fetch level. This is not evidence that room creation, drawing sync, guessing, timers, scoring, or reconnects work end to end.

## Contribution questions

- Which real-time events and server-side rules did the candidate implement?
- How were room membership, drawer permissions, timers, hints, and scoring designed?
- What tradeoff led to in-memory room storage, and what would replace it for persistence or horizontal scaling?

## Build/test gaps

- The echo-only test script should be replaced with meaningful unit, integration, or browser-flow coverage.
- Test the room lifecycle, permissions, invalid payloads, disconnect/reconnect, concurrent drawing, and round timing.
- No local build or test was run on the remote repository for this audit.

## Portfolio suitability

**Strongest current candidate.** It has the clearest user-facing demo and the most distinctive real-time systems story. Feature it only with a transparent note about the placeholder test script and pending full-flow verification.

## Source URLs

- `https://github.com/prakashankit1212-art/scribble-arena`
- `https://raw.githubusercontent.com/prakashankit1212-art/scribble-arena/main/README.md`
- `https://scribble-arena.vercel.app`
