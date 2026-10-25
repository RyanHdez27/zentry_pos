import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Mail, Zap } from 'lucide-react';
import { authApi } from '../services/api';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('carlos@zentrypos.com');
  const [password, setPassword] = useState('password123');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await authApi.login(email, password);
      onLogin();
    } catch (err: any) {
      // Si la API responde con un error de validación o credenciales de un servidor activo
      if (err?.status === 422 || err?.status === 403 || err?.status === 401) {
        setErrorMessage(err.message || 'Credenciales inválidas');
      } else {
        // En entornos estáticos como GitHub Pages o preview sin backend encendido:
        // Carga transparente del modo demo comercial
        console.info('Entorno estático detectado, iniciando modo demo interactivo...');
        onLogin();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    onLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/10 pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-600/5 pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl leading-none">Zentry POS</div>
              <div className="text-slate-400 text-sm">Sistema empresarial</div>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestiona tu negocio<br />con precisión.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Ventas, inventario, caja, facturación y reportes en una sola plataforma.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: 'Ventas hoy', value: '$2.450.000', change: '+12.5%' },
            { label: 'Clientes', value: '1.245', change: '+3.1%' },
            { label: 'Productos', value: '248', change: '' },
            { label: 'Facturas', value: '1.284', change: '+8.2%' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
              <p className="text-white font-bold text-lg">{stat.value}</p>
              {stat.change && <p className="text-emerald-400 text-xs mt-0.5">{stat.change} este mes</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">Z</span>
            </div>
            <span className="text-slate-900 font-bold text-xl">Zentry POS</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Bienvenido nuevamente</h1>
          <p className="text-slate-500 text-sm mb-6">Ingresa tus credenciales para continuar.</p>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleDemoBypass}
                className="self-end text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Ingresar en modo Demo local &rarr;
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  placeholder="correo@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">Recordarme</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-sm shadow-blue-500/20"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            <button
              type="button"
              onClick={handleDemoBypass}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap size={16} className="text-amber-500" />
              Explorar Demo Interactivo
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            © 2026 Zentry POS. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
