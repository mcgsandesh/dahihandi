import React, { useState } from 'react';
import { Calendar, Smartphone, LogIn, Trophy, MapPin, ShieldCheck, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

export default function FAQAndManual({ onBack, setCurrentPublicPage }) {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    { q: "माझे गुगल लॉगिन होत नाही, काय करावे?", a: "कृपया तपासा की तुम्ही अधिकृत गुगल अकाउंट वापरत आहात का. जर इंटरनेट मंद असेल तरीही अडचण येऊ शकते. ब्राउझर कॅश साफ करून पुन्हा प्रयत्न करा." },
    { q: "माझा ईमेल नोंदणीकृत नाही, नवीन लॉगिन कसे मिळवावे?", a: "नवीन नोंदणीसाठी आमच्या अधिकृत फेसबुक पेज (Facebook Page) वरून मुख्य ॲडमीनशी संपर्क साधा. पडताळणीनंतर तुमचे खाते सक्रिय केले जाईल." },
    { q: "नकाशावर (Geo Map) माझ्या जवळील दहीहंडी किंवा शिबिरे का दिसत नाहीत?", a: "मोबाईल किंवा ब्राउझरवर प्रथमच ॲप उघडताना 'Location Permission' (स्थान परवानगी) मागितली जाते,'Allow' करणे आवश्यक आहे. सेटिंग्जमधून लोकेशन चालू करा." },
    { q: "हे ॲप प्ले स्टोअरवर (Play Store) का सापडत नाही?", a: "हे एक प्रगत PWA (Progressive Web App) आहे. याला इन्स्टॉल करण्यासाठी प्ले स्टोअरची गरज नाही. तुम्ही क्रोम किंवा सफारी ब्राउझरमधून थेट 'Add to Home Screen' करून इन्स्टॉल करू शकता." },
    { q: "ऐतिहासिक रेकॉर्ड्स गॅलरीमध्ये कोणत्या वर्षांचे विक्रम उपलब्ध आहेत?", a: "सर्व अधिकृत थर, महिला पथकांचे विक्रम आणि विश्वविक्रमांची जिल्हानिहाय अचूक माहिती उपलब्ध आहे." }
  ];

  return (
    <div className="min-h-screen bg-[#03060f] text-slate-100 font-sans py-10 px-4 md:px-8 selection:bg-orange-600 relative">
      <div className="max-w-4xl mx-auto space-y-6 relative">
        
        {/* 📥 १. कडक प्रिमियम बॅक बटण (होम स्क्रीनवर परत जाण्यासाठी) */}
        <div className="text-left">
          <button 
            onClick={onBack}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black text-xs py-2 px-4 rounded-xl border border-slate-800 transition-all active:scale-95 z-20"
          >
            <ArrowLeft size={14} /> <span>मुख्य पानावर जा</span>
          </button>
        </div>

        {/* 📱 भाग १: PWA मोबाईल App User Manual (संपूर्ण गाईड - जशीच्या तशी सुरक्षित 🎯) */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl text-left">
          <div className="border-b border-slate-900 pb-4 mb-6">
            <h1 className="text-xl md:text-2xl font-black text-white">📱 PWA मोबाईल App User Manual (V1.0)</h1>
            <p className="text-xs text-orange-500 font-bold mt-1">महाराष्ट्राचा गोविंदा सिस्टीम वापरण्याची सोपी मार्गदर्शिका</p>
          </div>

          <div className="space-y-6 text-xs md:text-sm text-slate-300">
            {/* क्रोम इन्स्टॉलेशन */}
            <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-2">
              <h3 className="font-black text-white flex items-center gap-2 text-sm"><Smartphone className="text-orange-500" size={15} />Android (Chrome) वर App Install कसे करावे?</h3>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 font-medium">
                <li>Chrome Browser मध्ये <code className="text-orange-400">maharashtrachagovinda.com</code> उघडा.</li>
                <li>उजव्या बाजूला असलेल्या <strong className="text-white">⋮ Menu</strong> वर क्लिक करा.</li>
                <li><strong className="text-white">Install App</strong> किंवा <strong className="text-white">Add to Home Screen</strong> निवडा.</li>
                <li>इन्स्टॉलवर क्लिक करा. ॲप कमी जागेत, जलद आणि Full Screen अनुभवासह सुरू होईल.</li>
              </ol>
            </div>

            {/* आयफोन इन्स्टॉलेशन */}
            <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-2">
              <h3 className="font-black text-white flex items-center gap-2 text-sm"><Smartphone className="text-pink-500" size={15} /> iPhone (Safari) वर Install कसे करावे?</h3>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 font-medium">
                <li>Safari Browser मध्ये वेबसाईट उघडा.</li>
                <li>खालच्या बाजूला असलेल्या <strong className="text-white">Share 📤</strong> बटणावर क्लिक करा.</li>
                <li><strong className="text-white">Add to Home Screen</strong> निवडा आणि नंतर <strong className="text-white">Add</strong> वर क्लिक करा.</li>
              </ol>
            </div>

            {/* लॉगिन व डॅशबोर्ड व्यवस्था */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl text-left">
                <h4 className="font-black text-orange-400 mb-1.5 flex items-center gap-1.5"><LogIn size={14}/> सुरक्षित लॉगिन व्यवस्था</h4>
                <p className="text-slate-400 text-[11px] md:text-xs font-medium">लँडिंग पेजवरील 'लॉगिन' बटणावर क्लिक करून अधिकृत गुगल ईमेल आयडी निवडा. नोंदणीकृत संघ थेट व्यवस्थापन पानामध्ये प्रवेश करतील.</p>
              </div>
              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl text-left">
                <h4 className="font-black text-orange-400 mb-1.5 flex items-center gap-1.5"><Trophy size={14}/> संघ प्रोफाइल व PDF डाऊनलोड</h4>
                <p className="text-slate-400 text-[11px] md:text-xs font-medium">लॉगिन झाल्यावर 'संघ प्रोफाइल' मधून सर्व माहिती, संपर्क आणि फोटो अपडेट करा. प्रोफाइल पूर्ण झाल्यावर कडक प्रिंटिंग किंवा PDF डाऊनलोड करता येईल.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ❓ भाग २: FAQ (वारंवार विचारले जाणारे प्रश्न - जसेच्या तसे सुरक्षित 🎯) */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl text-left">
          <div className="mb-5">
            <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="text-orange-500" size={18} />नेहमी विचारले जाणारे प्रश्न (FAQ)
            </h2>
          </div>

          <div className="space-y-3">
            {faqData.map((faq, idx) => (
              <div key={idx} className="border border-slate-900 bg-slate-900/20 rounded-xl overflow-hidden transition-all">
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex justify-between items-center p-4 text-left text-xs md:text-sm font-black text-slate-200 hover:bg-slate-900/40 transition-colors"
                >
                  <span>❓ {faq.q}</span>
                  {openIndex === idx ? <ChevronUp size={14} className="text-orange-500" /> : <ChevronDown size={14} className="text-slate-400" />}
                </button>
                
                {openIndex === idx && (
                  <div className="p-4 bg-slate-950/80 border-t border-slate-900 text-[11px] md:text-xs text-slate-400 font-bold leading-relaxed animate-in slide-in-from-top-2 duration-150">
                    💡 {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 🔗 ३. गुगल अ‍ॅडसेन्ससाठी आवश्यक इतर पेजेसच्या लिंक्स (Interlinking) */}
        <div className="pt-4 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500">
          <button onClick={() => setCurrentPublicPage('about')} className="hover:text-orange-500 transition-colors">About Us</button>
          <span className="text-slate-700">•</span>
          <button onClick={() => setCurrentPublicPage('privacy')} className="hover:text-orange-500 transition-colors">Privacy Policy</button>
          <span className="text-slate-700">•</span>
          <button onClick={() => setCurrentPublicPage('terms')} className="hover:text-orange-500 transition-colors">Terms & Conditions</button>
        </div>

      </div>
    </div>
  );
}