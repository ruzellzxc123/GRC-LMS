<?php

use App\Http\Controllers\Admin\AdminAcademicTermController;
use App\Http\Controllers\Admin\AdminActivityController;
use App\Http\Controllers\Admin\AdminCalendarAnnouncementController;
use App\Http\Controllers\Admin\AdminCourseContentController;
use App\Http\Controllers\Admin\AdminCoursewareController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminDepartmentController;
use App\Http\Controllers\Admin\AdminEnrollmentController;
use App\Http\Controllers\Admin\AdminGradingOversightController;
use App\Http\Controllers\Admin\AdminPerformanceController;
use App\Http\Controllers\Admin\AdminProfessorController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\AdminStudentController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\Professor\ProfessorAttendanceController;
use App\Http\Controllers\Professor\ProfessorCourseContentController;
use App\Http\Controllers\Professor\ProfessorCoursewareController;
use App\Http\Controllers\Professor\ProfessorDashboardController;
use App\Http\Controllers\Professor\ProfessorFeedbackController;
use App\Http\Controllers\Professor\ProfessorGradeController;
use App\Http\Controllers\Professor\ProfessorMeetingController;
use App\Http\Controllers\Professor\ProfessorQuizController;
use App\Http\Controllers\Professor\ProfessorRosterController;
use App\Http\Controllers\Student\StudentAttendanceController;
use App\Http\Controllers\Student\StudentContentCommentController;
use App\Http\Controllers\Student\StudentCourseController;
use App\Http\Controllers\Student\StudentDashboardController;
use App\Http\Controllers\Student\StudentEnrollmentController;
use App\Http\Controllers\Student\StudentFeedbackController;
use App\Http\Controllers\Student\StudentQuizController;
use App\Http\Controllers\Student\StudentScoreController;
use App\Http\Controllers\Student\StudentSubmissionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

