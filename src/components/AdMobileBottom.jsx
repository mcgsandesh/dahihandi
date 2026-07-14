import React, { useEffect, useRef, useState } from 'react';

export default function AdMobileBottom() {
  const adRef = useRef(null);
  const [isAdVisible, setIsAdVisible] = useState(false); // 🎯 सुरुवातीला पट्टी पूर्ण गायब राहील

  useEffect(() => {
    if (adRef.current) {
      try {
        // गुगल ॲड पुश करणे
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        
        // 🎯 मॅजिक फिचर: ॲड खरोखर लोड झाली आहे की नाही हे तपासण्यासाठी एक लहान इंटरव्हल (चेक)
        const checkAdLoad = setInterval(() => {
          if (adRef.current && adRef.current.getAttribute('data-ad-status') === 'filled') {
            setIsAdVisible(true); // ॲड भरली (लोड झाली) तरच पट्टी दाखवा!
            clearInterval(checkAdLoad);
          }
        }, 1000);

        // १० सेकंदात ॲड लोड नाही झाली तर चेक बंद करा (Reads & CPU सेव्हर)
        setTimeout(() => clearInterval(checkAdLoad), 10000);

        return () => clearInterval(checkAdLoad);
      } catch (e) {
        console.error("❌ Mobile Ad Error:", e);
        setIsAdVisible(false);
      }
    }
  }, []);

  // 🎯 फिक्स: जर गुगलने ॲड पाठवली नसेल तर ती काळी पट्टी स्क्रीनवर ०% जागा घेईल (पूर्ण गायब!)
  if (!isAdVisible) return null;

  return (
    /* 🎯 फिक्स: हाईट तंतोतंत ६०px वर कडक लॉक केली आहे व !important स्टाईल लावली आहे */
    <div 
      className="md:hidden fixed bottom-[64px] inset-x-0 z-40 bg-slate-950/95 border-t border-slate-900 text-center backdrop-blur-sm shadow-xl overflow-hidden flex flex-col justify-center"
      style={{ height: '60px', minHeight: '60px', maxHeight: '60px' }}
    >
      <span className="text-[7px] text-slate-600 font-mono tracking-widest block uppercase leading-none mt-0.5 mb-0.5">
        ADVERTISEMENT
      </span>
      
      <div className="flex justify-center items-center h-[50px] w-full overflow-hidden">
        <ins 
          ref={adRef}
          className="adsbygoogle"
          // 🎯 गुगलला सक्तीने ३२०x५० च्या मोबाईल बॅनर आकारात काम करायला भाग पाडले
          style={{ display: 'inline-block', width: '320px', height: '50px' }}
          data-ad-client="ca-pub-3159634487006142"
          data-ad-slot="8373866927"
          data-full-width-responsive="false" // 👈 गुगलला स्वतःहून साईड वाढवू न देणारी मॅजिक ओळ!
        ></ins>
      </div>
    </div>
  );
}