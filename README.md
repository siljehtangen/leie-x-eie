# LeieXEie

A rent-vs-buy calculator tailored for the Norwegian housing market. Enter your numbers and get a clear recommendation based on long-term net worth — not just monthly costs.

## Features

- **Quick mode** — core inputs: rent, purchase price, down payment, mortgage rate, HOA fee, and time horizon
- **Advanced mode** — full Norwegian financial model:
  - Shared debt as permanent liability with its own tax-deductible interest
  - Interest-only period with recalculated amortisation after
  - Maintenance costs inflation-adjusted year-over-year
  - Municipal fees, home insurance, property tax
  - Contents insurance, electricity, internet, parking (electricity/internet applied to both sides to avoid asymmetry)
  - Security deposit opportunity cost (3 months rent, returned at face value at end)
  - **Wealth tax**: primary residence valued at 25% vs. financial assets at 80% — one of the largest structural advantages of homeownership in Norway
  - **After-tax investment returns**: configurable effective tax rate (default 37.84% under aksjonærmodellen); home appreciation remains tax-free
- Inflation-deflated net worth comparison (real kroner)
- Breakeven year detection
- Detailed calculation breakdown (year-by-year costs, equity, and portfolio growth)
- PDF export of the full calculation breakdown (`@react-pdf/renderer`)
- Interactive charts (Recharts)
- Norwegian and English UI (i18next)

## How it works

The calculator models two scenarios side by side:

**Buyer** — pays mortgage (with optional interest-only period) + HOA + all ownership costs. Builds equity as the property appreciates tax-free. Taxed on wealth at 25% of home value (vs. 80% for financial assets).

**Renter** — invests the down payment and closing costs upfront (minus a 3-month security deposit), then invests any monthly surplus vs. the buyer's costs. Investment returns are taxed annually at the configured rate. Portfolio taxed on wealth at 80% of market value.

Both final net worths are deflated to today's kroner using the inflation rate. Whoever ends up with more wins.

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [Recharts](https://recharts.org/) for charts
- [@react-pdf/renderer](https://react-pdf.org/) for PDF export
- [react-i18next](https://react.i18next.com/) for i18n (Norwegian / English)
- [lucide-react](https://lucide.dev/) for icons

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Disclaimer

For educational purposes only. Not financial advice.
