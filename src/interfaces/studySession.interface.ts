export interface GetStudySessionsParams {
  userId: number;
  page: number;
  limit: number;
  from?: Date | undefined;
  to?: Date | undefined;
  status?: "pending" | "t0_completed" | "completed" | undefined;
}
