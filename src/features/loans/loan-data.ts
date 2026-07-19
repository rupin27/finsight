import { getAccounts } from "@/features/accounts/account-data";
import type {
  LoanDashboardData,
  LoanProfile,
  LoanRateType,
  StudentLoanRecord,
} from "@/features/loans/loan.types";
import { getUserDefaultCurrency } from "@/features/currency/currency-data";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { convertAmount } from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";

export async function getLoanDashboardData(): Promise<LoanDashboardData> {
  const [accounts, displayCurrency] = await Promise.all([
    getAccounts(),
    getUserDefaultCurrency(),
  ]);

  const loanAccounts = accounts.filter(
    (account) => account.accountType === "loan",
  );

  if (loanAccounts.length === 0) {
    return {
      displayCurrency,
      fxEffectiveDate: null,

      totalBalanceInDisplayCurrency: 0,
      totalPaymentsInDisplayCurrency: 0,

      loans: [],
    };
  }

  const fxSnapshot = await getExchangeRateSnapshot(displayCurrency);

  const { supabase, userId } = await requireAuthenticatedUser();

  const loanAccountIds = loanAccounts.map((account) => account.id);

  const [profileResult, paymentResult] = await Promise.all([
    supabase
      .from("loan_profiles")
      .select(
        `
          id,
          account_id,
          lender,
          original_principal,
          annual_interest_rate,
          required_monthly_payment,
          next_payment_date,
          original_term_months,
          rate_type,
          created_at,
          updated_at
        `,
      )
      .eq("user_id", userId)
      .in("account_id", loanAccountIds),

    supabase
      .from("transactions")
      .select(
        `
          destination_account_id,
          amount,
          currency,
          transaction_date
        `,
      )
      .eq("user_id", userId)
      .eq("transaction_kind", "loan_payment")
      .in("destination_account_id", loanAccountIds)
      .order("transaction_date", {
        ascending: false,
      }),
  ]);

  if (profileResult.error) {
    throw new Error(
      `Unable to load loan profiles: ${profileResult.error.message}`,
    );
  }

  if (paymentResult.error) {
    throw new Error(
      `Unable to load loan payments: ${paymentResult.error.message}`,
    );
  }

  const profileMap = new Map<string, LoanProfile>();

  for (const row of profileResult.data ?? []) {
    profileMap.set(String(row.account_id), {
      id: String(row.id),

      accountId: String(row.account_id),

      lender: typeof row.lender === "string" ? row.lender : null,

      originalPrincipal:
        row.original_principal === null ? null : Number(row.original_principal),

      annualInterestRate: Number(row.annual_interest_rate),

      requiredMonthlyPayment: Number(row.required_monthly_payment),

      nextPaymentDate: String(row.next_payment_date),

      originalTermMonths:
        row.original_term_months === null
          ? null
          : Number(row.original_term_months),

      rateType: row.rate_type as LoanRateType,

      createdAt: String(row.created_at),

      updatedAt: String(row.updated_at),
    });
  }

  const paymentSummaries = new Map<
    string,
    {
      count: number;
      total: number;
      lastPaymentDate: string | null;
    }
  >();

  for (const payment of paymentResult.data ?? []) {
    if (typeof payment.destination_account_id !== "string") {
      continue;
    }

    const existing = paymentSummaries.get(payment.destination_account_id) ?? {
      count: 0,
      total: 0,
      lastPaymentDate: null,
    };

    existing.count += 1;
    existing.total += Number(payment.amount ?? 0);

    if (!existing.lastPaymentDate) {
      existing.lastPaymentDate = String(payment.transaction_date);
    }

    paymentSummaries.set(payment.destination_account_id, existing);
  }

  const loans: StudentLoanRecord[] = loanAccounts.map((account) => {
    const paymentSummary = paymentSummaries.get(account.id) ?? {
      count: 0,
      total: 0,
      lastPaymentDate: null,
    };

    return {
      accountId: account.id,
      accountName: account.name,

      institution: account.institution,

      currency: account.currency,

      openingBalance: account.openingBalance,

      currentBalance: Math.max(0, account.currentBalance),

      isActive: account.isActive,

      paymentCount: paymentSummary.count,

      totalPaymentsRecorded: paymentSummary.total,

      lastPaymentDate: paymentSummary.lastPaymentDate,

      profile: profileMap.get(account.id) ?? null,
    };
  });

  const totalBalanceInDisplayCurrency = loans.reduce(
    (total, loan) =>
      total +
      convertAmount(
        loan.currentBalance,
        loan.currency,
        displayCurrency,
        fxSnapshot,
      ),
    0,
  );

  const totalPaymentsInDisplayCurrency = loans.reduce(
    (total, loan) =>
      total +
      convertAmount(
        loan.totalPaymentsRecorded,
        loan.currency,
        displayCurrency,
        fxSnapshot,
      ),
    0,
  );

  return {
    displayCurrency,

    fxEffectiveDate: fxSnapshot.effectiveDate,

    totalBalanceInDisplayCurrency,
    totalPaymentsInDisplayCurrency,

    loans,
  };
}
