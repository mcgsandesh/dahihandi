import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldCheck, MapPin, Calendar, Info, Image, 
  Trophy, FileText, Check, Image as ImageIcon, HeartHandshake,
  Link, AlertTriangle, Globe, Edit2, User, Award, Printer, Share2
} from 'lucide-react';
import Swal from 'sweetalert2';

// 💸 मोबाईलसाठी तळाची चिकटलेली मॅन्युअल ॲड इम्पॉर्ट केली
import AdMobileBottom from '../components/AdMobileBottom'; // कॉम्पोनंटचा अचूक पाथ तपासून घ्या

// 🖨️ ग्लोबल प्रिंट कॉम्पोनेंट इम्पोर्ट
import PrintableTeamProfile from './PrintableTeamProfile';
import { handleProfilePrint } from '../components/PrintableTeamProfile';
// 🎯 मुख्य लोगोचा पाथ (तुमच्या प्रोजेक्ट स्ट्रक्चरनुसार मॅच करा)
import logoIcon from '../assets/logo.png'; 

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

  // ५ एड्रेस FIELD्स स्टेट्स
  const [areaName, setAreaName] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');

  // मैलस्टोन आणि इतर इनपुट स्टेट्स
  const [coachName, setCoachName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [milestone7, setMilestone7] = useState('');
  const [milestone8, setMilestone8] = useState('');
  const [milestone9, setMilestone9] = useState('');
  const [milestone10, setMilestone10] = useState('');

  // =========================================================================
  // 🔍 SECTION 1: डेटाबेस आणि प्रॉप्स रिअल-टाइम सिंकिंग (UNDEFINED ERROR FIX 🚀)
  // =========================================================================
  useEffect(() => {
    console.log("🔍 [PROPS CHECK]: पॅरेंट कडून आलेला मूळ teamData:", teamData);

    if (teamData) {
      const targetData = teamData.data ? teamData.data : teamData;
      
      console.log("=== 🔥 [START] TeamProfile अचूक डेटायादी पडताळणी कक्ष ===");
      
      setTeamCategory(targetData.teamCategory || 'Men');
      setAddress(targetData.address || '');
      setEstYear(targetData.establishedYear || '');
      setSlogan(targetData.slogan || '');
      setLogoUrl(targetData.logoUrl || '');
      setAboutTeam(targetData.aboutTeam || '');
      setBestPerformance(targetData.bestPerformance || '');
      
      const localUser = JSON.parse(localStorage.getItem('govinda_user') || '{}');
      
      setHasInsurance(targetData.hasInsurance !== undefined ? targetData.hasInsurance : (localUser.hasInsurance === true));
      setBestPerformanceUrl(targetData.bestPerformanceUrl || localUser.bestPerformanceUrl || '');
      
      setFacebook(targetData.socialLinks?.facebook || localUser.socialLinks?.facebook || '');
      setInstagram(targetData.socialLinks?.instagram || localUser.socialLinks?.instagram || '');
      setYoutube(targetData.socialLinks?.youtube || localUser.socialLinks?.youtube || '');

      setAreaName(targetData.areaName || '');
      setPincode(targetData.pincode || '');
      setCity(targetData.city || '');
      setDistrict(targetData.district || '');
      setState(targetData.state || '');

      setCoachName(targetData.coachName || '');
      setCaptainName(targetData.captainName || '');
      setMilestone7(targetData.milestone7 || '');
      setMilestone8(targetData.milestone8 || '');
      setMilestone9(targetData.milestone9 || '');
      setMilestone10(targetData.milestone10 || '');
      
      console.log("=== ✓ [SUCCESS] सर्व लोकल स्टेट्स मॅप झाल्या! ===");
    }
  }, [teamData]);
  
  // =========================================================================
  // 💾 SECTION 2: सेव्ह हँडलर (अचूक फ्रंटएंड री-रेंडर फिक्स 🚀)
  // =========================================================================
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docId = user.teamUID || user.uid || user.id || teamData?.uid || teamData?.id;
      if (!docId) {
        Swal.fire({ icon: 'error', title: 'त्रुटी!', text: 'संघ आयडी (UID) सापडला नाही.', confirmButtonColor: '#ff6600' });
        setLoading(false);
        return;
      }

      const isSuperAdmin = user?.role === 'superadmin';

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
        hasPendingEdits: isSuperAdmin ? false : true,  
        verificationStatus: isSuperAdmin ? "approved" : "pending",
        profileUpdatedAt: serverTimestamp(),
        hasInsurance,
        bestPerformanceUrl: bestPerformanceUrl.trim(),
        socialLinks: { facebook: facebook.trim(), instagram: instagram.trim(), youtube: youtube.trim() },
        areaName: areaName.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        district: district.trim(),
        state: state.trim(),
        coachName: coachName.trim(),
        captainName: captainName.trim(),
        milestone7: milestone7.trim(),
        milestone8: milestone8.trim(),
        milestone9: milestone9.trim(),
        milestone10: teamCategory === 'Women' ? '' : milestone10.trim()
      };

      await updateDoc(userRef, updatedObj);

      if (setTeamData) {
        setTeamData(prev => ({ ...prev, ...updatedObj }));
      }

      if (fetchUserData) await fetchUserData();

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

      if (setIsEditMode) setIsEditMode(false); 

      Swal.fire({ 
        icon: 'success', 
        title: isSuperAdmin ? 'डेटा थेट पब्लिश झाला! 🚀' : 'बदल जतन केले! ⏳', 
        text: isSuperAdmin ? 'संघाची प्रोफाईल थेट लाईव्ह अपडेट झाली आहे.' : 'सुपरॲडमीन मंजुरीनंतर कट्ट्यावर बदल दिसतील.', 
        showConfirmButton: false, 
        timer: 2000, 
        customClass: { popup: 'rounded-3xl' } 
      });
    } catch (err) {
      console.error("❌ [PROFILE SAVE CRASH]:", err);
      Swal.fire({ icon: 'error', title: 'अडचण आली!', text: `त्रुटी: ${err.message || 'कृपया पुन्हा प्रयत्न करा.'}`, confirmButtonColor: '#ff6600' });
    } finally { setLoading(false); }
  };

  // =========================================================================
  // 🔐 शेअर लिंक लॉक करण्यासाठी कडक सुधारित व्हॅलिडेशन चेक 🚀
  // =========================================================================
  const isProfileReadyForShare = 
    (aboutTeam && aboutTeam.trim().length >= 300) && 
    address && logoUrl && slogan && bestPerformance && bestPerformanceUrl &&
    coachName && captainName && 
    (milestone7 || milestone8 || milestone9 || milestone10);

  // =========================================================================
  // 🖥️ SECTION 3: VIEW MODE (अल्ट्रा-कॉम्पॅक्ट ओव्हरलॅप फ्री डिझाईन 🚀)
  // =========================================================================
  if (!isEditMode) {
    return (
      <div className="w-full space-y-4 animate-in fade-in duration-150 p-0 m-0 text-left text-slate-900 bg-[#f8fafc]">
        
        {/* 🚩 १. अल्ट्रा-कॉम्पॅक्ट बॅनर */}
        <div className="bg-gradient-to-br from-[#070b19] via-[#0f172a] to-[#1e293b] text-white p-4 md:p-6 rounded-3xl shadow-md relative overflow-hidden w-full border border-slate-800">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-orange-600 opacity-10 blur-3xl rounded-full pointer-events-none"></div>
          
          {/* 🛠️ डेस्कटॉप ॲक्शन बटणे */}
          <div className="hidden md:flex absolute top-5 right-5 z-20 items-center gap-2.5">
            {/* 🔗 शेअर बटण (डेस्कटॉप - व्हॅलिडेशन लॉक फिक्स) */}
            {isProfileReadyForShare ? (
              <button 
                type="button"
                onClick={async () => {
                  // 🎯 क्लीन युआरएल स्लॅग मॅपिंग: teamname-UID
                  const cleanName = (teamData?.teamName || user?.teamName || 'team').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
                  const cleanUID = (teamData?.uid || user?.teamUID || user?.uid || 'id').toLowerCase();
                  const shareUrl = `${window.location.origin}/view/${cleanName}-${cleanUID}`;
                  
                  console.log("🔗 [DEBUG SHARE LINK GENERATED]:", shareUrl);

                  if (navigator.share) {
                    try {
                      await navigator.share({ title: teamData?.teamName || user?.teamName, text: 'आमच्या गोविंदा पथकाची अधिकृत प्रोफाईल पहा!', url: shareUrl });
                    } catch (err) { console.log(err); }
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    Swal.fire({ icon: 'success', title: 'वेबसाईट लिंक कॉपी झाली! 🔗', text: 'आता तुम्ही ही लिंक कुठेही शेअर करू शकता.', confirmButtonColor: '#ff6600', timer: 2000, customClass: { popup: 'rounded-3xl' } });
                  }
                }} 
                className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-2 text-xs font-black cursor-pointer active:scale-95"
              >
                <Share2 size={14} />
                <span>लिंक शेअर करा</span>
              </button>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1.5 rounded-xl text-[10px] font-black max-w-[200px] leading-tight" title="कृपया आधी प्रोफाईलची पूर्ण माहिती भरा भाऊ">
                ⚠️ शेअर लॉक (माहिती अपूर्ण)
              </div>
            )}

            <button 
              type="button"
              onClick={() => handleProfilePrint(teamData, user, logoIcon)} 
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-2 text-xs font-black"
            >
              <Printer size={14} className="text-orange-400" />
              <span>PDF प्रिंट</span>
            </button>
            
            <button 
              type="button"
              onClick={() => setIsEditMode(true)} 
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-2 text-xs font-black border border-orange-400/20"
            >
              <Edit2 size={13} />
              <span>माहिती सुधारा</span>
            </button>
          </div>

          <div className="flex flex-row items-center md:items-start gap-3.5 relative z-10 text-left md:pr-56">
            <div className="w-16 h-16 md:w-28 md:h-28 bg-white rounded-xl md:rounded-2xl border border-slate-700/40 flex items-center justify-center p-1 md:p-2 flex-shrink-0 overflow-hidden shadow-2xl">
              {teamData?.logoUrl ? (
                <img src={teamData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <ImageIcon size={22} />
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <h1 className="text-base md:text-3xl font-black uppercase tracking-wide text-white leading-tight truncate">
                {teamData?.teamName || user?.teamName || "संघ उपलब्ध नाही"}
              </h1>
              
              {teamData?.slogan && (
                <p className="text-[10px] md:text-sm text-slate-300 italic font-medium tracking-wide truncate">
                  "{teamData.slogan}"
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[7px] md:text-[10px] bg-blue-600 text-white font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                  {teamData?.teamCategory === 'Women' ? '👩‍👧 महिला' : teamData?.teamCategory === 'Both' ? '👨‍👩‍👦 दोन्ही' : '👨‍👦 पुरुष'}
                </span>
                <span className={`text-[7px] md:text-[10px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider text-white ${teamData?.hasInsurance ? 'bg-emerald-600' : 'bg-red-600'}`}>
                  {teamData?.hasInsurance ? 'विमा पूर्ण' : 'विमा अपूर्ण'}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5">
                {teamData?.establishedYear && (
                  <div className="text-[8px] md:text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/20 shadow-inner">
                    🚩 स्थापना: {teamData.establishedYear}
                  </div>
                )}
                <div className="font-mono text-[8px] md:text-[10px] font-black px-1.5 py-0.2 rounded bg-white/10 text-slate-300 tracking-wide border border-white/5">
                  ID: {teamData?.uid || user?.teamUID || user?.uid || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* 📱 केवळ मोबाईल व्ह्यूसाठी तळाशी बटणे */}
          <div className="flex md:hidden items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/60 relative z-20">
            {isProfileReadyForShare ? (
              <button 
                type="button"
                onClick={async () => {
                  const cleanName = (teamData?.teamName || user?.teamName || 'team').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
                  const cleanUID = (teamData?.uid || user?.teamUID || user?.uid || 'id').toLowerCase();
                  const shareUrl = `${window.location.origin}/view/${cleanName}-${cleanUID}`;
                  
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: teamData?.teamName || user?.teamName, text: 'आमच्या गोविंदा पथकाची अधिकृत प्रोफाईल पहा!', url: shareUrl });
                    } catch (err) { console.log(err); }
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    Swal.fire({ icon: 'success', title: 'लिंक कॉपी झाली! 🔗', confirmButtonColor: '#ff6600', timer: 1500, customClass: { popup: 'rounded-3xl' } });
                  }
                }} 
                className="flex-1 bg-orange-600 text-white py-1.5 rounded-lg flex items-center justify-center space-x-1 text-[11px] font-black shadow-sm"
              >
                <Share2 size={12} />
                <span>शेअर लिंक</span>
              </button>
            ) : (
              <div className="flex-1 bg-amber-500/5 border border-amber-500/10 text-amber-500 py-1.5 rounded-lg text-center text-[9px] font-black leading-tight">
                ⚠️ शेअर लॉक आहे
              </div>
            )}
            
            <button 
              type="button"
              onClick={() => handleProfilePrint(teamData, user, logoIcon)} 
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-1.5 rounded-lg flex items-center justify-center space-x-1 text-[11px] font-bold"
            >
              <Printer size={12} className="text-orange-400" />
              <span>PDF</span>
            </button>
            
            <button 
              type="button"
              onClick={() => setIsEditMode(true)} 
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-1.5 rounded-lg flex items-center justify-center space-x-1 text-[11px] font-black border border-orange-400/10"
            >
              <Edit2 size={11} />
              <span>सुधारा</span>
            </button>
          </div>

        </div>

        {/* 📊 २. २-कॉलम प्रो वेबसाईट लेआउट */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-4 rounded-3xl text-white shadow-md flex items-center justify-between border border-orange-400/20">
              <div className="space-y-0.5 text-left">
                <span className="block font-black uppercase tracking-widest text-[9px] text-orange-100">🏆 ऐतिहासिक सर्वोच्च विक्रम</span>
                <p className="text-sm md:text-base font-black leading-tight">{teamData?.bestPerformance || 'नमुद नाही भाऊ'}</p>
              </div>
              <Trophy size={28} className="opacity-40 flex-shrink-0 ml-2" />
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center space-x-2">
                <FileText size={14} className="text-slate-400" /> <span>संघाचा इतिहास व परंपरा</span>
              </h3>
              <div className="text-slate-700 font-extrabold leading-relaxed text-xs md:text-sm whitespace-pre-wrap">
                {teamData?.aboutTeam || 'संघाचा संक्षिप्त इतिहास येथे नमुद केला जाईल...'}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left space-y-3">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider block flex items-center gap-1.5 border-b pb-2">
                <Award size={14} className="text-amber-500"/> अधिकृत मानवी मनोरे रेकॉर्ड्स
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teamData?.milestone7 && teamData.milestone7 !== '—' && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                    <span className="text-slate-500 font-bold text-xs">{teamCategory === 'Women' ? '५ थर' : '७ थर'}</span> 
                    <span className="text-slate-900 font-black text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">{teamData.milestone7}</span>
                  </div>
                )}
                {teamData?.milestone8 && teamData.milestone8 !== '—' && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                    <span className="text-slate-500 font-bold text-xs">{teamCategory === 'Women' ? '६ थर' : '८ थर'}</span> 
                    <span className="text-orange-600 font-black text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">{teamData.milestone8}</span>
                  </div>
                )}
                {teamData?.milestone9 && teamData.milestone9 !== '—' && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                    <span className="text-slate-500 font-bold text-xs">{teamCategory === 'Women' ? '७ थर' : '९ थर'}</span> 
                    <span className="text-slate-900 font-black text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">{teamData.milestone9}</span>
                  </div>
                )}
                {teamCategory !== 'Women' && teamData?.milestone10 && teamData.milestone10 !== '—' && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                    <span className="text-slate-500 font-bold text-xs">१० थर</span> 
                    <span className="text-slate-900 font-black text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">{teamData.milestone10}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0b132b] text-white p-5 rounded-3xl shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2 text-slate-300">
                    <MapPin size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">परिसर व पत्ता</p>
                      <p className="text-white mt-0.5 font-black leading-snug">
                        {teamData?.address || '—'} 
                        {teamData?.district && `, जिल्हा: ${teamData.district}`}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {teamData?.areaName && <span className="bg-white/10 text-slate-200 text-[8px] px-1.5 py-0.5 rounded border border-white/5">{teamData.areaName}</span>}
                        {teamData?.pincode && <span className="bg-white/10 text-orange-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-white/5">PIN: {teamData.pincode}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-white/5 border border-white/5 p-3 rounded-2xl">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="text-[9px] text-slate-400 uppercase font-black">मार्गदर्शक:</span>
                    <span className="text-white font-black text-xs truncate max-w-[120px]">{teamData?.coachName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 uppercase font-black">कर्णधार:</span>
                    <span className="text-white font-black text-xs truncate max-w-[120px]">{teamData?.captainName || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">वेबसाईट सोशल मीडिया जोडण्या:</span>
                <div className="flex gap-2">
                  {teamData?.socialLinks?.instagram && <a href={teamData.socialLinks.instagram} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white text-[11px] font-black flex items-center space-x-1 shadow"><Link size={11} /> <span>Instagram</span></a>}
                  {teamData?.socialLinks?.facebook && <a href={teamData.socialLinks.facebook} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-black flex items-center space-x-1 shadow"><Link size={11} /> <span>Facebook</span></a>}
                  {teamData?.socialLinks?.youtube && <a href={teamData.socialLinks.youtube} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-[11px] font-black flex items-center space-x-1 shadow"><Link size={11} /> <span>YouTube</span></a>}
                </div>
              </div>
            </div>
          </div>

          {/* उजवी बाजू (कॉलम ५) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between w-full h-full min-h-[460px] lg:min-h-full">
            <div className="w-full h-full flex flex-col flex-1 justify-between space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col flex-1 justify-between">
                <span className="block font-black text-slate-900 uppercase tracking-wider text-[10px] border-b pb-2.5 mb-4 flex-shrink-0">
                  📸 सलामी ऐतिहासिक क्षणचित्र (Vertical Image Structure)
                </span>
                <div className="flex-1 w-full rounded-2xl border border-slate-900/5 overflow-hidden bg-slate-950 shadow-inner relative min-h-[380px] flex items-center justify-center">
                  {teamData?.bestPerformanceUrl ? (
                    <img src={teamData.bestPerformanceUrl} alt="Best Performance Vertical" className="w-full h-full object-contain md:object-cover hover:object-contain transition-all duration-300" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-50/50">
                      <ImageIcon size={36} />
                      <p className="text-xs font-black mt-2 text-slate-400">सलामी फोटो उपलब्ध नाही</p>
                    </div>
                  )}
                </div>
              </div>

              <AdMobileBottom/>      
              {/* 💸 गुगल जाहिरात स्लॉट */}
              <div className="w-full bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-3xl text-center relative overflow-hidden flex-shrink-0 h-[90px] flex flex-col justify-center items-center shadow-inner">
                <span className="absolute top-1 right-2 text-[6px] font-black uppercase text-slate-600 tracking-widest">Google AdSense</span>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-wide">🎯 तुमच्या ब्रँड किंवा मंडळाची जाहिरात लावा!</p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">अधिक माहितीसाठी संपर्क साधा भाऊ.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden print:block fixed inset-0 bg-white z-[99999] m-0 p-0">
          <PrintableTeamProfile team={teamData} user={user} logoIcon={logoIcon} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 📝 SECTION 4: EDIT MODE (मूळ ६२१ लाईन्स लेआउट)
  // =========================================================================
 return (
    <form onSubmit={handleSaveProfile} className="w-full space-y-4 pt-1 text-xs font-bold text-slate-600 animate-in fade-in duration-150 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-0.5">✏️   संघ प्रोफाईल संपादन</h3>
        <p className="text-[10px] text-slate-400 font-medium">माहिती अचूक भरून अपडेट करा भाऊ. (कॅरेक्टर मर्यादा लागू आहे)</p>
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
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">विमा सुरक्षा (Insurance)</label>
          <button type="button" onClick={() => setHasInsurance(!hasInsurance)} className={`w-full py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center space-x-2 ${hasInsurance ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <HeartHandshake size={14} />
            <span>{hasInsurance ? 'विमा पूर्ण उतरवला आहे ✓' : 'विमा उतरवला नाही ✗'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/40 border p-3 rounded-2xl">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase flex items-center space-x-1"><User size={11}/> <span>मार्गदर्शक / कोच नाव</span></label>
          <input type="text" value={coachName} maxLength={50} onChange={(e) => setCoachName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none" placeholder="उदा. विजय कदम" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase flex items-center space-x-1"><User size={11}/> <span>संघाचा कर्णधार (Captain)</span></label>
          <input type="text" value={captainName} maxLength={50} onChange={(e) => setCaptainName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none" placeholder="उदा. प्रथमेश परब" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><MapPin size={11} /> <span>पूर्ण पत्ता (Address - English ONLY)</span></label>
          {/* 🎯 कडक पॅच: पत्ता फक्त इंग्रजीत स्वीकारणे (मराठी अक्षरे गाळणे) */}
          <input 
            type="text" 
            value={address} 
            onChange={(e) => setAddress(e.target.value.replace(/[\u0900-\u097F]/g, ''))} 
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" 
            placeholder="Enter address in English"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Calendar size={11} /> <span>स्थापना वर्ष</span></label>
          {/* 🎯 कडक पॅच: type="number" मुळे फक्त इंग्रजी आकडे टाईप होतील */}
          <input 
            type="number" 
            value={estYear} 
            onInput={(e) => e.target.value = e.target.value.slice(0, 4)}
            onChange={(e) => setEstYear(e.target.value)} 
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none" 
            placeholder="YYYY"
          />
        </div>
      </div>

      <div className="bg-slate-50/50 border border-slate-200/60 p-3 rounded-2xl space-y-3 w-full">
        <span className="text-[10px] uppercase font-black tracking-wider text-orange-500 block">📍 शहर आणि परिसर तपशील (English Input)</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* 🎯 परिसर: इंग्रजी रिस्ट्रिक्शन पॅच */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500">परिसर (Area)</label>
            <input 
              type="text" 
              value={areaName} 
              onChange={(e) => setAreaName(e.target.value.replace(/[\u0900-\u097F]/g, ''))} 
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" 
              placeholder="e.g. Dadar West"
            />
          </div>
          
          {/* 🎯 पिनकोड: ६ अंकी इंग्रजी नंबर लॉक */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500">पिनकोड (Pincode)</label>
            <input 
              type="number" 
              value={pincode} 
              onInput={(e) => e.target.value = e.target.value.slice(0, 6)}
              onChange={(e) => setPincode(e.target.value)} 
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" 
              placeholder="400013"
            />
          </div>
          
          {/* 🎯 शहर: इंग्रजी रिस्ट्रिक्शन पॅच */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500">शहर (City)</label>
            <input 
              type="text" 
              value={city} 
              onChange={(e) => setCity(e.target.value.replace(/[\u0900-\u097F]/g, ''))} 
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" 
              placeholder="e.g. Mumbai"
            />
          </div>
          
          {/* 🎯 जिल्हा: सुरक्षित इंग्रजी ड्रॉपडाऊन (फिल्टर डेटा सुरक्षित 🔒) */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500 font-black">जिल्हा (District)</label>
            <select 
              value={district} 
              onChange={(e) => setDistrict(e.target.value)} 
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none text-xs font-bold text-slate-700 h-[34px]"
            >
              <option value="">Select District</option>
              <option value="Mumbai City">Mumbai City</option>
              <option value="Mumbai Suburban">Mumbai Suburban</option>
              <option value="Thane">Thane</option>
              <option value="Palghar">Palghar</option>
              <option value="Raigad">Raigad</option>
              <option value="Pune">Pune</option>
              <option value="Nashik">Nashik</option>
              <option value="Nagpur">Nagpur</option>
              <option value="Kolhapur">Kolhapur</option>
              <option value="Sangli">Sangli</option>
              <option value="Satara">Satara</option>
              <option value="Ratnagiri">Ratnagiri</option>
              <option value="Sindhudurg">Sindhudurg</option>
              {/* तुला हवे असल्यास महाराष्ट्रातील इतर जिल्हे इथे ॲड करू शकतोस भाऊ */}
            </select>
          </div>

        </div>
      </div>

      <div className="bg-slate-50/50 border p-3 rounded-2xl space-y-2 w-full">
        <span className="text-[10px] uppercase font-black tracking-wider text-amber-600 block flex items-center space-x-1"><Award size={12}/> <span>🏆 ऐतिहासिक थर रेकॉर्ड्स (वर्ष किंवा उत्सव नाव लिहा)</span></span>
        {teamCategory === 'Women' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500 font-bold">पहिले ५ थर</label><input type="text" value={milestone7} maxLength={30} onChange={(e) => setMilestone7(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="उदा. २०२३ - दादर" /></div>
            <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500 font-bold">पहिले ६ थर</label><input type="text" value={milestone8} maxLength={30} onChange={(e) => setMilestone8(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="उदा. २०२४ - ठाणे" /></div>
            <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500 font-bold">पहिले ७ थर</label><input type="text" value={milestone9} maxLength={30} onChange={(e) => setMilestone9(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="उदा. २०२५ - घाटकोपर" /></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500 font-bold">पहिले ७ थर</label><input type="text" value={milestone7} maxLength={30} onChange={(e) => setMilestone7(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="उदा. १९९२ - दादर" /></div>
            <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500 font-bold">पहिले ८ थर</label><input type="text" value={milestone8} maxLength={30} onChange={(e) => setMilestone8(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="उदा. २००६ - ठाणे" /></div>
            <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500 font-bold">पहिले ९ थर</label><input type="text" value={milestone9} maxLength={30} onChange={(e) => setMilestone9(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="उदा. २०२४ - बोरिवली" /></div>
            <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500 font-bold">पहिले १० थर</label><input type="text" value={milestone10} maxLength={30} onChange={(e) => setMilestone10(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" placeholder="अजून रेकॉर्ड नाही" /></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Image size={11} /> <span>लोगो लिंक (Logo URL)</span></label>
          <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Info size={11} /> <span>घोषवाक्य (Slogan - कमाल ६० अक्षरे)</span></label>
          <input type="text" value={slogan} maxLength={60} onChange={(e) => setSlogan(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><Trophy size={11} /> <span>सर्वोत्कृष्ट कामगिरी (Record - कमाल १५० अक्षरे)</span></label>
          <input type="text" value={bestPerformance} maxLength={150} onChange={(e) => setBestPerformance(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><ImageIcon size={11} /> <span>सलामी फोटो लिंक (Performance Photo URL)</span></label>
          <input type="url" value={bestPerformanceUrl} onChange={(e) => setBestPerformanceUrl(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none" />
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
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-1"><FileText size={11} /> <span>संघाची माहिती (About Team)</span></label>
          <span className={`text-[10px] font-mono ${aboutTeam.length > 450 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>{aboutTeam.length}/1500</span>
        </div>
        <textarea rows="3" value={aboutTeam} maxLength={1500} onChange={(e) => setAboutTeam(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 resize-none focus:bg-white focus:outline-none" placeholder="मंडळाचा संक्षिप्त इतिहास लिहा..." />
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