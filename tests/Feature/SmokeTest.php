<?php

use App\Models\AcademicTerm;
use App\Models\Attendance;
use App\Models\Courseware;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Feedback;
use App\Models\Quiz;
use App\Models\User;

function seedSmokeData(): array
{
    $admin = User::factory()->create(['role' => 'admin']);
    $professor = User::factory()->create(['role' => 'professor', 'professor_id' => 'T-SMOKE-1', 'department' => 'CS']);
    $student = User::factory()->create(['role' => 'student', 'student_id' => 'S-SMOKE-1', 'program' => 'BSIT', 'year_level' => '1', 'section' => 'A']);

    $department = Department::create(['name' => 'Computer Studies', 'code' => 'CS']);
    $term = AcademicTerm::create(['name' => 'Term 1', 'start_date' => now(), 'end_date' => now()->addMonths(4), 'is_current' => true]);

    $course = Courseware::create([
        'subject' => 'Smoke Subject',
        'professor' => $professor->name,
        'professor_id' => $professor->id,
        'module_title' => 'Module 1',
        'department_id' => $department->id,
        'academic_term_id' => $term->id,
    ]);

    $enrollment = Enrollment::create(['student_id' => $student->id, 'courseware_id' => $course->id]);

    Attendance::create(['enrollment_id' => $enrollment->id, 'date' => now()->toDateString(), 'status' => 'present']);
    Feedback::create(['professor_id' => $professor->id, 'student_id' => $student->id, 'courseware_id' => $course->id, 'message' => 'Great work!']);

    $quiz = Quiz::create(['courseware_id' => $course->id, 'title' => 'Smoke Quiz', 'is_published' => true]);
    $question = $quiz->questions()->create(['question' => 'What is 2+2?', 'order' => 0]);
    $question->options()->create(['option_text' => '4', 'is_correct' => true, 'order' => 0]);
    $question->options()->create(['option_text' => '5', 'is_correct' => false, 'order' => 1]);

    return compact('admin', 'professor', 'student', 'course', 'enrollment', 'quiz');
}

test('admin can view core admin pages', function () {
    ['admin' => $admin, 'course' => $course, 'student' => $student] = seedSmokeData();

    $this->actingAs($admin);
    $this->get('/dashboard')->assertRedirect('/admin/dashboard');
    $this->get('/admin/dashboard')->assertOk();
    $this->get("/admin/courses/{$course->id}/enrollments")->assertOk();
    $this->get('/admin/performance/students')->assertOk();
    $this->get("/admin/performance/students/{$student->id}")->assertOk();
    $this->get('/admin/performance/professors')->assertOk();
    $this->get('/admin/activities')->assertOk();
    $this->get('/admin/reports')->assertOk();
});

test('professor can view core professor pages', function () {
    ['professor' => $professor, 'course' => $course, 'student' => $student, 'quiz' => $quiz] = seedSmokeData();

    $this->actingAs($professor);
    $this->get('/dashboard')->assertRedirect('/professor/dashboard');
    $this->get('/professor/dashboard')->assertOk();
    $this->get("/professor/courses/{$course->id}/roster")->assertOk();
    $this->get("/professor/courses/{$course->id}/attendance")->assertOk();
    $this->get('/professor/feedback')->assertOk();
    $this->get("/professor/courses/{$course->id}/students/{$student->id}/feedback/create")->assertOk();
    $this->get('/professor/quizzes')->assertOk();
    $this->get('/professor/quizzes/create')->assertOk();
    $this->get("/professor/quizzes/{$quiz->id}/edit")->assertOk();
});

test('student can view core student pages and take a quiz', function () {
    ['student' => $student, 'course' => $course, 'quiz' => $quiz] = seedSmokeData();

    $this->actingAs($student);
    $this->get('/dashboard')->assertRedirect('/student/dashboard');
    $this->get('/student/dashboard')->assertOk();
    $this->get('/student/courses')->assertOk();
    $this->get("/student/courses/{$course->id}")->assertOk();
    $this->get('/student/feedback')->assertOk();
    $this->get("/student/quizzes/{$quiz->id}")->assertOk();

    $option = $quiz->questions->first()->options->firstWhere('is_correct', true);
    $this->post("/student/quizzes/{$quiz->id}", [
        'answers' => [$quiz->questions->first()->id => $option->id],
    ])->assertRedirect("/student/quizzes/{$quiz->id}");

    $this->get("/student/quizzes/{$quiz->id}")->assertOk();
});

test('professor cannot access another professors course roster', function () {
    ['course' => $course] = seedSmokeData();
    $otherProfessor = User::factory()->create(['role' => 'professor', 'professor_id' => 'T-SMOKE-2']);

    $this->actingAs($otherProfessor);
    $this->get("/professor/courses/{$course->id}/roster")->assertForbidden();
});
