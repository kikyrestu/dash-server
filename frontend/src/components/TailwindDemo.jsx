import React, { useState } from 'react';
import MetricCardTailwind from './MetricCardTailwind';
import ConnectionStatusTailwind from './ConnectionStatusTailwind';

const TailwindDemo = () => {
  const [demoData] = useState({
    cpu: 45.2,
    memory: { percentage: 67.8 },
    disk: { percentage: 82.3 },
    temperature: 58.5
  });

  const [connectionStatus] = useState('Connected');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎨 Tailwind CSS Migration Demo
          </h1>
          <p className="text-gray-600 text-lg">
            Perbandingan antara inline CSS vs Tailwind CSS
          </p>
        </div>

        {/* Connection Status Comparison */}
        <div className="bg-white rounded-xl p-8 shadow-card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            🔗 Connection Status Components
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                😴 Old Style (Inline CSS)
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <ConnectionStatusTailwind status={connectionStatus} />
              </div>
              <div className="text-sm text-gray-500">
                ❌ Verbose inline styles<br/>
                ❌ Hard to maintain<br/>
                ❌ No design system
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                🚀 New Style (Tailwind CSS)
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <ConnectionStatusTailwind status={connectionStatus} />
              </div>
              <div className="text-sm text-gray-500">
                ✅ Clean utility classes<br/>
                ✅ Consistent design system<br/>
                ✅ Better animations & effects
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards Comparison */}
        <div className="bg-white rounded-xl p-8 shadow-card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            📊 Metric Card Components
          </h2>

          {/* Old Style */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              😴 Old Style (Inline CSS)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCardTailwind
                title="CPU Usage"
                value={demoData.cpu}
                unit="%"
                percentage={demoData.cpu}
                status="warning"
              />
              <MetricCardTailwind
                title="Memory"
                value={demoData.memory.percentage}
                unit="%"
                percentage={demoData.memory.percentage}
                status="good"
              />
              <MetricCardTailwind
                title="Disk Usage"
                value={demoData.disk.percentage}
                unit="%"
                percentage={demoData.disk.percentage}
                status="danger"
              />
              <MetricCardTailwind
                title="Temperature"
                value={demoData.temperature}
                unit="°C"
                status="normal"
              />
            </div>
          </div>

          {/* New Style */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              🚀 New Style (Tailwind CSS)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCardTailwind
                title="CPU Usage"
                value={demoData.cpu}
                unit="%"
                percentage={demoData.cpu}
                status="warning"
              />
              <MetricCardTailwind
                title="Memory"
                value={demoData.memory.percentage}
                unit="%"
                percentage={demoData.memory.percentage}
                status="good"
              />
              <MetricCardTailwind
                title="Disk Usage"
                value={demoData.disk.percentage}
                unit="%"
                percentage={demoData.disk.percentage}
                status="danger"
              />
              <MetricCardTailwind
                title="Temperature"
                value={demoData.temperature}
                unit="°C"
                status="normal"
              />
            </div>
          </div>
        </div>

        {/* Code Comparison */}
        <div className="bg-white rounded-xl p-8 shadow-card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            👨‍💻 Code Comparison
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">❌ Old Way (Inline CSS)</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <pre>{`<div style={{
  background: 'linear-gradient(135deg, #ef444420, #ef444405)',
  border: '1px solid #ef444430',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center',
  minHeight: '140px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
}}>
  {/* Complex inline styles... */}
</div>`}</pre>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-600">✅ New Way (Tailwind)</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <pre>{`<div className="bg-gradient-to-br from-danger-50 to-danger-100 
              border-danger-200 border rounded-xl p-5 
              text-center min-h-[140px] flex flex-col 
              justify-between transition-all duration-300 
              hover:shadow-card-hover hover:scale-105">
  {/* Clean, readable classes! */}
</div>`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            ✨ Keunggulan Tailwind CSS
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="text-2xl">🚀</div>
              <h3 className="font-semibold text-gray-800">Faster Development</h3>
              <p className="text-gray-600">
                Tidak perlu menulis CSS manual, cukup gunakan utility classes yang sudah tersedia.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-2xl">🎨</div>
              <h3 className="font-semibold text-gray-800">Consistent Design</h3>
              <p className="text-gray-600">
                Design system yang konsisten dengan spacing, colors, dan typography yang terstandar.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-2xl">🔧</div>
              <h3 className="font-semibold text-gray-800">Easy Maintenance</h3>
              <p className="text-gray-600">
                Mudah di-maintain, responsive by default, dan tidak ada CSS yang tidak terpakai.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-2xl">📱</div>
              <h3 className="font-semibold text-gray-800">Mobile First</h3>
              <p className="text-gray-600">
                Responsive design yang mudah dengan breakpoint yang sudah tersedia.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-2xl">⚡</div>
              <h3 className="font-semibold text-gray-800">Performance</h3>
              <p className="text-gray-600">
                CSS bundle yang lebih kecil karena hanya menggunakan classes yang diperlukan.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-2xl">🎯</div>
              <h3 className="font-semibold text-gray-800">Developer Experience</h3>
              <p className="text-gray-600">
                Autocomplete di editor, no context switching, dan debugging yang lebih mudah.
              </p>
            </div>
          </div>
        </div>

        {/* Migration Steps */}
        <div className="bg-white rounded-xl p-8 shadow-card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            🔄 Migration Steps
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Install Tailwind CSS</h3>
                <code className="text-sm bg-gray-200 px-2 py-1 rounded">npm install -D tailwindcss postcss autoprefixer</code>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Configure Tailwind</h3>
                <p className="text-gray-600">Setup tailwind.config.js and postcss.config.js</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Add Tailwind Directives</h3>
                <p className="text-gray-600">Add @tailwind directives to your CSS file</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Convert Components</h3>
                <p className="text-gray-600">Replace inline styles with Tailwind utility classes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindDemo;
