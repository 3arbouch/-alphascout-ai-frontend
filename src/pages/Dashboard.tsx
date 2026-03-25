import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Dashboard() {
  const [strategies, setStrategies] = useState<any[]>([])
  const [backtests, setBacktests] = useState<any[]>([])
  const [deployments, setDeployments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getStrategies().catch(() => ({ strategies: [] })),
      api.getBacktests().catch(() => ({ backtests: [] })),
      api.getDeployments().catch(() => ({ deployments: [] })),
    ]).then(([s, b, d]) => {
      setStrategies(s.strategies)
      setBacktests(b.backtests)
      setDeployments(d.deployments)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-400">Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Strategies" value={strategies.length} />
        <StatCard label="Backtests" value={backtests.length} />
        <StatCard label="Active Deployments" value={deployments.filter(d => d.status === 'active').length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a1b23] rounded-lg p-4 border border-[#2e303a]">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Backtests</h2>
          {backtests.length === 0 ? (
            <p className="text-gray-500 text-sm">No backtests yet</p>
          ) : (
            <div className="space-y-2">
              {backtests.slice(0, 5).map((bt: any) => (
                <div key={bt.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">{bt.strategy_id?.slice(0, 8)}...</span>
                  <span className={bt.status === 'completed' ? 'text-green-400' : bt.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}>
                    {bt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1b23] rounded-lg p-4 border border-[#2e303a]">
          <h2 className="text-lg font-semibold text-white mb-3">Active Deployments</h2>
          {deployments.filter(d => d.status === 'active').length === 0 ? (
            <p className="text-gray-500 text-sm">No active deployments</p>
          ) : (
            <div className="space-y-2">
              {deployments.filter(d => d.status === 'active').map((dep: any) => (
                <div key={dep.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">{dep.name}</span>
                  <span className={dep.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {dep.total_return_pct?.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#1a1b23] rounded-lg p-4 border border-[#2e303a]">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
