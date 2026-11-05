<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::with('company')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        if (! $user->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Este usuario se encuentra inactivo. Contacte al administrador.',
            ], 403);
        }

        // Revocar tokens anteriores opcionalmente o permitir nuevo token
        $token = $user->createToken('auth-token', [$user->role])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Inicio de sesión exitoso.',
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'avatar' => $user->avatar,
                    'phone' => $user->phone,
                ],
                'company' => $user->company ? [
                    'id' => $user->company->id,
                    'name' => $user->company->name,
                    'legal_name' => $user->company->legal_name,
                    'tax_id' => $user->company->tax_id,
                    'email' => $user->company->email,
                    'phone' => $user->company->phone,
                    'address' => $user->company->address,
                    'logo_path' => $user->company->logo_path,
                    'currency' => $user->company->currency,
                    'default_tax_rate' => $user->company->default_tax_rate,
                    'invoice_prefix' => $user->company->invoice_prefix,
                    'modules' => $user->company->modules ?? [],
                ] : null,
            ],
        ]);
    }

    /**
     * Get the authenticated User with their Company.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('company');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'avatar' => $user->avatar,
                    'phone' => $user->phone,
                ],
                'company' => $user->company ? [
                    'id' => $user->company->id,
                    'name' => $user->company->name,
                    'legal_name' => $user->company->legal_name,
                    'tax_id' => $user->company->tax_id,
                    'email' => $user->company->email,
                    'phone' => $user->company->phone,
                    'address' => $user->company->address,
                    'logo_path' => $user->company->logo_path,
                    'currency' => $user->company->currency,
                    'default_tax_rate' => $user->company->default_tax_rate,
                    'invoice_prefix' => $user->company->invoice_prefix,
                    'modules' => $user->company->modules ?? [],
                ] : null,
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('avatar')) {
            $oldAvatar = $user->avatar;
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
            if ($oldAvatar && ! str_starts_with($oldAvatar, 'http')) {
                Storage::disk('public')->delete($oldAvatar);
            }
        }

        $user->update($data);
        $user->refresh();

        return response()->json(['success' => true, 'message' => 'Perfil actualizado.', 'data' => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
            'role' => $user->role, 'status' => $user->status, 'avatar' => $user->avatar, 'phone' => $user->phone,
        ]]);
    }

    /**
     * Log the user out (Invalidate token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }
}
