# TerraShield

Climate-risk intelligence powered by real environmental observations from the JKUAT Conduit Weather Station.

## What TerraShield does

TerraShield transforms real environmental observations into explainable climate-risk insights. It follows the pipeline:

```
JKUAT Conduit observations
        ↓
   Normalization
        ↓
 TerraShield risk engine
        ↓
   Risk insight
        ↓
   Scenario lab
        ↓
 Decision support
        ↓
      Impact
```

## JKUAT Conduit integration

TerraShield integrates with the [JKUAT Conduit Weather Station API](https://conduit.jhubafrica.com/data.php) to use real environmental observations as inputs to its risk models.

### Architecture

- **Server-side API route**: `/api/conduit/weather` fetches data from the Conduit API. The API key and email are never exposed to the browser.
- **Normalization layer**: `lib/climate/conduit.ts` converts raw sensor string values into typed numbers and selects the latest observation by timestamp.
- **Risk engine integration**: Real Conduit rainfall feeds the flood model; real Conduit temperature feeds the heat model.
- **Scenario Lab**: Sliders initialize from the latest Conduit observations, letting users explore hypothetical changes.
- **Fallback**: If Conduit is unavailable, TerraShield falls back to demo data and clearly labels it.

### Environment variables

```bash
CONDUIT_API_URL=https://conduit.jhubafrica.com/data.php
CONDUIT_API_KEY=        # Set in .env.local or deployment — never commit
CONDUIT_EMAIL=          # Set in .env.local or deployment — never commit
CONDUIT_ENABLED=true
CLIMATE_DATA_PROVIDER=conduit
```

**Security**: The API key and email are server-side only. They are never prefixed with `NEXT_PUBLIC_` and never sent to the browser.

### Conduit sensor fields

The API returns observations with these fields:

| Category | Fields |
|----------|--------|
| Precipitation | rg1, rg2, rg1tt, rg2tt, rg1tp, rg2tp |
| Temperature | temp_bmx, temp_mcp, temp_sht, heat_idx, wet_bulb_temp, wet_bulb_globe_temp |
| Humidity | humidity_sht |
| Pressure | press_bmx |
| Solar/UV | si1145_vis, si1145_ir, si1145_uv |
| Wind | wind_spd, wind_dir, wind_gust, wind_gust_dir |

### Risk engine inputs

- **Flood model**: `rainfallIntensity` comes from `rg1tt` (daily rainfall total), clamped to 0–150 mm
- **Heat model**: `temperatureC` comes from `temp_sht`, clamped to 20–45°C

### Observed vs modeled vs scenario

- **OBSERVED** — real Conduit data, labeled "JKUAT CONDUIT · OBSERVED DATA"
- **MODELED** — TerraShield risk scores, labeled "MODELED RISK"
- **SCENARIO** — user-adjusted hypothetical values, labeled "SCENARIO · NOT OBSERVED"

## Data limitations

- Conduit is a single weather station — observations should not be treated as area-wide measurements
- Risk scores are modeled estimates, not official forecasts or warnings
- Scores should not replace local authority guidance

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Leaflet (interactive map)
- Zod (API response validation)
- SWR (data fetching)

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
