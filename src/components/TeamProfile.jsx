import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, MapPin, Calendar, Info, ArrowRight, Image, Trophy, FileText, Check, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TeamProfile({ user, teamData, setTeamData, isEditMode, setIsEditMode, fetchUserData, handleProfileComplete }) {
  // फॉर्म स्टेट्स
  const [teamCategory, setTeamCategory] = useState(teamData?.teamCategory || 'Men');
  const [address, setAddress] = useState(teamData?.address || '');
  const [estYear, setEstYear] = useState(teamData?.establishedYear || '');
  const [slogan, setSlogan] = useState(teamData?.slogan || '');
  const [logoUrl, setLogoUrl] = useState(teamData?.logoUrl || '');
  const [aboutTeam, setAboutTeam] = useState(teamData?.aboutTeam || '');
  const [bestPerformance, setBestPerformance] = useState(teamData?.bestPerformance || '');
  const [loading, setLoading] = useState(false);

  // 🎯 नवीन ५ एड्रेस फील्ड्स स्टेट्स
  const [areaName, setAreaName] = useState(teamData?.areaName || '');
  const [pincode, setPincode] = useState(teamData?.pincode || '');
  const [city, setCity] = useState(teamData?.city || '');
  const [district, setDistrict] = useState(teamData?.district || '');
  const [state, setState] = useState(teamData?.state || '');

  useEffect(() => {
    if (teamData) {
      setTeamCategory(teamData.teamCategory || 'Men');
      setAddress(teamData.address || '');
      setEstYear(teamData.establishedYear || '');
      setSlogan(teamData.slogan || '');
      setLogoUrl(teamData.logoUrl || '');
      setAboutTeam(teamData.aboutTeam || '');
      setBestPerformance(teamData.bestPerformance || '');
      
      // नवीन फील्ड्स सिंक ठेवणे
      setAreaName(teamData.areaName || '');
      setPincode(teamData.pincode || '');
      setCity(teamData.city || '');
      setDistrict(teamData.district || '');
      setState(teamData.state || '');
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
        isProfileComplete: true,
        profileUpdatedAt: serverTimestamp(),
        
        // 🎯 नवीन फील्ड्स पेलोडमध्ये जोडली
        areaName: areaName.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        district: district.trim(),
        state: state.trim()
      };

      // १. डेटाबेस अपडेट केला
      await updateDoc(userRef, updatedObj);
      
      // २. तुझे मूळ लोकल स्टेट्स अपडेट्स (आहेत तसेच सुरक्षित)
      if (setTeamData) setTeamData(prev => ({ ...prev, ...updatedObj }));
      if (setIsEditMode) setIsEditMode(false); // 👈 यामुळे फॉर्म बंद होऊन डायरेक्ट व्ह्यू मोड ओपन होईल!
      if (fetchUserData) fetchUserData();

      if (handleProfileComplete) {
        const freshUserObj = {
          ...user,
          ...updatedObj,
          isProfileComplete: true
        };
        handleProfileComplete(freshUserObj);
      } else {
        // 🎯 कडक दुरुस्ती: रिलोड मारणारा 'window.location.reload()' इथून पूर्णपणे काढून टाकला!
        const savedUser = localStorage.getItem('govinda_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          localStorage.setItem('govinda_user', JSON.stringify({ ...parsedUser, ...updatedObj, isProfileComplete: true }));
        }
      }

      Swal.fire({ icon: 'success', title: 'बदल यशस्वी! 🎉', text: 'संघाची प्रोफाईल अपडेट झाली आहे.', showConfirmButton: false, timer: 1500, customClass: { popup: 'rounded-3xl' } });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'अडचण आली!', text: 'माहिती सुरक्षित करता आली नाही.', confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
    } finally { setLoading(false); }
  };

  // 🎯 १. VIEW MODE: प्रिमियम आणि स्पेस-ऑप्टिमाइज्ड लेआउट (`image_3e313d.png` चे प्रिमियम व्हर्जन)
  if (!isEditMode) {
    return (
      <div className="w-full space-y-5 animate-in fade-in duration-150">
        {/* मुख्य हेडर भाग */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
            {teamData?.logoUrl ? (
              <img src={teamData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 flex flex-col items-center justify-center text-slate-400">
                <ImageIcon size={22} className="text-slate-400" />
                <span className="text-[8px] font-black tracking-widest uppercase mt-0.5">No Logo</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide truncate">{user?.teamName || "संघ उपलब्ध नाही"}</h2>
            <p className="text-xs text-[#ff6600] font-bold mt-0.5">
              ⚡ {teamData?.teamCategory === 'Women' ? 'महिला गोविंदा पथक' : teamData?.teamCategory === 'Both' ? 'पुरुष व महिला गोविंदा पथक' : 'पुरुष गोविंदा पथक'}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wide">
              स्थापना: {teamData?.establishedYear || '—'}
            </p>
          </div>
        </div>

        {/* घोषवाक्य (Slogan) */}
        {teamData?.slogan && (
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-xs italic font-bold text-slate-500">"{teamData.slogan}"</p>
          </div>
        )}

        {/* 📍 सुबक पत्ता विभाग (डायनॅमिक बॅजेस लेआउट - जागा वाचवण्यासाठी) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-50">
          <span className="block font-black text-slate-400 uppercase tracking-wider text-[10px]">📍 मंडळाचा पत्ता</span>
          <p className="text-xs text-slate-700 font-bold leading-relaxed">{address}</p>
          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold">
            {areaName && <span className="bg-slate-50 text-slate-600 border px-2 py-0.5 rounded-lg">{areaName}</span>}
            {city && <span className="bg-slate-50 text-slate-600 border px-2 py-0.5 rounded-lg">{city}</span>}
            {pincode && <span className="bg-slate-50 text-slate-700 font-mono border px-2 py-0.5 rounded-lg">PIN: {pincode}</span>}
            {district && <span className="bg-slate-50 text-slate-400 border px-2 py-0.5 rounded-lg">{district}</span>}
            {state && <span className="bg-slate-50 text-slate-400 border px-2 py-0.5 rounded-lg">{state}</span>}
          </div>
        </div>

        {/* 🏆 सर्वोत्कृष्ट कामगिरी */}
        {teamData?.bestPerformance && (
          <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-3 flex items-start space-x-2.5">
            <Trophy className="text-[#ff6600] flex-shrink-0 mt-0.5" size={15} />
            <div className="text-xs">
              <span className="block font-black text-orange-800 uppercase tracking-wider text-[10px]">सर्वोत्कृष्ट कामगिरी (Record)</span>
              <p className="text-slate-700 font-bold mt-0.5">{teamData.bestPerformance}</p>
            </div>
          </div>
        )}

        {/* 📝 संघाची माहिती */}
        {teamData?.aboutTeam && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-start space-x-2.5">
            <FileText className="text-slate-400 flex-shrink-0 mt-0.5" size={15} />
            <div className="text-xs">
              <span className="block font-black text-slate-400 uppercase tracking-wider text-[10px]">संघाची माहिती (About)</span>
              <p className="text-slate-600 font-medium mt-1 leading-relaxed whitespace-pre-wrap">{teamData.aboutTeam}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🎯 २. EDIT MODE: २-कॉलम डेस्कटॉप ग्रीड लेआउट (जागेचा परिपूर्ण वापर)
  return (
    <form onSubmit={handleSaveProfile} className="space-y-4 pt-1 w-full text-xs font-bold text-slate-600 animate-in fade-in duration-150">
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-0.5">✏️ संघ प्रोफाईल संपादन</h3>
        <p className="text-[10px] text-slate-400 font-medium">पत्ता आणि इतर माहिती तुकड्यांमध्ये भरल्यास रिपोर्ट आणि डेटा फिल्टर करणे सोपे होईल.</p>
      </div>

      {/* संघाचा प्रकार */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">संघाचा प्रकार</label>
        <div className="grid grid-cols-3 gap-2">
          {[{ id: 'Men', label: 'पुरुष संघ' }, { id: 'Women', label: 'महिला संघ' }, { id: 'Both', label: 'दोन्ही' }].map((cat) => (
            <button key={cat.id} type="button" onClick={() => setTeamCategory(cat.id)} className={`py-2 px-1 rounded-xl border text-xs font-black transition-all text-center ${teamCategory === cat.id ? 'bg-[#ff6600] text-white border-[#ff6600] shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{cat.label}</button>
          ))}
        </div>
      </div>

      {/* पत्ता आणि स्थापना वर्ष */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><MapPin size={11} /> <span>पूर्ण पत्ता (Address)</span></label>
          <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 font-bold focus:bg-white focus:outline-none" placeholder="उदा. खोली नं. ४, कोकण वैभव चाळ, मुंबई" />
        </div>
        <div className="md:col-span-4 space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Calendar size={11} /> <span>स्थापना वर्ष</span></label>
          <input type="number" required value={estYear} onChange={(e) => setEstYear(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 font-bold focus:bg-white focus:outline-none" placeholder="1950" />
        </div>
      </div>

      {/* 🎯 ५ नवीन एड्रेस तुकडे फील्ड्स (डेस्कटॉपवर ३ कॉलम ग्रीड) */}
      <div className="bg-slate-50/50 border border-slate-200/60 p-3 rounded-2xl space-y-3">
        <span className="text-[10px] uppercase font-black tracking-wider text-orange-500 block">📍 शहर आणि परिसर तपशील (फिल्टरसाठी)</span>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500">परिसराचे नाव (Area)</label>
            <input type="text" value={areaName} onChange={(e) => setAreaName(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="उदा. Lower Parel" />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500">पिनकोड (Pincode)</label>
            <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white font-mono focus:outline-none" placeholder="400013" />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500">शहर / गाव (City)</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="Mumbai" />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500">जिल्हा (District)</label>
            <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="Mumbai City" />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500">राज्य (State)</label>
            <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="Maharashtra" />
          </div>
        </div>
      </div>

      {/* लोगो आणि घोषवाक्य */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Image size={11} /> <span>लोगो लिंक (Logo URL)</span></label>
          <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" placeholder="https://example.com/logo.png" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Info size={11} /> <span>घोषवाक्य (Slogan)</span></label>
          <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" placeholder="उदा. एकी हेच बळ" />
        </div>
      </div>

      {/* कामगिरी */}
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Trophy size={11} className="text-[#ff6600]" /> <span>सर्वोत्कृष्ट कामगिरी (Record)</span></label>
        <input type="text" value={bestPerformance} onChange={(e) => setBestPerformance(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" placeholder="उदा. २००५ साली लावलेले ८ थर" />
      </div>

      {/* संघाची माहिती */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><FileText size={11} /> <span>संघाची माहिती (About Team)</span></label>
          <span className="text-[10px] font-bold text-slate-400">{aboutTeam.length}/200</span>
        </div>
        <textarea required maxLength="200" rows="2" value={aboutTeam} onChange={(e) => setAboutTeam(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 resize-none focus:bg-white focus:outline-none" placeholder="मंडळाचा संक्षिप्त इतिहास लिहा..." />
      </div>

      {/* ॲक्शन बटन्स */}
      <div className="flex items-center space-x-2 pt-2">
        <button type="button" onClick={() => setIsEditMode(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold transition-all">रद्द करा</button>
        <button type="submit" disabled={loading} className="flex-1 bg-[#0b132b] hover:bg-black text-white py-2.5 rounded-xl font-black shadow-md flex items-center justify-center space-x-1 transition-all">
          <Check size={14} /> <span>{loading ? 'जतन होत आहे...' : 'माहिती जतन करा'}</span>
        </button>
      </div>
    </form>
  );
}