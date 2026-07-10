import React from 'react';
import logoIcon from '/icon-512.png';
import { ArrowLeft } from 'lucide-react';

export default function AboutUs({ onBack, setCurrentPublicPage }) {
  return (
    <div className="min-h-screen bg-[#03060f] text-slate-100 font-sans py-10 px-4 md:px-8 relative selection:bg-orange-600">
      <div className="max-w-4xl mx-auto bg-slate-950/60 border border-slate-900 rounded-[32px] p-6 md:p-10 backdrop-blur-xl shadow-2xl relative">
        
        {/* 📥 १. कडक प्रिमियम बॅक बटण */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black text-xs py-2 px-4 rounded-xl border border-slate-800 transition-all active:scale-95 z-20"
        >
          <ArrowLeft size={14} /> <span>मुख्य पानावर जा</span>
        </button>

        {/* हेडर (पॅडिंग आणि स्पेसिंग ऍडजस्ट केली) */}
        <div className="text-center space-y-3 border-b border-slate-900 pb-6 pt-12 md:pt-10">
          <img src={logoIcon} alt="Logo" className="w-16 h-16 mx-auto object-contain rounded-2xl shadow-xl shadow-orange-600/10" />
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white to-orange-500 bg-clip-text text-transparent">
            १. महाराष्ट्राचा गोविंदा - आमच्याबद्दल (About Us)
          </h1>
          <p className="text-xs text-orange-500 font-bold tracking-widest uppercase">🚩 प्रत्येक गोविंदासाठी हक्काचे डिजिटल माध्यम 🚩</p>
        </div>

        {/* 📝 २. तुझा मूळ मुख्य डेटा (जसाच्या तसा सुरक्षित 🎯) */}
        <div className="mt-8 space-y-6 text-left text-sm md:text-base text-slate-300 leading-relaxed">
          <p className="font-medium text-slate-400">
            "महाराष्ट्राचा गोविंदा" हे महाराष्ट्रातील आणि देशातील सर्व दहीहंडी आणि लहान-मोठ्या गोविंदा पथकांना डिजिटल युगात एकत्र आणणारे पहिले आणि सर्वात विश्वसनीय अधिकृत डिजिटल व्यासपीठ (PWA Web App) आहे.
          </p>

          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl space-y-2">
            <h3 className="font-black text-orange-500 text-sm md:text-base">🎯 आमचे उद्दिष्ट (Our Vision)</h3>
            <p className="text-xs md:text-sm text-slate-400">
              लहान-मोठ्या सर्व गोविंदापथकांचे अपार कष्ट, मानवी मनोरे रचण्याचे अद्भूत कौशल्य आणि ऐतिहासिक जागतिक विक्रम (World Records) संपूर्ण जगातील आणि विदेशातील लोकांपर्यंत निस्वार्थीपणे पोहोचवणे हे आमचे मुख्य ध्येय आहे.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-white text-base border-l-4 border-orange-500 pl-2">🌟 या सिस्टीमद्वारे काय सुविधा मिळतात?</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-slate-300 font-bold">
              <li className="flex items-center gap-2 bg-slate-900/30 p-2.5 border border-slate-900 rounded-xl">✔ सराव शिबिरे व स्पर्धांचे नियोजन</li>
              <li className="flex items-center gap-2 bg-slate-900/30 p-2.5 border border-slate-900 rounded-xl">✔ दहीहंडी व बक्षीस वितरण अपडेट्स</li>
              <li className="flex items-center gap-2 bg-slate-900/30 p-2.5 border border-slate-900 rounded-xl">✔ जागतिक ऐतिहासिक विक्रम</li>
              <li className="flex items-center gap-2 bg-slate-900/30 p-2.5 border border-slate-900 rounded-xl">✔ ताज्या क्रीडा घडामोडी व शासकीय नियम</li>
              <li className="flex items-center gap-2 bg-slate-900/30 p-2.5 border border-slate-900 rounded-xl">✔ Geo Mapping द्वारे जवळील हंड्या</li>
              <li className="flex items-center gap-2 bg-slate-900/30 p-2.5 border border-slate-900 rounded-xl">✔ डिजिटल गोविंदा कट्टा व संघ डिरेक्टरी</li>
            </ul>
          </div>

          <div className="border-t border-slate-900 pt-6 text-center text-xs text-slate-500 font-bold">
            <p>An Initiative & Developed by Sandesh Mahadik and MG Team </p>
            <p className="mt-1">Official Website: <a href="https://www.maharashtrachagovinda.com" target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">www.maharashtrachagovinda.com</a></p>
          </div>
        </div>

        {/* 🔗 ३. गुगल अ‍ॅडसेन्ससाठी आवश्यक इतर पेजेसच्या लिंक्स (Interlinking) */}
        <div className="mt-8 pt-5 border-t border-slate-900/60 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500">
          <button onClick={() => setCurrentPublicPage('privacy')} className="hover:text-orange-500 transition-colors">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => setCurrentPublicPage('terms')} className="hover:text-orange-500 transition-colors">Terms & Conditions</button>
          <span>•</span>
          <button onClick={() => setCurrentPublicPage('faq')} className="hover:text-orange-500 transition-colors">FAQ & Manual</button>
        </div>

      </div>
    </div>
  );
}