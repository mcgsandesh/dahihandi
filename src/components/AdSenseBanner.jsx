import React, { useEffect, useRef } from 'react';

export default function AdSenseBanner() {
  const adRef = useRef(null);

  useEffect(() => {
    // 🎯 चेक करा की ॲड आधीच प्रोसेस झाली आहे का? जर झाली असेल तर पुन्हा पुश करू नका!
    if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log("💸 [AdSense] नवीन ॲड यशस्वीरित्या पुश झाली भाऊ!");
      } catch (e) {
        console.error("❌ AdSense Push Error:", e);
      }
    }
  }, []);

  return (
    <div className="w-full my-6 p-2 bg-slate-950/40 border border-slate-900 rounded-2xl text-center overflow-hidden">
      <span className="text-[8px] text-slate-600 font-mono tracking-widest block mb-1">ADVERTISEMENT</span>
      
      {/* ref={adRef} चा वापर करून आपण या टॅगच्या स्टेटसवर लक्ष ठेवणार आहोत 🎯 */}
      <ins 
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client="ca-pub-3159634487006142"
        data-ad-slot="8373866927"
      ></ins>
    </div>
  );
}