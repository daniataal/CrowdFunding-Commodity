export type KycProviderStatus = "PENDING" | "APPROVED" | "REJECTED"

/**
 * Placeholder integration for a KYC provider like SumSub/Onfido.
 * In production this would create an applicant, upload media, and poll webhooks.
 */
export async function verifyKycPlaceholder(_args: {
  userId: string
  email: string
  name: string
}): Promise<{ status: KycProviderStatus; providerRef: string }> {
  // Simulate: always return PENDING.
  return { status: "PENDING", providerRef: `demo-${Date.now()}` }
}


