'use client';

import { useState } from 'react';
import { Mail, Phone, Users, FileText, Plus, Filter, Search, Calendar, MessageSquare } from 'lucide-react';

interface Interaction {
  id: string;
  type: 'email' | 'phone' | 'meeting' | 'note';
  title: string;
  caseNumber: string;
  description: string;
  participants: string[];
  timestamp: string;
  status?: 'pending' | 'completed' | 'follow-up';
}

export default function InteractionsPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const interactions: Interaction[] = [
    {
      id: '1',
      type: 'email',
      title: 'Email - Settlement Confirmation',
      caseNumber: 'MOCK-003',
      description: 'Sent settlement agreement to client Lisa Chen. Awaiting signature on the settlement documents. Follow-up scheduled for tomorrow if no response.',
      participants: ['Lisa Chen', 'Legal Team'],
      timestamp: '10 minutes ago',
      status: 'pending',
    },
    {
      id: '2',
      type: 'phone',
      title: 'Phone Call - Insurance Update',
      caseNumber: 'MOCK-002',
      description: 'Spoke with insurance adjuster regarding claim #INS-2024-789. They confirmed coverage approval for the full amount. Documentation to be sent within 48 hours.',
      participants: ['James Wilson', 'ABC Insurance'],
      timestamp: '2 hours ago',
      status: 'completed',
    },
    {
      id: '3',
      type: 'meeting',
      title: 'Meeting - Case Review',
      caseNumber: '2025-001',
      description: 'Quarterly review meeting with John Smith and legal counsel. Discussed case progress, upcoming depositions, and settlement strategy. Next meeting scheduled for next month.',
      participants: ['John Smith', 'Davis Legal', 'Internal Team'],
      timestamp: 'Yesterday at 3:00 PM',
      status: 'completed',
    },
    {
      id: '4',
      type: 'note',
      title: 'Internal Note - Documentation',
      caseNumber: 'MOCK-004',
      description: 'Received all required documentation from David Rodriguez. Police report, medical records, and witness statements have been uploaded to case file. Ready for legal review.',
      participants: ['David Rodriguez', 'Admin Team'],
      timestamp: '2 days ago',
      status: 'completed',
    },
    {
      id: '5',
      type: 'email',
      title: 'Email - Payment Reminder',
      caseNumber: 'TEST-002',
      description: 'Sent payment reminder to Test Client 002 regarding outstanding balance. Payment terms expire in 7 days. Automated follow-up scheduled if no response within 48 hours.',
      participants: ['Test Client 002', 'Billing Dept'],
      timestamp: '3 days ago',
      status: 'follow-up',
    },
    {
      id: '6',
      type: 'phone',
      title: 'Phone Call - Initial Consultation',
      caseNumber: 'NEW-001',
      description: 'Initial consultation call with potential client regarding motorcycle accident. Gathered preliminary information and scheduled in-person meeting for detailed case assessment.',
      participants: ['New Client', 'Intake Team'],
      timestamp: '4 days ago',
      status: 'follow-up',
    },
    {
      id: '7',
      type: 'meeting',
      title: 'Meeting - Settlement Negotiation',
      caseNumber: 'MOCK-001',
      description: 'Settlement negotiation meeting with opposing counsel. Reached preliminary agreement on compensation amount. Final documentation to be prepared by legal team.',
      participants: ['Client Attorney', 'Opposing Counsel', 'Mediator'],
      timestamp: '5 days ago',
      status: 'pending',
    },
  ];

  const filteredInteractions = interactions.filter(interaction => {
    const matchesType = filterType === 'all' || interaction.type === filterType;
    const matchesSearch = interaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          interaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          interaction.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'phone':
        return <Phone className="w-5 h-5" />;
      case 'meeting':
        return <Users className="w-5 h-5" />;
      case 'note':
        return <FileText className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-600';
      case 'phone':
        return 'bg-purple-100 text-purple-600';
      case 'meeting':
        return 'bg-green-100 text-green-600';
      case 'note':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      'follow-up': 'bg-blue-100 text-blue-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interactions</h1>
            <p className="mt-2 text-gray-600">Track all communication and activities</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
            <Plus className="w-5 h-5" />
            Add Interaction
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search interactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('email')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'email' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Emails
              </button>
              <button
                onClick={() => setFilterType('phone')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'phone' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Calls
              </button>
              <button
                onClick={() => setFilterType('meeting')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'meeting' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Meetings
              </button>
              <button
                onClick={() => setFilterType('note')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'note' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Notes
              </button>
            </div>
          </div>
        </div>

        {/* Interactions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredInteractions.map((interaction) => (
              <div
                key={interaction.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${getInteractionColor(interaction.type)}`}>
                    {getInteractionIcon(interaction.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {interaction.title}
                        </h3>
                        <p className="text-sm text-indigo-600">
                          Case #{interaction.caseNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(interaction.status)}
                        <span className="text-sm text-gray-500">
                          {interaction.timestamp}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">
                      {interaction.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {interaction.participants.map((participant, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {participant}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">142</p>
                <p className="text-sm text-gray-600">Total Interactions</p>
              </div>
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">23</p>
                <p className="text-sm text-gray-600">Pending Follow-ups</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">4.2h</p>
                <p className="text-sm text-gray-600">Avg Response Time</p>
              </div>
              <Phone className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">89%</p>
                <p className="text-sm text-gray-600">Resolution Rate</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}