Route::get('/dashboard', function (Request $request) {
    return match ($request->user()?->role) {
        'admin' => redirect()->route('admin.dashboard'),
        'professor' => redirect()->route('professor.dashboard'),
        'student' => redirect()->route('student.dashboard'),
        default => Inertia::render('dashboard'),
    };
})
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware([
    'auth',
    'verified',
    'role:admin',
])
    ->prefix('admin')
    ->name('admin.')
    ->group(function (): void {

        Route::get(
            '/dashboard',
            AdminDashboardController::class,
        )->name('dashboard');

        Route::get(
            '/students',
            [AdminStudentController::class, 'index'],
        )->name('students.index');

        Route::get(
            '/students/create',
            [AdminStudentController::class, 'create'],
        )->name('students.create');

        Route::post(
            '/students',
            [AdminStudentController::class, 'store'],
        )->name('students.store');

        Route::get(
            '/students/{student}/edit',
            [AdminStudentController::class, 'edit'],
        )->name('students.edit');

        Route::put(
            '/students/{student}',
            [AdminStudentController::class, 'update'],
        )->name('students.update');

        Route::get(
            '/professors',
            [AdminProfessorController::class, 'index'],
        )->name('professors.index');

        Route::get(
            '/professors/create',
            [AdminProfessorController::class, 'create'],
        )->name('professors.create');

        Route::post(
            '/professors',
            [AdminProfessorController::class, 'store'],
        )->name('professors.store');

        Route::get(
            '/professors/{professor}/edit',
            [AdminProfessorController::class, 'edit'],
        )->name('professors.edit');

        Route::put(
            '/professors/{professor}',
            [AdminProfessorController::class, 'update'],
        )->name('professors.update');

        Route::patch(
            '/professors/{professor}/status',
            [AdminProfessorController::class, 'toggleStatus'],
        )->name('professors.status');

        Route::get(
            '/courses',
            [AdminCoursewareController::class, 'index'],
        )->name('courses.index');

        Route::post(
            '/courses',
            [AdminCoursewareController::class, 'store'],
        )->name('courses.store');

        Route::put(
            '/courses/{courseware}',
            [AdminCoursewareController::class, 'update'],
        )->name('courses.update');

        Route::get(
            '/courses/{courseware}/content',
            [AdminCourseContentController::class, 'index'],
        )->name('content.index');

        Route::post(
            '/courses/{courseware}/content/categories/{category}/items',
            [AdminCourseContentController::class, 'storeItem'],
        )->name('content.items.store');

        Route::get(
            '/courses/{courseware}/content/items/{item}/edit',
            [AdminCourseContentController::class, 'editItem'],
        )->name('content.items.edit');

        Route::put(
            '/courses/{courseware}/content/items/{item}',
            [AdminCourseContentController::class, 'updateItem'],
        )->name('content.items.update');

        Route::patch(
            '/courses/{courseware}/content/items/{item}/publish',
            [AdminCourseContentController::class, 'togglePublish'],
        )->name('content.items.publish');

        Route::get(
            '/courses/{courseware}/content/items/{item}/submissions',
            [AdminCourseContentController::class, 'submissions'],
        )->name('content.items.submissions');

        Route::put(
            '/courses/{courseware}/content/submissions/{submission}',
            [AdminCourseContentController::class, 'updateSubmissionScore'],
        )->name('content.submissions.score');

        Route::post(
            '/courses/{courseware}/content/submissions/{submission}/acknowledge',
            [AdminCourseContentController::class, 'acknowledgeSubmission'],
        )->name('content.submissions.acknowledge');

        Route::post(
            '/courses/{courseware}/content/items/{item}/late-exceptions/{student}',
            [AdminCourseContentController::class, 'grantLateException'],
        )->name('content.items.late-exceptions.grant');

        Route::delete(
            '/courses/{courseware}/content/items/{item}/late-exceptions/{student}',
            [AdminCourseContentController::class, 'revokeLateException'],
        )->name('content.items.late-exceptions.revoke');

        Route::post(
            '/courses/{courseware}/quizzes/{quiz}/late-exceptions/{student}',
            [AdminCourseContentController::class, 'grantQuizLateException'],
        )->name('quizzes.late-exceptions.grant');

        Route::delete(
            '/courses/{courseware}/quizzes/{quiz}/late-exceptions/{student}',
            [AdminCourseContentController::class, 'revokeQuizLateException'],
        )->name('quizzes.late-exceptions.revoke');

        Route::post(
            '/courses/{courseware}/content/items/{item}/comments',
            [AdminCourseContentController::class, 'storeComment'],
        )->name('content.items.comments.store');

        Route::get(
            '/courses/{courseware}/enrollments',
            [AdminEnrollmentController::class, 'index'],
        )->name('enrollments.index');

        Route::post(
            '/courses/{courseware}/enrollments',
            [AdminEnrollmentController::class, 'store'],
        )->name('enrollments.store');

        Route::delete(
            '/courses/{courseware}/enrollments/{enrollment}',
            [AdminEnrollmentController::class, 'destroy'],
        )->name('enrollments.destroy');

        Route::get(
            '/departments',
            [AdminDepartmentController::class, 'index'],
        )->name('departments.index');

        Route::get(
            '/departments/create',
            [AdminDepartmentController::class, 'create'],
        )->name('departments.create');

        Route::post(
            '/departments',
            [AdminDepartmentController::class, 'store'],
        )->name('departments.store');

        Route::get(
            '/departments/{department}/edit',
            [AdminDepartmentController::class, 'edit'],
        )->name('departments.edit');

        Route::put(
            '/departments/{department}',
            [AdminDepartmentController::class, 'update'],
        )->name('departments.update');

        Route::get(
            '/activities',
            [AdminActivityController::class, 'index'],
        )->name('activities.index');

        Route::get(
            '/reports',
            [AdminReportController::class, 'index'],
        )->name('reports.index');

        Route::get(
            '/grading',
            [AdminGradingOversightController::class, 'index'],
        )->name('grading.index');

        Route::get(
            '/performance/students',
            [AdminPerformanceController::class, 'students'],
        )->name('performance.students');

        Route::get(
            '/performance/students/{student}',
            [AdminPerformanceController::class, 'show'],
        )->name('performance.students.show');

        Route::get(
            '/performance/professors',
            [AdminPerformanceController::class, 'professors'],
        )->name('performance.professors');

        Route::get(
            '/terms',
            [AdminAcademicTermController::class, 'index'],
        )->name('terms.index');

        Route::get(
            '/terms/create',
            [AdminAcademicTermController::class, 'create'],
        )->name('terms.create');

        Route::post(
            '/terms',
            [AdminAcademicTermController::class, 'store'],
        )->name('terms.store');

        Route::get(
            '/terms/{term}/edit',
            [AdminAcademicTermController::class, 'edit'],
        )->name('terms.edit');

        Route::put(
            '/terms/{term}',
            [AdminAcademicTermController::class, 'update'],
        )->name('terms.update');

        Route::get(
            '/calendar',
            [CalendarController::class, 'index'],
        )->name('calendar.index');

        Route::post(
            '/calendar/announcements',
            [AdminCalendarAnnouncementController::class, 'store'],
        )->name('calendar.announcements.store');

        Route::delete(
            '/calendar/announcements/{announcement}',
            [AdminCalendarAnnouncementController::class, 'destroy'],
        )->name('calendar.announcements.destroy');
    });

