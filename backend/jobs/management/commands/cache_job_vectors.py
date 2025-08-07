# jobs/management/commands/cache_job_vectors.py

from django.core.management.base import BaseCommand
from sentence_transformers import SentenceTransformer
from jobs.models import Job
from jobs.redis_client import redis_client
import numpy as np
import uuid
import json

model = SentenceTransformer('all-MiniLM-L6-v2')


def float32_to_bytes(vec):
    return np.array(vec, dtype=np.float32).tobytes()


class Command(BaseCommand):
    help = "Embed jobs and store all data in Redis for vector search"

    def handle(self, *args, **kwargs):
        for job in Job.objects.all():
            combined_text = f"{job.title} {job.description} {', '.join(job.tags)}"
            vector = model.encode(combined_text, normalize_embeddings=True)

            redis_key = f"job:{str(job.id)}"

            redis_client.hset(redis_key, mapping={
                "id": str(job.id),
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "type": job.type,
                "posted": str(job.posted),
                #"match_score": job.match_score,
                "description": job.description,
                "tags": json.dumps(job.tags),
                "salary": job.salary,
                "benefits": json.dumps(job.benefits),
                #"matched_skills": json.dumps(job.matched_skills),
                #"missing_skills": json.dumps(job.missing_skills),
                #"explanation": job.explanation,
                "embedding": float32_to_bytes(vector)
            })

        self.stdout.write(self.style.SUCCESS("✅ All job vectors and data stored in Redis."))
