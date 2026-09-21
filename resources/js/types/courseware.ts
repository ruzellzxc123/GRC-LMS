export interface Courseware {
    id: number;
    subject: string;
    professor: string;
    module_title: string;
    progress?: number;
    code?: string;
}

export interface CoursewareApiResponse {
    success: boolean;
    message: string;
    data: Courseware[];
}
