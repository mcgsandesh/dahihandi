import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, MapPin, Calendar, Info, ArrowRight } from 'lucide-react';

export default function TeamProfile({ user, onProfileComplete }) {
  // फॉर्म स्टेट्स
  const [teamCategory, setTeamCategory] = useState('Men'); // Men, Women, Both
  const [address, setAddress] = useState('');
  const [estYear, setEstYear] = useState('');
  const [slogan, setSlogan] = useState('');
  const [loading, setLoading] = useState(false);

  // प्रोफाईल डेटा फायरस्टोरमध्ये अपडेट करणे
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!address || !estYear) {
      alert("कृपया संघाचा पत्ता आणि स्थापना वर्ष अचूक भरा!");
      return;
    }
    setLoading(true);

    try {
      const userRef = doc(db, "users", user.info.email);
      
      // फायरस्टोरमध्ये प्रोफाईल माहिती अपडेट करणे
      await updateDoc(userRef, {
        teamCategory: teamCategory,
        address: address.trim(),
        establishedYear: estYear.trim(),
        slogan: slogan.trim(),
        isProfileComplete: true, // 👈 या फ्लॅगमुळे पुढच्या वेळी थेट डॅशबोर्ड उघडेल
        profileUpdatedAt: serverTimestamp()
      });

      alert("🛡️ तुमच्या संघाची प्रोफाईल यशस्वीरीत्या पूर्ण झाली आहे!");
      
      // ॲप स्टेट अपडेट करून थेट डॅशबोर्डवर नेणे
      onProfileComplete({
        ...user,
        isProfileComplete: true,
        teamCategory: teamCategory
      });
    } catch (err) {
      console.error("प्रोफाईल सेव्ह करताना एरर:", err);
      alert("माहिती सेव्ह करताना काहीतरी चूक झाली.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b132b] flex items-center justify-center p-4 md:p-10 font-sans relative overflow-hidden">
      
      {/* बॅकग्राउंड डिझाईन इफेक्ट्स */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#ff6600] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* हेडर आणि स्वागत मेसेज */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#ff6600]/10 text-[#ff6600] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 truncate px-2">
            {user.teamName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            सिस्टीम सुरू करण्यासाठी कृपया तुमच्या संघाची प्रोफाईल पूर्ण करा.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          
          {/* 🚻 १. संघाचा प्रकार (Visual Radio Chips - No Dropdown) */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              संघाचा प्रकार (Category)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Men', label: 'पुरुष संघ' },
                { id: 'Women', label: 'महिला संघ' },
                { id: 'Both', label: 'दोन्ही' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setTeamCategory(cat.id)}
                  className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all text-center ${
                    teamCategory === cat.id
                      ? 'bg-[#ff6600] text-white border-[#ff6600] shadow-md shadow-[#ff6600]/20 scale-[1.02]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 📍 २. संघाचा पत्ता */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <MapPin size={12} className="text-slate-400" />
              <span>संघाचा पत्ता / विभाग</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="उदा. गिरगाव, मुंबई किंवा ठाणे वेस्ट"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium transition-all"
            />
          </div>

          {/* 📅 ३. स्थापना वर्ष */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Calendar size={12} className="text-slate-400" />
              <span>स्थापना वर्ष (Established Year)</span>
            </label>
            <input
              type="number"
              required
              maxLength="4"
              value={estYear}
              onChange={(e) => setEstYear(e.target.value)}
              placeholder="उदा. १९९५ किंवा २०१२"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium transition-all"
            />
          </div>

          {/* 💬 ४. संघाचे घोषवाक्य / ब्रीदवाक्य (Slogan - Optional) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Info size={12} className="text-slate-400" />
              <span>घोषवाक्य / ब्रीदवाक्य (ऐच्छिक)</span>
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="उदा. प्रत्येक गोविंदासाठी..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium transition-all"
            />
          </div>

          {/* सबमिट बटण */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0b132b] hover:bg-[#162244] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
          >
            <span>{loading ? 'माहिती सुरक्षित होत आहे...' : 'प्रोफाईल पूर्ण करा आणि पुढे जा'}</span>
            <ArrowRight size={16} />
          </button>

        </form>

      </div>
    </div>
  );
}