import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const SIGNAL_TYPES = ['current_drop', 'period_drop', 'daily_drop', 'selloff', 'earnings_momentum'] as const

export default function Strategies() {
  const [strategies, setStrategies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [universeType, setUniverseType] = useState('sector')
  const [sector, setSector] = useState('Technology')
  const [tickers, setTickers] = useState('')
  const [signalType, setSignalType] = useState<string>('current_drop')
  const [threshold, setThreshold] = useState(-30)
  const [maxPositions, setMaxPositions] = useState(5)
  const [stopLoss, setStopLoss] = useState(-30)
  const [takeProfit, setTakeProfit] = useState(80)

  const load = () => {
    api.getStrategies().then(res => {
      setStrategies(res.strategies)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const config: any = {
        name,
        universe: universeType === 'sector'
          ? { type: 'sector', sector }
          : { type: 'custom', tickers: tickers.split(',').map(t => t.trim().toUpperCase()) },
        entry: {
          conditions: [{ type: signalType, threshold }],
          logic: 'any',
          priority: 'worst_drawdown',
        },
        sizing: { type: 'equal_weight', max_positions: maxPositions },
        stop_loss: { type: 'drawdown_from_entry', value: stopLoss },
        take_profit: { type: 'gain_from_entry', value: takeProfit },
      }
      await api.createStrategy(config)
      setShowForm(false)
      setName('')
      load()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this strategy?')) return
    await api.deleteStrategy(id)
    load()
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Strategies</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Strategy'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1a1b23] rounded-lg p-6 border border-[#2e303a] mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create Strategy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Universe</label>
              <select value={universeType} onChange={e => setUniverseType(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm">
                <option value="sector">Sector</option>
                <option value="custom">Custom Tickers</option>
              </select>
            </div>
            {universeType === 'sector' ? (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sector</label>
                <input value={sector} onChange={e => setSector(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm" />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tickers (comma-separated)</label>
                <input value={tickers} onChange={e => setTickers(e.target.value)} placeholder="AAPL, MSFT, NVDA"
                  className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Signal Type</label>
              <select value={signalType} onChange={e => setSignalType(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm">
                {SIGNAL_TYPES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Threshold (%)</label>
              <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Positions</label>
              <input type="number" value={maxPositions} onChange={e => setMaxPositions(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Stop Loss (%)</label>
              <input type="number" value={stopLoss} onChange={e => setStopLoss(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Take Profit (%)</label>
              <input type="number" value={takeProfit} onChange={e => setTakeProfit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e303a] rounded text-white text-sm" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating || !name}
            className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-sm transition-colors">
            {creating ? 'Creating...' : 'Create Strategy'}
          </button>
        </div>
      )}

      {strategies.length === 0 ? (
        <p className="text-gray-500">No strategies yet. Create one to get started.</p>
      ) : (
        <div className="space-y-3">
          {strategies.map((s: any) => (
            <div key={s.id} className="bg-[#1a1b23] rounded-lg p-4 border border-[#2e303a] flex justify-between items-center">
              <div>
                <p className="text-white font-medium">{s.config?.name || 'Unnamed'}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {s.config?.universe?.type === 'sector' ? s.config.universe.sector : s.config?.universe?.tickers?.join(', ')}
                  {' | '}
                  {s.config?.entry?.conditions?.[0]?.type?.replace(/_/g, ' ')}
                  {' '}
                  {s.config?.entry?.conditions?.[0]?.threshold}%
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(s.id)}
                  className="px-3 py-1 text-red-400 hover:text-red-300 text-sm transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
