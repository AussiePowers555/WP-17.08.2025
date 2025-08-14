'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugDatabasePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDatabaseTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/database-test');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/run-migration', {
        method: 'POST',
      });
      const data = await response.json();
      setMigrationResult(data);
      // Run test again to see updated state
      await runDatabaseTest();
    } catch (error) {
      setMigrationResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Debug Tools</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Database Column Check</CardTitle>
            <CardDescription>
              Check if is_deleted and deleted_at columns exist in the cases table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runDatabaseTest} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Running...' : 'Run Database Test'}
            </Button>
            
            {testResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Migration</CardTitle>
            <CardDescription>
              Force migration to add is_deleted columns if they don't exist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runMigration} 
              disabled={loading}
              variant="destructive"
              className="mb-4"
            >
              {loading ? 'Running...' : 'Run Migration (Use with caution)'}
            </Button>
            
            {migrationResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(migrationResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}