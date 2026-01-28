import { createFileRoute, redirect } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useLogin } from '@/hooks/queries/useAuth';
import { loginSchema, type LoginInput } from '@/schemas/auth.schema';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginForm() {
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login.mutateAsync(data);
      toast.success('Bem-vindo de volta!');
      navigate({ to: '/' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Credenciais inválidas';
      toast.error('Falha no login', { description: message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nome@exemplo.com"
          autoComplete="email"
          className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 transition-all focus:border-[#8b5cf6] focus:bg-white focus:ring-2 focus:ring-[#8b5cf6]/20"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Digite sua senha"
          autoComplete="current-password"
          className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 transition-all focus:border-[#8b5cf6] focus:bg-white focus:ring-2 focus:ring-[#8b5cf6]/20"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-xl bg-linear-to-r from-[#8b5cf6] to-[#a78bfa] text-base font-semibold shadow-lg shadow-[#8b5cf6]/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-[#8b5cf6]/30"
        disabled={login.isPending}
      >
        {login.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Entrar
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link
          to="/register"
          className="font-semibold text-[#8b5cf6] hover:text-[#7c3aed] hover:underline"
        >
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}

function LoginPage() {
  return (
    <AuthLayout
      theme="purple"
      title="Bem-vindo de volta"
      subtitle="Digite suas credenciais para acessar sua conta"
      mobileCta="Fazer Login"
      mobileLink={{ to: '/register', label: 'Criar uma conta' }}
      illustrationType="tasks"
      illustrationTitle="Organize suas tarefas"
      illustrationSubtitle="Gerencie seus projetos de forma simples e eficiente com o TaskFlow"
    >
      <LoginForm />
    </AuthLayout>
  );
}
