'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Clock, BarChart3, PieChart, Activity } from 'lucide-react';

interface KPI {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

interface ActivityItem {
  id: string;
  type: 'case' | 'payment' | 'user' | 'report';
  title: string;
  time: string;
  icon: string;
}

export default function AnalyticsPage() {
  const kpis: KPI[] = [
    {
      label: 'Total Revenue',
      value: '$124,586',
      change: 12.5,
      changeLabel: 'from last month',
      trend: 'up',
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      label: 'Active Cases',
      value: 47,
      change: 8,
      changeLabel: 'new this week',
      trend: 'up',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: 'Completion Rate',
      value: '94.2%',
      change: 2.1,
      changeLabel: 'improvement',
      trend: 'up',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      label: 'Avg Resolution Time',
      value: '3.2 days',
      change: 0.5,
      changeLabel: 'days faster',
      trend: 'down',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: 'Customer Satisfaction',
      value: '4.8/5',
      change: 0.2,
      changeLabel: 'points increase',
      trend: 'up',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Active Users',
      value: 89,
      change: -3,
      changeLabel: 'less than yesterday',
      trend: 'down',
      icon: <Users className="w-5 h-5" />,
    },
  ];

  const recentActivity: ActivityItem[] = [
    { id: '1', type: 'case', title: 'New case MOCK-005 created', time: '2 minutes ago', icon: '📊' },
    { id: '2', type: 'case', title: 'Case MOCK-004 completed', time: '1 hour ago', icon: '✅' },
    { id: '3', type: 'payment', title: 'Payment received: $2,450', time: '3 hours ago', icon: '💰' },
    { id: '4', type: 'user', title: 'New user registered', time: '5 hours ago', icon: '👤' },
    { id: '5', type: 'report', title: 'Report generated: Monthly Summary', time: 'Yesterday', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Real-time business intelligence and metrics</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {kpis.map((kpi, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600"></div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className="p-2 bg-gray-50 rounded-lg">
                  {kpi.icon}
                </div>
              </div>
              
              <div className="text-2xl font-bold text-gray-900 mb-2">{kpi.value}</div>
              
              <div className={`flex items-center gap-1 text-sm ${
                kpi.trend === 'up' && kpi.change > 0 ? 'text-green-600' : 
                kpi.trend === 'down' && kpi.change < 0 ? 'text-red-600' : 
                'text-green-600'
              }`}>
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(kpi.change)}{typeof kpi.change === 'number' && kpi.change > 0 ? '%' : ''} {kpi.changeLabel}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Volume Trend</h3>
            <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Line Chart: Case volume over the last 30 days</p>
              </div>
            </div>
            
            {/* Mini Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">247</div>
                <div className="text-xs text-gray-600">Total Cases</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">82%</div>
                <div className="text-xs text-gray-600">On Time</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">15</div>
                <div className="text-xs text-gray-600">Pending Review</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Revenue by Workspace */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Workspace</h3>
            <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Bar Chart: Revenue breakdown by workspace</p>
              </div>
            </div>
          </div>

          {/* Case Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Status Distribution</h3>
            <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-2" />
                <p>Pie Chart: Active vs Completed vs Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2" />
              <p>Heat Map: Performance metrics across different time periods</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}