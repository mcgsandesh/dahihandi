import React, { useEffect } from 'react';
// 🎯 विटला सांगूया की इमेज 'public' मध्ये आहे, तो स्वतः पाथ मॅनेज करेल
import splashImg from '/splash-bg.png'; 

export default function SplashScreen({ onFinished }) {
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinished) onFinished();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinished]);

return (
    // md:bg-contain मुळे डेस्कटॉपवर इमेज पूर्ण दिसेल (कट होणार नाही) आणि आजूबाजूला थीमचा डार्क रंग येईल
    <div 
      className="min-h-screen w-full bg-[#0b121f] bg-cover md:bg-contain bg-center bg-no-repeat select-none animate-in fade-in duration-500"
      style={{ backgroundImage: `url(${splashImg})` }}
    >
      <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
    </div>
  );
  
}