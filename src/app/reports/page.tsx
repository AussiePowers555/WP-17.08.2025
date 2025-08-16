'use client';

import { useState } from 'react';
import { Calendar, Download, TrendingUp, DollarSign, Users, Shield, FileText, Activity } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  lastUpdated: string;
  frequency: string;
  category: string;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '2025-08-01',
    end: '2025-08-16',
  });

  const reports: Report[] = [
    {
      id: '1',
      title: 'Case Summary Report',
      description: 'Overview of all cases including status breakdown, completion rates, and average processing time.',
      icon: <FileText className="w-6 h-6" />,
      lastUpdated: '2 hours ago',
      frequency: 'Monthly',
      category: 'Operations',
    },
    {
      id: '2',
      title: 'Financial Report',
      description: 'Revenue analysis, outstanding payments, collection rates, and financial forecasts.',
      icon: <DollarSign className="w-6 h-6" />,
      lastUpdated: '1 day ago',
      frequency: 'Weekly',
      category: 'Finance',
    },
    {
      id: '3',
      title: 'Workspace Performance',
      description: 'Performance metrics for each workspace including case volume and resolution times.',
      icon: <TrendingUp className="w-6 h-6" />,
      lastUpdated: '3 hours ago',
      frequency: 'Weekly',
      category: 'Performance',
    },
    {
      id: '4',
      title: 'Insurance Claims',
      description: 'Track insurance claim status, approval rates, and settlement amounts.',
      icon: <Shield className="w-6 h-6" />,
      lastUpdated: '5 hours ago',
      frequency: 'Daily',
      category: 'Insurance',
    },
    {
      id: '5',
      title: 'User Activity',
      description: 'User engagement metrics, login frequency, and system usage patterns.',
      icon: <Users className="w-6 h-6" />,
      lastUpdated: '1 hour ago',
      frequency: 'Daily',
      category: 'Users',
    },
    {
      id: '6',
      title: 'Compliance Report',
      description: 'Regulatory compliance status, audit trails, and documentation completeness.',
      icon: <Activity className="w-6 h-6" />,
      lastUpdated: '2 days ago',
      frequency: 'Monthly',
      category: 'Compliance',
    },
  ];

  const handleGenerateReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    alert(`Opening ${report?.title}...`);
  };

  const handleExport = (format: string) => {
    alert(`Generating ${format} report...`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-2 text-gray-600">Generate and view business reports</p>
          </div>
          
          {/* Date Range Picker */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="border-0 focus:ring-0 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="border-0 focus:ring-0 text-sm"
            />
            <button className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
              Apply
            </button>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleGenerateReport(report.id)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                  {report.icon}
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {report.frequency}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{report.description}</p>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Updated: {report.lastUpdated}</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {report.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Report Activity</h2>
          
          {/* Chart Placeholder */}
          <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center text-gray-400 mb-6">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2" />
              <p>Report generation trends over the last 30 days</p>
            </div>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('PDF')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export as PDF
            </button>
            <button
              onClick={() => handleExport('Excel')}
              className="flex items-center gap-2 px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export as Excel
            </button>
            <button
              onClick={() => handleExport('CSV')}
              className="flex items-center gap-2 px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export as CSV
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">156</div>
            <div className="text-sm text-gray-600">Reports Generated</div>
            <div className="text-xs text-green-600 mt-1">+12% this month</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">43</div>
            <div className="text-sm text-gray-600">Scheduled Reports</div>
            <div className="text-xs text-gray-500 mt-1">Next in 2 hours</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">98%</div>
            <div className="text-sm text-gray-600">Accuracy Rate</div>
            <div className="text-xs text-green-600 mt-1">Above target</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">2.3s</div>
            <div className="text-sm text-gray-600">Avg. Generation Time</div>
            <div className="text-xs text-green-600 mt-1">-0.5s improvement</div>
          </div>
        </div>
      </div>
    </div>
  );
}