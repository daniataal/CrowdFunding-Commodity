export const RISK_LIMITS = {
  // End-user limits (soft MVP values; adjust for production)
  maxDepositPerTxn: 25_000,
  maxWithdrawPerTxn: 10_000,
  maxWithdrawPerDay: 20_000,

  // Two-person thresholds (admin actions)
  twoPersonPayoutTotal: 100_000,
  twoPersonWalletAdjustmentAbs: 10_000,
} as const


