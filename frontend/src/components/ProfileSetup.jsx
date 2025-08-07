import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Badge } from './ui/badge';
import { Upload, X, Plus, UserCircle } from 'lucide-react';

export default function AccountPage({ userProfile, onUpdate, user }) {
const [profileData, setProfileData] = useState({
  id: userProfile?.id || null,
  name: userProfile?.name || user?.name || '',
  email: user?.email || '',
  role: userProfile?.role || '',
  skills: userProfile?.skills || [],
  experience: userProfile?.experience || '',
  resume: null,
});


  const [newSkill, setNewSkill] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    if (userProfile) {
      setProfileData(prev => ({
        ...prev,
        ...userProfile
      }));
    }
  }, [userProfile]);

  const handleRoleChange = (value) => {
    setProfileData(prev => ({ ...prev, role: value }));
  };

  const handleExperienceChange = (value) => {
    setProfileData(prev => ({ ...prev, experience: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
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
      setProfileData(prev => ({ ...prev, resume: file }));
    }
  };

  const isFormValid =
    profileData.role && profileData.skills.length > 0 && profileData.experience;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('id', user?.sub);
    formData.append('name', profileData.name);
    formData.append('email', profileData.email);
    formData.append('role', profileData.role);
    formData.append('experience', profileData.experience);
    formData.append('skills', JSON.stringify(profileData.skills));
    if (profileData.resume) {
      formData.append('resume', profileData.resume);
    }

    try {
      const method = profileData.id ? 'PATCH' : 'POST';
      const url = profileData.id
        ? `http://localhost:8000/api/profiles/${profileData.id}/`
        : `http://localhost:8000/api/profiles/`;

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
          const errorText = await response.text(); // Show exact error
          console.error('Server Error:', errorText);
          throw new Error('Failed to save profile');
      }
      if (!user?.sub) {
        alert("User ID not found.");
        return;
      }

      const data = await response.json();
      onUpdate(data);
      setUploadStatus('success');
      alert('✅ Profile saved successfully!');
      console.log("User ID sent to backend:", user?.sub);
    } catch (error) {
      console.error(error);
      setUploadStatus('error');
      alert('❌ Failed to save profile. Please try again.');
    }
    {uploadStatus && (
  <p className="text-sm text-green-600 mt-2">
    {uploadStatus}
  </p>
  

)}

  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <UserCircle className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">
                Set up Profile
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Welcome back, {user?.name}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role */}
              <div>
                <Label htmlFor="role">Current/Desired Role</Label>
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
                <Label htmlFor="skills">Skills</Label>
                <div className="mt-1 space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a skill (e.g., React, Python)"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addSkill} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {profileData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center space-x-1"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Select
                  value={profileData.experience}
                  onValueChange={handleExperienceChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0-1 years (Entry Level)</SelectItem>
                    <SelectItem value="2-4">2-4 years (Junior)</SelectItem>
                    <SelectItem value="5-7">5-7 years (Mid Level)</SelectItem>
                    <SelectItem value="8-10">8-10 years (Senior)</SelectItem>
                    <SelectItem value="10+">10+ years (Expert)</SelectItem>
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
                      <p className="text-xs text-gray-500">
                        PDF, DOC, or DOCX (MAX. 5MB)
                      </p>
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
                      ✓ {profileData.resume.name || 'Resume file attached'}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={!isFormValid}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
