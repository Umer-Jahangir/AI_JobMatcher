import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Upload, X, Pencil, UserCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';

export default function AccountPage({ userProfile, onUpdate, user, onNavigate }) {
  const [profileData, setProfileData] = useState(userProfile || {
    role: '',
    skills: [],
    experience: '',
    resume: null
  });

  const [newSkill, setNewSkill] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile) {
      setProfileData(userProfile);
    }
  }, [userProfile]);

  const handleRoleChange = (value) => setProfileData(prev => ({ ...prev, role: value }));
  const handleExperienceChange = (value) => setProfileData(prev => ({ ...prev, experience: value }));

  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
  };

  const handleKeyPress = (e) => { 
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      addSkill(); 
    } 
  };

  const handleResumeUpload = (e) => { 
    const file = e.target.files[0]; 
    if (file) { 
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setProfileData(prev => ({ ...prev, resume: file })); 
      setError('');
    } 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileData.role || profileData.skills.length === 0 || !profileData.experience) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all required fields
      if (user?.sub) formData.append('id', user.sub); // Add Auth0 user ID
      if (user?.name) formData.append('name', user.name);
      if (user?.email) formData.append('email', user.email);
      formData.append('role', profileData.role);
      formData.append('experience', profileData.experience);
      formData.append('skills', JSON.stringify(profileData.skills));

      // Only append resume if it's a new file
      if (profileData.resume && profileData.resume instanceof File) {
        formData.append('resume', profileData.resume);
      }

      // Log FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const encodedId = encodeURIComponent(userProfile.id);
      const response = await fetch(`http://localhost:8000/api/profiles/${encodedId}/`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
        // Remove Content-Type header - FormData sets it automatically
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        onUpdate(updatedProfile);
        setEditMode(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        // Log the full error response
        console.error('Server error:', errorData);
        setError(errorData.detail || errorData.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
    );
    
    if (!confirmed) return;

    // Second confirmation for critical action
    const doubleConfirmed = window.confirm(
      "This is your final warning. Deleting your account will permanently remove all your profile data, job applications, and account information. Type 'DELETE' in the next prompt to confirm."
    );
    
    if (!doubleConfirmed) return;

    // Ask user to type DELETE for final confirmation
    const deleteConfirmation = window.prompt(
      "Type 'DELETE' (in capital letters) to confirm account deletion:"
    );
    
    if (deleteConfirmation !== 'DELETE') {
      alert('Account deletion cancelled. You must type "DELETE" exactly to confirm.');
      return;
    }

    setDeleteLoading(true);
    setError('');

    try {
      const encodedId = encodeURIComponent(userProfile.id);
      const response = await fetch(`http://localhost:8000/api/profiles/${encodedId}/`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Account deleted successfully
        alert('Your account has been permanently deleted.');
        
        // Navigate to landing page and potentially trigger logout
        onNavigate('/');
        
        // If you have access to Auth0 logout function, you might want to call it here
        // For example: logout({ returnTo: window.location.origin });
        
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelEdit = () => {
    setProfileData(userProfile); // Reset to original data
    setEditMode(false);
    setError('');
    setSuccess('');
  };

  const isFormValid = profileData.role && profileData.skills.length > 0 && profileData.experience;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <UserCircle className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">Account</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.name || 'User'}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onNavigate('/jobs')}
              >
                Back to Jobs
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Success/Error Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Your Profile</CardTitle>
            {!editMode && (
              <Button size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editMode ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role */}
                <div>
                  <Label>Role *</Label>
                  <Select value={profileData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frontend-developer">Frontend Developer</SelectItem>
                      <SelectItem value="backend-developer">Backend Developer</SelectItem>
                      <SelectItem value="fullstack-developer">Full Stack Developer</SelectItem>
                      <SelectItem value="data-scientist">Data Scientist</SelectItem>
                      <SelectItem value="product-manager">Product Manager</SelectItem>
                      <SelectItem value="ui-ux-designer">UI/UX Designer</SelectItem>
                      <SelectItem value="devops-engineer">DevOps Engineer</SelectItem>
                      <SelectItem value="mobile-developer">Mobile Developer</SelectItem>
                      <SelectItem value="qa-engineer">QA Engineer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Skills */}
                <div>
                  <Label>Skills *</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a skill"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addSkill} size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profileData.skills.map((skill, index) => (
                      <Badge key={index} className="flex items-center space-x-1">
                        <span>{skill}</span>
                        <button type="button" onClick={() => removeSkill(skill)}>
                          <X className="h-3 w-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <Label>Experience *</Label>
                  <Select value={profileData.experience} onValueChange={handleExperienceChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="2-4">2-4 years</SelectItem>
                      <SelectItem value="5-7">5-7 years</SelectItem>
                      <SelectItem value="8-10">8-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resume Upload */}
                <div>
                  <Label htmlFor="resume">Resume Upload (Optional)</Label>
                  <div className="mt-1">
                    <label
                      htmlFor="resume-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, or DOCX (MAX. 5MB)</p>
                      </div>
                      <input
                        id="resume-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                      />
                    </label>
                    {profileData.resume && (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ {profileData.resume.name || 'Resume uploaded'} 
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3">
                  <Button 
                    type="submit" 
                    disabled={!isFormValid || loading} 
                    className="flex-1"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-gray-700">
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {profileData.role || 'N/A'}</p>
                <p><strong>Experience:</strong> {profileData.experience || 'N/A'}</p>
                <div>
                  <strong>Skills:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profileData.skills.length > 0 ? (
                      profileData.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No skills listed</span>
                    )}
                  </div>
                </div>
                {profileData.resume && (
                  <p className="mt-2">
                    <strong>Resume:</strong> {profileData.resume.name || 'Uploaded'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          
          {/* Delete Account Section */}
          <div className="px-6 pb-6">
            <div className="border-t pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-800 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-700 mb-3">
                  Once you delete your account, there is no going back. This will permanently delete 
                  your profile, job applications, and all associated data.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleteLoading}
                  onClick={handleDeleteAccount}
                >
                  {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {deleteLoading ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}