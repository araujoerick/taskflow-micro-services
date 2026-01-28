import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { CheckCircle2, Zap, Shield, Sparkles, Users, BarChart3, Calendar } from 'lucide-react';

type ColorTheme = 'purple' | 'green';

interface AuthLayoutProps {
  children: ReactNode;
  theme: ColorTheme;
  title: string;
  subtitle: string;
  mobileLink: { to: '/login' | '/register'; label: string };
  illustrationType: 'tasks' | 'dashboard';
  illustrationTitle: string;
  illustrationSubtitle: string;
}

const themeConfig = {
  purple: {
    gradient: 'from-[#8b5cf6] via-[#a78bfa] to-[#c4b5fd]',
    iconBg: 'from-[#8b5cf6] to-[#a78bfa]',
    iconColor: 'text-[#8b5cf6]',
    shadow: 'shadow-[#8b5cf6]/25',
  },
  green: {
    gradient: 'from-[#22c55e] via-[#4ade80] to-[#86efac]',
    iconBg: 'from-[#22c55e] to-[#4ade80]',
    iconColor: 'text-[#22c55e]',
    shadow: 'shadow-[#22c55e]/25',
  },
};

function FloatingDots() {
  return (
    <>
      <div className="absolute left-8 top-12 animate-bounce">
        <div className="h-4 w-4 rounded-full bg-[#22c55e]" />
      </div>
      <div className="absolute right-16 top-24 animate-bounce delay-150">
        <div className="h-3 w-3 rounded-full bg-[#ec4899]" />
      </div>
      <div className="absolute bottom-32 left-16 animate-bounce delay-300">
        <div className="h-5 w-5 rounded-full bg-[#f97316]" />
      </div>
      <div className="absolute bottom-48 right-12 animate-bounce delay-500">
        <div className="h-3 w-3 rounded-full bg-white/60" />
      </div>
    </>
  );
}

function BackgroundBlurs() {
  return (
    <>
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#22c55e]/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#ec4899]/20 blur-3xl" />
      <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-[#f97316]/20 blur-2xl" />
    </>
  );
}

function FeaturePills({ variant }: { variant: 'login' | 'register' }) {
  const pills =
    variant === 'login'
      ? [
          { icon: Sparkles, label: 'Simples', color: 'text-[#f97316]' },
          { icon: Zap, label: 'Rápido', color: 'text-[#22c55e]' },
          { icon: Shield, label: 'Seguro', color: 'text-[#ec4899]' },
        ]
      : [
          { icon: Sparkles, label: 'Gratuito', color: 'text-[#8b5cf6]' },
          { icon: Zap, label: 'Ilimitado', color: 'text-[#f97316]' },
          { icon: Shield, label: 'Privado', color: 'text-[#ec4899]' },
        ];

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {pills.map(({ icon: Icon, label, color }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm"
        >
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
      ))}
    </div>
  );
}

