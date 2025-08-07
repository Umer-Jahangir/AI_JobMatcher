from django.core.management.base import BaseCommand
from jobs.models import UserProfile, Job
# from jobs.ai_utils import enrich_job_with_ai  #  Commented: no AI enrichment now call from redis in ai_utils.py
import requests
from uuid import uuid4
from django.utils import timezone
from datetime import datetime
import time
import json

class Command(BaseCommand):
    help = 'Fetch jobs for all users (AI enrichment disabled)'

    def handle(self, *args, **kwargs):
        for user in UserProfile.objects.all():
            print(f"🔍 Fetching jobs for user: {user.name} ({user.email}) — ID: {user.id}")

            jobs = self.fetch_jobs_from_api(user)
            for job_data in jobs:
                #time.sleep(4)   reduce delay since no AI call

                # 🔻 Commented out enrichment
                # enriched = enrich_job_with_ai(user, job_data)
                # if not enriched:
                #     print(f"⚠️ Skipping job due to failed enrichment: {job_data.get('title', 'Unknown')}")
                #     continue

                required_fields = ['title', 'company', 'location', 'type', 'posted', 'description']
                if not all(field in job_data and job_data[field] for field in required_fields):
                    print(f"⚠️ Skipping job due to missing required fields: {job_data.get('title', 'Unknown')}")
                    continue

                job_id = str(uuid4())  # Always assign a new UUID

                try:
                    job_obj, created = Job.objects.update_or_create(
                        id=job_id,
                        defaults=job_data  # 🔁 Use job_data directly
                    )
                    if created:
                        print(f"✅ Saved: {job_data['title']} — {job_data['company']}")
                    else:
                        print(f"🔁 Skipped (already saved): {job_data['title']} — {job_data['company']}")
                except Exception as e:
                    print(f"❌ Failed to save job {job_data.get('title', 'Unknown')}: {e}")

    def fetch_jobs_from_api(self, user):
        try:
            response = requests.get("https://remoteok.com/api")
            response.raise_for_status()
            data = response.json()
            jobs = []

            for job in data:
                if isinstance(job, dict) and 'tags' in job:
                    # Handle date conversion properly
                    date_str = job.get("date")
                    try:
                        posted_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else timezone.now().date()
                    except (ValueError, TypeError):
                        posted_date = timezone.now().date()

                    # Convert tags to JSON-serializable list
                    tags = job.get("tags", [])
                    if isinstance(tags, str):
                        try:
                            tags = json.loads(tags)
                        except json.JSONDecodeError:
                            tags = [tags]
                    
                    # Convert benefits to JSON-serializable list
                    benefits = job.get("benefits", [])
                    if isinstance(benefits, str):
                        try:
                            benefits = json.loads(benefits)
                        except json.JSONDecodeError:
                            benefits = [benefits]

                    # Ensure salary is a string
                    salary = str(job.get("salary", "Not specified"))

                    jobs.append({
                        "title": str(job.get("position", "")),
                        "company": str(job.get("company", "")),
                        "location": str(job.get("location", "Remote")),
                        "type": str(job.get("type", "Full-time")),
                        "posted": posted_date,
                        "description": str(job.get("description", "")),
                        "tags": tags,
                        "salary": salary,
                        "benefits": benefits,
                    })
            return jobs
        except Exception as e:
            print("❌ Failed to fetch jobs:", e)
            return []
