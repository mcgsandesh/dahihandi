import React from 'react';
import { BookOpen, ShieldAlert, HeartPulse, CheckCircle2, Info } from 'lucide-react';

export default function PublicInfo() {
  // 📜 नियमावलीची कडक वर्गवारी
  const rulesSections = [
    {
      title: "🛡️ सुरक्षा आणि पथक नियम",
      icon: <ShieldAlert className="text-orange-500" size={18} />,
      items: [
        "सर्व खेळाडूंचा (गोविंदा) अधिकृत विमा उतरवलेला असणे सक्तीचे आहे.",
        "१४ वर्षांखालील बाल गोविंदांना थरावर चढवण्यास कायद्याने पूर्णपणे बंदी आहे.",
        "थरांच्या सुरक्षेसाठी हेल्मेट, सेफ्टी बेल्ट आणि चेस्ट गार्डचा वापर करणे बंधनकारक आहे.",
        "दहीहंडीच्या ठिकाणी सराव करताना किंवा सलामी देताना वैद्यकीय कीट सोबत ठेवावी."
      ]
    },
    {
      title: "❤️ आरोग्य आणि वैद्यकीय काळजी",
      icon: <HeartPulse className="text-emerald-500" size={18} />,
      items: [
        "गोविंदा पथकासोबत त्यांचे स्वतःचे प्रथमोपचार (First-Aid) तज्ज्ञ किंवा डॉक्टर असावेत.",
        "उन्हाचा किंवा डिहायड्रेशनचा त्रास टाळण्यासाठी खेळाडूंना ओआरएस (ORS) आणि पाण्याचे पुरेशा प्रमाणात वाटप करावे.",
        "कोणतीही दुखापत झाल्यास त्वरित जवळच्या समन्वय समितीच्या वैद्यकीय कक्षाशी संपर्क साधावा."
      ]
    },
    {
      title: "📜 उत्सव शिस्त आणि कायदे",
      icon: <CheckCircle2 className="text-blue-500" size={18} />,
      items: [
        "दहीहंडी उत्सव काळात वाहतुकीचे नियम पाळावेत आणि रस्त्यांवर वाहने अडवून गोंधळ घालू नये.",
        "ध्वनी प्रदूषणाचे नियम पाळून ध्वनिक्षेपकांचा (Sound System) आवाज मर्यादित ठेवावा.",
        "स्थानिक पोलीस प्रशासन आणि समन्वय समितीने दिलेल्या वेळेच्या मर्यादेतच उत्सव साजरा करावा."
      ]
    }
  ];

  return (
    <div className="space-y-5">
      
      {/* 🚩 टॉप माहिती बॅनर्स */}
      <div className="bg-slate-950 text-white p-5 rounded-3xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600 opacity-20 blur-3xl rounded-full"></div>
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center space-x-2 text-orange-400 text-xs font-black uppercase tracking-wider">
            <Info size={14} />
            <span>समन्वय समिती मार्गदर्शक तत्त्वे</span>
          </div>
          <h3 className="text-base font-black tracking-wide">दहीहंडी उत्सव २०२६ नियमावली</h3>
          <p className="text-slate-400 text-[11px] leading-relaxed font-medium">
            हा उत्सव महाराष्ट्राची परंपरा आणि संस्कृती राखत सुरक्षितपणे पार पाडण्यासाठी खालील नियमांचे कडक पालन करणे सर्व मंडळांना बंधनकारक आहे.
          </p>
        </div>
      </div>

      {/* 📱 नियमांचे कार्ड्स */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rulesSections.map((section, idx) => (
          <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3.5">
            {/* सेक्शन हेडर */}
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-2.5">
              {section.icon}
              <h4 className="text-xs font-black text-slate-800 tracking-wide">{section.title}</h4>
            </div>

            {/* नियमांची यादी */}
            <ul className="space-y-2.5 pl-1">
              {section.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start space-x-2 text-xs font-bold text-slate-600 leading-relaxed">
                  <span className="text-[#ff6600] mt-0.5 font-sans">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* 📞 आणीबाणी संपर्क कक्ष (Emergency Helpline Card) */}
        <div className="bg-red-50/50 border border-red-100 p-4 rounded-3xl flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-red-800">🚨 आणीबाणीच्या वेळी त्वरित संपर्क</h4>
            <p className="text-[10px] text-red-600/80 font-bold">उत्सवाच्या दरम्यान कोणतीही मोठी दुर्घटना किंवा तातडीची मदत लागल्यास खालील क्रमांकांवर संपर्क साधावा.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-red-100/50 text-[11px] font-black text-slate-700">
            <div className="bg-white p-2.5 rounded-xl border border-red-100 text-center shadow-sm">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">पोलीस नियंत्रण</p>
              <p className="font-sans text-red-600 text-sm font-black mt-0.5">100</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-red-100 text-center shadow-sm">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">रुग्णवाहिका कक्ष</p>
              <p className="font-sans text-red-600 text-sm font-black mt-0.5">108</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}