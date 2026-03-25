# AlphaScout Frontend

React dashboard for the AlphaScout trading platform.

## Stack

- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: TradingView Lightweight Charts
- **Auth**: Supabase Auth (JWT)
- **API**: https://api.alphascoutai.com

## Pages

- Dashboard (overview, active deployments, market snapshot)
- Strategy Builder (create/edit trading strategies)
- Backtest Results (equity curves, metrics, trade list)
- Optimization Runs (experiment log, best strategy evolution)
- Deployments (paper trading P&L, positions)
- Chat Agent (streaming AI assistant)

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment

```
VITE_API_URL=https://api.alphascoutai.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```
