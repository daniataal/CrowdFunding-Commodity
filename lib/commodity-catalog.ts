export type CommodityTemplate = {
  key: string
  name: string
  type: "Agriculture" | "Energy" | "Metals"
  icon:
  | "coffee"
  | "wheat"
  | "fuel"
  | "boxes"
  | "leaf"
  | "gold"
  | "silver"
  | "diesel"
  | "titanium"
  | "palladium"
  | "copper"
  // Optional sane defaults to speed up listing creation
  risk?: "Low" | "Medium" | "High"
  targetApy?: number
  duration?: number
  insuranceValue?: number
  transportMethod?: string
  // Metals-specific optional defaults
  metalForm?: string
  purityPercent?: number
  karat?: number
  grossWeightTroyOz?: number
  refineryName?: string
  refineryLocation?: string
}

export const COMMODITY_TEMPLATES: CommodityTemplate[] = [
  {
    key: "coffee",
    name: "Brazilian Coffee Beans",
    type: "Agriculture",
    icon: "coffee",
    risk: "Low",
    targetApy: 12.5,
    duration: 45,
    insuranceValue: 275000,
    transportMethod: "Container Ship",
  },
  {
    key: "wheat",
    name: "Spring Wheat",
    type: "Agriculture",
    icon: "wheat",
    risk: "Low",
    targetApy: 9.8,
    duration: 30,
    insuranceValue: 198000,
    transportMethod: "Bulk Carrier",
  },
  {
    key: "oil",
    name: "Crude Oil WTI",
    type: "Energy",
    icon: "fuel",
    risk: "High",
    targetApy: 22.4,
    duration: 90,
    insuranceValue: 3520000,
    transportMethod: "Oil Tanker",
  },
  {
    key: "copper",
    name: "Copper Cathodes",
    type: "Metals",
    icon: "boxes",
    risk: "Medium",
    targetApy: 18.2,
    duration: 60,
    insuranceValue: 1650000,
    transportMethod: "Cargo Vessel",
  },
  {
    key: "gold",
    name: "Gold",
    type: "Metals",
    icon: "gold",
    risk: "Medium",
    targetApy: 11.8,
    duration: 60,
    insuranceValue: 2500000,
    transportMethod: "Secured Vault Transfer",
    metalForm: "BULLION",
    purityPercent: 99.99,
    karat: 24,
    grossWeightTroyOz: 1000,
    refineryName: "Valcambi",
    refineryLocation: "Switzerland",
  },
  {
    key: "silver",
    name: "Silver",
    type: "Metals",
    icon: "silver",
    risk: "Medium",
    targetApy: 13.2,
    duration: 60,
    insuranceValue: 1200000,
    transportMethod: "Secured Vault Transfer",
    metalForm: "BULLION",
    purityPercent: 99.9,
    grossWeightTroyOz: 5000,
    refineryName: "Metalor",
    refineryLocation: "Switzerland",
  },
  {
    key: "diamonds",
    name: "Diamonds",
    type: "Metals",
    icon: "boxes",
    risk: "High",
    targetApy: 24.0,
    duration: 90,
    insuranceValue: 3000000,
    transportMethod: "Secured Vault Transfer",
    metalForm: "ROUGH_DIAMONDS",
    refineryName: "Diamond Sorting Facility",
    refineryLocation: "Antwerp, Belgium",
  },
  {
    key: "diesel",
    name: "Diesel Fuel (ULSD)",
    type: "Energy",
    icon: "diesel",
    risk: "High",
    targetApy: 20.5,
    duration: 45,
    insuranceValue: 1800000,
    transportMethod: "Tanker Truck",
  },
  {
    key: "titanium",
    name: "Titanium Ingots",
    type: "Metals",
    icon: "titanium",
    risk: "High",
    targetApy: 19.1,
    duration: 75,
    insuranceValue: 2100000,
    transportMethod: "Cargo Vessel",
  },
  {
    key: "palladium",
    name: "Palladium (Pd) Sponge",
    type: "Metals",
    icon: "palladium",
    risk: "High",
    targetApy: 21.7,
    duration: 75,
    insuranceValue: 1600000,
    transportMethod: "Secured Vault Transfer",
  },
  {
    key: "copper-refined",
    name: "Refined Copper (Cu) Rods",
    type: "Metals",
    icon: "copper",
    risk: "Medium",
    targetApy: 16.4,
    duration: 60,
    insuranceValue: 1500000,
    transportMethod: "Cargo Vessel",
  },
  {
    key: "soy",
    name: "Organic Soybeans",
    type: "Agriculture",
    icon: "leaf",
    risk: "Medium",
    targetApy: 14.7,
    duration: 40,
    insuranceValue: 214500,
    transportMethod: "Bulk Carrier",
  },
]

export const ICON_TO_IMAGE: Record<CommodityTemplate["icon"], string> = {
  coffee: "/commodities/coffee.svg",
  wheat: "/commodities/wheat.svg",
  fuel: "/commodities/fuel.svg",
  boxes: "/commodities/metals.svg",
  leaf: "/commodities/leaf.svg",
  gold: "/commodities/gold.svg",
  silver: "/commodities/silver.svg",
  diesel: "/commodities/diesel.svg",
  titanium: "/commodities/titanium.svg",
  palladium: "/commodities/palladium.svg",
  copper: "/commodities/copper.svg",
}


