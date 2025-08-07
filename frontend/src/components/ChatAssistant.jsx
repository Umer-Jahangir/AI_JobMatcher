import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { BrainCircuit, Send, ArrowLeft, User } from 'lucide-react';

const suggestionQuestions = [
  "What skills should I improve for Google SWE role?",
  "How can I transition from frontend to full-stack?",
  "What salary should I expect for my experience level?",
  "How do I prepare for technical interviews?",
  "What are the current trends in web development?"
];

export default function ChatAssistant({ onNavigate, userProfile }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hi! I'm your AI Career Assistant. I'm here to help you with career advice, skill development, interview preparation, and job search strategies.\n\nBased on your profile as a ${userProfile?.role || 'developer'}, I can provide personalized guidance. What would you like to discuss today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getAIResponse = async (userMessage) => {
    try {
      const res = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          user_profile: userProfile || {},
        }),
      });

      const data = await res.json();
      return data.reply || "Sorry, no response received.";
    } catch (err) {
      console.error("AI chat error:", err);
      return "An error occurred while contacting the AI.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const aiText = await getAIResponse(inputValue);

    const aiResponse = {
      id: Date.now() + 1,
      type: 'ai',
      content: aiText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
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
              <span className="text-xl font-bold text-gray-900">AI Career Assistant</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col">
        {/* Suggestions */}
        {messages.length === 1 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Try asking:</h3>
              <div className="grid md:grid-cols-2 gap-2">
                {suggestionQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto p-3 text-wrap"
                    onClick={() => handleSuggestionClick(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-4 mb-6 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={message.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>

                <div className={`rounded-lg p-4 ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm'}`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex space-x-3 max-w-3xl">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gray-100 text-gray-600">
                    <BrainCircuit className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border shadow-sm rounded-lg p-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <Card>
          <CardContent className="p-4">
            <div className="flex space-x-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your career..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
