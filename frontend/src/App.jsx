import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

import LandingPage from './components/LandingPage';
import ProfileSetup from './components/ProfileSetup';
import JobFeed from './components/JobFeed';
import JobDetail from './components/JobDetail';
import ChatAssistant from './components/ChatAssistant';
import AccountPage from './components/AccountPage';

function App() {
  // Initialize currentPage from current URL path
  const [currentPage, setCurrentPage] = useState(window.location.pathname || '/');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const { isAuthenticated, user, isLoading } = useAuth0();

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(window.location.pathname);
      // Extract jobId from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('jobId');
      if (jobId) {
        setSelectedJobId(jobId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Also check current URL on mount for any query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');
    if (jobId) {
      setSelectedJobId(parseInt(jobId),10);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (path, jobId = null) => {
    setCurrentPage(path);
    if (jobId) {
      setSelectedJobId(jobId);
      // Update URL with jobId parameter
      const url = `${path}?jobId=${jobId}`;
      window.history.pushState(null, '', url);
    } else {
      // Update URL without parameters
      window.history.pushState(null, '', path);
    }
  };

  const handleProfileComplete = (profileData) => {
    setUserProfile(profileData);
    navigate('/jobs');
  };

  // Fetch profile once on auth success
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userEmail = user?.email;
        const res = await fetch(`http://localhost:8000/api/profiles/me/?email=${userEmail}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setUserProfile(data);
            setProfileChecked(true);
            // Only navigate to /jobs if we're currently on landing page
            if (currentPage === '/') {
              navigate('/jobs');
            }
          } else {
            setProfileChecked(true);
            // Only navigate to profile setup if we're on landing or protected page without profile
            if (currentPage === '/' || (currentPage !== '/profile-setup' && isAuthenticated)) {
              navigate('/profile-setup');
            }
          }
        } else {
          setProfileChecked(true);
          if (currentPage === '/' || (currentPage !== '/profile-setup' && isAuthenticated)) {
            navigate('/profile-setup');
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setProfileChecked(true);
        if (currentPage === '/' || (currentPage !== '/profile-setup' && isAuthenticated)) {
          navigate('/profile-setup');
        }
      }
    };

    if (isAuthenticated && !profileChecked) {
      fetchProfile();
    }
  }, [isAuthenticated, profileChecked, currentPage]);

  // Redirect to landing page if trying to access protected routes while not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const protectedRoutes = ['/jobs', '/job-detail', '/chat', '/account', '/profile-setup'];
      if (protectedRoutes.includes(currentPage)) {
        navigate('/');
      }
    }
  }, [isAuthenticated, isLoading, currentPage]);

  // Prevent rendering until we've checked profile status
  if (isLoading || (isAuthenticated && !profileChecked)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case '/':
        return <LandingPage onNavigate={navigate} />;
      case '/profile-setup':
        return isAuthenticated ? (
          <ProfileSetup
            onUpdate={handleProfileComplete}
            onNavigate={navigate}
            user={user}
          />
        ) : (
          <LandingPage onNavigate={navigate} />
        );
      case '/jobs':
        return isAuthenticated ? (
          <JobFeed onNavigate={navigate} userProfile={userProfile} />
        ) : (
          <LandingPage onNavigate={navigate} />
        );
      case '/job-detail':
        return isAuthenticated ? (
          <JobDetail jobId={selectedJobId} onNavigate={navigate} userProfile={userProfile} />
        ) : (
          <LandingPage onNavigate={navigate} />
        );
      case '/chat':
        return isAuthenticated ? (
          <ChatAssistant onNavigate={navigate} userProfile={userProfile} />
        ) : (
          <LandingPage onNavigate={navigate} />
        );
      case '/account':
        return isAuthenticated ? (
          <AccountPage
            onNavigate={navigate}
            userProfile={userProfile}
            onUpdate={(updatedProfile) => setUserProfile(updatedProfile)}
            user={user}
          />
        ) : (
          <LandingPage onNavigate={navigate} />
        );
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderPage()}</div>;
}

export default App;