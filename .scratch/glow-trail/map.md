# Glow trail spec map

## Destination

A spec a later session can implement with no further product choices. The head sits on the pointer. A short wake follows it. The trail keeps the cyan-to-violet taper and screen blend. Pulse and film grain stay only if they still fit the budget. The trail holds 60fps on a typical 1080p laptop and does almost no GPU work after the wake has faded. `prefers-reduced-motion` turns it off.

This map ends at that spec. It does not change the glow trail in the app.

## Notes

Domain: the site-wide glow trail in `frontend/src/components/ui/GlowCursor.tsx`, mounted by `frontend/src/components/glow-cursor-layer.tsx` on the root layout.

Language for this effort: **glow trail** is the effect, **head** is the point on the pointer, **wake** is the ribbon behind the head.

Skills every session should consult: grilling and domain-modeling for decisions; research for cost and drawing-approach tickets; prototype for the wake.

Standing preferences:

- The head sits on the pointer. The delayed chase (`followSpeed` 0.16, then a lagging point chain) is what this spec replaces.
- Keep the cyan (`#67E8F9`) to violet (`#A78BFA`) tapered glow and screen blend.
- Pulse and film grain may be cut if they are what breaks the budget.
- Budget: 60fps on a typical 1080p laptop, and almost no GPU work once the wake has faded.
- `prefers-reduced-motion` turns the trail off.
- Tracker is local markdown. GitHub issues are disabled on this repo.

Starting evidence, not a closed decision. The layer mounts the trail for fine pointers at 768px or wider. The component draws one fullscreen WebGL pass. The fragment shader walks up to 63 segments per pixel (`MAX_POINTS` 64), including pulse and film grain. The head eases toward the pointer, then a 40-point chain lags behind that head. `requestAnimationFrame` keeps rendering after the trail has faded.

## Decisions so far

- [Where the glow trail spends its frames](.scratch/glow-trail/issues/01-where-the-glow-trail-spends-its-frames.md): the 63-iteration per-pixel segment loop breaks 60fps and still runs after fade; the always-on animation frame keeps that pass going when idle; pulse, film grain, and the eased chase do not.

## Not yet specified

- Idle fade timing once the wake is short
- Resolution policy, including the current 1.5 device-pixel-ratio cap, once a drawing approach exists
- How the spec will show “almost no GPU work” once the approach is chosen

## Out of scope

- Implementing the trail in the app. This map ends at the spec.
- Coarse pointers and viewports under 768px. The existing gate stays.
- Motion or styling outside the glow trail.