function TasksIllustration() {
  return (
    <div className="relative">
      <div className="relative h-48 w-64 rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#8b5cf6] to-[#a78bfa]">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="h-3 w-24 rounded-full bg-gray-200" />
            <div className="mt-2 h-2 w-16 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="space-y-3">
          {[
            { color: 'border-[#22c55e] bg-[#22c55e]/20', width: 'w-32' },
            { color: 'border-[#8b5cf6] bg-[#8b5cf6]/20', width: 'w-28' },
            { color: 'border-[#ec4899] bg-[#ec4899]/20', width: 'w-36' },
          ].map(({ color, width }, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded border-2 ${color}`} />
              <div className={`h-2 ${width} rounded-full bg-gray-200`} />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -right-8 -top-4 h-16 w-16 rotate-12 rounded-2xl bg-[#22c55e] p-3 shadow-lg">
        <Zap className="h-full w-full text-white" />
      </div>
      <div className="absolute -bottom-6 -left-6 h-14 w-14 -rotate-12 rounded-2xl bg-[#ec4899] p-3 shadow-lg">
        <Shield className="h-full w-full text-white" />
      </div>
    </div>
  );
}

function DashboardIllustration() {
  const bars = [
    { h: 'h-12', color: 'from-[#8b5cf6] to-[#a78bfa]' },
    { h: 'h-16', color: 'from-[#22c55e] to-[#4ade80]' },
    { h: 'h-10', color: 'from-[#ec4899] to-[#f472b6]' },
    { h: 'h-20', color: 'from-[#f97316] to-[#fb923c]' },
    { h: 'h-14', color: 'from-[#8b5cf6] to-[#a78bfa]' },
    { h: 'h-8', color: 'from-[#22c55e] to-[#4ade80]' },
  ];

  return (
    <div className="relative">
      <div className="relative h-52 w-72 rounded-3xl bg-white/95 p-5 shadow-2xl backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-[#22c55e] to-[#4ade80]">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="h-2 w-16 rounded-full bg-gray-200" />
          </div>
          <div className="flex gap-1">
            {['bg-[#22c55e]', 'bg-[#8b5cf6]', 'bg-[#ec4899]'].map((bg, i) => (
              <div key={i} className={`h-2 w-2 rounded-full ${bg}`} />
            ))}
          </div>
        </div>
        <div className="mb-4 flex items-end justify-between gap-2 px-2">
          {bars.map(({ h, color }, i) => (
            <div key={i} className={`${h} w-6 rounded-t-lg bg-linear-to-t ${color}`} />
          ))}
        </div>
        <div className="flex justify-between">
          {[
            { value: '24', label: 'Tarefas', color: 'text-gray-800' },
            { value: '18', label: 'Concluídas', color: 'text-[#22c55e]' },
            { value: '6', label: 'Pendentes', color: 'text-[#8b5cf6]' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center">
              <div className={`text-lg font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -right-6 -top-6 h-14 w-14 rotate-12 rounded-2xl bg-[#8b5cf6] p-3 shadow-lg">
        <Users className="h-full w-full text-white" />
      </div>
      <div className="absolute -bottom-4 -left-8 h-16 w-16 -rotate-12 rounded-2xl bg-[#f97316] p-3 shadow-lg">
        <Calendar className="h-full w-full text-white" />
      </div>
    </div>
  );
}

function AuthIllustration({
  type,
  title,
  subtitle,
  theme,
}: {
  type: 'tasks' | 'dashboard';
  title: string;
  subtitle: string;
  theme: ColorTheme;
}) {
  const config = themeConfig[theme];

  return (
    <div
      className={`relative flex h-full flex-col items-center justify-center overflow-hidden bg-linear-to-br ${config.gradient} p-8 md:p-12`}
    >
      <BackgroundBlurs />
      <FloatingDots />

      <div className="relative z-10 text-center">
        <div className="mb-8 flex justify-center">
          {type === 'tasks' ? <TasksIllustration /> : <DashboardIllustration />}
        </div>

        <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">{title}</h1>
        <p className="mx-auto max-w-sm text-base text-white/80 md:text-lg">{subtitle}</p>

        <FeaturePills variant={type === 'tasks' ? 'login' : 'register'} />
      </div>
    </div>
  );
}

export function AuthLayout({
  children,
  theme,
  title,
  subtitle,
  mobileLink,
  illustrationType,
  illustrationTitle,
  illustrationSubtitle,
}: AuthLayoutProps) {
  const config = themeConfig[theme];

  return (
    <div className="min-h-screen">
      {/* Mobile */}
      <div className={`flex min-h-screen flex-col overflow-hidden bg-linear-to-br ${config.gradient} md:hidden`}>
        <div className="relative flex flex-col items-center px-6 pt-12">
          <BackgroundBlurs />
          <div className="relative z-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl">
              <CheckCircle2 className={`h-8 w-8 ${config.iconColor}`} />
            </div>
            <h1 className="text-2xl font-bold text-white">TaskFlow</h1>
            <p className="mt-1 text-sm text-white/80">{illustrationTitle}</p>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex-1 rounded-t-3xl bg-white px-6 pb-8 pt-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          {children}
          <div className="mt-6 text-center">
            <Link
              to={mobileLink.to}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
            >
              {mobileLink.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden min-h-screen md:grid md:grid-cols-2">
        <AuthIllustration
          type={illustrationType}
          title={illustrationTitle}
          subtitle={illustrationSubtitle}
          theme={theme}
        />

        <div className="flex flex-col items-center justify-center bg-white p-8 md:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${config.iconBg} shadow-lg ${config.shadow}`}
              >
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              <p className="mt-2 text-gray-500">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
