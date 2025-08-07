import os
import google.generativeai as genai
from dotenv import load_dotenv
import logging
import re
from sentence_transformers import SentenceTransformer, util
from redis.commands.search.query import Query
from .redis_client import redis_client
import numpy as np
import json
import time
import hashlib
from jobs.models import Job 
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

model = genai.GenerativeModel("gemini-2.0-flash")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def enrich_job_with_ai(user, job):
    prompt = f"""
Analyze this job match and respond in this exact format:
match_score: [number between 0-100]
matched_skills: [skill1, skill2, ...]
missing_skills: [skill1, skill2, ...]
explanation: [detailed explanation]

User Profile:
Name: {user.name}
Email: {user.email}
Role: {user.role}
Skills: {user.skills}
Experience: {user.experience}

Job Details:
Title: {job['title']}
Company: {job['company']}
Description: {job['description']}
Required Skills: {job['tags']}
"""

    try:
        response = model.generate_content(prompt)
        
        # Validate response
        if not response or not response.text:
            raise ValueError("Empty response from AI")
            
        # Check if response contains required sections
        required_sections = ['match_score:', 'matched_skills:', 'missing_skills:', 'explanation:']
        if not all(section in response.text.lower() for section in required_sections):
            raise ValueError("AI response missing required sections")
            
        parsed = parse_ai_response(response.text)
        return {**job, **parsed}

    except Exception as e:
        logger.error(f"AI enrichment failed: {str(e)}", exc_info=True)
        # Return original job with default values
        return {**job, 
                "match_score": 0,
                "matched_skills": [],
                "missing_skills": [],
                "explanation": f"AI enrichment failed: {str(e)}"}

def parse_ai_response(text):
    try:
        # Define regex patterns with more flexible matching
        patterns = {
            'match_score': r'match_score\s*:\s*(\d+)',
            'matched_skills': r'matched_skills\s*:\s*\[(.*?)\]',
            'missing_skills': r'missing_skills\s*:\s*\[(.*?)\]',
            'explanation': r'explanation\s*:\s*([^\n]*(?:\n(?!\w+:).*)*)'
        }
        
        # Extract data with validation
        match_score = re.search(patterns['match_score'], text)
        if not match_score:
            raise ValueError("Could not find match_score")
        
        matched_skills = re.search(patterns['matched_skills'], text)
        missing_skills = re.search(patterns['missing_skills'], text)
        explanation = re.search(patterns['explanation'], text, re.MULTILINE)
        
        # Process and validate the extracted data
        result = {
            "match_score": min(100, max(0, int(match_score.group(1)))),
            "matched_skills": [s.strip() for s in (matched_skills.group(1).split(',') if matched_skills else [])],
            "missing_skills": [s.strip() for s in (missing_skills.group(1).split(',') if missing_skills else [])],
            "explanation": explanation.group(1).strip() if explanation else "No explanation provided"
        }
        
        return result

    except (AttributeError, ValueError) as e:
        logger.error(f"Error parsing AI response: {str(e)}", exc_info=True)
        # Return default values instead of empty dict
        return {
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": [],
            "explanation": "Failed to parse AI response"
        }
    
