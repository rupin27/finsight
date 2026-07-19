import type { AccountFieldErrors } from "@/features/accounts/account-validation";

export interface AccountActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: AccountFieldErrors;
}

export const INITIAL_ACCOUNT_ACTION_STATE: AccountActionState = {
  status: "idle",
};
