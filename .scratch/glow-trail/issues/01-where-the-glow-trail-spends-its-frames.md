Type: research
Status: resolved

## Question

Which of the per-pixel segment loop, pulse, film grain, the eased chase, and the always-on animation frame break 60fps and idle cost on a 1080p laptop?

Primary source is the glow trail implementation: `frontend/src/components/ui/GlowCursor.tsx` and `frontend/src/components/glow-cursor-layer.tsx`.

## Context

Findings are captured on branch [research/glow-trail-cost](https://github.com/Yahiro025/tanglaw/tree/research/glow-trail-cost) (local worktree `/home/yahiro/Documents/PROJECTS/tanglaw-glow-trail-cost`). The branch is local until pushed.

## Answer

The per-pixel segment loop breaks 60fps on a 1080p laptop, and it is still the work inside every idle frame. The always-on animation frame breaks the idle budget by submitting that fullscreen pass after the wake has faded (and before any pointer). Pulse, film grain, and the eased chase (`followSpeed` 0.16) do not break either budget. Frame time was not measured; the split is structural.

Write-up: `/home/yahiro/Documents/PROJECTS/tanglaw-glow-trail-cost/.scratch/glow-trail/research/where-the-glow-trail-spends-its-frames.md` on branch `research/glow-trail-cost` (`69dcb0a`).