def get_ai_chat_response(message, user_profile):
    prompt = f"""
You are an AI career assistant. The user has this profile:
- Name: {user_profile.get('name', 'Anonymous')}
- Role: {user_profile.get('role', 'Developer')}
- Skills: {', '.join(user_profile.get('skills', []))}
- Experience: {user_profile.get('experience', 'Not specified')}

User asked: "{message}"

Respond in a helpful, structured way.
"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error generating AI chat response: {str(e)}", exc_info=True)
        return "I'm sorry, I couldn't process that question right now."
    
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def float32_to_bytes(vec):
    return np.array(vec, dtype=np.float32).tobytes()


def match_user_to_jobs(user, top_k=10):
    # Create profile text for vector embedding
    profile_text = f"{user.name} {user.role} {' '.join(user.skills)} {user.experience}"
    user_vector = embedding_model.encode(profile_text, normalize_embeddings=True)

    # Search top K*2 jobs from Redis vector index
    q = (
        Query("*=>[KNN %d @embedding $vec AS score]" % (top_k * 2))
        .sort_by("score")
        .paging(0, top_k * 2)
        .return_fields("id", "title", "description", "skills", "company", "location", "type", "posted", "tags", "salary", "benefits")
        .dialect(2)
    )

    results = redis_client.ft("job_idx").search(q, query_params={"vec": float32_to_bytes(user_vector)})

    enriched_jobs = []
    seen_keys = set()

    for doc in results.docs:
        raw_key = f"{doc.title.strip().lower()}_{doc.company.strip().lower()}_{doc.location.strip().lower()}"
        job_hash = hashlib.md5(raw_key.encode()).hexdigest()

        if job_hash in seen_keys:
            continue
        seen_keys.add(job_hash)

        job_id = doc.id.split(":")[-1]

        # Create user-job cache key
        # Generate stable hashes
        user_hash = hashlib.md5(user.email.encode()).hexdigest()

        # Generate a hash of the current user profile (name, role, skills, experience)
        profile_data = f"{user.name} {user.role} {' '.join(user.skills)} {user.experience}"
        profile_hash = hashlib.md5(profile_data.encode()).hexdigest()

        # Updated cache key includes the profile hash
        cache_key = f"user:{user_hash}:profile:{profile_hash}:job:{job_id}:enriched"

        # Now check the cache
        cached = redis_client.get(cache_key)

        if cached:
            try:
                job_data = json.loads(cached)
                enriched_jobs.append(job_data)
                # Also save to Job model if it doesn't exist
                Job.objects.update_or_create(
                    id=job_data["id"],
                    defaults={
                        "title": job_data["title"],
                        "description": job_data["description"],
                        "skills": job_data.get("skills", []),
                        "matched_skills": job_data.get("matched_skills", []),
                        "missing_skills": job_data.get("missing_skills", []),
                        "match_score": job_data.get("match_score", 0.0),
                        "explanation": job_data.get("explanation", ""),
                        "company": job_data["company"],
                        "location": job_data["location"],
                        "type": job_data["type"],
                        "tags": job_data.get("tags", []),
                        "salary": job_data.get("salary", ""),
                        "benefits": job_data.get("benefits", []),
                    }
                )

                if len(enriched_jobs) >= top_k:
                    break
                continue
            except Exception as e:
                logger.warning(f"Failed to load cached job {job_id} for user {user.email}: {str(e)}")

        # Build job object
        job = {
            "id": job_id,
            "title": doc.title,
            "company": doc.company,
            "location": doc.location,
            "type": doc.type,
            "posted": str(doc.posted),
            "description": doc.description,
            "tags": json.loads(doc.tags),
            "salary": doc.salary,
            "benefits": json.loads(doc.benefits),
        }
        print(f"🔍 Enriching job {job['title']} for user {user.email} with AI...")
        # Enrich with AI
        enriched = enrich_job_with_ai(user, job)

        # Merge job + enriched fields
        full_data = {**job, **enriched}
        # Save to Job model as well
        Job.objects.update_or_create(
            id=full_data["id"],
            defaults={
                "title": full_data["title"],
                "description": full_data["description"],
                "skills": full_data.get("skills", []),
                "matched_skills": full_data.get("matched_skills", []),
                "missing_skills": full_data.get("missing_skills", []),
                "match_score": full_data.get("match_score", 0.0),
                "explanation": full_data.get("explanation", ""),
                "company": full_data["company"],
                "location": full_data["location"],
                "type": full_data["type"],
                "tags": full_data.get("tags", []),
                "salary": full_data.get("salary", ""),
                "benefits": full_data.get("benefits", []),
            }
        )

        enriched_jobs.append(full_data)

        try:
            # Save full data to Redis for next time
            redis_client.set(cache_key, json.dumps(full_data))
        except Exception as e:
            logger.error(f"Failed to cache job {job_id} for user {user.email}: {str(e)}", exc_info=True)

        if len(enriched_jobs) >= top_k:
            break

    return enriched_jobs
