<?php

namespace App\Services;

final class QuizImportParser
{
    public function parse(string $contents): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $contents);
        $questions = [];
        $errors = [];
        $current = null;

        foreach ($lines as $lineNumber => $rawLine) {
            $line = trim($rawLine);

            if ($line === '') {
                continue;
            }

            if (preg_match('/^Q:\s*(.+)$/i', $line, $matches)) {
                if ($current !== null) {
                    $questions[] = $current;
                }

                $current = ['question' => trim($matches[1]), 'options' => []];

                continue;
            }

            if (preg_match('/^[A-Za-z][)\.]\s*(.+)$/', $line, $matches)) {
                if ($current === null) {
                    $errors[] = 'Line '.($lineNumber + 1).': option found before any question ("Q:" line).';

                    continue;
                }

                $text = trim($matches[1]);
                $isCorrect = false;

                if (preg_match('/\*\s*$/', $text)) {
                    $isCorrect = true;
                    $text = trim(preg_replace('/\*\s*$/', '', $text));
                }

                $current['options'][] = ['option_text' => $text, 'is_correct' => $isCorrect];

                continue;
            }

            $errors[] = 'Line '.($lineNumber + 1).": couldn't understand \"{$line}\" — expected a line starting with \"Q:\" or an option like \"A) ...\".";
        }

        if ($current !== null) {
            $questions[] = $current;
        }

        if (empty($questions)) {
            $errors[] = 'No questions were found in the file.';
        }

        foreach ($questions as $index => $question) {
            $correctCount = collect($question['options'])->where('is_correct', true)->count();

            if (count($question['options']) < 2) {
                $errors[] = 'Question '.($index + 1).' ("'.$question['question'].'") needs at least 2 options.';
            }

            if ($correctCount !== 1) {
                $errors[] = 'Question '.($index + 1).' ("'.$question['question'].'") must have exactly one option marked correct with a trailing *.';
            }
        }

        return ['questions' => $questions, 'errors' => $errors];
    }
}
