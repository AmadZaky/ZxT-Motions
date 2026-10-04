"""An explicit repair commit may keep Official v1.0.0; ordinary same-version pushes fail."""
from pathlib import Path
import shutil,subprocess,tempfile,sys
root=Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory() as temp:
 p=Path(temp)
 for name in ['VERSION','CSXS/manifest.xml','presets.json','js/bridge.js','jsx/hostscript.jsx','tools/check-version.py']:
  target=p/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/name,target)
 def git(*args):return subprocess.check_output(['git',*args],cwd=p,stderr=subprocess.DEVNULL,text=True)
 git('init');git('config','user.name','Test');git('config','user.email','test@example.invalid');git('add','.');git('commit','-m','v1.0.0 baseline')
 git('commit','--allow-empty','-m','[official-repair] approved v1.0.0 correction')
 assert subprocess.run([sys.executable,'tools/check-version.py'],cwd=p,capture_output=True).returncode==0,'Approved same-version correction rejected'
 git('commit','--allow-empty','-m','Unapproved same-version change')
 assert subprocess.run([sys.executable,'tools/check-version.py'],cwd=p,capture_output=True).returncode!=0,'Same-version change must require explicit maintenance marker'
print('PASS: approved v1.0.0 repair and rejected ordinary same-version changes')
