export interface CurriculumSubject {
    id: number;
    department_id: number;
    year_level: string | null;
    semester: string | null;
    category: 'regular' | 'bridging' | 'elective';
    code: string;
    title: string;
}

export interface AcademicTermOption {
    id: number;
    semester: string | null;
}

/**
 * Subject Title options for a given department + year level + academic
 * term, per the department's uploaded curriculum. Electives have no
 * year/semester of their own (a shared pool), so they're always included.
 * When the selected term has no semester set, both semesters' subjects for
 * that year are shown rather than none, since there's nothing to match against.
 */
export function getCurriculumSubjectOptions(
    subjects: CurriculumSubject[],
    departmentId: string,
    yearLevel: string,
    academicTermId: string,
    academicTerms: AcademicTermOption[],
): CurriculumSubject[] {
    if (!departmentId || !yearLevel || !academicTermId) {
        return [];
    }

    const term = academicTerms.find(
        (candidate) => String(candidate.id) === academicTermId,
    );
    const semester = term?.semester ?? null;

    return subjects
        .filter((subject) => subject.department_id === Number(departmentId))
        .filter(
            (subject) =>
                subject.category === 'elective' ||
                subject.year_level === yearLevel,
        )
        .filter(
            (subject) =>
                subject.category === 'elective' ||
                semester === null ||
                subject.semester === semester,
        );
}
