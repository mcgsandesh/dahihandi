import React, { useEffect, useRef } from 'react';

export default function AdMobileBottom() {
  const adRef = useRef(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("❌ Mobile Ad Error:", e);
      }
    }
  }, []);

  return (
    /* 🎯 fixed bottom-[64px] केले जेणेकरून ते बॉटम बारच्या बरोबर वर बसेल */
    <div className="md:hidden fixed bottom-[64px] inset-x-0 z-40 bg-slate-950/95 border-t border-b border-slate-900 text-center py-1 backdrop-blur-md shadow-2xl">
      <span className="text-[8px] text-slate-600 font-mono tracking-widest block uppercase mb-0.5">ADVERTISEMENT</span>
      
      <div className="flex justify-center items-center min-h-[50px]">
        <ins 
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'inline-block', width: '320px', height: '50px' }}
          data-ad-client="ca-pub-3159634487006142"
          data-ad-slot="8373866927" // तुझा स्लॉट आयडी
        ></ins>
      </div>
    </div>
  );
}