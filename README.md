# DeciDwell

A rent-vs-buy calculator tailored for the Norwegian housing market. Enter your numbers and get a clear recommendation based on long-term net worth — not just monthly costs.

## Features

- **Quick mode** — core inputs: rent, purchase price, down payment, mortgage rate, HOA fee, and time horizon
- **Advanced mode** — adds shared debt, tax deduction on interest, maintenance, municipal fees, home insurance, property tax, contents insurance, electricity, internet, and parking
- Inflation-adjusted net worth comparison over time
- Breakeven year detection
- Interactive charts (Recharts)
- Norwegian and English UI (i18next)

## How it works

The calculator models two scenarios side by side:

**Buyer** — pays mortgage + HOA + optional extras. Builds equity as the property appreciates.

**Renter** — invests the down payment and closing costs upfront, then invests any monthly surplus vs. the buyer's costs. Portfolio grows at the specified investment return rate.

Both final net worths are deflated to today's kroner using the inflation rate. Whoever ends up with more wins.

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [Recharts](https://recharts.org/) for charts
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
