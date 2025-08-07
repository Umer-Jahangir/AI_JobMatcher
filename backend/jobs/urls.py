from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, JobViewSet , AIChatAssistantView , MatchedJobsView , CachedJobDetailView

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet)
router.register(r'jobs', JobViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', AIChatAssistantView.as_view(), name='ai_chat'),
    path("redis-matched-jobs/<str:user_id>/", MatchedJobsView.as_view(), name="matched-jobs"),
    path('api/redis-job-detail/<str:job_id>/<str:user_id>/', CachedJobDetailView.as_view(), name='job-detail-cached'),
]
