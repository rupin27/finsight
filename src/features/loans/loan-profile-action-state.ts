import type { LoanProfileFieldErrors } from "@/features/loans/loan-profile-validation";

export interface LoanProfileActionState {
  status: "idle" | "success" | "error";

  message?: string;

  fieldErrors?: LoanProfileFieldErrors;
}

export const INITIAL_LOAN_PROFILE_ACTION_STATE: LoanProfileActionState = {
  status: "idle",
};