Route::middleware([
    'auth',
    'verified',
    'role:professor',
])
    ->prefix('professor')
    ->name('professor.')
    ->group(function (): void {
        Route::get(
            '/dashboard',
            ProfessorDashboardController::class,
        )->name('dashboard');

        Route::get(
            '/courses',
            [ProfessorCoursewareController::class, 'index'],
        )->name('courses.index');

        Route::post(
            '/courses',
            [ProfessorCoursewareController::class, 'store'],
        )->name('courses.store');

        Route::put(
            '/courses/{courseware}',
            [ProfessorCoursewareController::class, 'update'],
        )->name('courses.update');

        Route::get(
            '/courses/{courseware}/roster',
            [ProfessorRosterController::class, 'index'],
        )->name('roster');

        Route::get(
            '/courses/{courseware}/content',
            [ProfessorCourseContentController::class, 'index'],
        )->name('content.index');

        Route::post(
            '/courses/{courseware}/content/categories/{category}/items',
            [ProfessorCourseContentController::class, 'storeItem'],
        )->name('content.items.store');

        Route::get(
            '/courses/{courseware}/content/items/{item}/edit',
            [ProfessorCourseContentController::class, 'editItem'],
        )->name('content.items.edit');

        Route::put(
            '/courses/{courseware}/content/items/{item}',
            [ProfessorCourseContentController::class, 'updateItem'],
        )->name('content.items.update');

        Route::patch(
            '/courses/{courseware}/content/items/{item}/publish',
            [ProfessorCourseContentController::class, 'togglePublish'],
        )->name('content.items.publish');

        Route::get(
            '/courses/{courseware}/content/items/{item}/submissions',
            [ProfessorCourseContentController::class, 'submissions'],
        )->name('content.items.submissions');

        Route::put(
            '/courses/{courseware}/content/submissions/{submission}',
            [ProfessorCourseContentController::class, 'updateSubmissionScore'],
        )->name('content.submissions.score');

        Route::post(
            '/courses/{courseware}/content/submissions/{submission}/acknowledge',
            [ProfessorCourseContentController::class, 'acknowledgeSubmission'],
        )->name('content.submissions.acknowledge');

        Route::post(
            '/courses/{courseware}/content/items/{item}/late-exceptions/{student}',
            [ProfessorCourseContentController::class, 'grantLateException'],
        )->name('content.items.late-exceptions.grant');

        Route::delete(
            '/courses/{courseware}/content/items/{item}/late-exceptions/{student}',
            [ProfessorCourseContentController::class, 'revokeLateException'],
        )->name('content.items.late-exceptions.revoke');

        Route::post(
            '/courses/{courseware}/content/items/{item}/comments',
            [ProfessorCourseContentController::class, 'storeComment'],
        )->name('content.items.comments.store');

        Route::put(
            '/courses/{courseware}/meeting',
            [ProfessorMeetingController::class, 'update'],
        )->name('meeting.update');

        Route::get(
            '/courses/{courseware}/meeting',
            [ProfessorMeetingController::class, 'show'],
        )->name('meeting.show');

        Route::post(
            '/courses/{courseware}/meeting/start',
            [ProfessorMeetingController::class, 'start'],
        )->name('meeting.start');

        Route::post(
            '/courses/{courseware}/meeting/end',
            [ProfessorMeetingController::class, 'end'],
        )->name('meeting.end');

        Route::get(
            '/grades',
            [ProfessorGradeController::class, 'subjects'],
        )->name('grades.index');

        Route::put(
            '/courses/{courseware}/grades/term-weights',
            [ProfessorGradeController::class, 'updateTermWeights'],
        )->name('grades.term-weights.update');

        Route::post(
            '/courses/{courseware}/grades/categories/{category}/items',
            [ProfessorGradeController::class, 'storeItem'],
        )->name('grades.items.store');

        Route::delete(
            '/courses/{courseware}/grades/items/{item}',
            [ProfessorGradeController::class, 'destroyItem'],
        )->name('grades.items.destroy');

        Route::get(
            '/courses/{courseware}/grades/{term}',
            [ProfessorGradeController::class, 'showTerm'],
        )->where('term', 'prelims|midterm|finals')->name('grades.term');

        Route::put(
            '/courses/{courseware}/grades/{term}/categories',
            [ProfessorGradeController::class, 'updateCategoryWeights'],
        )->where('term', 'prelims|midterm|finals')->name('grades.categories.update');

        Route::put(
            '/courses/{courseware}/grades/{term}/scores',
            [ProfessorGradeController::class, 'updateScores'],
        )->where('term', 'prelims|midterm|finals')->name('grades.scores.update');

        Route::get(
            '/courses/{courseware}/grades/{term}/export',
            [ProfessorGradeController::class, 'export'],
        )->where('term', 'prelims|midterm|finals')->name('grades.export');

        Route::get(
            '/courses/{courseware}/attendance',
            [ProfessorAttendanceController::class, 'index'],
        )->name('attendance.index');

        Route::post(
            '/courses/{courseware}/attendance',
            [ProfessorAttendanceController::class, 'store'],
        )->name('attendance.store');

        Route::get(
            '/feedback',
            [ProfessorFeedbackController::class, 'index'],
        )->name('feedback.index');

        Route::get(
            '/courses/{courseware}/students/{student}/feedback/create',
            [ProfessorFeedbackController::class, 'create'],
        )->name('feedback.create');

        Route::post(
            '/courses/{courseware}/students/{student}/feedback',
            [ProfessorFeedbackController::class, 'store'],
        )->name('feedback.store');

        Route::get(
            '/quizzes',
            [ProfessorQuizController::class, 'index'],
        )->name('quizzes.index');

        Route::get(
            '/quizzes/create',
            [ProfessorQuizController::class, 'create'],
        )->name('quizzes.create');

        Route::post(
            '/quizzes',
            [ProfessorQuizController::class, 'store'],
        )->name('quizzes.store');

        Route::get(
            '/quizzes/import',
            [ProfessorQuizController::class, 'import'],
        )->name('quizzes.import');

        Route::post(
            '/quizzes/import',
            [ProfessorQuizController::class, 'storeImport'],
        )->name('quizzes.import.store');

        Route::get(
            '/quizzes/{quiz}/edit',
            [ProfessorQuizController::class, 'edit'],
        )->name('quizzes.edit');

        Route::put(
            '/quizzes/{quiz}',
            [ProfessorQuizController::class, 'update'],
        )->name('quizzes.update');

        Route::patch(
            '/quizzes/{quiz}/publish',
            [ProfessorQuizController::class, 'togglePublish'],
        )->name('quizzes.publish');

        Route::delete(
            '/quizzes/{quiz}',
            [ProfessorQuizController::class, 'destroy'],
        )->name('quizzes.destroy');

        Route::post(
            '/quizzes/{quiz}/late-exceptions/{student}',
            [ProfessorQuizController::class, 'grantLateException'],
        )->name('quizzes.late-exceptions.grant');

        Route::delete(
            '/quizzes/{quiz}/late-exceptions/{student}',
            [ProfessorQuizController::class, 'revokeLateException'],
        )->name('quizzes.late-exceptions.revoke');

        Route::get(
            '/calendar',
            [CalendarController::class, 'index'],
        )->name('calendar.index');
    });

