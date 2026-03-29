import LoginForm from './login-form';

// Force dynamic rendering — Supabase client needs runtime env vars
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginForm />;
}
