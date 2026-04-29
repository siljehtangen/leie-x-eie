# LeieXEie

> Norwegian rent-vs-buy calculator — compare long-term net worth, not just monthly costs.

[English](#english) · [Norsk](#norsk)

---

## Screenshots

<img src="assets/quick-1.png" width="680" alt="Landing page — Quick mode input form">

<table>
<tr>
<td><img src="assets/quick-2.png" width="335" alt="Results — net worth and monthly cost charts"></td>
<td><img src="assets/quick-3.png" width="335" alt="Recommendation card with breakeven year"></td>
</tr>
<tr>
<td><img src="assets/quick-4.png" width="335" alt="Calculation breakdown with formulas"></td>
<td><img src="assets/quick-5.png" width="335" alt="Year-by-year net worth table"></td>
</tr>
</table>

---

## English

**LeieXEie** ("rent vs. own") models two scenarios side by side — renting and buying — and tells you which leaves you wealthier after *N* years, in today's kroner.

### Features

**Quick mode** — six core inputs: rent, purchase price, down payment, mortgage rate, HOA fee, and time horizon. Fast estimate, no fuss.

**Advanced mode** — full Norwegian financial model:

- Shared debt (fellesgjeld) as a permanent liability with its own tax-deductible interest
- Interest-only period with recalculated amortisation afterwards
- Maintenance costs inflation-adjusted year over year
- Municipal fees, home insurance, property tax
- Contents insurance, electricity, internet, and parking (electricity and internet applied to both sides to cancel asymmetry)
- Security deposit opportunity cost (3 months rent, returned at face value)
- **Wealth tax**: primary residence valued at 25% of market value vs. financial assets at 80% — one of the largest structural advantages of homeownership in Norway
- **After-tax investment returns**: configurable effective tax rate (default 37.84% under aksjonærmodellen); home appreciation remains tax-free

**Output:**

- Inflation-deflated net worth comparison (real kroner)
- Breakeven year detection
- Year-by-year breakdown table (costs, equity, portfolio growth)
- PDF export of the full breakdown
- Interactive charts (net worth over time, monthly costs)
- Norwegian and English UI

### How it works

**Buyer** — pays mortgage (with optional interest-only period) + HOA + all ownership costs. Builds equity as the property appreciates tax-free. Wealth tax on 25% of home value.

**Renter** — invests the down payment and closing costs upfront (minus a 3-month security deposit), then invests any monthly surplus vs. the buyer's total costs. Investment returns taxed annually at the configured rate. Wealth tax on 80% of portfolio value.

Both final net worths are deflated to today's kroner. The higher number wins.

### Stack

| Library | Purpose |
|---|---|
| Vite 5 + React 18 + TypeScript | App framework |
| Recharts | Interactive charts |
| @react-pdf/renderer | PDF export |
| react-i18next | Norwegian / English UI |
| lucide-react | Icons |

### Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Type-check without emitting |

### Disclaimer

For educational purposes only. Not financial advice.

---

## Norsk

**LeieXEie** modellerer to scenarioer side om side — leie og kjøp — og viser deg hvilken strategi gir høyest formue etter *N* år, i dagens kroner.

### Funksjoner

**Hurtigmodus** — seks nøkkelinput: husleie, kjøpesum, egenkapital, boliglånsrente, HOA-avgift og tidshorisont. Rask estimering uten kompliserte innstillinger.

**Avansert modus** — fullstendig norsk finansmodell:

- Fellesgjeld som permanent forpliktelse med egen rentefradragsberettiget rente
- Avdragsfri periode med ny amortiseringsplan etterpå
- Vedlikeholdskostnader justert for inflasjon hvert år
- Kommunale avgifter, innboforsikring, boligforsikring, eiendomsskatt
- Innboforsikring, strøm, internett og parkering (strøm og internett lagt til begge sider for å unngå asymmetri)
- Depositumets alternativkostnad (3 måneder husleie, tilbakebetalt til pålydende)
- **Formuesskatt**: primærbolig verdsatt til 25 % av markedsverdi vs. finansielle eiendeler til 80 % — en av de største strukturelle fordelene ved å eie bolig i Norge
- **Avkastning etter skatt**: konfigurerbar effektiv skattesats (standard 37,84 % under aksjonærmodellen); boligverdistigning er skattefri

**Resultat:**

- Formuesammenligning deflatert til reelle kroner
- Deteksjon av break-even-år
- Detaljert beregningstabell år for år (kostnader, egenkapital, porteføljevekst)
- PDF-eksport av hele beregningen
- Interaktive grafer (formue over tid, månedlige kostnader)
- Norsk og engelsk brukergrensesnitt

### Slik fungerer det

**Kjøper** — betaler boliglån (med valgfri avdragsfri periode) + fellesutgifter + alle eierkostnader. Bygger egenkapital gjennom skattefri boligverdistigning. Formuesskatt på 25 % av boligverdi.

**Leietaker** — investerer egenkapital og omkostninger ved oppstart (minus 3 måneder depositum), og investerer deretter eventuelt månedlig overskudd sammenlignet med kjøpers totale kostnader. Avkastning beskattes årlig etter konfigurert sats. Formuesskatt på 80 % av porteføljeverdi.

Begge sluttformuene deflateres til dagens kroner. Den høyeste verdien vinner.

### Teknisk stack

| Bibliotek | Formål |
|---|---|
| Vite 5 + React 18 + TypeScript | Applikasjonsrammeverk |
| Recharts | Interaktive grafer |
| @react-pdf/renderer | PDF-eksport |
| react-i18next | Norsk / engelsk brukergrensesnitt |
| lucide-react | Ikoner |

### Kom i gang

```bash
npm install
npm run dev
```

Åpne [http://localhost:5173](http://localhost:5173).

### Skript

| Kommando | Beskrivelse |
|---|---|
| `npm run dev` | Start utviklingsserver |
| `npm run build` | Produksjonsbygg |
| `npm run preview` | Forhåndsvis produksjonsbygg |
| `npm run typecheck` | Typesjekk uten å kompilere |

### Ansvarsfraskrivelse

Kun til informasjonsformål. Ikke finansiell rådgivning.
