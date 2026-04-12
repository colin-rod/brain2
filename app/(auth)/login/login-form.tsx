'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/inbox');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-north-base">
      <div className="w-full max-w-sm space-y-north-lg">
        <div className="text-center space-y-north-sm">
          <h1 className="text-page-title">Brain2</h1>
          <p className="text-foreground-secondary text-body">
            Turn messy work inputs into structured knowledge
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-north-base">
          <div className="space-y-north-sm">
            <label htmlFor="email" className="text-metadata text-foreground-secondary block">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-north-sm">
            <label htmlFor="password" className="text-metadata text-foreground-secondary block">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-metadata text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? isSignUp
                ? 'Creating account…'
                : 'Signing in…'
              : isSignUp
                ? 'Sign Up'
                : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-metadata text-foreground-muted">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Button
            variant="link"
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="h-auto p-0 align-baseline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Button>
        </p>
      </div>
    </div>
  );
}
