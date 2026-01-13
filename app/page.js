import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[100px]" />

      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            LabHour
          </h1>
          <p className="text-slate-400">Accede a tu panel de gestión</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
