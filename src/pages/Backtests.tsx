import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Backtests() {
  const [strategies, setStrategies] = useState<any[]>([])
  const [backtests, setBacktests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  // Backtest form
  const [selectedStrategy, setSelectedStrategy] = useState('')
  const [startDate, setStartDate] = useState('2020-01-01')
  const [endDate, setEndDate] = useState('2025-12-31')
  const [capital, setCapital] = useState(1000000)

  const load = async () => {
    const [s, b] = await Promise.all([
      api.getStrategies().catch(() => ({ strategies: [] })),
      api.getBacktests().catch(() => ({ backtests: [] })),
    ])
    setStrategies(s.strategies)
    setBacktests(b.backtests)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRun = async () => {
    if (!selectedStrategy) return
    setRunning(true)
    try {
      await api.runBacktest(selectedStrategy, {
        start_date: startDate,
        end_date: endDate,
        initial_capital: capital,
      })
      // Poll for completion
      setTimeout(() => load(), 2000)
      setTimeout(() => load(), 5000)
      setTimeout(() => load(), 10000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Backtests</h1>

      {/* Run backtest form */}
      <div className="bg-[#1a1b23] rounded-lg p-4 border border-[#2e303a] mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Run Backtest</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Strategy</label>
            <select value={selectedStrategy} onChange={e => setSelectedStrategy(e.target.value)}
              className="px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm min-w-[200px]">
              <option value="">Select...</option>
              {strategies.map(s => (
                <option key={s.id} value={s.id}>{s.config?.name || s.id.slice(0, 8)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Capital ($)</label>
            <input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))}
              className="px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm w-36" />
          </div>
          <button onClick={handleRun} disabled={running || !selectedStrategy}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm transition-colors">
            {running ? 'Running...' : 'Run Backtest'}
          </button>
        </div>
      </div>

      {/* Results */}
      {backtests.length === 0 ? (
        <p className="text-gray-500">No backtests yet. Select a strategy and run one.</p>
      ) : (
        <div className="space-y-3">
          {backtests.map((bt: any) => (
            <div key={bt.id} className="bg-[#1a1b23] rounded-lg p-4 border border-[#2e303a]">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    bt.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                    bt.status === 'failed' ? 'bg-red-900/50 text-red-400' :
                    'bg-yellow-900/50 text-yellow-400'
                  }`}>{bt.status}</span>
                  <span className="text-gray-500 text-xs ml-2">{new Date(bt.created_at).toLocaleString()}</span>
                </div>
              </div>
              {bt.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Metric label="Sharpe" value={bt.metrics.sharpe_ratio?.toFixed(2)} />
                  <Metric label="Alpha" value={`${bt.metrics.alpha?.toFixed(1)}%`} />
                  <Metric label="Return" value={`${bt.metrics.total_return?.toFixed(1)}%`} positive={bt.metrics.total_return >= 0} />
                  <Metric label="Max DD" value={`${bt.metrics.max_drawdown?.toFixed(1)}%`} />
                  <Metric label="Win Rate" value={`${(bt.metrics.win_rate * 100)?.toFixed(0)}%`} />
                  <Metric label="Trades" value={bt.metrics.trades} />
                  <Metric label="Profit Factor" value={bt.metrics.profit_factor?.toFixed(2) || '—'} />
                  <Metric label="Sortino" value={bt.metrics.sortino_ratio?.toFixed(2) || '—'} />
                </div>
              )}
              {bt.error && <p className="text-red-400 text-sm mt-2">{bt.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, positive }: { label: string; value: any; positive?: boolean }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className={`text-sm font-medium ${positive === true ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}
