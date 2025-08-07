import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from './ui/button';
import { BrainCircuit, Target, Users, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <BrainCircuit className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI JobMatch</span>
            </div>
            <div className="space-x-4">
              {!isAuthenticated && (
                <Button variant="ghost" onClick={() => loginWithRedirect()}>
                  Login
                </Button>
              )}
              <Button onClick={() => loginWithRedirect()}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Find Your Perfect Job with AI
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Smart job recommendations based on your skills, experience, and career goals. 
              Let our AI assistant guide you to your dream career.
            </p>
            <div className="space-x-4">
              <Button 
                size="lg" 
                onClick={() => loginWithRedirect()} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose AI JobMatch?
            </h2>
            <p className="text-xl text-gray-600">
              Advanced AI technology meets personalized career guidance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
              <p className="text-gray-600">
                Our AI analyzes your skills and experience to find the perfect job matches with accuracy scores.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Career Assistant</h3>
              <p className="text-gray-600">
                Get personalized career advice and guidance through our AI-powered chat assistant.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Growth Tracking</h3>
              <p className="text-gray-600">
                Track your career progress and get recommendations for skill development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Dream Job?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who found their perfect career match
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => loginWithRedirect()}>
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BrainCircuit className="h-6 w-6" />
            <span className="font-semibold">AI JobMatch</span>
          </div>
          <p className="text-gray-400">
            © 2025 AI JobMatch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}