import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions({ onBack, setCurrentPublicPage }) {
  return (
    <div className="min-h-screen bg-[#03060f] text-slate-100 font-sans py-10 px-4 md:px-8 relative selection:bg-orange-600">
      <div className="max-w-4xl mx-auto bg-slate-950/60 border border-slate-900 rounded-[32px] p-6 md:p-10 backdrop-blur-xl shadow-2xl relative">
        
        {/* 📥 १. कडक प्रिमियम बॅक बटण (होम स्क्रीनवर परत जाण्यासाठी) */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black text-xs py-2 px-4 rounded-xl border border-slate-800 transition-all active:scale-95 z-20"
        >
          <ArrowLeft size={14} /> <span>मुख्य पानावर जा</span>
        </button>

        {/* हेडर विभाग */}
        <div className="text-left space-y-4 border-b border-slate-900 pb-5 pt-12 md:pt-10">
          <h1 className="text-xl md:text-2xl font-black text-white">📋 नियम आणि अटी (Terms & Conditions)</h1>
          <p className="text-xs text-slate-500 font-mono">Version 1.0 - Active desde 2026</p>
        </div>

        {/* 📝 २. तुझा मूळ मुख्य डेटा (१ टक्काही न बदलता जसाच्या तसा सुरक्षित 🎯) */}
        <div className="mt-6 space-y-5 text-left text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
          <p>
            "महाराष्ट्राचा गोविंदा" वेब ॲप्लिकेशन वापरण्यापूर्वी कृपया खालील नियम आणि अटी काळजीपूर्वक वाचा. हे ॲप वापरून तुम्ही या अटींचे पालन करण्यास संमती दर्शवता.
          </p>

          <div className="space-y-2">
            <h4 className="font-bold text-orange-500">१. अकाऊंट आणि लॉगिन (Account Eligibility)</h4>
            <p className="text-slate-400">
              • प्रत्येक गोविंदा पथकासाठी केवळ एकच अधिकृत Admin Login दिले जाईल.<br />
              • डेटाबेसमध्ये नोंदणी नसलेल्या ईमेल आयडीला लॉगिन केल्यानंतर केवळ सार्वजनिक व्ह्यूअर किंवा गेस्ट (Guest Mode) म्हणून प्रवेश दिला जाईल.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-orange-500">२. माहितीची अचूकता (Data Accuracy)</h4>
            <p className="text-slate-400">
              • संघ व्यवस्थापकाने (Team Admin) भरलेली माहिती, फोटो, संपर्क आणि सदस्यांची यादी कायदेशीररित्या अचूक असणे बंधनकारक आहे.<br />
              • कोणत्याही बनावट (Fake) किंवा आक्षेपार्ह माहिती आढळल्यास सुपरॲडमीनला ते खाते तात्काळ डीॲक्टिव्हेट (Block) करण्याचा संपूर्ण अधिकार आहे.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-orange-500">३. सुरक्षितता आणि वापर (Fair Usage)</h4>
            <p className="text-slate-400">
              • या वेब ॲपमधील कोणत्याही डेटाची चोरी, चुकीचे हॅकिंग किंवा व्यावसायिक गैरवापर करणे हा कायद्याने गुन्हा आहे.<br />
              • पीडीएफ डाऊनलोड किंवा प्रिंटिंग सुविधेचा वापर केवळ अधिकृत संघ व्यवस्थापनाच्या कामासाठीच केला जावा.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-orange-500">४. बदलांचे अधिकार (Right to Modify)</h4>
            <p className="text-slate-400">
              सिस्टीमचे व्यवस्थापन आणि सुरक्षा मजबूत करण्यासाठी नियमांमध्ये किंवा ॲपच्या रचनेत कधीही बदल करण्याचे सर्व हक्क "महाराष्ट्राचा गोविंदा" पॅनल राखून ठेवत आहे.
            </p>
          </div>
        </div>

        {/* 🔗 ३. गुगल अ‍ॅडसेन्ससाठी आवश्यक इतर पेजेसच्या लिंक्स (Interlinking) */}
        <div className="mt-8 pt-5 border-t border-slate-900/60 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500">
          <button onClick={() => setCurrentPublicPage('about')} className="hover:text-orange-500 transition-colors">About Us</button>
          <span>•</span>
          <button onClick={() => setCurrentPublicPage('privacy')} className="hover:text-orange-500 transition-colors">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => setCurrentPublicPage('faq')} className="hover:text-orange-500 transition-colors">FAQ & Manual</button>
        </div>

      </div>
    </div>
  );
}