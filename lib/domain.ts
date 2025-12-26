export type UserRole = "USER" | "ADMIN" | "AUDITOR"
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | "NOT_STARTED"

export type CommodityType = "Agriculture" | "Energy" | "Metals"
export type RiskLevel = "Low" | "Medium" | "High"
export type CommodityStatus = "FUNDING" | "ACTIVE" | "IN_TRANSIT" | "SETTLED" | "CANCELLED"

export type DocumentType =
  | "BILL_OF_LADING"
  | "INSURANCE_CERTIFICATE"
  | "QUALITY_CERTIFICATION"
  | "COMMODITY_CONTRACT"
  | "KYC_ID"
  | "KYC_PROOF_OF_ADDRESS"
  | "OTHER"

export type MarketplaceCommodity = {
  id: string
  type: CommodityType
  name: string
  icon: string
  risk: RiskLevel
  targetApy: number
  duration: number
  minInvestment?: number | null
  maxInvestment?: number | null
  platformFeeBps?: number | null
  originLat?: number | null
  originLng?: number | null
  destLat?: number | null
  destLng?: number | null
  amountRequired: number
  currentAmount: number
  description: string
  origin: string
  destination: string
  status: CommodityStatus
  shipmentId?: string | null
  insuranceValue?: number | null
  transportMethod?: string | null
  riskScore?: number | null
  maturityDate?: string | null
}

export type CommodityDocument = {
  id: string
  commodityId?: string | null
  userId?: string | null
  type: DocumentType
  name: string
  url: string
  mimeType?: string | null
  size?: number | null
  verified: boolean
  verifiedAt?: string | null
  createdAt: string
}

export type DashboardSummary = {
  totalValue: number
  totalProfit: number
  cashInWallet: number
  roi: number
  totalInvested: number
}

export type PerformancePoint = {
  date: string
  portfolio: number
  market: number
}

export type WalletTransaction = {
  id: string
  type: "DEPOSIT" | "WITHDRAWAL" | "INVESTMENT" | "DIVIDEND" | "PAYOUT" | "REFUND"
  amount: number
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED"
  description?: string | null
  createdAt: string
  commodity?: { id: string; name: string } | null
}

export type ActivityItem = {
  id: string
  type: "investment" | "dividend" | "shipment" | "withdrawal" | "deposit"
  title: string
  description: string
  amount?: number
  timestamp: string
  status: "success" | "pending" | "info"
}

export type NotificationItem = {
  id: string
  type: "investment" | "shipment" | "dividend" | "alert" | "system"
  title: string
  message: string
  timestamp: string
  read: boolean
  icon?: string | null
  link?: string | null
}

export type UserProfile = {
  id: string
  email: string
  name: string
  role: UserRole
  kycStatus: KycStatus
  disabled?: boolean
  disabledAt?: string | null
  walletFrozen?: boolean
  walletFrozenAt?: string | null
  avatar?: string | null
  phone?: string | null
  company?: string | null
  bio?: string | null
  twoFactorEnabled: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  investmentAlerts: boolean
  marketUpdates: boolean
  weeklyReport: boolean
  currency: string
  timezone: string
  language: string
}

export type AdminUserSummary = {
  id: string
  email: string
  name: string
  role: UserRole
  kycStatus: KycStatus
  walletBalance: number
  walletFrozen?: boolean
  walletFrozenAt?: string | null
  disabled: boolean
  disabledAt: string | null
  createdAt: string
  _count: { investments: number; transactions: number; documents: number }
}

export type AdminUserDetail = AdminUserSummary & {
  updatedAt: string
  avatar?: string | null
  phone?: string | null
  company?: string | null
  kycDocuments: CommodityDocument[]
}

export type AuditLogItem = {
  id: string
  action: string
  entityType: string
  entityId?: string | null
  changes?: any
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
  actor?: { id: string; email: string; name: string; role: UserRole } | null
}


