import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Deployments() {
  const [deployments, setDeployments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDeployments()
      .then(res => setDeployments(res.deployments))
      .catch(() => setDeployments([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-400">Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Deployments</h1>
      {deployments.length === 0 ? (
        <p className="text-gray-500">No deployments yet. Deploy a strategy from the chat agent or API.</p>
      ) : (
        <div className="space-y-3">
          {deployments.map((dep: any) => (
            <div key={dep.id} className="bg-[#1a1b23] rounded-lg p-4 border border-[#2e303a]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-medium">{dep.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  dep.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>{dep.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">NAV</p>
                  <p className="text-white">${dep.current_nav?.toLocaleString() || dep.initial_capital?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Return</p>
                  <p className={dep.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {dep.total_return_pct?.toFixed(2) || '0.00'}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Positions</p>
                  <p className="text-white">{dep.open_positions?.length || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
