import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { BrainCircuit, ArrowLeft, MapPin, Calendar, DollarSign, Building, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function JobDetail({ jobId, onNavigate}) {
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const cleanDescription = (text) => {
  if (!text) return 'No description available';

  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Replace corrupted UTF-8 characters
    .replace(/â/g, "'")
    .replace(/â/g, '"')
    .replace(/â/g, '"')
    .replace(/â¦/g, '...')
    .replace(/â/g, '-')
    .replace(/â”/g, '—')
    .replace(/â¢/g, '•')
    // Replace \n or \\n with real line breaks or space
    .replace(/\\n/g, '\n')
    .replace(/\n+/g, '\n')
    // Remove markdown/extra formatting
    .replace(/\*\*/g, '')
    .replace(/\[.*?\]/g, '')
    // Remove tracking lines (like job board tracking tags)
    .replace(/Please mention the word.*(#.*)?/gi, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:8000/api/jobs/${jobId}/`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch job details');
        }
        return res.json();
      })
      .then(data => {
        // Ensure all required properties exist with defaults
        setJob({
          ...data,
          skills: data.skills || [],
          benefits: data.benefits || [],
          ai_analysis:  {
          matched_skills: data.matched_skills || [],
          missing_skills: data.missing_skills || [],
          explanation: data.explanation || 'No analysis available',
          },
          match_score: data.match_score || 0
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [jobId]);

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getMatchScoreIcon = (score) => {
    if (score >= 90) return '🎯';
    if (score >= 80) return '💡';
    if (score >= 70) return '⚡';
    return '💭';
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="mb-4">Error: {error}</p>
          <Button onClick={() => onNavigate('/jobs')}>Return to Jobs</Button>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No job details found</p>
          <Button onClick={() => onNavigate('/jobs')}>Return to Jobs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('/jobs')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Jobs</span>
            </Button>
            <div className="flex items-center space-x-2">
              <BrainCircuit className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI JobMatch</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  <Badge className={`${getMatchScoreColor(job.match_score)} border`}>
                    {getMatchScoreIcon(job.match_score)} {job.match_score}% Match
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Building className="h-5 w-5" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-5 w-5" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <DollarSign className="h-5 w-5" />
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span>Posted {job.posted}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.skills.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  <Badge variant={job.type === 'Remote' ? 'default' : 'secondary'}>
                    {job.type}
                  </Badge>
                </div>
                <div className="flex space-x-3">
                  <Button className="bg-blue-600 hover:bg-blue-700 flex-1 md:flex-none">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                  <Button variant="outline">Save Job</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {cleanDescription(job.description).split('\n\n').map((para, index) => (
                    <div key={index} className="mb-4">
                      {para.split('\n').map((line, i) => (
                        <div key={i} className={line.startsWith('•') ? 'ml-4' : ''}>{line}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {job.benefits && job.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits &amp; Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-2">
                    {job.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {job.ai_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BrainCircuit className="h-5 w-5 text-blue-600" />
                    <span>AI Match Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${job.match_score >= 90 ? 'text-green-600' : job.match_score >= 80 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {job.match_score}%
                    </div>
                    <p className="text-sm text-gray-600">Overall Match</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Skills You Have</span>
                    </h4>
                    <div className="space-y-1">
                      {job.ai_analysis.matched_skills.map((skill, i) => (
                        <div key={i} className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Skills to Develop</span>
                    </h4>
                    <div className="space-y-1">
                      {job.ai_analysis.missing_skills.map((skill, i) => (
                        <div key={i} className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Why This Match?</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {job.ai_analysis.explanation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}