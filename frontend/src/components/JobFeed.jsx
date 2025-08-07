import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BrainCircuit, MapPin, Calendar, Search, Filter, MessageCircle, User, LogOut } from 'lucide-react';

export default function JobFeed({ onNavigate, userProfile }) {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('match');
  const [filterLocation, setFilterLocation] = useState('all');

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch(`http://localhost:8000/api/redis-matched-jobs/${userProfile.id}/`);
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    }
    fetchJobs();
  }, []);

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getMatchScoreIcon = (score) => {
    if (score >= 90) return '🎯';
    if (score >= 80) return '💡';
    if (score >= 70) return '⚡';
    return '💭';
  };

  const filteredAndSortedJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = filterLocation === 'all' || job.location.includes(filterLocation);
      return matchesSearch && matchesLocation;
    })
    .sort((a, b) => {
      if (sortBy === 'match') return b.match_score - a.match_score;
      if (sortBy === 'date') return new Date(b.posted) - new Date(a.posted);
      return 0;
    });

const cleanDescription = (text) => {
  if (!text) return 'No description available';

  return text
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode basic HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Replace corrupted UTF-8 symbols with normal equivalents
    .replace(/â/g, "'")
    .replace(/â/g, '"')
    .replace(/â/g, '"')
    .replace(/â¦/g, '...')
    .replace(/â/g, '-')
    .replace(/â”/g, '—')
    .replace(/â¢/g, '•')
    // Fix \n formatting
    .replace(/\\n/g, '\n')
    .replace(/\n+/g, '\n')
    // Remove bold markdown **text**
    .replace(/\*\*/g, '')
    // Remove markdown-style links [text](url)
    .replace(/\[.*?\]\(.*?\)/g, '')
    // Remove leftover square brackets
    .replace(/\[.*?\]/g, '')
    // Remove job board tracking lines or junk
    .replace(/Please mention the word.*(#.*)?/gi, '')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    .trim();
};



  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <BrainCircuit className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI JobMatch</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => onNavigate('/chat')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/account')} className="relative group">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">{userProfile?.role || 'User'}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/')} className="relative group">
                <LogOut className="h-4 w-4" />
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Logout
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recommended Jobs for You</h1>
          <p className="text-gray-600">
            {userProfile?.skills ? 
              `Based on your skills: ${userProfile.skills.slice(0, 3).join(', ')}${userProfile.skills.length > 3 ? '...' : ''}` :
              'Personalized job recommendations powered by AI'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search jobs, companies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="date">Most Recent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {[...new Set(jobs.map(job => job.location))].map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAndSortedJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <Badge className={`${getMatchScoreColor(job.match_score)} border-0`}>
                        {getMatchScoreIcon(job.match_score)} {job.match_score}% Match
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 text-gray-600 mb-3">
                      <span className="font-medium">{job.company}</span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{job.posted}</span>
                      </div>
                    </div>

                    <div className="text-gray-600 mb-4">
                      <p className="whitespace-pre-line">
                        {cleanDescription(job.description)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-green-600">{job.salary}</span>
                        <Badge variant={job.type === 'Remote' ? 'default' : 'secondary'}>{job.type}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => onNavigate('/job-detail', job.id)} className="bg-blue-600 hover:bg-blue-700">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAndSortedJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}