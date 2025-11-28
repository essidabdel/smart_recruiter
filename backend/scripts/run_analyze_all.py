import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hr_ai.settings')
django.setup()

from applications.models import Application
from ai_engine.pipeline import analyze_application

apps = Application.objects.all()
print(f"Found {apps.count()} applications. Running analyze_application on each (this may be slow)...")

for i, app in enumerate(apps, 1):
    try:
        updated = analyze_application(app.id)
        print(f"[{i}/{apps.count()}] Analyzed id={app.id} final_score={getattr(updated, 'final_score', None)}")
    except Exception as e:
        print(f"[{i}/{apps.count()}] Error analyzing id={app.id}: {e}")

print("Done")
