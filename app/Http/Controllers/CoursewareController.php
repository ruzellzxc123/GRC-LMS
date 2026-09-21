<?php

namespace App\Http\Controllers;

use App\Models\Courseware;
use Illuminate\Http\JsonResponse;
use Throwable;

class CoursewareController extends Controller
{
    /**
     * Return all available courseware records.
     */
    public function index(): JsonResponse
    {
        try {
            $courses = Courseware::query()
                ->select([
                    'id',
                    'subject',
                    'professor',
                    'module_title',
                ])
                ->orderBy('id')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Courseware retrieved successfully.',
                'data' => $courses,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Unable to retrieve courseware.',
                'data' => [],
            ], 500);
        }
    }
}
