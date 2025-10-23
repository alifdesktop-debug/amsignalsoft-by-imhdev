// Market configuration with categories

export interface Market {
  id: string
  name: string
  type: "otc"
  category: "currencies" | "commodities" | "stocks"
}

export const markets: Market[] = [
  // Currencies
  { id: "usd-brl-otc", name: "USD/BRL (OTC)", type: "otc", category: "currencies" },
  { id: "usd-bdt-otc", name: "USD/BDT (OTC)", type: "otc", category: "currencies" },
  { id: "nzd-chf-otc", name: "NZD/CHF (OTC)", type: "otc", category: "currencies" },
  { id: "eur-aud-otc", name: "EUR/AUD (OTC)", type: "otc", category: "currencies" },
  { id: "eur-jpy-otc", name: "EUR/JPY (OTC)", type: "otc", category: "currencies" },
  { id: "gbp-chf-otc", name: "GBP/CHF (OTC)", type: "otc", category: "currencies" },
  { id: "usd-cad-otc", name: "USD/CAD (OTC)", type: "otc", category: "currencies" },
  { id: "usd-chf-otc", name: "USD/CHF (OTC)", type: "otc", category: "currencies" },
  { id: "usd-idr-otc", name: "USD/IDR (OTC)", type: "otc", category: "currencies" },
  { id: "eur-cad-otc", name: "EUR/CAD (OTC)", type: "otc", category: "currencies" },
  { id: "eur-chf-otc", name: "EUR/CHF (OTC)", type: "otc", category: "currencies" },
  { id: "usd-inr-otc", name: "USD/INR (OTC)", type: "otc", category: "currencies" },
  { id: "usd-ngn-otc", name: "USD/NGN (OTC)", type: "otc", category: "currencies" },
  { id: "aud-chf-otc", name: "AUD/CHF (OTC)", type: "otc", category: "currencies" },
  { id: "aud-jpy-otc", name: "AUD/JPY (OTC)", type: "otc", category: "currencies" },
  { id: "usd-php-otc", name: "USD/PHP (OTC)", type: "otc", category: "currencies" },
  { id: "gbp-aud-otc", name: "GBP/AUD (OTC)", type: "otc", category: "currencies" },
  { id: "usd-cop-otc", name: "USD/COP (OTC)", type: "otc", category: "currencies" },
  { id: "nzd-cad-otc", name: "NZD/CAD (OTC)", type: "otc", category: "currencies" },
  { id: "usd-mxn-otc", name: "USD/MXN (OTC)", type: "otc", category: "currencies" },
  { id: "usd-zar-otc", name: "USD/ZAR (OTC)", type: "otc", category: "currencies" },
  { id: "eur-sgd-otc", name: "EUR/SGD (OTC)", type: "otc", category: "currencies" },
  { id: "nzd-usd-otc", name: "NZD/USD (OTC)", type: "otc", category: "currencies" },
  { id: "aud-cad-otc", name: "AUD/CAD (OTC)", type: "otc", category: "currencies" },
  { id: "gbp-jpy-otc", name: "GBP/JPY (OTC)", type: "otc", category: "currencies" },
  { id: "usd-jpy-otc", name: "USD/JPY (OTC)", type: "otc", category: "currencies" },
  { id: "usd-pkr-otc", name: "USD/PKR (OTC)", type: "otc", category: "currencies" },
  { id: "usd-ars-otc", name: "USD/ARS (OTC)", type: "otc", category: "currencies" },
  { id: "aud-usd-otc", name: "AUD/USD (OTC)", type: "otc", category: "currencies" },
  { id: "cad-chf-otc", name: "CAD/CHF (OTC)", type: "otc", category: "currencies" },
  { id: "chf-jpy-otc", name: "CHF/JPY (OTC)", type: "otc", category: "currencies" },
  { id: "eur-gbp-otc", name: "EUR/GBP (OTC)", type: "otc", category: "currencies" },
  { id: "usd-dzd-otc", name: "USD/DZD (OTC)", type: "otc", category: "currencies" },
  { id: "usd-try-otc", name: "USD/TRY (OTC)", type: "otc", category: "currencies" },
  { id: "nzd-jpy-otc", name: "NZD/JPY (OTC)", type: "otc", category: "currencies" },
  { id: "eur-nzd-otc", name: "EUR/NZD (OTC)", type: "otc", category: "currencies" },

  // Commodities
  { id: "ukbrent-otc", name: "UKBrent (OTC)", type: "otc", category: "commodities" },
  { id: "gold-otc", name: "Gold (OTC)", type: "otc", category: "commodities" },
  { id: "uscrude-otc", name: "USCrude (OTC)", type: "otc", category: "commodities" },
  { id: "silver-otc", name: "Silver (OTC)", type: "otc", category: "commodities" },

  // Stocks
  { id: "intel-otc", name: "Intel (OTC)", type: "otc", category: "stocks" },
  { id: "microsoft-otc", name: "Microsoft (OTC)", type: "otc", category: "stocks" },
  { id: "facebook-otc", name: "FACEBOOK INC (OTC)", type: "otc", category: "stocks" },
  { id: "pfizer-otc", name: "Pfizer Inc (OTC)", type: "otc", category: "stocks" },
  { id: "amex-otc", name: "American Express (OTC)", type: "otc", category: "stocks" },
]

export const currencyPairs = markets

export function isMarketOpen(type: "otc"): boolean {
  return true // OTC markets always open
}

export function getMarketStatus(type: "otc"): "open" | "closed" {
  return isMarketOpen(type) ? "open" : "closed"
}

export function formatPairName(pairId: string): string {
  const market = markets.find((p) => p.id === pairId)
  return market ? market.name : pairId
}

export function getMarketsByCategory(category: "currencies" | "commodities" | "stocks"): Market[] {
  return markets.filter((m) => m.category === category)
}
