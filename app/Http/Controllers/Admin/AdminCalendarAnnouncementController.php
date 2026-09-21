<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalendarAnnouncement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class AdminCalendarAnnouncementController extends Controller
{
    /**
     * One announcement per date — resubmitting for a date that already has
     * one just replaces its title/description instead of erroring out.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        CalendarAnnouncement::updateOrCreate(
            ['date' => $validated['date']],
            [
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'created_by' => auth()->id(),
            ],
        );

        return Redirect::back()->with('success', 'Announcement saved.');
    }

    public function destroy(CalendarAnnouncement $announcement): RedirectResponse
    {
        $announcement->delete();

        return Redirect::back()->with('success', 'Announcement removed.');
    }
}
