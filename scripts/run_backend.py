"""Start the existing backend with a local, untracked environment file."""
import argparse
import os
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--env-file', type=Path, default=root / '.local/runtime.env')
args = parser.parse_args()
env = os.environ.copy()
for raw in args.env_file.read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith('#'):
        continue
    key, separator, value = line.partition('=')
    if not separator:
        parser.error('Each environment entry must use KEY=VALUE')
    env[key.strip()] = value.strip().strip('"').strip("'")
jar = root / 'backend/target/backend-0.0.1-SNAPSHOT.jar'
if not jar.is_file():
    parser.error('Build first: mvn -f backend/pom.xml package -DskipTests')
os.chdir(root / 'backend')
os.execvpe('java', ['java', '-jar', str(jar)], env)
