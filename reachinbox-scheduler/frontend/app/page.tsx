'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API, api } from '@/lib/api';
import { GoogleIcon } from '@/components/icons';
import { Input } from '@/components/ui/Input';

export default function Login() {
  const router = useRouter();
  const [note, setNote] = useState('');
  useEffect(() => {
    api.me().then(() => router.replace('/dashboard')).catch(() => {});
    if (new URLSearchParams(window.location.search).get('error')) setNote('Google sign-in failed. Try again.');
  }, [router]);
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line p-8">
        <h1 className="mb-6 text-center text-xl font-semibold">Login</h1>
        <a href={`${API}/auth/google`} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-soft py-2.5 text-sm font-medium hover:bg-brand-soft/70">
          <GoogleIcon />Login with Google</a>
        <p className="my-4 text-center text-[11px] text-mute">or sign up through email</p>
        <div className="space-y-3">
          <Input type="email" placeholder="Email ID" aria-label="Email ID" />
          <Input type="password" placeholder="Password" aria-label="Password" />
          <button onClick={() => setNote('Email login is not enabled. Use Login with Google.')} className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark">Login</button>
        </div>
        {note && <p role="alert" className="mt-3 text-center text-xs text-red-600">{note}</p>}
      </div>
    </main>
  );
}
