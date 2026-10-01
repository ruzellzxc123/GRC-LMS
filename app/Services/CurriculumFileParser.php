<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

/**
 * Reads the department's official curriculum spreadsheet — the real layout
 * used institution-wide (confirmed against the actual uploaded
 * 2024-BSIT-Curriculum.xlsx, not a guess): one sheet, a year-level marker row
 * ("FIRST YEAR" / "SECOND YEAR" / "THIRD YEAR" / "FOURTH YEAR"), then a
 * "First Semester" / "Second Semester" sub-header row, then a repeated
 * Grade/Code/Title/Lec/Lab/Units/Pre-Req column header row, then data rows
 * with the first-semester block in columns B–G and the second-semester
 * block side-by-side in columns J–O. A "Bridging Course" marker row flips
 * the category for the rows until the next "Total" row, which also ends
 * that year's block. Parsing stops at "PROFESSIONAL ELECTIVES" (or end of
 * sheet) — electives are intentionally excluded; only Year 1–4 subjects are
 * loaded, per instruction.
 */
class CurriculumFileParser
{
    private const YEAR_LEVEL_MARKERS = [
        'FIRST YEAR' => '1st Year',
        'SECOND YEAR' => '2nd Year',
        'THIRD YEAR' => '3rd Year',
        'FOURTH YEAR' => '4th Year',
    ];

    // 0-based column indices for the two side-by-side semester blocks.
    private const SEM1_CODE = 1;   // B

    private const SEM1_TITLE = 2;  // C

    private const SEM1_LEC = 3;    // D

    private const SEM1_LAB = 4;    // E

    private const SEM1_UNITS = 5;  // F

    private const SEM1_PREREQ = 6; // G

    private const SEM2_CODE = 9;    // J

    private const SEM2_TITLE = 10;  // K

    private const SEM2_LEC = 11;    // L

    private const SEM2_LAB = 12;    // M

    private const SEM2_UNITS = 13;  // N

    private const SEM2_PREREQ = 14; // O

    /**
     * @return array<int, array{
     *     year_level: string|null,
     *     semester: string|null,
     *     category: string,
     *     code: string,
     *     title: string,
     *     lec: int|null,
     *     lab: int|null,
     *     units: float|null,
     *     pre_req: string|null,
     *     order: int,
     * }>
     */
    public function parse(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $rows = $spreadsheet->getActiveSheet()->toArray(null, true, true, false);

        $subjects = [];
        $order = 0;
        $yearLevel = null;
        $category = 'regular';

        foreach ($rows as $row) {
            $marker = $this->cell($row, 1);

            if ($marker !== null && isset(self::YEAR_LEVEL_MARKERS[strtoupper($marker)])) {
                $yearLevel = self::YEAR_LEVEL_MARKERS[strtoupper($marker)];
                $category = 'regular';

                continue;
            }

            if ($marker !== null && strtoupper($marker) === 'PROFESSIONAL ELECTIVES') {
                break;
            }

            if ($this->isSkippableRow($row, $marker)) {
                continue;
            }

            if ($this->isBridgingMarkerRow($row)) {
                $category = 'bridging';

                continue;
            }

            if ($this->isTotalRow($row)) {
                $category = 'regular';

                continue;
            }

            if ($yearLevel === null) {
                // Rows before the first year marker (title, "Name:") — ignore.
                continue;
            }

            $left = $this->extractSubject($row, self::SEM1_CODE, self::SEM1_TITLE, self::SEM1_LEC, self::SEM1_LAB, self::SEM1_UNITS, self::SEM1_PREREQ);

            if ($left !== null) {
                $subjects[] = [
                    ...$left,
                    'year_level' => $yearLevel,
                    'semester' => '1st Semester',
                    'category' => $category,
                    'order' => $order++,
                ];
            }

            $right = $this->extractSubject($row, self::SEM2_CODE, self::SEM2_TITLE, self::SEM2_LEC, self::SEM2_LAB, self::SEM2_UNITS, self::SEM2_PREREQ);

            if ($right !== null) {
                $subjects[] = [
                    ...$right,
                    'year_level' => $yearLevel,
                    'semester' => '2nd Semester',
                    'category' => $category,
                    'order' => $order++,
                ];
            }
        }

        if ($subjects === []) {
            throw new RuntimeException('No Year 1–4 subject rows were recognized in this file. Make sure it follows the official curriculum sheet layout ("FIRST YEAR" / "First Semester" / "Second Semester" section headers, with Code and Title columns).');
        }

        return $subjects;
    }

    /**
     * @return array{code: string, title: string, lec: int|null, lab: int|null, units: float|null, pre_req: string|null}|null
     */
    private function extractSubject(array $row, int $codeCol, int $titleCol, int $lecCol, int $labCol, int $unitsCol, int $preReqCol): ?array
    {
        $code = $this->cell($row, $codeCol);
        $title = $this->cell($row, $titleCol);

        if ($code === null || $title === null) {
            return null;
        }

        return [
            'code' => $code,
            'title' => $title,
            'lec' => $this->toInt($this->cell($row, $lecCol)),
            'lab' => $this->toInt($this->cell($row, $labCol)),
            'units' => $this->toFloat($this->cell($row, $unitsCol)),
            'pre_req' => $this->normalizePreReq($this->cell($row, $preReqCol)),
        ];
    }

    private function isSkippableRow(array $row, ?string $marker): bool
    {
        if ($marker === null) {
            // A fully blank left side is only truly skippable if the whole
            // row is blank — otherwise it's a right-only data row.
            return $this->cell($row, self::SEM2_CODE) === null
                && $this->cell($row, self::SEM1_TITLE) === null
                && $this->cell($row, self::SEM2_TITLE) === null;
        }

        $upper = strtoupper($marker);

        // "First Semester" / "Second Semester" sub-header row, or the
        // repeated "Grade" column-header row (checked via column A).
        return $upper === 'FIRST SEMESTER'
            || $upper === 'SECOND SEMESTER'
            || strtoupper((string) $this->cell($row, 0)) === 'GRADE';
    }

    private function isBridgingMarkerRow(array $row): bool
    {
        $title = $this->cell($row, self::SEM1_TITLE) ?? $this->cell($row, self::SEM2_TITLE);

        return $title !== null && strtoupper($title) === 'BRIDGING COURSE';
    }

    private function isTotalRow(array $row): bool
    {
        $title = $this->cell($row, self::SEM1_TITLE) ?? $this->cell($row, self::SEM2_TITLE);

        return $title !== null && strtoupper($title) === 'TOTAL';
    }

    private function cell(array $row, int $index): ?string
    {
        $value = $row[$index] ?? null;

        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function normalizePreReq(?string $value): ?string
    {
        if ($value === null || strtoupper($value) === 'NONE') {
            return null;
        }

        return $value;
    }

    private function toInt(?string $value): ?int
    {
        return $value === null || ! is_numeric($value) ? null : (int) round((float) $value);
    }

    private function toFloat(?string $value): ?float
    {
        return $value === null || ! is_numeric($value) ? null : (float) $value;
    }
}
