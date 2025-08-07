from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import UserProfile, Job
from .redis_client import redis_client
from .serializers import UserProfileSerializer, JobSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny 
from .ai_utils import get_ai_chat_response
from rest_framework.views import APIView
from .ai_utils import match_user_to_jobs
from rest_framework import status
from django.shortcuts import get_object_or_404
import logging
import hashlib
import json
logger = logging.getLogger(__name__)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path='me')
    def get_me(self, request):
        email = request.user.email if request.user and request.user.is_authenticated else request.query_params.get("email")

        if not email:
            return Response({'detail': 'Authentication required or email not provided.'}, status=401)

        try:
            profile = UserProfile.objects.get(email=email)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=404)
        
class JobViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer

class AIChatAssistantView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_input = request.data.get('message')
        user_profile = request.data.get('user_profile', {})

        if not user_input:
            return Response({'error': 'Message is required'}, status=400)

        ai_reply = get_ai_chat_response(user_input, user_profile)
        return Response({'reply': ai_reply})
    
class MatchedJobsView(APIView):
    def get(self, request, user_id):
        try:
            user_profile = UserProfile.objects.get(id=user_id)
        except UserProfile.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Pass user_profile (not profile_text) directly
            matched_jobs = match_user_to_jobs(user_profile)
            return Response(matched_jobs, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Matching failed:")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class CachedJobDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, job_id, user_id):
        try:
            user = get_object_or_404(UserProfile, user_id=user_id)
            user_hash = hashlib.md5(user.email.encode()).hexdigest()
            redis_key = f"user:{user_hash}:job:{job_id}:enriched"

            cached_data = redis_client.get(redis_key)

            if not cached_data:
                return Response({"error": "No enriched job data found in cache"}, status=status.HTTP_404_NOT_FOUND)

            job_data = json.loads(cached_data)
            return Response(job_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Failed to fetch cached job data")
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)