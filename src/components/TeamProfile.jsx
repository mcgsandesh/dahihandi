import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldCheck, MapPin, Calendar, Info, Image, 
  Trophy, FileText, Check, Image as ImageIcon, HeartHandshake,
  Link, AlertTriangle, Globe, Edit2
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function TeamProfile({ user, teamData, setTeamData, isEditMode, setIsEditMode, fetchUserData, handleProfileComplete }) {
  
  // 🎯 फॉर्म स्टेट्स (Blank Screen फॉलबॅक)
  const [teamCategory, setTeamCategory] = useState('Men');
  const [address, setAddress] = useState('');
  const [estYear, setEstYear] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [aboutTeam, setAboutTeam] = useState('');
  const [bestPerformance, setBestPerformance] = useState('');
  const [loading, setLoading] = useState(false);

  // नवीन फीचर्स स्टेट्स
  const [hasInsurance, setHasInsurance] = useState(false);
  const [bestPerformanceUrl, setBestPerformanceUrl] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');

  // ५ एड्रेस फील्ड्स स्टेट्स
  const [areaName, setAreaName] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');

  // 🔄 १. डेटाबेस आणि प्रॉप्स सिंकिंग (फक्त एकदाच लोड होणार - टॉगल लॉक फिक्स ⚡)
  useEffect(() => {
    if (teamData) {
      console.log("=== 🔥 [START] TeamProfile Data Debug Live ===");
      setTeamCategory(teamData.teamCategory || 'Men');
      setAddress(teamData.address || '');
      setEstYear(teamData.establishedYear || '');
      setSlogan(teamData.slogan || '');
      setLogoUrl(teamData.logoUrl || '');
      setAboutTeam(teamData.aboutTeam || '');
      setBestPerformance(teamData.bestPerformance || '');
      
      const localUser = JSON.parse(localStorage.getItem('govinda_user') || '{}');
      
      setHasInsurance(teamData.hasInsurance !== undefined ? teamData.hasInsurance : (localUser.hasInsurance === true));
      setBestPerformanceUrl(teamData.bestPerformanceUrl || localUser.bestPerformanceUrl || '');
      
      setFacebook(teamData.socialLinks?.facebook || localUser.socialLinks?.facebook || '');
      setInstagram(teamData.socialLinks?.instagram || localUser.socialLinks?.instagram || '');
      setYoutube(teamData.socialLinks?.youtube || localUser.socialLinks?.youtube || '');

      setAreaName(teamData.areaName || '');
      setPincode(teamData.pincode || '');
      setCity(teamData.city || '');
      setDistrict(teamData.district || '');
      setState(teamData.state || '');
    }
  }, [teamData]);
  
  // 💾 २. सेव्ह हँडलर
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docId = user.teamUID || user.uid || user.id;
      if (!docId) {
        Swal.fire({ icon: 'error', title: 'त्रुटी!', text: 'संघ आयडी सापडला नाही.', confirmButtonColor: '#ff6600' });
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", docId);
      const updatedObj = {
        teamCategory,
        address: address.trim(),
        establishedYear: estYear.toString().trim(),
        slogan: slogan.trim(),
        logoUrl: logoUrl.trim(),
        aboutTeam: aboutTeam.trim(),
        bestPerformance: bestPerformance.trim(),
        isProfileComplete: true,
        profileUpdatedAt: serverTimestamp(),
        hasInsurance,
        bestPerformanceUrl: bestPerformanceUrl.trim(),
        socialLinks: { facebook: facebook.trim(), instagram: instagram.trim(), youtube: youtube.trim() },
        areaName: areaName.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        district: district.trim(),
        state: state.trim()
      };

      await updateDoc(userRef, updatedObj);
      if (setTeamData) setTeamData(prev => ({ ...prev, ...updatedObj }));
      if (setIsEditMode) setIsEditMode(false); 
      if (fetchUserData) fetchUserData();

      if (handleProfileComplete) {
        const freshUserObj = { ...user, ...updatedObj, isProfileComplete: true };
        handleProfileComplete(freshUserObj);
      } else {
        const savedUser = localStorage.getItem('govinda_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          localStorage.setItem('govinda_user', JSON.stringify({ ...parsedUser, ...updatedObj, isProfileComplete: true }));
        }
      }

      Swal.fire({ icon: 'success', title: 'बदल यशस्वी! 🎉', text: 'संघाची प्रोफाईल अपडेट झाली आहे.', showConfirmButton: false, timer: 1500, customClass: { popup: 'rounded-3xl' } });
    } catch (err) {
      console.error("Profile Save Error:", err);
      Swal.fire({ icon: 'error', title: 'अडचण आली!', text: 'कृपया पुन्हा प्रयत्न करा.', confirmButtonColor: '#ff6600' });
    } finally { setLoading(false); }
  };

  // 🖥️ ३. VIEW MODE: भव्य डार्क बॅनर आणि इन-बिल्ट एडिट बटण
  if (!isEditMode) {
    return (
      <div className="w-full space-y-5 animate-in fade-in duration-150 p-0 m-0">
        
        {/* 🚩 मुख्य ब्रँडिंग डार्क बॅनर (image_e6da5c.png डिझाइन) */}
        <div className="bg-gradient-to-r from-[#0b132b] to-[#1c2541] text-white p-6 rounded-3xl shadow-sm relative overflow-hidden w-full">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#ff6600] opacity-15 blur-3xl rounded-full"></div>
          
          {/* 🎯 कडक एडिट बटण - बॅनरच्या आतच उजव्या कोपऱ्यात सेट केले! */}
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={() => setIsEditMode(true)} 
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center space-x-1.5 backdrop-blur-sm group active:scale-95"
              title="माहिती सुधारा"
            >
              <Edit2 size={14} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-black tracking-wide hidden sm:inline">माहिती सुधारा</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left pr-0 sm:pr-24">
            <div className="w-20 h-20 bg-white rounded-2xl border border-slate-700/50 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden shadow-lg">
              {teamData?.logoUrl ? (
                <img src={teamData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ImageIcon size={24} />
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white">{user?.teamName || "संघ उपलब्ध नाही"}</h2>
                <div className="flex items-center space-x-1.5 self-center sm:self-auto">
                  <span className="text-[9px] bg-blue-600/30 text-blue-300 font-black px-2 py-0.5 rounded border border-blue-500/20">
                    {teamData?.teamCategory === 'Women' ? '👩‍👧 महिला पथक' : teamData?.teamCategory === 'Both' ? '👨‍👩‍👦 पुरुष व महिला' : '👨‍👦 पुरुष पथक'}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${hasInsurance ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/20' : 'bg-red-600/20 text-red-300 border-red-500/20'}`}>
                    {hasInsurance ? '● विमा सुरक्षित' : '● विमा अपूर्ण'}
                  </span>
                </div>
              </div>
              
              {teamData?.slogan && <p className="text-xs text-slate-300 italic font-medium">"{teamData.slogan}"</p>}
              
              <div className="font-mono text-[9px] font-black px-2 py-0.5 rounded bg-white/10 text-slate-400 tracking-wide inline-block">
                UID: {user?.teamUID || user?.uid || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* 📊 खालचे दोन कॉलम्स ग्रीड (४ आणि ८ स्प्लिट) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
          
          {/* डावा कॉलम: मंडळाची माहिती */}
          <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 w-full">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center space-x-1">
              <FileText size={13} className="text-slate-400" /> <span>📋 मंडळाची माहिती</span>
            </h3>
            
            <div className="space-y-4 text-xs font-bold text-slate-600">
              <div className="flex items-start space-x-3">
                <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">पत्ता / परिसर</p>
                  <p className="text-slate-800 mt-0.5 font-extrabold">{address || '—'}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {areaName && <span className="bg-slate-50 text-slate-500 text-[9px] px-1.5 py-0.5 rounded border">{areaName}</span>}
                    {pincode && <span className="bg-slate-50 text-slate-600 text-[9px] font-mono px-1.5 py-0.5 rounded border">PIN: {pincode}</span>}
                    {district && <span className="bg-slate-50 text-slate-400 text-[9px] px-1.5 py-0.5 rounded border">{district}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">स्थापना वर्ष</p>
                  <p className="text-slate-800 font-sans font-extrabold mt-0.5 text-sm">{teamData?.establishedYear || estYear || '—'}</p>
                </div>
              </div>
            </div>

            {/* 🔗 सोशल कनेक्ट */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">सोशल नेटवर्क:</span>
              <div className="flex flex-wrap gap-1.5">
                {instagram ? (
                  <a href={instagram} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-all text-[11px] font-black flex items-center space-x-1"><Link size={11} /> <span>Instagram</span></a>
                ) : <span className="text-[9px] text-slate-300 italic">नो इंस्टाग्राम</span>}
                {facebook ? (
                  <a href={facebook} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-[11px] font-black flex items-center space-x-1"><Link size={11} /> <span>Facebook</span></a>
                ) : <span className="text-[9px] text-slate-300 italic ml-1">नो फेसबुक</span>}
                {youtube ? (
                  <a href={youtube} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all text-[11px] font-black flex items-center space-x-1"><Link size={11} /> <span>YouTube</span></a>
                ) : <span className="text-[9px] text-slate-300 italic ml-1">नो यूट्यूब</span>}
              </div>
            </div>
          </div>

          {/* उजवा मोठा कॉलम: उत्सव सद्यस्थिती + फोटो व्हिज्युअल */}
          <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 w-full">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center space-x-1">
              <Trophy size={13} className="text-amber-500" /> <span>📊 उत्सव सद्यस्थिती आणि कामगिरी</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50/50 p-3 rounded-2xl border flex items-start space-x-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-[#ff6600] mt-0.5"><Trophy size={15} /></div>
                <div className="text-xs">
                  <span className="block font-black text-slate-400 uppercase tracking-wider text-[9px]">सर्वोत्कृष्ट कामगिरी (Record)</span>
                  <p className="text-slate-700 font-extrabold mt-0.5">{bestPerformance || 'माहिती भरलेली नाही'}</p>
                </div>
              </div>

              <div className="bg-slate-50/50 p-3 rounded-2xl border flex items-start space-x-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-white mt-0.5"><Info size={15} /></div>
                <div className="text-xs">
                  <span className="block font-black text-slate-400 uppercase tracking-wider text-[9px]">संघाबद्दल संक्षिप्त इतिहास</span>
                  <p className="text-slate-600 font-medium mt-0.5 leading-relaxed line-clamp-3">{aboutTeam || '—'}</p>
                </div>
              </div>
            </div>

            {/* 📸 सलामी क्षणचित्र व्हिज्युअल */}
            <div className="pt-2 w-full">
              <span className="block font-black text-slate-400 uppercase tracking-wider text-[10px] mb-2">📸 सर्वोत्कृष्ट सलामी क्षणचित्र</span>
              {bestPerformanceUrl ? (
                <div className="w-full h-80 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 shadow-sm">
                  <img src={bestPerformanceUrl} alt="Best Performance Live" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-4 text-center text-slate-400">
                  <ImageIcon size={22} className="text-slate-300" />
                  <p className="text-[11px] font-bold mt-1 text-slate-500">सलामीचा फोटो उपलब्ध नाही</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    );
  }

  // 📝 ४. EDIT MODE
  return (
    <form onSubmit={handleSaveProfile} className="w-full space-y-4 pt-1 text-xs font-bold text-slate-600 animate-in fade-in duration-150 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-0.5">✏️ संघ प्रोफाईल संपादन</h3>
        <p className="text-[10px] text-slate-400 font-medium">माहिती अचूक भरून अपडेट करा भाऊ.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-7 space-y-1.5">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">संघाचा प्रकार</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'Men', label: 'पुरुष संघ' }, { id: 'Women', label: 'महिला संघ' }, { id: 'Both', label: 'दोन्ही' }].map((cat) => (
              <button key={cat.id} type="button" onClick={() => setTeamCategory(cat.id)} className={`py-2 px-1 rounded-xl border text-xs font-black transition-all text-center ${teamCategory === cat.id ? 'bg-[#ff6600] text-white border-[#ff6600]' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{cat.label}</button>
            ))}
          </div>
        </div>

        <div className="md:col-span-5 space-y-1.5">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">खेळाडूंचा विमा (Insurance)</label>
          <button type="button" onClick={() => setHasInsurance(!hasInsurance)} className={`w-full py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center space-x-2 ${hasInsurance ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <HeartHandshake size={14} />
            <span>{hasInsurance ? 'विमा पूर्ण उतरवला आहे ✓' : 'विमा उतरवला नाही ✗'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><MapPin size={11} /> <span>पूर्ण पत्ता (Address)</span></label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" />
        </div>
        <div className="md:col-span-4 space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Calendar size={11} /> <span>स्थापना वर्ष</span></label>
          <input type="number" value={estYear} onChange={(e) => setEstYear(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" />
        </div>
      </div>

      <div className="bg-slate-50/50 border border-slate-200/60 p-3 rounded-2xl space-y-3 w-full">
        <span className="text-[10px] uppercase font-black tracking-wider text-orange-500 block">📍 city आणि परिसर तपशील</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500">परिसर (Area)</label><input type="text" value={areaName} onChange={(e) => setAreaName(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" /></div>
          <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500">पिनकोड (Pincode)</label><input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" /></div>
          <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500">शहर (City)</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" /></div>
          <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500">जिल्हा (District)</label><input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Image size={11} /> <span>लोगो लिंक (Logo URL)</span></label>
          <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Info size={11} /> <span>घोषवाक्य (Slogan)</span></label>
          <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Trophy size={11} className="text-[#ff6600]" /> <span>सर्वोत्कृष्ट कामगिरी (Record)</span></label>
          <input type="text" value={bestPerformance} onChange={(e) => setBestPerformance(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><ImageIcon size={11} className="text-[#ff6600]" /> <span>सलामी फोटो लिंक (Performance Photo URL)</span></label>
          <input type="url" value={bestPerformanceUrl} onChange={(e) => setBestPerformanceUrl(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" />
        </div>
      </div>

      <div className="bg-slate-50/50 border border-slate-200/60 p-3 rounded-2xl space-y-3 w-full">
        <span className="text-[10px] uppercase font-black tracking-wider text-blue-600 flex items-center space-x-1"><Link size={11}/> <span>सोशल मीडिया नेटवर्क लिंक्स</span></span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center bg-white border rounded-xl px-2.5 py-1"><span className="text-[10px] text-blue-600 font-bold mr-2">FB</span><input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full py-1 text-xs focus:outline-none bg-transparent" /></div>
          <div className="flex items-center bg-white border rounded-xl px-2.5 py-1"><span className="text-[10px] text-pink-600 font-bold mr-2">IG</span><input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full py-1 text-xs focus:outline-none bg-transparent" /></div>
          <div className="flex items-center bg-white border rounded-xl px-2.5 py-1"><span className="text-[10px] text-red-600 font-bold mr-2">YT</span><input type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} className="w-full py-1 text-xs focus:outline-none bg-transparent" /></div>
        </div>
      </div>

      <div className="space-y-1 w-full">
        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><FileText size={11} /> <span>संघाची माहिती (About Team)</span></label>
        <textarea rows="2" value={aboutTeam} onChange={(e) => setAboutTeam(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 resize-none focus:bg-white focus:outline-none" />
      </div>

      <div className="flex items-center space-x-2 pt-1 w-full">
        <button type="button" onClick={() => setIsEditMode(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold transition-all">रद्द करा</button>
        <button type="submit" disabled={loading} className="flex-1 bg-[#0b132b] hover:bg-black text-white py-2.5 rounded-xl font-black shadow-md flex items-center justify-center space-x-1 transition-all">
          <Check size={14} /> <span>{loading ? 'जतन होत आहे...' : 'माहिती जतन करा'}</span>
        </button>
      </div> 
    </form>
  );
}