import { createFileRoute, redirect } from '@tanstack/react-router';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <RegisterForm />
    </div>
  );
}
