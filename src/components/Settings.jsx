import React from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, Copy, Link2 } from 'lucide-react';
import Swal from 'sweetalert2'; // 👈 फीडबॅकसाठी

export default function Settings({ user, teamData, setTeamData, isFormActive, handleToggleFormStatus, shareLink, copied, handleCopyLink, onBack }) {


  // 🎯 कडक टॉगल फंक्शन (डेटाबेस आणि स्टेट दोन्ही एकाच वेळी परफेक्ट अपडेट करेल)
  const toggleSetting = async (field) => {
    // 1. Old value save karun theva
    const currentValue = teamData[field] === true;
    const newValue = !currentValue;

    // 2. Optimistic UI Update (Immediate visual response)
    // Firebase cha response chi vaat na pahata UI la pathvun de
    setTeamData(prev => ({ ...prev, [field]: newValue }));

    // 3. Firebase update (Team UID नुसार कडक दुरुस्ती)
    try {
      // 🎯 कडक बदल: ईमेल ऐवजी थेट युनिक Team UID (Document ID) चा वापर केला
      const teamIdentifier = user.teamUID || user.uid;

      if (!teamIdentifier) {
        throw new Error("संघ आयडी (Team UID) स्टेटमध्ये सापडला नाही!");
      }

      // 🚨 अचूक Team UID च्या डॉक्युमेंटवर थेट वार
      const userRef = doc(db, "users", teamIdentifier);
      
      await updateDoc(userRef, { [field]: newValue });
      
      console.log(`✅ ${field} successfully updated to: ${newValue}`);
    } catch (error) {
      console.error("Firebase update failed:", error);
      
      // Fail jhalyaas parat juna value la rollback kar (तुझे मूळ लॉजिक सुरक्षित)
      setTeamData(prev => ({ ...prev, [field]: currentValue }));
      Swal.fire({ icon: 'error', title: 'त्रुटी', text: 'काहीतरी गडबड झाली, पुन्हा ट्राय करा.' });
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      
      {/* हेडर पट्टी */}
      <div className="border-b border-slate-200 pb-3 flex items-center space-x-3">
        <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 flex items-center justify-center transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">फॉर्म सेटिंग्स</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">नोंदणी फॉर्म आणि साहित्य कंट्रोल पॅनेल</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        
        {/* डावा भाग - टॉगल्स */}
        <div className="md:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider block mb-1">⚙️ फॉर्म अव्हेलेबिलिटी आणि कंट्रोल्स</span>
          
          {/* १. पब्लिक फॉर्म टॉगल */}
          <div className="flex items-center justify-between py-1">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-800 block">पब्लिक नोंदणी फॉर्म</span>
              <span className="text-[10px] text-slate-400 font-medium">खेळाडूंना स्वतः नोंदणी करू देणे</span>
            </div>
            <button 
              type="button" 
              onClick={handleToggleFormStatus} 
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm transition-all active:scale-95 ${isFormActive ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}
            >
              {isFormActive ? '🟢 ON' : '🔴 OFF'}
            </button>
          </div>

          {/* २. बेल्ट (Belt) फील्ड */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3.5">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-800 block">कमर बेल्ट (Belt) फील्ड</span>
              <span className="text-[10px] text-slate-400 font-medium">नोंदणी फॉर्ममध्ये बेल्टचा पर्याय दाखवा</span>
            </div>
            <button 
              type="button" 
              onClick={() => toggleSetting('showBeltField')} 
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm transition-all active:scale-95 ${teamData.showBeltField === true ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}
            >
              {teamData.showBeltField === true ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* ३. टॉवेल (Towel) फील्ड */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3.5">
            <div className="pr-3">
              <span className="text-xs font-bold text-slate-800 block">टॉवेल (Towel) फील्ड</span>
              <span className="text-[10px] text-slate-400 font-medium">नोंदणी फॉर्ममध्ये टॉवेलचा पर्याय दाखवा</span>
            </div>
            <button 
              type="button" 
              onClick={() => toggleSetting('showTowelField')} 
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm transition-all active:scale-95 ${teamData.showTowelField === true ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}
            >
              {teamData.showTowelField === true ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* उजवा भाग - नोंदणी लिंक (जशी होती तशी) */}
        <div className="md:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider flex items-center space-x-1">
              <Link2 size={12} /> <span>मंडळ नोंदणी लिंक</span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">ही लिंक कॉपी करून तुमच्या व्हाट्सॲप ग्रुपवर पाठवा.</p>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono text-[11px] text-slate-500 break-all select-all mt-2">
              {shareLink}
            </div>
          </div>
          
          <button 
            onClick={handleCopyLink} 
            className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-sm ${copied ? 'bg-emerald-600 text-white' : 'bg-[#ff6600] text-white'}`}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            <span>{copied ? 'लिंक कॉपी झाली!' : 'लिंक COPY करा'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}