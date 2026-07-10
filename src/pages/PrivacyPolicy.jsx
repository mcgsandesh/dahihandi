import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ onBack, setCurrentPublicPage }) {
  return (
    <div className="min-h-screen bg-[#03060f] text-slate-100 font-sans py-10 px-4 md:px-8 relative selection:bg-orange-600">
      <div className="max-w-4xl mx-auto bg-slate-950/60 border border-slate-900 rounded-[32px] p-6 md:p-10 backdrop-blur-xl shadow-2xl relative">
        
        {/* 📥 १. कडक प्रिमियम बॅक बटण (युझरला होम स्क्रीनवर परत नेण्यासाठी) */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black text-xs py-2 px-4 rounded-xl border border-slate-800 transition-all active:scale-95 z-20"
        >
          <ArrowLeft size={14} /> <span>मुख्य पानावर जा</span>
        </button>

        {/* हेडर विभाग */}
        <div className="text-left space-y-4 border-b border-slate-900 pb-5 pt-12 md:pt-10">
          <h1 className="text-xl md:text-2xl font-black text-white">🔐 गोपनीयता धोरण (Privacy Policy)</h1>
          <p className="text-xs text-slate-500 font-mono">Last Updated: July 2026</p>
        </div>

        {/* 📝 २. तुझा मूळ मुख्य डेटा (१ टक्काही न बदलता जसाच्या तसा सुरक्षित 🎯) */}
        <div className="mt-6 space-y-6 text-left text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
          <p>
            "महाराष्ट्राचा गोविंदा" (www.maharashtrachagovinda.com) वर युझरच्या गोपनीयतेचा आदर करणे ही आमची सर्वोच्च प्राथमिकता आहे. हे ॲप तुमच्या डेटाची सुरक्षा कशी करते, याची माहिती खालीलप्रमाणे आहे.
          </p>

          <div className="space-y-2.5">
            <h3 className="font-black text-orange-500 text-sm">१. गोळा करण्यात येणारी माहिती (Data Collection)</h3>
            <p className="text-slate-400">
              • <strong>गुगल लॉगिन (Google Authentication):</strong> जेव्हा तुम्ही संघ व्यवस्थापक म्हणून लॉगिन करता, तेव्हा आम्ही तुमचा फक्त सुरक्षित ईमेल आयडी आणि प्रोफाइल नाव प्राप्त करतो.<br />
              • <strong>स्थान परवानगी (Geo Location Permission):</strong> युझरच्या मोबाईलवरील लोकेशनचा वापर केवळ जवळील सराव शिबिरे, दहीहंडी आणि इव्हेंट्स नकाशावर दाखवण्यासाठी केला जातो. आम्ही तुमचे लोकेशन बॅकएंड सर्व्हरवर सेव्ह करत नाही.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-black text-orange-500 text-sm">२. माहितीचा वापर (Data Usage)</h3>
            <p className="text-slate-400">
              • संकलित केलेल्या माहितीचा वापर केवळ संघाची डिजिटल प्रोफाइल व्यवस्थापित करण्यासाठी, पीडीएफ डाऊनलोड करण्यासाठी आणि ॲपमधील अचूक आकडेवारी (Statistics) पडताळण्यासाठी केला जातो.<br />
              • आम्ही तुमचा वैयक्तिक डेटा कोणत्याही Third-Party किंवा व्यावसायिक कंपन्यांना विकत नाही किंवा शेअर करत नाही.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-black text-orange-500 text-sm">३. कुकीज आणि अ‍ॅडसेन्स (Cookies & AdSense)</h3>
            <p className="text-slate-400">
              • आम्ही लॉगिन सेशन टिकवून ठेवण्यासाठी ब्राउझरमधील <code>localStorage</code> चा वापर करतो.<br />
              • ही वेबसाईट Google AdSense जाहिराती दाखवू शकते, ज्या युझरच्या आवडीनुसार जाहिराती व्यवस्थापित करण्यासाठी कुकीजचा वापर करू शकतात.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-black text-orange-500 text-sm">४. सुरक्षा (Security)</h3>
            <p className="text-slate-400">
              तुमचा सर्व डेटा **Google Firebase Firestore** डेटाबेस आणि सुरक्षित सर्व्हरच्या দেখরেखीखाली साठवला जातो, जो अत्यंत सुरक्षित मानला जातो.
            </p>
          </div>

          <p className="text-[11px] text-slate-500 border-t border-slate-900 pt-4 text-center">
            या गोपनीयता धोरणाबाबत काही शंका असल्यास कृपया आमच्या अधिकृत सोशल मीडिया पेजवरून डेव्हलपरशी संपर्क साधा.
          </p>
        </div>

        {/* 🔗 ३. गुगल अ‍ॅडसेन्ससाठी आवश्यक इतर पेजेसच्या लिंक्स (Interlinking) */}
        <div className="mt-8 pt-5 border-t border-slate-900/60 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500">
          <button onClick={() => setCurrentPublicPage('about')} className="hover:text-orange-500 transition-colors">About Us</button>
          <span>•</span>
          <button onClick={() => setCurrentPublicPage('terms')} className="hover:text-orange-500 transition-colors">Terms & Conditions</button>
          <span>•</span>
          <button onClick={() => setCurrentPublicPage('faq')} className="hover:text-orange-500 transition-colors">FAQ & Manual</button>
        </div>

      </div>
    </div>
  );
}