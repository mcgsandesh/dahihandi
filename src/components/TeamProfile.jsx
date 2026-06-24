import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, MapPin, Calendar, Info, ArrowRight, Image, Trophy, FileText, Check, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TeamProfile({ user, teamData, setTeamData, isEditMode, setIsEditMode, fetchUserData }) {
  // फॉर्म स्टेट्स
  const [teamCategory, setTeamCategory] = useState(teamData?.teamCategory || 'Men');
  const [address, setAddress] = useState(teamData?.address || '');
  const [estYear, setEstYear] = useState(teamData?.establishedYear || '');
  const [slogan, setSlogan] = useState(teamData?.slogan || '');
  const [logoUrl, setLogoUrl] = useState(teamData?.logoUrl || '');
  const [aboutTeam, setAboutTeam] = useState(teamData?.aboutTeam || '');
  const [bestPerformance, setBestPerformance] = useState(teamData?.bestPerformance || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teamData) {
      setTeamCategory(teamData.teamCategory || 'Men');
      setAddress(teamData.address || '');
      setEstYear(teamData.establishedYear || '');
      setSlogan(teamData.slogan || '');
      setLogoUrl(teamData.logoUrl || '');
      setAboutTeam(teamData.aboutTeam || '');
      setBestPerformance(teamData.bestPerformance || '');
    }
  }, [teamData]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const cleanAddress = address.trim();
    const cleanEstYear = estYear.toString().trim();
    const cleanAbout = aboutTeam.trim();

    if (!cleanAddress || !cleanEstYear || !cleanAbout) {
      Swal.fire({ icon: 'warning', title: 'माहिती अपूर्ण आहे!', text: 'कृपया आवश्यक माहिती अचूक भरा!', confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
      return;
    }
    
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.email || user.info?.email);
      const updatedObj = {
        teamCategory,
        address: cleanAddress,
        establishedYear: cleanEstYear,
        slogan: slogan.trim(),
        logoUrl: logoUrl.trim(),
        aboutTeam: cleanAbout,
        bestPerformance: bestPerformance.trim(),
        profileUpdatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updatedObj);
      setTeamData(prev => ({ ...prev, ...updatedObj }));
      setIsEditMode(false);
      if (fetchUserData) fetchUserData();

      Swal.fire({ icon: 'success', title: 'बदल यशस्वी! 🎉', text: 'संघाची प्रोफाईल अपडेट झाली आहे.', showConfirmButton: false, timer: 1500, customClass: { popup: 'rounded-3xl' } });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'अडचण आली!', text: 'माहिती सुरक्षित करता आली नाही.', confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
    } finally { setLoading(false); }
  };

// 🎯 १. VIEW MODE: माहिती, कामगिरी आणि घोषवाक्य इथे डिस्प्ले होईल!
  if (!isEditMode) {
    return (
      <div className="w-full space-y-4">
        {/* मुख्य हेडर भाग (image_cd0385.png सारखा लूक) */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
            {teamData.logoUrl ? <img src={teamData.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-400" size={24} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide truncate">{user.teamName}</h2>
            <p className="text-xs text-[#ff6600] font-bold mt-0.5">
              ⚡ {teamData.teamCategory === 'Women' ? 'महिला गोविंदा पथक' : teamData.teamCategory === 'Both' ? 'पुरुष व महिला गोविंदा पथक' : 'पुरुष गोविंदा पथक'}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wide">
              स्थापना: {teamData.establishedYear || '—'} | पत्ता: {teamData.address || '—'}
            </p>
          </div>
        </div>

        {/* 🎯 बदल: घोषवाक्य (Slogan) आता कॉम्पोनंटच्या आतच सर्वात आधी प्रिमियम दिसेल */}
        {teamData.slogan && (
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-xs italic font-bold text-slate-500">"{teamData.slogan}"</p>
          </div>
        )}

        {/* 🏆 सर्वोत्कृष्ट कामगिरी */}
        {teamData.bestPerformance && (
          <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-3 flex items-start space-x-2.5 animate-in fade-in duration-150">
            <Trophy className="text-[#ff6600] flex-shrink-0 mt-0.5" size={15} />
            <div className="text-xs">
              <span className="block font-black text-orange-800 uppercase tracking-wider text-[10px]">सर्वोत्कृष्ट कामगिरी (Record)</span>
              <p className="text-slate-700 font-bold mt-0.5">{teamData.bestPerformance}</p>
            </div>
          </div>
        )}

        {/* 📝 संघाची माहिती */}
        {teamData.aboutTeam && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-start space-x-2.5 animate-in fade-in duration-150">
            <FileText className="text-slate-400 flex-shrink-0 mt-0.5" size={15} />
            <div className="text-xs">
              <span className="block font-black text-slate-400 uppercase tracking-wider text-[10px]">संघाची माहिती (About)</span>
              <p className="text-slate-600 font-medium mt-1 leading-relaxed">{teamData.aboutTeam}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🎯 २. EDIT MODE: पेन्सिल दाबल्यावर हा प्रिमियम फॉर्म दिसेल
  return (
    <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 w-full">
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">संघाचा प्रकार</label>
        <div className="grid grid-cols-3 gap-2">
          {[{ id: 'Men', label: 'पुरुष संघ' }, { id: 'Women', label: 'महिला संघ' }, { id: 'Both', label: 'दोन्ही' }].map((cat) => (
            <button key={cat.id} type="button" onClick={() => setTeamCategory(cat.id)} className={`py-2 px-1 rounded-xl border text-xs font-black transition-all text-center ${teamCategory === cat.id ? 'bg-[#ff6600] text-white border-[#ff6600]' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{cat.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center space-x-1"><MapPin size={11} /> <span>पत्ता</span></label>
          <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 text-slate-800 font-bold focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center space-x-1"><Calendar size={11} /> <span>स्थापना वर्ष</span></label>
          <input type="number" required value={estYear} onChange={(e) => setEstYear(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 text-slate-800 font-bold focus:outline-none" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center space-x-1"><Image size={11} /> <span>लोगो लिंक</span></label>
        <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 text-slate-800 focus:outline-none" />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center space-x-1"><Info size={11} /> <span>घोषवाक्य</span></label>
        <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 text-slate-800 focus:outline-none" />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center space-x-1"><Trophy size={11} className="text-[#ff6600]" /> <span>सर्वोत्कृष्ट कामगिरी</span></label>
        <input type="text" value={bestPerformance} onChange={(e) => setBestPerformance(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 text-slate-800 focus:outline-none" />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center space-x-1"><FileText size={11} /> <span>संघाची माहिती</span></label>
          <span className="text-[10px] font-bold text-slate-400">{aboutTeam.length}/200</span>
        </div>
        <textarea required maxLength="200" rows="2" value={aboutTeam} onChange={(e) => setAboutTeam(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 text-slate-800 resize-none focus:outline-none" />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-[#0b132b] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 shadow-md">
        <Check size={14} /> <span>{loading ? 'जतन होत आहे...' : 'माहिती जतन करा'}</span>
      </button>
    </form>
  );
}