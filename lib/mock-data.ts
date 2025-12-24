export interface Commodity {
  id: string
  type: "Agriculture" | "Energy" | "Metals"
  name: string
  icon: string
  risk: "Low" | "Medium" | "High"
  targetApy: number
  duration: number
  amountRequired: number
  amountFunded: number
  description: string
  origin: string
  destination: string
  status: "Funding" | "In Transit" | "Sold" | "Settled"
  shipmentId?: string
  insuranceValue?: number
  transportMethod?: string
}

export interface PortfolioSummary {
  totalValue: number
  totalProfit: number
  cashInWallet: number
  roi: number
}

export interface Transaction {
  id: string
  type: "Deposit" | "Withdrawal" | "Dividend" | "Investment"
  amount: number
  date: string
  commodity?: string
  status: "Completed" | "Pending" | "Failed"
}

export interface PerformanceData {
  date: string
  portfolio: number
  market: number
}

export interface Notification {
  id: string
  type: "investment" | "shipment" | "dividend" | "alert" | "system"
  title: string
  message: string
  timestamp: string
  read: boolean
  icon?: string
}

export interface ActivityItem {
  id: string
  type: "investment" | "dividend" | "shipment" | "withdrawal" | "deposit"
  title: string
  description: string
  amount?: number
  timestamp: string
  status: "success" | "pending" | "info"
}

export const mockCommodities: Commodity[] = [
  {
    id: "coffee-001",
    type: "Agriculture",
    name: "Brazilian Coffee Beans",
    icon: "coffee",
    risk: "Low",
    targetApy: 12.5,
    duration: 45,
    amountRequired: 250000,
    amountFunded: 187500,
    description: "5000 bags of premium Arabica coffee beans from Brazilian highlands",
    origin: "São Paulo, Brazil",
    destination: "Rotterdam, Netherlands",
    status: "Funding",
    shipmentId: "BRZ-CFE-2024-001",
    insuranceValue: 275000,
    transportMethod: "Container Ship",
  },
  {
    id: "copper-002",
    type: "Metals",
    name: "Copper Cathodes",
    icon: "boxes",
    risk: "Medium",
    targetApy: 18.2,
    duration: 60,
    amountRequired: 1500000,
    amountFunded: 1350000,
    description: "400 metric tons of 99.99% pure copper cathodes",
    origin: "Santiago, Chile",
    destination: "Shanghai, China",
    status: "Funding",
    shipmentId: "CHL-COP-2024-402",
    insuranceValue: 1650000,
    transportMethod: "Cargo Vessel",
  },
  {
    id: "wheat-003",
    type: "Agriculture",
    name: "Spring Wheat",
    icon: "wheat",
    risk: "Low",
    targetApy: 9.8,
    duration: 30,
    amountRequired: 180000,
    amountFunded: 180000,
    description: "2500 tons of high-grade spring wheat for milling",
    origin: "Kansas, USA",
    destination: "Mumbai, India",
    status: "In Transit",
    shipmentId: "USA-WHT-2024-156",
    insuranceValue: 198000,
    transportMethod: "Bulk Carrier",
  },
  {
    id: "oil-004",
    type: "Energy",
    name: "Crude Oil WTI",
    icon: "fuel",
    risk: "High",
    targetApy: 22.4,
    duration: 90,
    amountRequired: 3200000,
    amountFunded: 960000,
    description: "50,000 barrels of West Texas Intermediate crude oil",
    origin: "Houston, USA",
    destination: "Singapore",
    status: "Funding",
    shipmentId: "USA-OIL-2024-789",
    insuranceValue: 3520000,
    transportMethod: "Oil Tanker",
  },
  {
    id: "aluminum-005",
    type: "Metals",
    name: "Aluminum Ingots",
    icon: "blocks",
    risk: "Low",
    targetApy: 11.3,
    duration: 45,
    amountRequired: 420000,
    amountFunded: 420000,
    description: "600 metric tons of high-purity aluminum ingots",
    origin: "Dubai, UAE",
    destination: "Hamburg, Germany",
    status: "In Transit",
    shipmentId: "UAE-ALU-2024-234",
    insuranceValue: 462000,
    transportMethod: "Container Ship",
  },
  {
    id: "soybeans-006",
    type: "Agriculture",
    name: "Organic Soybeans",
    icon: "leaf",
    risk: "Medium",
    targetApy: 14.7,
    duration: 40,
    amountRequired: 195000,
    amountFunded: 97500,
    description: "3000 tons of certified organic non-GMO soybeans",
    origin: "Mato Grosso, Brazil",
    destination: "Tokyo, Japan",
    status: "Funding",
    shipmentId: "BRZ-SOY-2024-098",
    insuranceValue: 214500,
    transportMethod: "Bulk Carrier",
  },
]

