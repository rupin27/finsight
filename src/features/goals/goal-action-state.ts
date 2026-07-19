import type { FinancialGoalFieldErrors } from "@/features/goals/goal-validation";

export interface GoalActionState {
  status: "idle" | "success" | "error";

  message?: string;

  fieldErrors?: FinancialGoalFieldErrors;
}

export const INITIAL_GOAL_ACTION_STATE: GoalActionState = {
  status: "idle",
};
