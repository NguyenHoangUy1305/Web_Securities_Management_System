<?php

declare(strict_types=1);

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;

class ExportService
{
    /**
     * Export data to an Excel XLSX file and return a download response.
     *
     * @param array<int, array<string, mixed>> $data     Rows of data (each row is an associative array or indexed array of values)
     * @param string                           $filename Output file name (e.g., 'transactions.xlsx')
     * @param array<int, string>               $headers  Column header labels
     */
    public function exportExcel(array $data, string $filename, array $headers): Response
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'export_');

        $writer = new Writer();
        $writer->openToFile($tempPath);

        // Write header row
        if (!empty($headers)) {
            $writer->addRow(Row::fromValues($headers));
        }

        // Write data rows
        foreach ($data as $row) {
            if (is_array($row)) {
                $writer->addRow(Row::fromValues(array_values($row)));
            } else {
                $writer->addRow(Row::fromValues([(string) $row]));
            }
        }

        $writer->close();

        return response()->download($tempPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Export data to a PDF file and return a download response.
     *
     * @param string $view     Blade view name (e.g., 'exports.transactions')
     * @param array<string, mixed> $data  Data to pass to the view
     * @param string $filename Output file name (e.g., 'transactions.pdf')
     */
    public function exportPDF(string $view, array $data, string $filename): Response
    {
        $pdf = Pdf::loadView($view, $data);

        return $pdf->download($filename);
    }
}
