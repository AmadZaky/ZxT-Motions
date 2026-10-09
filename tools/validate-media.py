"""Run recorded Task 2 regression commands plus focused Task 3 scripts; no native AE claims."""
import json, os, shlex, subprocess
from pathlib import Path
root=Path(__file__).resolve().parent.parent
results=[]
commands=[r['command'] for r in json.loads((root/'docs/task2/validation-results.json').read_text())['results']]
commands += ['node tests/media-host.cjs','node tests/media-safety.cjs','node tests/media-bridge.cjs','node tests/media-collections.cjs','node tests/media-boundaries.cjs','node tests/media-ui.cjs']
for command in commands:
 p=subprocess.run(shlex.split(command),cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 results.append(dict(command=command,exitCode=p.returncode,output=p.stdout))
 print(('PASS ' if p.returncode==0 else 'FAIL ')+command,flush=True)
 if p.returncode: print(p.stdout[-2500:],flush=True)
 (root/'docs/task3/validation-results.json').write_text(json.dumps(dict(nativeAEValidated=False,environment={k:os.environ.get(k) for k in ['NODE_PATH','CODEX_PRIMARY_RUNTIME_NODE_MODULES','CHROMIUM_PATH']},results=results,summary=dict(scripts=len(results),passed=sum(r['exitCode']==0 for r in results))),indent=2)+'\n')
raise SystemExit(any(r['exitCode'] for r in results))
