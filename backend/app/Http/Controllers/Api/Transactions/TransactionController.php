<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Transactions;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\TransactionResource;
use App\Services\TransactionService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TransactionController extends BaseController
{
    protected TransactionService $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Display a paginated list of transactions for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'per_page'    => 'nullable|integer|min:1|max:100',
            'type'        => 'nullable|string|in:buy,sell,dividend,deposit,withdrawal',
            'security_id' => 'nullable|integer|exists:securities,id',
            'portfolio_id' => 'nullable|integer|exists:portfolios,id',
            'from'        => 'nullable|date',
            'to'          => 'nullable|date|after_or_equal:from',
            'date_from'   => 'nullable|date',
            'date_to'     => 'nullable|date|after_or_equal:date_from',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $perPage = (int) ($request->input('per_page', 15));
            $filters = $request->only([
                'type', 'security_id', 'portfolio_id',
                'from', 'to', 'date_from', 'date_to',
            ]);

            $transactions = $this->transactionService->getTransactionHistory(
                $request->user()->id,
                $filters,
                $perPage
            );

            return $this->sendResponse(
                $transactions->through(fn ($transaction) => new TransactionResource($transaction)),
                'Transactions retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve transactions.',
                500
            );
        }
    }

    /**
     * Display the specified transaction.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $transaction = $this->transactionService->getById($id);

            if (!$transaction || $transaction->user_id !== $request->user()->id) {
                return $this->sendError('Transaction not found.', 404);
            }

            $transaction->load(['security', 'portfolio', 'order']);

            return $this->sendResponse(
                new TransactionResource($transaction),
                'Transaction retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve transaction.',
                500
            );
        }
    }

    /**
     * Export transactions in the requested format (pdf or excel).
     */
    public function export(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'format'      => 'required|string|in:pdf,excel,xlsx',
            'type'        => 'nullable|string|in:buy,sell,dividend,deposit,withdrawal',
            'security_id' => 'nullable|integer|exists:securities,id',
            'portfolio_id' => 'nullable|integer|exists:portfolios,id',
            'from'        => 'nullable|date',
            'to'          => 'nullable|date|after_or_equal:from',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $format = $request->input('format');
            $filters = $request->only([
                'type', 'security_id', 'portfolio_id', 'from', 'to',
            ]);

            $exportService = $this->transactionService;

            $response = match ($format) {
                'excel', 'xlsx' => $exportService->exportToExcel($request->user()->id, $filters),
                'pdf'           => $exportService->exportToPDF($request->user()->id, $filters),
                default         => throw new Exception('Unsupported format.'),
            };

            return $response;
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to export transactions.',
                500
            );
        }
    }

    /**
     * Get a summary of transactions for a date range.
     */
    public function summary(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $summary = $this->transactionService->getTransactionSummary(
                $request->user()->id,
                $request->input('from'),
                $request->input('to')
            );

            return $this->sendResponse(
                $summary,
                'Transaction summary retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve transaction summary.',
                500
            );
        }
    }
}
