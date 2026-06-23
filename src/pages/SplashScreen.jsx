import React, { useEffect } from 'react';

export default function SplashScreen({ onFinished }) {
  
  // ३ सेकंदांनंतर स्प्लॅश स्क्रीन बंद होऊन लँडिंग पेज दिसेल
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinished) onFinished();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col justify-between items-center p-6 text-center select-none relative overflow-hidden">
      
      {/* बॅकग्राउंड इफेक्ट - भगवा ग्लो */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-bhagwa opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-bhagwa opacity-5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Top Section - Spacer */}
      <div></div>

      {/* Center Section - Main Brand Profile */}
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        {/* भगवा झेंडा आयकॉन वर्तुळात */}
        <div className="w-24 h-24 bg-bhagwa/10 rounded-full flex items-center justify-center border border-bhagwa/30 shadow-lg shadow-bhagwa/20 mb-2">
          <svg className="w-12 h-12 text-bhagwa" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
          </svg>
        </div>
        
        {/* मुख्य नाव */}
        <h1 className="text-5xl font-black text-white tracking-wide font-serif">
          महाराष्ट्राचा <span className="text-bhagwa">गोविंदा</span>
        </h1>
        
        <p className="text-bhagwa-light/80 text-sm font-medium tracking-[0.2em] uppercase">
          प्रत्येक गोविंदासाठी
        </p>
        
        <p className="text-slate-400 text-xs bg-slate-800/50 border border-slate-700/50 px-4 py-1.5 rounded-full backdrop-blur-sm mt-4">
          Dahihandi Management Platform
        </p>
      </div>

      {/* Bottom Section - Loader & Initiative Credit */}
      <div className="w-full flex flex-col items-center space-y-6">
        {/* छोटा प्रोग्रेस बार / लोडर */}
        <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-bhagwa rounded-full w-full origin-left animate-[pulse_1.5s_infinite]"></div>
        </div>

        <div className="border-t border-slate-850 pt-4 w-48">
          <p className="text-slate-500 text-[11px] tracking-widest uppercase">An Initiative by</p>
          <p className="text-slate-300 text-sm font-bold tracking-wide mt-0.5">Sandesh Mahadik</p>
        </div>
      </div>

    </div>
  );
}