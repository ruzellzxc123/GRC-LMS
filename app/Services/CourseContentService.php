<?php

namespace App\Services;

use App\Models\CourseContentCategory;
use App\Models\Courseware;
use Illuminate\Support\Collection;

final class CourseContentService
{
    /**
     * Fixed categories auto-provisioned the first time a subject's content
     * page is opened — professors can no longer add their own categories,
     * so this is the complete, permanent set. Each term category holds both
     * materials and student work: every item posted under it can require a
     * submission, there's no separate Activity bucket anymore.
     */
    private const DEFAULT_CATEGORIES = [
        ['name' => 'Prelims', 'requires_submission' => true],
        ['name' => 'Midterm', 'requires_submission' => true],
        ['name' => 'Finals', 'requires_submission' => true],
    ];

    public function categoriesFor(Courseware $courseware): Collection
    {
        $categories = CourseContentCategory::where('courseware_id', $courseware->id)
            ->with('items.comments.user')
            ->orderBy('order')
            ->get();

        if ($categories->isEmpty()) {
            $categories = $this->createDefaultCategories($courseware);
        }

        return $categories;
    }

    private function createDefaultCategories(Courseware $courseware): Collection
    {
        return collect(self::DEFAULT_CATEGORIES)->map(
            fn (array $definition, int $index) => tap(
                CourseContentCategory::create([
                    'courseware_id' => $courseware->id,
                    'name' => $definition['name'],
                    'order' => $index,
                    'requires_submission' => $definition['requires_submission'],
                ]),
                fn (CourseContentCategory $category) => $category->setRelation('items', collect()),
            ),
        )->values();
    }
}
