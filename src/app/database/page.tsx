'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TableInfo {
  name: string;
  records: number;
  size: string;
  lastModified: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([
    { name: 'cases', records: 247, size: '4.2 MB', lastModified: '2 minutes ago', status: 'active' },
    { name: 'workspaces', records: 15, size: '1.8 MB', lastModified: '1 hour ago', status: 'active' },
    { name: 'users', records: 89, size: '2.1 MB', lastModified: '15 minutes ago', status: 'active' },
    { name: 'interactions', records: 1496, size: '8.7 MB', lastModified: '5 minutes ago', status: 'active' },
    { name: 'contacts', records: 234, size: '3.4 MB', lastModified: '3 hours ago', status: 'active' },
  ]);

  const [dbStats] = useState({
    status: 'Online',
    totalTables: 12,
    totalRecords: 1847,
    dbSize: '24.5 MB',
    capacity: 78,
  });

  const handleBackup = () => {
    alert('Database backup initiated. This may take a few minutes.');
  };

  const handleOptimize = () => {
    alert('Optimizing database tables...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="mt-2 text-gray-600">Monitor and manage your PostgreSQL database</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase">Database Status</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{dbStats.status}</div>
            <div className="mt-1 text-sm text-green-600">✓ Connected</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase">Total Tables</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{dbStats.totalTables}</div>
            <div className="mt-1 text-sm text-gray-600">+2 this month</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase">Total Records</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{dbStats.totalRecords.toLocaleString()}</div>
            <div className="mt-1 text-sm text-gray-600">+156 today</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase">Database Size</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{dbStats.dbSize}</div>
            <div className="mt-1 text-sm text-gray-600">{dbStats.capacity}% capacity</div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Database Tables</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map((table) => (
                  <tr key={table.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{table.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{table.records.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{table.size}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{table.lastModified}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        table.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {table.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Queries */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Queries</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="bg-gray-50 p-4 rounded-md font-mono text-sm text-gray-700">
              SELECT * FROM cases WHERE status = 'active' ORDER BY created_at DESC LIMIT 10;
            </div>
            <div className="bg-gray-50 p-4 rounded-md font-mono text-sm text-gray-700">
              UPDATE workspaces SET last_accessed = NOW() WHERE id = '550e8400-e29b-41d4';
            </div>
            <div className="bg-gray-50 p-4 rounded-md font-mono text-sm text-gray-700">
              INSERT INTO interactions (case_id, user_id, type, description) VALUES (...);
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Database Actions</h2>
          </div>
          <div className="p-6 flex flex-wrap gap-3">
            <button
              onClick={handleBackup}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Backup Database
            </button>
            <button
              onClick={() => alert('Opening query console...')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Query Console
            </button>
            <button
              onClick={handleOptimize}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Optimize Tables
            </button>
            <button
              onClick={() => confirm('Are you sure you want to clear cache?') && alert('Cache cleared')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}