export const mockPortfolio: PortfolioSummary = {
  totalValue: 842350,
  totalProfit: 127845,
  cashInWallet: 45230,
  roi: 17.9,
}

export const mockTransactions: Transaction[] = [
  {
    id: "txn-001",
    type: "Dividend",
    amount: 12450,
    date: "2024-12-20",
    commodity: "Spring Wheat",
    status: "Completed",
  },
  {
    id: "txn-002",
    type: "Investment",
    amount: -75000,
    date: "2024-12-18",
    commodity: "Copper Cathodes",
    status: "Completed",
  },
  {
    id: "txn-003",
    type: "Deposit",
    amount: 50000,
    date: "2024-12-15",
    status: "Completed",
  },
  {
    id: "txn-004",
    type: "Dividend",
    amount: 8920,
    date: "2024-12-12",
    commodity: "Aluminum Ingots",
    status: "Completed",
  },
  {
    id: "txn-005",
    type: "Investment",
    amount: -45000,
    date: "2024-12-10",
    commodity: "Brazilian Coffee",
    status: "Completed",
  },
  {
    id: "txn-006",
    type: "Withdrawal",
    amount: -25000,
    date: "2024-12-08",
    status: "Completed",
  },
]

export const mockPerformanceData: PerformanceData[] = [
  { date: "2024-07", portfolio: 680000, market: 695000 },
  { date: "2024-08", portfolio: 705000, market: 708000 },
  { date: "2024-09", portfolio: 725000, market: 715000 },
  { date: "2024-10", portfolio: 760000, market: 745000 },
  { date: "2024-11", portfolio: 805000, market: 780000 },
  { date: "2024-12", portfolio: 842350, market: 800000 },
]

export const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    type: "dividend",
    title: "Dividend Received",
    message: "You've received $12,450 from Spring Wheat shipment",
    timestamp: "2024-12-24T10:30:00Z",
    read: false,
  },
  {
    id: "notif-002",
    type: "shipment",
    title: "Shipment Update",
    message: "Copper Cathodes has reached 90% funding milestone",
    timestamp: "2024-12-24T08:15:00Z",
    read: false,
  },
  {
    id: "notif-003",
    type: "investment",
    title: "Investment Confirmed",
    message: "Your $75,000 investment in Copper Cathodes is confirmed",
    timestamp: "2024-12-23T16:45:00Z",
    read: true,
  },
  {
    id: "notif-004",
    type: "alert",
    title: "Price Alert",
    message: "Crude Oil WTI prices increased by 5.2% today",
    timestamp: "2024-12-23T14:20:00Z",
    read: true,
  },
  {
    id: "notif-005",
    type: "shipment",
    title: "Shipment Departed",
    message: "Aluminum Ingots shipment has departed from Dubai",
    timestamp: "2024-12-22T11:00:00Z",
    read: true,
  },
]

export const mockActivity: ActivityItem[] = [
  {
    id: "act-001",
    type: "dividend",
    title: "Dividend Payment",
    description: "Spring Wheat - Shipment completed",
    amount: 12450,
    timestamp: "2024-12-20T10:30:00Z",
    status: "success",
  },
  {
    id: "act-002",
    type: "investment",
    title: "New Investment",
    description: "Copper Cathodes - 5% stake",
    amount: -75000,
    timestamp: "2024-12-18T14:20:00Z",
    status: "success",
  },
  {
    id: "act-003",
    type: "deposit",
    title: "Account Deposit",
    description: "Bank transfer completed",
    amount: 50000,
    timestamp: "2024-12-15T09:15:00Z",
    status: "success",
  },
  {
    id: "act-004",
    type: "dividend",
    title: "Dividend Payment",
    description: "Aluminum Ingots - Quarterly distribution",
    amount: 8920,
    timestamp: "2024-12-12T11:45:00Z",
    status: "success",
  },
  {
    id: "act-005",
    type: "investment",
    title: "New Investment",
    description: "Brazilian Coffee - 3% stake",
    amount: -45000,
    timestamp: "2024-12-10T16:30:00Z",
    status: "success",
  },
  {
    id: "act-006",
    type: "shipment",
    title: "Shipment Status Update",
    description: "Spring Wheat - In transit to Mumbai",
    timestamp: "2024-12-08T08:00:00Z",
    status: "info",
  },
  {
    id: "act-007",
    type: "withdrawal",
    title: "Withdrawal Processed",
    description: "Transfer to bank account",
    amount: -25000,
    timestamp: "2024-12-05T13:20:00Z",
    status: "success",
  },
]