Route::middleware([
    'auth',
    'verified',
    'role:student',
])
    ->prefix('student')
    ->name('student.')
    ->group(function (): void {
        Route::get(
            '/dashboard',
            StudentDashboardController::class,
        )->name('dashboard');

        Route::get(
            '/courses',
            [StudentCourseController::class, 'index'],
        )->name('courses.index');

        Route::post(
            '/enrollments',
            [StudentEnrollmentController::class, 'store'],
        )->name('enrollments.store');

        Route::get(
            '/courses/{courseware}',
            [StudentCourseController::class, 'show'],
        )->name('courses.show');

        Route::get(
            '/courses/{courseware}/meeting',
            [StudentCourseController::class, 'meeting'],
        )->name('courses.meeting');

        Route::post(
            '/content/items/{item}/submit',
            [StudentSubmissionController::class, 'store'],
        )->name('content.items.submit');

        Route::post(
            '/content/items/{item}/comments',
            [StudentContentCommentController::class, 'store'],
        )->name('content.items.comments.store');

        Route::post(
            '/content/items/{item}/start',
            [StudentCourseController::class, 'startContentItem'],
        )->name('content.items.start');

        Route::post(
            '/content/items/{item}/finish',
            [StudentCourseController::class, 'markContentFinished'],
        )->name('content.items.finish');

        Route::get(
            '/quizzes/{quiz}',
            [StudentQuizController::class, 'show'],
        )->name('quizzes.show');

        Route::post(
            '/quizzes/{quiz}',
            [StudentQuizController::class, 'store'],
        )->name('quizzes.store');

        Route::get(
            '/feedback',
            [StudentFeedbackController::class, 'index'],
        )->name('feedback.index');

        Route::get(
            '/attendance',
            [StudentAttendanceController::class, 'index'],
        )->name('attendance.index');

        Route::get(
            '/scores',
            [StudentScoreController::class, 'index'],
        )->name('scores.index');

        Route::get(
            '/calendar',
            [CalendarController::class, 'index'],
        )->name('calendar.index');
    });

require __DIR__.'/settings.php';
