'use client';
import Link from 'next/link';

const plans = [
  { id: 'basic', name: 'Basic', price: 29, features: ['Basic features','Email support','Up to 5 projects'] },
  { id: 'professional', name: 'Professional', price: 99, features: ['All basic','Priority support','Unlimited','Analytics'], popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 299, features: ['All pro','Custom integrations','Dedicated support','SLA'] },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Choose your plan</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map(p => (
          <div key={p.id} className="rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              {p.popular && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Popular</span>}
            </div>
            <div className="text-3xl font-bold my-4">${p.price}/mo</div>
            <ul className="text-sm space-y-1 mb-4">{p.features.map(f => <li key={f}>• {f}</li>)}</ul>
            <Link href={`/api/subscribe/${p.id}`} className="inline-block rounded bg-blue-600 text-white px-4 py-2">
              Start 14-day trial
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
