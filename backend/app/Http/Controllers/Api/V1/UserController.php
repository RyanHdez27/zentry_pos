<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * GET /api/v1/users
     * Lista todos los usuarios colaboradores de la empresa.
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $users = User::where('company_id', $companyId)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }

    /**
     * POST /api/v1/users
     * Registra un nuevo colaborador (Cajero, Administrador o Inventario).
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        if ($request->user()->role === 'cashier' && $request->validated('role') !== 'cashier') {
            return response()->json(['success' => false, 'message' => 'Los vendedores solo pueden crear otros vendedores.'], 403);
        }
        $companyId = $request->user()->company_id;
        $data = $request->validated();

        $nameParts = explode(' ', trim($data['name']));
        $initials = strtoupper(substr($nameParts[0], 0, 1) . (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : ''));

        $user = User::create([
            'company_id' => $companyId,
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'role'       => $data['role'],
            'status'     => $data['status'] ?? 'active',
            'phone'      => $data['phone'] ?? null,
            'avatar'     => $initials,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Usuario colaborador creado con éxito.',
            'data'    => $user,
        ], 201);
    }

    /**
     * PUT /api/v1/users/{user}
     * Actualiza el rol, estado o perfil de un colaborador.
     */
    public function update(User $user, UpdateUserRequest $request): JsonResponse
    {
        if ($user->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'No autorizado para modificar este usuario.'], 404);
        }
        if ($request->user()->role === 'cashier' && ($user->role !== 'cashier' || (($request->validated('role') ?? 'cashier') !== 'cashier'))) {
            return response()->json(['success' => false, 'message' => 'Los vendedores solo pueden gestionar cuentas de vendedor.'], 403);
        }

        $data = $request->validated();
        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (isset($data['name'])) {
            $nameParts = explode(' ', trim($data['name']));
            $data['avatar'] = strtoupper(substr($nameParts[0], 0, 1) . (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : ''));
        }

        $user->update($data);
        if (($data['status'] ?? null) === 'inactive') $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuario actualizado correctamente.',
            'data'    => $user->fresh(),
        ]);
    }

    /**
     * DELETE /api/v1/users/{user}
     * Elimina o desactiva un usuario colaborador.
     */
    public function destroy(User $user, Request $request): JsonResponse
    {
        if ($user->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'No encontrado.'], 404);
        }
        if ($request->user()->role === 'cashier' && $user->role !== 'cashier') {
            return response()->json(['success' => false, 'message' => 'Los vendedores solo pueden gestionar cuentas de vendedor.'], 403);
        }

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => ['No puedes eliminar tu propia cuenta de usuario en sesión.'],
            ]);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuario eliminado correctamente.',
        ]);
    }
}
