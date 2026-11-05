<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\UpdateCompanyRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\InventoryMovement;
use App\Models\CashMovement;

class CompanyController extends Controller
{
    private const AVAILABLE_MODULES = ['dashboard', 'pos', 'products', 'inventory', 'customers', 'cash', 'invoices', 'reports', 'users', 'roles', 'settings', 'audit'];

    public function dashboard(): JsonResponse
    {
        $companies = Company::withCount(['users', 'sales'])->orderBy('name')->get();
        $products = Product::query()->selectRaw('company_id, count(*) as total')->groupBy('company_id')->pluck('total', 'company_id');
        $customers = Customer::query()->selectRaw('company_id, count(*) as total')->groupBy('company_id')->pluck('total', 'company_id');
        $sales = Sale::query()->selectRaw('company_id, count(*) as total, coalesce(sum(total), 0) as revenue')->where('status', 'completed')->groupBy('company_id')->get()->keyBy('company_id');
        $companies->each(function (Company $company) use ($products, $customers, $sales) {
            $company->products_count = (int) ($products[$company->id] ?? 0);
            $company->customers_count = (int) ($customers[$company->id] ?? 0);
            $company->sales_count = (int) ($sales[$company->id]->total ?? 0);
            $company->sales_total = (float) ($sales[$company->id]->revenue ?? 0);
        });

        return response()->json(['success' => true, 'data' => [
            'summary' => [
                'companies' => $companies->count(),
                'active_companies' => $companies->where('status', 'active')->count(),
                'users' => $companies->sum('users_count'),
                'products' => $companies->sum('products_count'),
                'sales' => $companies->sum('sales_count'),
                'revenue' => $companies->sum('sales_total'),
            ],
            'companies' => $companies,
        ]]);
    }

    public function index(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Company::withCount('users')->orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'legal_name' => ['nullable', 'string', 'max:150'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'currency' => ['required', 'string', 'max:10'],
            'default_tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'invoice_prefix' => ['required', 'string', 'max:10'],
            'modules' => ['sometimes', 'array'],
            'modules.*' => ['string', Rule::in(self::AVAILABLE_MODULES)],
            'admin.name' => ['required', 'string', 'max:120'],
            'admin.email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'admin.password' => ['required', 'string', 'min:10'],
        ]);

        $company = DB::transaction(function () use ($data) {
            $company = Company::create(array_merge(collect($data)->except('admin')->all(), [
                'modules' => $data['modules'] ?? self::AVAILABLE_MODULES,
            ]));
            $company->users()->create([
                'name' => $data['admin']['name'],
                'email' => $data['admin']['email'],
                'password' => $data['admin']['password'],
                'role' => 'admin',
                'status' => 'active',
            ]);
            return $company->loadCount('users');
        });

