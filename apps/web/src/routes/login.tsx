import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '@/components/auth/LoginForm';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
