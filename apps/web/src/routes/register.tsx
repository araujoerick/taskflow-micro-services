import { createFileRoute, redirect } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useRegister } from '@/hooks/queries/useAuth';
import { registerSchema, type RegisterInput } from '@/schemas/auth.schema';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: RegisterPage,
});

function RegisterForm() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success('Conta criada com sucesso!', {
        description: 'Por favor, faça login com suas credenciais.',
      });
      navigate({ to: '/login' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha no cadastro';
      toast.error('Falha no cadastro', { description: message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input
          id="name"
          type="text"
          placeholder="João Silva"
          autoComplete="name"
          className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 transition-all focus:border-[#8b5cf6] focus:bg-white focus:ring-2 focus:ring-[#8b5cf6]/20"
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

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
          placeholder="Crie uma senha forte"
          autoComplete="new-password"
          className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 transition-all focus:border-[#8b5cf6] focus:bg-white focus:ring-2 focus:ring-[#8b5cf6]/20"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        <p className="text-xs text-muted-foreground">Deve ter pelo menos 8 caracteres.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirme sua senha"
          autoComplete="new-password"
          className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 transition-all focus:border-[#8b5cf6] focus:bg-white focus:ring-2 focus:ring-[#8b5cf6]/20"
          {...register('confirmPassword')}
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-xl bg-linear-to-r from-[#8b5cf6] to-[#a78bfa] text-base font-semibold shadow-lg shadow-[#8b5cf6]/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-[#8b5cf6]/30"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Criar conta
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link
          to="/login"
          className="font-semibold text-[#8b5cf6] hover:text-[#7c3aed] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}

function RegisterPage() {
  return (
    <AuthLayout
      theme="green"
      title="Criar uma conta"
      subtitle="Digite suas informações para começar"
      mobileCta="Criar Conta"
      mobileLink={{ to: '/login', label: 'Já tenho uma conta' }}
      illustrationType="dashboard"
      illustrationTitle="Comece sua jornada"
      illustrationSubtitle="Crie sua conta gratuita e transforme a forma como você gerencia suas tarefas"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
