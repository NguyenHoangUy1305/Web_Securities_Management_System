<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Transaction;
use App\Repositories\TransactionRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;

class TransactionService extends BaseService
{
    protected TransactionRepository $transactionRepository;

    protected ExportService $exportService;

    public function __construct(
        TransactionRepository $transactionRepository,
        ExportService $exportService
    ) {
        parent::__construct($transactionRepository);
        $this->transactionRepository = $transactionRepository;
        $this->exportService = $exportService;
    }

    /**
     * Create a new transaction record.
     *
     * @param array<string, mixed> $data
     */
    public function createTransaction(array $data): Transaction
    {
        /** @var Transaction */
        return $this->transactionRepository->create($data);
    }

    /**
     * Retrieve paginated transaction history for a user with optional filters.
     *
     * @param array<string, mixed> $filters
     */
    public function getTransactionHistory(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->transactionRepository->getByUserPaginated($userId, $filters, $perPage);
    }

    /**
     * Export transactions to an Excel file.
     *
     * @param array<string, mixed> $filters
     */
    public function exportToExcel(int $userId, array $filters = []): Response
    {
        $transactions = $this->transactionRepository->getByUser($userId, $filters);

        $headers = [
            'ID', 'Type', 'Symbol', 'Portfolio', 'Quantity', 'Price',
            'Total Amount', 'Fee', 'Tax', 'Net Amount', 'Executed At', 'Notes',
        ];

        $data = $transactions->map(function (Transaction $t) {
            return [
                $t->id,
                $t->type instanceof \App\Enums\TransactionType ? $t->type->value : $t->type,
                $t->security?->symbol ?? 'N/A',
                $t->portfolio?->name ?? 'N/A',
                $t->quantity !== null ? (float) $t->quantity : '',
                $t->price !== null ? (float) $t->price : '',
                (float) $t->total_amount,
                (float) $t->fee,
                (float) $t->tax,
                (float) $t->net_amount,
                $t->executed_at?->format('Y-m-d H:i:s') ?? '',
                $t->notes ?? '',
            ];
        })->toArray();

        $filename = 'transactions_' . now()->format('Ymd_His') . '.xlsx';

        return $this->exportService->exportExcel($data, $filename, $headers);
    }

    /**
     * Export transactions to a PDF file.
     *
     * @param array<string, mixed> $filters
     */
    public function exportToPDF(int $userId, array $filters = []): Response
    {
        $transactions = $this->transactionRepository->getByUser($userId, $filters);

        $filename = 'transactions_' . now()->format('Ymd_His') . '.pdf';

        return $this->exportService->exportPDF('exports.transactions', [
            'transactions' => $transactions,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ], $filename);
    }

    /**
     * Get a summary of transactions for a user within a date range.
     *
     * @return array<string, mixed>
     */
    public function getTransactionSummary(int $userId, string $from, string $to): array
    {
        $filters = [
            'from' => $from,
            'to'   => $to,
        ];

        $transactions = $this->transactionRepository->getByUser($userId, $filters);

        $totalBuy = 0;
        $totalSell = 0;
        $totalDividend = 0;
        $totalDeposit = 0;
        $totalWithdrawal = 0;
        $totalFee = 0;
        $totalTax = 0;
        $count = $transactions->count();

        foreach ($transactions as $t) {
            $type = $t->type instanceof \App\Enums\TransactionType ? $t->type->value : $t->type;
            $totalFee += (float) $t->fee;
            $totalTax += (float) $t->tax;

            switch ($type) {
                case 'buy':
                    $totalBuy += (float) $t->total_amount;
                    break;
                case 'sell':
                    $totalSell += (float) $t->total_amount;
                    break;
                case 'dividend':
                    $totalDividend += (float) $t->net_amount;
                    break;
                case 'deposit':
                    $totalDeposit += (float) $t->net_amount;
                    break;
                case 'withdrawal':
                    $totalWithdrawal += (float) $t->net_amount;
                    break;
            }
        }

        return [
            'from'            => $from,
            'to'              => $to,
            'total_count'     => $count,
            'total_buy'       => round($totalBuy, 2),
            'total_sell'      => round($totalSell, 2),
            'total_dividend'  => round($totalDividend, 2),
            'total_deposit'   => round($totalDeposit, 2),
            'total_withdrawal' => round($totalWithdrawal, 2),
            'total_fee'       => round($totalFee, 2),
            'total_tax'       => round($totalTax, 2),
            'net_change'      => round($totalDeposit - $totalWithdrawal + $totalSell - $totalBuy + $totalDividend, 2),
        ];
    }
}
