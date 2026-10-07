import type { JobStatus } from "../../../../generated/prisma/enums";


export interface ICreateJobPayload {
    title: string;
    description: string;
    assignmentDetails: string;
    requirements?: string;
    responsibilities?: string;
    deadline?: string;
    status?: JobStatus;
}

export interface IUpdateJobPayload {
    title?: string;
    description?: string;
    assignmentDetails?: string;
    requirements?: string;
    responsibilities?: string;
    deadline?: string;
    status?: JobStatus;
}