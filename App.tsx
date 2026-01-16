
import React, { useState, useMemo } from 'react';
import { ProtocolSection, CalculationResult, InitialInput, AdjustmentInput } from './types';
import { calculateInitialRate, calculateAdjustmentRate } from './protocolEngine';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'initial' | 'adjustment'>('initial');
  
  // Initial Input State
  const [initialBG, setInitialBG] = useState<string>('');
  
  // Adjustment Input State
  const [adjCurrentBG, setAdjCurrentBG] = useState<string>('');
  const [adjPreviousBG, setAdjPreviousBG] = useState<string>('');
  const [adjCurrentRate, setAdjCurrentRate] = useState<string>('');
  const [adjHoursElapsed, setAdjHoursElapsed] = useState<string>('1');

  const result = useMemo(() => {
    if (activeTab === 'initial') {
      const bg = parseFloat(initialBG);
      if (isNaN(bg) || bg < 0) return null;
      return calculateInitialRate({ currentBG: bg });
    } else {
      const cBG = parseFloat(adjCurrentBG);
      const pBG = parseFloat(adjPreviousBG);
      const rate = parseFloat(adjCurrentRate);
      const hours = parseFloat(adjHoursElapsed);
      
      if (isNaN(cBG) || isNaN(pBG) || isNaN(rate) || isNaN(hours) || hours <= 0) return null;
      
      return calculateAdjustmentRate({
        currentBG: cBG,
        previousBG: pBG,
        currentRate: rate,
        hoursElapsed: hours
      });
    }
  }, [activeTab, initialBG, adjCurrentBG, adjPreviousBG, adjCurrentRate, adjHoursElapsed]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-8 border-b border-slate-200 pb-6 text-center">
        <div className="flex justify-center items-center gap-4 mb-2">
          <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          <h1 className="text-3xl font-bold text-slate-800">Yale ICU Insulin Protocol</h1>
        </div>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Protocol-based insulin infusion calculator for adult patients in the ICU. 
          Target BG Range: <span className="font-bold text-indigo-600">120-160 mg/dL</span>.
        </p>
      </header>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button 
            onClick={() => setActiveTab('initial')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'initial' ? 'bg-white text-indigo-600 border-t-4 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Initial Calculation
          </button>
          <button 
            onClick={() => setActiveTab('adjustment')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'adjustment' ? 'bg-white text-indigo-600 border-t-4 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Subsequent Adjustment
          </button>
        </div>

        <div className="p-6 md:p-10">
          {activeTab === 'initial' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Blood Glucose (mg/dL)</label>
                <input 
                  type="number"
                  placeholder="e.g., 250"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xl font-medium"
                  value={initialBG}
                  onChange={(e) => setInitialBG(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current BG (mg/dL)</label>
                <input 
                  type="number"
                  placeholder="e.g., 180"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg"
                  value={adjCurrentBG}
                  onChange={(e) => setAdjCurrentBG(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Previous BG (mg/dL)</label>
                <input 
                  type="number"
                  placeholder="e.g., 220"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg"
                  value={adjPreviousBG}
                  onChange={(e) => setAdjPreviousBG(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Rate (Units/hr)</label>
                <input 
                  type="number"
                  step="0.5"
                  placeholder="e.g., 2.5"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg"
                  value={adjCurrentRate}
                  onChange={(e) => setAdjCurrentRate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hours Since Last Measurement</label>
                <input 
                  type="number"
                  step="1"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg"
                  value={adjHoursElapsed}
                  onChange={(e) => setAdjHoursElapsed(e.target.value)}
                />
              </div>
            </div>
          )}

          {result ? (
            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-indigo-50 rounded-2xl p-6 md:p-8 border border-indigo-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-indigo-200 text-indigo-800 text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
                      {result.section}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900">{result.action}</h2>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-slate-500 uppercase font-bold tracking-tight">New Infusion Rate</p>
                    <p className="text-4xl font-black text-indigo-700">
                      {typeof result.newRate === 'number' ? `${result.newRate.toFixed(1)} Units/hr` : result.newRate}
                    </p>
                    {result.bolus !== undefined && (
                      <p className="text-lg text-indigo-600 font-bold mt-1">
                        + IV Bolus: {result.bolus.toFixed(1)} Units
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Protocol Explanation</h3>
                    <ul className="space-y-2">
                      {result.explanation.map((line, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm leading-relaxed">
                          <span className="text-indigo-400 mt-1">•</span>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-3 text-indigo-700 bg-indigo-100/50 p-4 rounded-xl border border-indigo-100">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">{result.monitoringFrequency}</p>
                  </div>

                  {result.caution && (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                      <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm font-bold">{result.caution}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-10 p-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
              <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p>Enter measurements above to calculate adjustment</p>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 text-center text-slate-400 text-xs px-4">
        <p className="mb-2 uppercase font-bold">Authoritative Source: Yale-New Haven Hospital ICU Insulin Infusion Protocol (IIP) for Adults</p>
        <p>This tool applies the protocol verbatim for calculation assistance. Clinical judgment is always required. If situation is not adequately addressed by protocol, contact MD.</p>
      </footer>
    </div>
  );
}

export default App;
