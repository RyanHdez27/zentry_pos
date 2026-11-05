<?php

namespace App\Services;

use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashService
{
    /**
     * Obtiene la sesión de caja actualmente abierta para una empresa y/o usuario.
     */
    public function getCurrentSession(Company $company, ?User $user = null): ?CashSession
    {
        $query = CashSession::where('company_id', $company->id)
            ->where('status', 'open');

        if ($user) {
            $userSession = (clone $query)->where('user_id', $user->id)->first();
            if ($userSession) {
                return $userSession;
            }
        }

        return $query->latest('opened_at')->first();
    }

    /**
     * Abre un nuevo turno de caja.
     */
    public function openSession(Company $company, User $user, float $openingAmount, ?string $notes = null): CashSession
    {
        return DB::transaction(function () use ($company, $user, $openingAmount, $notes) {
            // Verificar si el usuario ya tiene un turno abierto
            $existing = CashSession::where('company_id', $company->id)
                ->where('user_id', $user->id)
                ->where('status', 'open')
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'session' => ['Ya tienes una sesión de caja abierta en este momento.'],
                ]);
            }

            $session = CashSession::create([
                'company_id'      => $company->id,
                'user_id'         => $user->id,
                'opening_amount'  => $openingAmount,
                'expected_amount' => $openingAmount,
                'status'          => 'open',
                'opened_at'       => now(),
                'notes'           => $notes,
            ]);

            // Registrar movimiento de apertura si hay monto inicial
            if ($openingAmount > 0) {
                CashMovement::create([
                    'company_id'      => $company->id,
                    'cash_session_id' => $session->id,
                    'user_id'         => $user->id,
                    'type'            => 'income',
                    'amount'          => $openingAmount,
                    'description'     => 'Apertura de caja — monto inicial',
                    'reference'       => 'APERTURA',
                ]);
            }

            return $session;
        });
    }

    /**
     * Registra un movimiento manual en la caja (ingreso, egreso o retiro).
     */
    public function recordMovement(
        CashSession $session,
        User $user,
        string $type,
        float $amount,
        string $description,
        ?string $reference = null
    ): CashMovement {
        if (! $session->isOpen()) {
            throw ValidationException::withMessages([
                'session' => ['No se pueden registrar movimientos en una caja cerrada.'],
            ]);
        }

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => ['El monto del movimiento debe ser superior a cero.'],
            ]);
        }

        $validTypes = ['income', 'expense', 'withdrawal', 'sale', 'cancellation'];
        if (! in_array($type, $validTypes, true)) {
            throw new \InvalidArgumentException("Tipo de movimiento de caja no válido: [{$type}].");
        }

        return DB::transaction(function () use ($session, $user, $type, $amount, $description, $reference) {
            return CashMovement::create([
                'company_id'      => $session->company_id,
                'cash_session_id' => $session->id,
                'user_id'         => $user->id,
                'type'            => $type,
                'amount'          => $amount,
                'description'     => $description,
                'reference'       => $reference,
            ]);
        });
    }

    /**
     * Cierra el turno de caja y calcula el arqueo.
     */
    public function closeSession(CashSession $session, float $closingAmount, ?string $notes = null): CashSession
    {
        if (! $session->isOpen()) {
            throw ValidationException::withMessages([
                'session' => ['Esta sesión de caja ya se encuentra cerrada.'],
            ]);
        }

        return DB::transaction(function () use ($session, $closingAmount, $notes) {
            $expected = $session->calculateExpectedCash();
            $difference = $closingAmount - $expected;

            $session->update([
                'closing_amount'  => $closingAmount,
                'expected_amount' => $expected,
                'difference'      => $difference,
                'status'          => 'closed',
                'closed_at'       => now(),
                'notes'           => $notes ?? $session->notes,
            ]);

            return $session->fresh();
        });
    }

    /**
     * Genera un resumen estadístico detallado de la sesión de caja.
     */
    public function getSummary(CashSession $session): array
    {
        $opening = (float) $session->opening_amount;

        $sales = (float) $session->movements()
            ->where('type', 'sale')
            ->sum('amount');

        $incomes = (float) $session->movements()
            ->where('type', 'income')
            ->where('reference', '!=', 'APERTURA')
            ->sum('amount');

        $withdrawals = (float) $session->movements()
            ->whereIn('type', ['withdrawal', 'expense'])
            ->sum('amount');

        $cancellations = (float) $session->movements()
            ->where('type', 'cancellation')
            ->sum('amount');

        $expected = $opening + $sales + $incomes - $withdrawals - $cancellations;

        return [
            'initial'       => $opening,
            'sales'         => $sales,
            'income'        => $incomes,
            'withdrawals'   => $withdrawals,
            'cancellations' => $cancellations,
            'expected'      => $expected,
            'closing'       => $session->closing_amount ? (float) $session->closing_amount : null,
            'difference'    => $session->difference ? (float) $session->difference : ($session->isOpen() ? 0.0 : ($session->closing_amount - $expected)),
            'status'        => $session->status,
        ];
    }
}
