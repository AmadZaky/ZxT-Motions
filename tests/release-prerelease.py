from pathlib import Path
import json,xml.etree.ElementTree as ET
r=Path(__file__).resolve().parent.parent
assert (r/'VERSION').read_text().strip()=='1.0.1'
x=ET.parse(r/'CSXS/manifest.xml').getroot();assert x.attrib['ExtensionBundleVersion']=='1.0.1'
assert all(e.attrib['Version']=='1.0.1' for e in x.findall('./ExtensionList/Extension'))
assert json.loads((r/'presets.json').read_text())['version']=='1.0.1'
for f in ['js/bridge.js','jsx/hostscript.jsx','jsx/shape.jsx','jsx/media.jsx']:assert '1.0.1' in (r/f).read_text()
w=(r/'.github/workflows/prerelease-v1.0.1.yml').read_text()
for text in ['release/v1.0.1-rc.1','--prerelease','--latest=false','v1.0.1-rc.1','ZxT-Motions_v1.0.1-rc.1.zip','tests/release-prerelease.py','tools/validate-task4.py']:
 assert text in w,text
assert 'refs/heads/main' not in w
assert w.index('git config --global core.autocrlf false')<w.index('uses: actions/checkout@v4')
assert 'native AE2025' in (r/'RELEASE_NOTES.md').read_text()
print('PASS numeric1.0.1 parity, isolated RC tag/asset/prerelease-not-latest workflow and native disclaimer')

# Run the actual publisher shell with fake Git/GH; no network or publication.
import os,subprocess,tempfile,shutil
start=w.index('          # Never replace');end=w.index('      - name: Save CI',start)
shell='\n'.join(line[10:] for line in w[start:end].splitlines())
with tempfile.TemporaryDirectory() as tmp:
 tmp=Path(tmp)
 (tmp/'git').write_text('#!/bin/sh\nif [ "$TAG_STATE" = failed ]; then exit 128; fi\nif [ "$TAG_STATE" = exists ]; then echo "abc refs/tags/v1.0.1-rc.1"; fi\n')
 (tmp/'gh').write_text('#!/bin/sh\nif [ "$1" = api ]; then if [ "$2" != --method ]; then echo "$SOURCE_SHA"; fi; exit 0; fi\nif [ "$2" = view ]; then test "$RELEASE_STATE" = exists; exit $?; fi\nprintf "%s\\n" "$@" > "$PUBLISH_LOG"\n')
 for x in ['git','gh']:(tmp/x).chmod(0o755)
 for tag,release,success in [('exists','missing',False),('failed','missing',False),('missing','exists',False),('missing','missing',True)]:
  log=tmp/'published';log.unlink(missing_ok=True)
  env={**os.environ,'PATH':str(tmp)+os.pathsep+os.environ['PATH'],'TAG_STATE':tag,'RELEASE_STATE':release,'SOURCE_SHA':'verified-sha','GH_REPO':'owner/repo','PUBLISH_LOG':str(log)}
  result=subprocess.run([shutil.which('bash'),'-e','-o','pipefail','-c',shell],env=env,capture_output=True,text=True)
  assert (result.returncode==0)==success,(tag,release,result.stdout,result.stderr)
  assert log.exists()==success
  if success:
   args=log.read_text().splitlines();assert '--verify-tag' in args and '--prerelease' in args and '--latest=false' in args;assert args[args.index('--target')+1]=='verified-sha'
print('PASS real publisher shell: existing tag/release/network failure stop, new RC uses verifiedSHA and prerelease-not-latest')
