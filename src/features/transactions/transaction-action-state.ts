import type { TransactionFieldErrors } from "@/features/transactions/transaction-validation";

export interface TransactionActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: TransactionFieldErrors;
}

export const INITIAL_TRANSACTION_ACTION_STATE: TransactionActionState = {
  status: "idle",
};
