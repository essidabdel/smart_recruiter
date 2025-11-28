import os
import sys
import django

# Ensure backend directory is on sys.path so Django project module can be imported
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hr_ai.settings')
django.setup()

from applications.models import Application, ParsedResume
from ai_engine.pipeline import analyze_application

app = Application.objects.first()
print('APP_ID', app.id if app else None)
if app:
    updated = analyze_application(app.id)
    print('FINAL', getattr(updated, 'final_score', None))
    pr = list(ParsedResume.objects.filter(application=updated).values('skills', 'experiences', 'education'))
    print('PARSED_RESUME:', pr)
else:
    print('No application found')
