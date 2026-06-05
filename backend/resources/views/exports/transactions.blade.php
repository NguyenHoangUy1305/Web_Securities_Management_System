<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Transaction Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10pt; }
        h1 { text-align: center; font-size: 16pt; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #666; font-size: 9pt; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 6px 4px; font-size: 8pt; text-align: left; }
        td { border: 1px solid #d1d5db; padding: 4px; font-size: 8pt; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row td { font-weight: bold; background-color: #f9fafb; }
    </style>
</head>
<body>
    <h1>Transaction Report</h1>
    <p class="subtitle">Generated at: {{ $generated_at ?? now()->format('Y-m-d H:i:s') }}</p>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Security</th>
                <th>Portfolio</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
                <th class="text-right">Fee</th>
                <th class="text-right">Tax</th>
                <th class="text-right">Net</th>
                <th>Executed At</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($transactions as $t)
            <tr>
                <td>{{ $t->id }}</td>
                <td>{{ $t->type instanceof \App\Enums\TransactionType ? $t->type->label() : $t->type }}</td>
                <td>{{ $t->security?->symbol ?? 'N/A' }}</td>
                <td>{{ $t->portfolio?->name ?? 'N/A' }}</td>
                <td class="text-right">{{ $t->quantity !== null ? number_format((float) $t->quantity, 4) : '-' }}</td>
                <td class="text-right">{{ $t->price !== null ? number_format((float) $t->price, 2) : '-' }}</td>
                <td class="text-right">{{ number_format((float) $t->total_amount, 2) }}</td>
                <td class="text-right">{{ number_format((float) $t->fee, 2) }}</td>
                <td class="text-right">{{ number_format((float) $t->tax, 2) }}</td>
                <td class="text-right">{{ number_format((float) $t->net_amount, 2) }}</td>
                <td>{{ $t->executed_at?->format('Y-m-d H:i') ?? '-' }}</td>
                <td>{{ $t->notes ?? '' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="12" class="text-center">No transactions found.</td>
            </tr>
            @endforelse

            @php
                $totalAmount = $transactions->sum(fn($t) => (float) $t->total_amount);
                $totalFee    = $transactions->sum(fn($t) => (float) $t->fee);
                $totalTax    = $transactions->sum(fn($t) => (float) $t->tax);
                $totalNet    = $transactions->sum(fn($t) => (float) $t->net_amount);
            @endphp
            <tr class="total-row">
                <td colspan="6" class="text-right">Totals</td>
                <td class="text-right">{{ number_format($totalAmount, 2) }}</td>
                <td class="text-right">{{ number_format($totalFee, 2) }}</td>
                <td class="text-right">{{ number_format($totalTax, 2) }}</td>
                <td class="text-right">{{ number_format($totalNet, 2) }}</td>
                <td colspan="2"></td>
            </tr>
        </tbody>
    </table>
</body>
</html>
