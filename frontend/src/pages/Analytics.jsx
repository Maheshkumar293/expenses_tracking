import React, { useState, useEffect } from 'react';
import transactionService from '../services/transactionService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Mic } from 'lucide-react';

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await transactionService.getTransactions({ limit: 200 });
      const txs = res.transactions || [];
      setTransactions(txs);

      const srcMap = { voice: 0, text: 0, manual: 0 };
      const payMap = {};

      txs.forEach(t => {
        const src = t.source || 'manual';
        srcMap[src] = (srcMap[src] || 0) + 1;

        if (t.payment_method) {
          payMap[t.payment_method] = (payMap[t.payment_method] || 0) + parseFloat(t.amount);
        }
      });

      setSourceData([
        { name: '🎙️ Voice Input', value: srcMap.voice, color: '#ef4444' },
        { name: '⌨ Text NLP Input', value: srcMap.text, color: '#8b5cf6' },
        { name: '📝 Manual Form', value: srcMap.manual, color: '#2563eb' }
      ]);

      const formattedPay = Object.keys(payMap).map(method => ({
        method,
        total: payMap[method]
      }));
      setPaymentData(formattedPay);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Analytics & Insights</h2>
        <p className="text-xs text-slate-500 font-semibold">Deep analysis of voice input usage and payment methods</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entry Source Analytics */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-200/50 space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Mic className="text-rose-600" size={18} /> Entry Source Analytics
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Spending Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-200/50 space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={18} /> Spending by Payment Method
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData}>
                <XAxis dataKey="method" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [`₹${v}`, 'Amount']}
                />
                <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
