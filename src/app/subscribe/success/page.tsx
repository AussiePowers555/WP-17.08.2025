'use client';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const params = useSearchParams();
  const plan = params.get('plan');
  const sessionId = params.get('session_id');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Subscription Activated</h1>
      <p className="mt-2">Thanks! Your {plan} plan is now active.</p>
      <p className="mt-2 text-sm text-muted-foreground">Session: {sessionId}</p>
    </div>
  );
}
