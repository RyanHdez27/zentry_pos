<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyModule
{
    private const MODULES = [
        'products' => ['products'], 'categories' => ['products'],
        'inventory' => ['inventory'], 'customers' => ['customers'],
        'cash-sessions' => ['cash'], 'sales' => ['pos', 'invoices'],
        'dashboard' => ['dashboard'], 'reports' => ['reports'],
        'audit' => ['audit'], 'users' => ['users'], 'company' => ['settings'],
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) return $next($request);
        if ($user->role === 'superadmin') {
            return in_array($request->segment(3), ['companies', 'superadmin'], true)
                ? $next($request)
                : response()->json(['success' => false, 'message' => 'El superadmin administra tenants desde la consola global.'], 403);
        }
        if ($user->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'La cuenta está inactiva. Contacta al administrador.'], 403);
        }

        $segment = $request->segment(3);
        $modules = self::MODULES[$segment] ?? null;
        if (! $modules) return $next($request);
        if ($segment === 'sales' && $request->isMethod('POST')) $modules = ['pos'];

        $company = $user->company;
        if ($company?->status === 'suspended') {
            return response()->json(['success' => false, 'message' => 'El acceso de esta empresa está suspendido.'], 403);
        }
        if (! $company || ! array_intersect($modules, $company->modules ?? self::defaultModules())) {
            return response()->json(['success' => false, 'message' => 'Este módulo no está habilitado para la empresa.'], 403);
        }

        return $next($request);
    }

    public static function defaultModules(): array
    {
        return ['dashboard', 'pos', 'products', 'inventory', 'customers', 'cash', 'invoices', 'reports', 'users', 'roles', 'settings', 'audit'];
    }
}
