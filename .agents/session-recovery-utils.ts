export interface RecoveryCheckpoint {
  id: string
  task: string
  pipeline: string
  model: string
  startTime: string
  lastCheckpoint: string
  status: 'in-progress' | 'completed' | 'crashed'
  phases: Record<string, string>
  context: {
    subtasks?: any[]
    discoveredPaths?: string[]
    waveIdx?: number
    totalWaves?: number
    completedSubtasks?: any[]
  }
  log: string[]
}

export function buildSessionId(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `session-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

export function writeCheckpointCmd(checkpoint: RecoveryCheckpoint): string {
  const safeJson = JSON.stringify(checkpoint).replace(/'/g, "'\\''")
  const id = checkpoint.id
  return `mkdir -p .agents/.recovery && echo '${safeJson}' > .agents/.recovery/${id}.json && cp .agents/.recovery/${id}.json .agents/.recovery/latest.json`
}

export const READ_LATEST_CHECKPOINT_CMD = `cat .agents/.recovery/latest.json 2>/dev/null || echo "NO_CHECKPOINT_FOUND"`

export const LIST_RECOVERY_SESSIONS_CMD = `python3 -c "
import os, json
d = '.agents/.recovery'
if not os.path.exists(d):
    print('No recovery sessions found.')
    exit(0)
files = [f for f in os.listdir(d) if f.startswith('session-') and f.endswith('.json')]
for f in files:
    try:
        data = json.load(open(os.path.join(d, f)))
        print(f\\"- ID: {data.get('id')} | Status: {data.get('status')} | Time: {data.get('lastCheckpoint')} | Task: {data.get('task', '')[:80]}...\\")
    except:
        pass
"`