        return response()->json(['success' => true, 'message' => 'Empresa y administrador creados.', 'data' => $company], 201);
    }

    public function superadminUpdate(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'legal_name' => ['nullable', 'string', 'max:150'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'currency' => ['sometimes', 'required', 'string', 'max:10'],
            'default_tax_rate' => ['sometimes', 'required', 'numeric', 'min:0', 'max:100'],
            'invoice_prefix' => ['sometimes', 'required', 'string', 'max:10'],
            'status' => ['sometimes', Rule::in(['active', 'suspended'])],
            'modules' => ['sometimes', 'array'],
            'modules.*' => ['string', Rule::in(self::AVAILABLE_MODULES)],
        ]);
        $company->update($data);
        return response()->json(['success' => true, 'data' => $company->fresh()->loadCount('users')]);
    }

    public function destroy(Company $company): JsonResponse
    {
        DB::transaction(function () use ($company) {
            $company->users()->delete();
            $company->delete();
        });
        return response()->json(['success' => true, 'message' => 'Empresa y sus datos fueron eliminados.']);
    }

    public function users(Company $company): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $company->users()->where('role', '!=', 'superadmin')->orderBy('name')->get()]);
    }

    public function audit(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate(['date_from' => ['nullable', 'date'], 'date_to' => ['nullable', 'date'], 'user_id' => ['nullable', 'integer']]);
        $filter = function ($query) use ($data) {
            if (!empty($data['date_from'])) $query->whereDate('created_at', '>=', $data['date_from']);
            if (!empty($data['date_to'])) $query->whereDate('created_at', '<=', $data['date_to']);
            if (!empty($data['user_id'])) $query->where('user_id', $data['user_id']);
        };
        $sales = Sale::where('company_id', $company->id)->with('user:id,name')->tap($filter)->latest()->limit(50)->get()->map(fn ($s) => ['id' => 'sale-'.$s->id, 'user' => $s->user?->name, 'action' => $s->status === 'cancelled' ? 'Venta anulada' : 'Venta procesada', 'detail' => $s->invoice_number.' · $'.number_format((float)$s->total, 0, ',', '.'), 'created_at' => $s->created_at]);
        $inventory = InventoryMovement::where('company_id', $company->id)->with(['user:id,name','product:id,name'])->tap($filter)->latest()->limit(50)->get()->map(fn ($m) => ['id' => 'inventory-'.$m->id, 'user' => $m->user?->name, 'action' => 'Inventario: '.$m->type, 'detail' => ($m->product?->name ?? 'Producto').' · '.$m->quantity.' uds · '.($m->reason ?? ''), 'created_at' => $m->created_at]);
        $cash = CashMovement::where('company_id', $company->id)->with('user:id,name')->tap($filter)->latest()->limit(50)->get()->map(fn ($m) => ['id' => 'cash-'.$m->id, 'user' => $m->user?->name, 'action' => 'Caja: '.$m->type, 'detail' => $m->description.' · $'.number_format((float)$m->amount, 0, ',', '.'), 'created_at' => $m->created_at]);
        $events = collect([...$sales, ...$inventory, ...$cash])->sortByDesc('created_at')->take(100)->values();
        return response()->json(['success' => true, 'data' => $events]);
    }

    public function createUser(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:10'],
            'role' => ['required', Rule::in(['admin', 'cashier', 'inventory'])],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);
        $user = $company->users()->create($data + ['status' => $data['status'] ?? 'active']);
        return response()->json(['success' => true, 'data' => $user], 201);
    }

    public function updateUser(Request $request, Company $company, User $user): JsonResponse
    {
        abort_unless($user->company_id === $company->id && $user->role !== 'superadmin', 404);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:120', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:10'],
            'role' => ['sometimes', Rule::in(['admin', 'cashier', 'inventory'])],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);
        if ($user->role === 'admin' && isset($data['role']) && $data['role'] !== 'admin' && $company->users()->where('role', 'admin')->count() <= 1) {
            return response()->json(['success' => false, 'message' => 'La empresa debe conservar al menos un administrador.'], 422);
        }
        if (empty($data['password'])) unset($data['password']);
        $user->update($data);
        if (($data['status'] ?? null) === 'inactive') $user->tokens()->delete();
        return response()->json(['success' => true, 'data' => $user->fresh()]);
    }

    public function deleteUser(Company $company, User $user): JsonResponse
    {
        abort_unless($user->company_id === $company->id && $user->role !== 'superadmin', 404);
        if ($user->role === 'admin' && $company->users()->where('role', 'admin')->count() <= 1) {
            return response()->json(['success' => false, 'message' => 'La empresa debe conservar al menos un administrador.'], 422);
        }
        $user->delete();
        return response()->json(['success' => true, 'message' => 'Usuario eliminado.']);
    }

    /**
     * GET /api/v1/company
     * Obtiene los datos fiscales y configuración de la empresa del usuario en sesión.
     */
    public function show(Request $request): JsonResponse
    {
        $company = $request->user()->company;

        return response()->json([
            'success' => true,
            'data'    => $company,
        ]);
    }

    /**
     * PUT /api/v1/company
     * Actualiza los datos fiscales y comerciales de la empresa (Admin only).
     */
    public function update(UpdateCompanyRequest $request): JsonResponse
    {
        $company = $request->user()->company;
        $data = $request->validated();
        unset($data['logo']);
        if ($request->hasFile('logo')) {
            $oldLogo = $company->logo_path;
            $data['logo_path'] = $request->file('logo')->store('company-logos', 'public');
            if ($oldLogo) Storage::disk('public')->delete($oldLogo);
        }
        $company->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Configuración de empresa actualizada correctamente.',
            'data'    => $company->fresh(),
        ]);
    }
}
