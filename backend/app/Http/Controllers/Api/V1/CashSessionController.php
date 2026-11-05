<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cash\CashMovementRequest;
use App\Http\Requests\Cash\CloseCashSessionRequest;
use App\Http\Requests\Cash\OpenCashSessionRequest;
use App\Models\CashSession;
use App\Models\CashMovement;
use App\Models\InventoryMovement;
use App\Models\Sale;
use App\Services\CashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashSessionController extends Controller
{
    public function __construct(
        protected CashService $cashService
    ) {}

    /**
     * GET /api/v1/cash-sessions/current
     * Obtiene el turno de caja abierto en este momento para el usuario o empresa.
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;

        $session = $this->cashService->getCurrentSession($company, $user);

        if (! $session) {
            return response()->json([
                'success' => true,
                'data'    => null,
                'message' => 'No hay una sesión de caja activa.',
            ]);
        }

        $session->load(['user', 'movements' => fn ($q) => $q->latest()->limit(50)]);
        $summary = $this->cashService->getSummary($session);

        return response()->json([
            'success' => true,
            'data'    => [
                'session'   => $session,
                'summary'   => $summary,
                'movements' => $session->movements,
            ],
        ]);
    }

    /**
     * POST /api/v1/cash-sessions/open
     * Abre un nuevo turno de caja con monto base inicial.
     */
    public function open(OpenCashSessionRequest $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;

        $session = $this->cashService->openSession(
            company: $company,
            user: $user,
            openingAmount: (float) $request->opening_amount,
            notes: $request->notes
        );

        $session->load('user');
        $summary = $this->cashService->getSummary($session);

        return response()->json([
            'success' => true,
            'message' => 'Turno de caja abierto correctamente.',
            'data'    => [
                'session' => $session,
                'summary' => $summary,
            ],
        ], 201);
    }

    /**
     * POST /api/v1/cash-sessions/{cashSession}/movements
     * Registra un ingreso, retiro o gasto manual en la caja.
     */
    public function storeMovement(CashSession $cashSession, CashMovementRequest $request): JsonResponse
    {
        $user = $request->user();

        $movement = $this->cashService->recordMovement(
            session: $cashSession,
            user: $user,
            type: $request->type,
            amount: (float) $request->amount,
            description: $request->description,
            reference: $request->reference
        );

        $summary = $this->cashService->getSummary($cashSession->fresh());

        return response()->json([
            'success' => true,
            'message' => 'Movimiento de caja registrado correctamente.',
            'data'    => [
                'movement' => $movement,
                'summary'  => $summary,
            ],
        ], 201);
    }

    /**
     * POST /api/v1/cash-sessions/{cashSession}/close
     * Cierra el turno de caja y calcula el arqueo.
     */
    public function close(CashSession $cashSession, CloseCashSessionRequest $request): JsonResponse
    {
        $closedSession = $this->cashService->closeSession(
            session: $cashSession,
            closingAmount: (float) $request->closing_amount,
            notes: $request->notes
        );

        $summary = $this->cashService->getSummary($closedSession);
        $companyId = $closedSession->company_id;
        $from = $closedSession->opened_at;
        $to = $closedSession->closed_at;
        $sales = Sale::with('user:id,name')->where('company_id', $companyId)->where('cash_session_id', $closedSession->id)->where('status', 'completed')->whereBetween('created_at', [$from, $to])->get(['id','user_id','invoice_number','total','created_at']);
        $stockEntries = InventoryMovement::with(['user:id,name','product:id,name'])->where('company_id', $companyId)->where('type', 'entry')->whereBetween('created_at', [$from, $to])->latest()->get();
        $cashMovements = CashMovement::with('user:id,name')->where('cash_session_id', $closedSession->id)->oldest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Caja cerrada y arqueo finalizado.',
            'data'    => [
                'session' => $closedSession,
                'summary' => $summary,
                'close_summary' => [
                    'sales_count' => $sales->count(),
                    'sales_total' => (float) $sales->sum('total'),
                    'sales' => $sales,
                    'stock_entries' => $stockEntries,
                    'stock_entries_count' => $stockEntries->count(),
                    'stock_entries_quantity' => (float) $stockEntries->sum('quantity'),
                    'cash_movements' => $cashMovements,
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/cash-sessions
     * Historial de sesiones de caja de la empresa.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CashSession::with('user');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $perPage = min((int) ($request->per_page ?? 15), 50);
        $sessions = $query->orderBy('opened_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $sessions->items(),
            'meta'    => [
                'current_page' => $sessions->currentPage(),
                'last_page'    => $sessions->lastPage(),
                'per_page'     => $sessions->perPage(),
                'total'        => $sessions->total(),
            ],
        ]);
    }

    /**
     * GET /api/v1/cash-sessions/{cashSession}
     * Detalle de una sesión de caja con sus movimientos.
     */
    public function show(CashSession $cashSession): JsonResponse
    {
        $cashSession->load(['user', 'movements' => fn ($q) => $q->latest()]);
        $summary = $this->cashService->getSummary($cashSession);

        return response()->json([
            'success' => true,
            'data'    => [
                'session'   => $cashSession,
                'summary'   => $summary,
                'movements' => $cashSession->movements,
            ],
        ]);
    }
}
