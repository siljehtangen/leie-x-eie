# LeieXEie

En kalkulator for leie eller eie, tilpasset det norske boligmarkedet. Legg inn tallene dine og få en tydelig anbefaling basert på formuen din på lang sikt.

---

## Skjermbilder

<img src="assets/quick-1.png" width="680" alt="Forsiden – skjema i enkel modus">

<table>
<tr>
<td><img src="assets/quick-2.png" width="335" alt="Resultater – grafer for formue og månedlige kostnader"></td>
<td><img src="assets/quick-3.png" width="335" alt="Anbefaling med break-even-år"></td>
</tr>
<tr>
<td><img src="assets/quick-4.png" width="335" alt="Beregningsdetaljer med formler"></td>
<td><img src="assets/quick-5.png" width="335" alt="Formue år for år"></td>
</tr>
</table>

## Funksjoner

- **Enkel modus** – de viktigste tallene:
  husleie, kjøpesum, egenkapital, rente, felleskostnader og hvor mye de øker hvert år, og tidshorisont

- **Avansert modus** – full modell med norske skatteregler:
  - Borettslag eller selveier: i borettslag betales ingen dokumentavgift (2,5 %), og fellesgjelden nedbetales over sin egen løpetid, med rentefradrag
  - Avdragsfri periode med påfølgende nedbetaling
  - Renteendring fra et valgt år, med nytt terminbeløp beregnet ut fra restgjelden
  - Vedlikeholdskostnader justert for inflasjon år for år
  - Kommunale avgifter, boligforsikring og eiendomsskatt
  - Innboforsikring, strøm, internett og parkering regnes med i begge alternativene
  - **Depositum** (3 måneders husleie) som gir sparerente mens det står på depositumskontoen
  - **Formuesskatt**: primærbolig verdsettes til 25 %, mot 80 % for aksjer og fond – en av de viktigste strukturelle fordelene ved å eie bolig i Norge. Par som skattlegges samlet, får dobbelt bunnfradrag
  - **Avkastning etter skatt**: enkel modus forutsetter sparekonto (renter skattes med 22 % hvert år). I avansert modus skattes ASK-gevinst med 37,84 % ved uttak, etter skjerming. Gevinst ved salg av egen bolig er skattefri

- Formue i dagens kroner (justert for inflasjon)
- Break-even-år: når det ene alternativet går forbi det andre
- Stresstest av terminbeløpet (rente + 3 prosentpoeng, minst 7 %, som i utlånsforskriften), med høyere rente på fellesgjeld og annen gjeld priset til stresstrenten
- Følsomhetstabell: hvordan svaret endres med boligprisvekst og rente
- Detaljert beregning år for år (kostnader, egenkapital og porteføljevekst)
- PDF-eksport av hele beregningen (`@react-pdf/renderer`)
- Interaktive grafer (Recharts)
- Norsk og engelsk språk (i18next)

## Slik fungerer det

Kalkulatoren regner på to alternativer side om side:

**Kjøper** – betaler boliglån (med valgfri avdragsfri periode), felleskostnader og alle eierkostnader. Bygger egenkapital etter hvert som boligen stiger i verdi, skattefritt. Formuesskatt beregnes av 25 % av boligverdien (mot 80 % for aksjer og fond).

**Leietaker** – sparer egenkapitalen og kjøpsomkostningene fra start (minus et depositum på 3 måneders husleie). Den som har lavest kostnad, sparer differansen hver måned. Enkel modus: renter på sparekonto skattes med 22 % hvert år. Avansert modus: ASK-gevinst skattes med 37,84 % ved uttak. Fond regnes med i formuesskatten til 80 % av verdien, bankinnskudd til 100 %.

Begge alternativene regnes om til dagens kroneverdi. Det alternativet som gir høyest formue, vinner.

## Teknologi

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [Recharts](https://recharts.org/) for grafer
- [@react-pdf/renderer](https://react-pdf.org/) for PDF-eksport
- [react-i18next](https://react.i18next.com/) for språk (norsk og engelsk)
- [lucide-react](https://lucide.dev/) for ikoner

## Kom i gang

```bash
npm install
npm run dev
```

Åpne [http://localhost:5173](http://localhost:5173).

## Skript

| Kommando          | Beskrivelse                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Starter utviklingsserveren      |
| `npm run build`   | Bygger for produksjon           |
| `npm run preview` | Forhåndsviser produksjonsbygget |

## Ansvarsfraskrivelse

Kun til læring. Ikke finansiell rådgivning.
