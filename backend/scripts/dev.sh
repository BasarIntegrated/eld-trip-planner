#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d .venv ]]; then
  echo "Backend venv missing. Run: npm run setup:backend"
  exit 1
fi

# shellcheck disable=SC1091
source .venv/bin/activate
python manage.py migrate --noinput
echo "Backend API: http://localhost:8000/api/health/"
python manage.py runserver 127.0.0.1:8000
