import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldCheck, MapPin, Calendar, Info, Image, 
  Trophy, FileText, Check, Image as ImageIcon, HeartHandshake,
  Link, AlertTriangle, Globe, Edit2, User, Award, Printer
} from 'lucide-react';
import Swal from 'sweetalert2';

// 🖨️ ग्लोबल प्रिंट कॉम्पोनंट इम्पोर्ट
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

      Swal.fire({ icon: 'success', title: 'बदल यशस्वी! 🎉', text: 'संघाची प्रोफाईल अपडेट झाली आहे.', showConfirmButton: false, timer: 1500, customClass: { popup: 'rounded-3xl' } });
    } catch (err) {
      console.error("❌ [PROFILE SAVE CRASH]:", err);
      Swal.fire({ icon: 'error', title: 'अडचण आली!', text: `त्रुटी: ${err.message || 'कृपया पुन्हा प्रयत्न करा.'}`, confirmButtonColor: '#ff6600' });
    } finally { setLoading(false); }
  };


  // // 🖨️ कडक तोडगा: Reports.jsx च्या धर्तीवर नवीन विंडो उघडून ए४ साईझमध्ये पोर्ट्रेट प्रिंट करणे 🚀
  // const handleProfilePrint = () => {
  //   const finalTeamName = teamData?.teamName || user?.teamName || "—";
  //   const finalUID = teamData?.uid || teamData?.id || user?.teamUID || user?.uid || "—";
  //   const currentYear = new Date().getFullYear();

  //   const printWindow = window.open('', '_blank');
  //   printWindow.document.write(`
  //     <html>
  //       <head>
  //         <title>${finalTeamName.toUpperCase()} PROFILE REPORT</title>
  //         <style>
  //           @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;700;800&family=Poppins:wght@400;600;700;900&display=swap');
  //           @page { size: A4 portrait; margin: 12mm 12mm 12mm 12mm; }
  //           body { font-family: 'Poppins', 'Mukta', sans-serif; margin: 0; padding: 0; color: #1e293b; background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            
  //           /* 🏆 मुख्य हेडर लेआउट (सोशल लिंक्स उजवीकडे २ ओळीत शिफ्ट) */
  //           .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
  //           .header-left { display: flex; align-items: center; gap: 12px; }
  //           .header-logo { width: 55px; height: 55px; object-contain: true; }
  //           .header-title { font-size: 24px; font-weight: 900; margin: 0; color: #0f172a; }
  //           .header-slogan { font-size: 11px; font-weight: 700; margin: 2px 0 0 0; color: #ff6600; }
            
  //           .social-box { text-align: right; font-size: 9px; font-weight: bold; font-family: monospace; color: #334155; }
  //           .social-row { display: flex; gap: 4px; justify-content: flex-end; margin-bottom: 3px; }
  //           .social-item { bg-color: #f8fafc; padding: 2px 6px; border: 1px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; gap: 4px; }
            
  //           /* 🚩 डार्क टीम बॅनर (स्थापना वर्ष आणि प्रकार आतमध्ये समाविष्ट) */
  //           .team-banner { background: linear-gradient(to right, #0f172a, #1e293b); color: #fff; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  //           .team-title { font-size: 18px; font-weight: 800; margin: 0; text-transform: uppercase; }
  //           .team-sub-row { display: flex; gap: 12px; margin-top: 4px; font-size: 10px; color: #cbd5e1; font-weight: bold; }
  //           .team-uid { text-align: right; font-family: monospace; font-size: 11px; font-weight: 900; color: #f97316; }

  //           /* 📊 २-कॉलम मुख्य रचना (माहिती वि. उभा फोटो) */
  //           .main-content { display: grid; grid-template-cols: 7fr 5fr; gap: 12px; align-items: start; }
  //           .left-side { display: flex; flex-col: true; gap: 10px; }
            
  //           /* माहिती तक्ते आणि कप्पे */
  //           .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; font-size: 11px; font-weight: bold; }
  //           .card-title { font-size: 9px; uppercase: true; color: #64748b; font-weight: 900; letter-spacing: 0.5px; margin-bottom: 3px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; }
  //           .grid-data { display: grid; grid-template-cols: 1fr 1fr; gap: 8px; }
            
  //           /* 📸 सलामीचे क्षणचित्र (उजवीकडे अचूक उभ्या स्वरूपात लॉक) */
  //           .photo-box { border: 1px solid #cbd5e1; padding: 4px; background: #f8fafc; border-radius: 8px; height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  //           .photo-box img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
  //           .no-photo { font-size: 10px; color: #94a3b8; font-weight: bold; text-align: center; }

  //           /* 🏆 ऐतिहासिक थर (४ बॉक्स रचना - सुबक डिझाईन) */
  //           .milestones-area { margin-top: 12px; background: #fff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; }
  //           .milestone-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 6px; margin-top: 4px; }
  //           .milestone-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: bold; }
  //           .milestone-badge { background: #ff6600; color: #fff; padding: 1px 6px; border-radius: 4px; font-size: 10px; }

  //           /* 📜 इतिहास बॉक्स सबसे नीचे स्वतंत्र */
  //           .history-area { margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; }
  //           .history-text { font-size: 11px; font-weight: 500; color: #334155; leading-ratio: 1.5; text-align: justify; margin: 4px 0 0 0; white-space: pre-wrap; word-break: break-word; }

  //           /* 👣 अधिकृत सुरक्षित फूटर बार (पेजच्या तळाशी लॉक) */
  //           .custom-footer { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #64748b; border-top: 1px solid #0f172a; padding-top: 4px; font-weight: bold; font-family: monospace; background: #fff; }
  //         </style>
  //       </head>
  //       <body>
          
  //         <!-- १. हेडर आणि सोशल नेटवर्क तपशील -->
  //         <div class="header-box">
  //           <div class="header-left">
  //             <img src="${logoIcon}" class="header-logo" alt="Logo" />
  //             <div>
  //               <h1 class="header-title">महाराष्ट्राचा <span style="color: #ff6600;">गोविंदा</span></h1>
  //               <p class="header-slogan">प्रत्येक गोविंदासाठी</p>
  //             </div>
  //           </div>
  //           <div class="social-box">
  //             <div class="social-row">
  //               <div class="social-item"><span style="color:#1877F2">📘</span> @maharashtrachagovinda</div>
  //               <div className="social-item"><span style="color:#E1306C">📸</span> @maharashtrachagovinda</div>
  //             </div>
  //             <div class="social-row">
  //               <div class="social-item"><span style="color:#FF0000">📺</span> @maharashtrachagovinda</div>
  //               <div class="social-item"><span>🌐</span> maharashtrachagovinda.com</div>
  //             </div>
  //           </div>
  //         </div>

  //         <!-- २. डार्क टीम बॅनर (स्थापना, प्रकार, नाव आणि UID सह) -->
  //         <div class="team-banner">
  //           <div>
  //             <h2 class="team-title">${finalTeamName}</h2>
  //             <div class="team-sub-row">
  //               <span>🗓️ स्थापना वर्ष: ${teamData?.establishedYear || '—'}</span>
  //               <span>🚩 पथक प्रकार: ${teamData?.teamCategory === 'Women' ? 'महिला' : teamData?.teamCategory === 'Both' ? 'दोन्ही' : 'पुरुष'}</span>
  //             </div>
  //           </div>
  //           <div class="team-uid">
  //             <span style="font-size: 7px; color: #94a3b8; block: true; font-weight: bold; letter-spacing: 0.5px;">TEAM IDENTIFIER</span>
  //             UID: ${finalUID}
  //           </div>
  //         </div>

  //         <!-- ३. मुख्य २-कॉलम रचना (माहिती वि. उभा फोटो) -->
  //         <div class="main-content">
            
  //           <!-- डावा भाग -->
  //           <div class="left-side">
  //             <div class="info-card">
  //               <div class="card-title">📍 परिसर आणि जिल्हा तपशील</div>
  //               <div style="color: #1e293b; font-size: 11px;">पत्ता: ${teamData?.address || '—'}</div>
  //               <div class="grid-data" style="margin-top: 4px;">
  //                 <div>जिल्हा: ${teamData?.district || '—'}</div>
  //                 <div>पिनकोड: ${teamData?.pincode || '—'}</div>
  //               </div>
  //             </div>

  //             <div class="info-card">
  //               <div class="card-title">👤 मंडळाचे मुख्य पदाधिकारी</div>
  //               <div class="grid-data">
  //                 <div>मार्गदर्शक: ${teamData?.coachName || '—'}</div>
  //                 <div>कर्णधार: ${teamData?.captainName || '—'}</div>
  //               </div>
  //             </div>

  //             <div class="info-card" style="background: #fff7ed; border-color: #ffedd5;">
  //               <div class="card-title" style="color: #c2410c;">🏆 सर्वोत्कृष्ट कामगिरी (RECORD)</div>
  //               <div style="color: #9a3412;">${teamData?.bestPerformance || '—'}</div>
  //             </div>
  //           </div>

  //           <!-- उजवा भाग (अचूक Vertical Format फोटो) -->
  //           <div>
  //             <span style="font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px;">📸 सलामीचे क्षणचित्र</span>
  //             <div class="photo-box">
  //               ${teamData?.bestPerformanceUrl ? 
  //                 `<img src="${teamData.bestPerformanceUrl}" alt="Performance" />` : 
  //                 `<div class="no-photo">⏳ फोटो उपलब्ध नाही</div>`
  //               }
  //             </div>
  //           </div>

  //         </div>

  //         <!-- ४. ऐतिहासिक थर रेकॉर्ड्स (४ फिक्स बॉक्सेस) -->
  //         <div class="milestones-area">
  //           <div class="card-title" style="border: none; margin: 0;">🏆 ऐतिहासिक थर कामगिरी रेkords</div>
  //           <div class="milestone-grid">
  //             <div class="milestone-item"><span>${teamData?.teamCategory === 'Women' ? '५ थर' : '७ थर'}</span> <span class="milestone-badge">${teamData?.milestone7 || '—'}</span></div>
  //             <div class="milestone-item"><span>${teamData?.teamCategory === 'Women' ? '६ थर' : '८ थर'}</span> <span class="milestone-badge">${teamData?.milestone8 || '—'}</span></div>
  //             <div class="milestone-item"><span>${teamData?.teamCategory === 'Women' ? '७ थर' : '९ थर'}</span> <span class="milestone-badge">${teamData?.milestone9 || '—'}</span></div>
  //             ${teamData?.teamCategory !== 'Women' ? `<div class="milestone-item"><span>१० थर</span> <span class="milestone-badge">${teamData?.milestone10 || '—'}</span></div>` : ''}
  //           </div>
  //         </div>

  //         <!-- ५. संक्षिप्त इतिहास (सर्वात खाली सुरक्षित आणि मोकळा) -->
  //         <div class="history-area">
  //           <div class="card-title" style="border: none; margin: 0;">📜 संघाबद्दल संक्षिप्त इतिहास</div>
  //           <p class="history-text">${teamData?.aboutTeam || '—'}</p>
  //         </div>

  //         <!-- ६. अचूक अधिकृत फूटर नोट बार (A4 च्या खाली लॉक) -->
  //         <div class="custom-footer">
  //           <div>MHARASHTRACHA GOVINDA DAHIHANDI MANAGEMENT APP</div>
  //           <div style="color: #ff6600;">An Initiative by Sandesh Mahadik</div>
  //         </div>

  //       </body>
  //     </html>
  //   `);
  //   printWindow.document.close();
  //   printWindow.print();
  // };


  // =========================================================================
  // 🖥️ SECTION 3: VIEW MODE (थरांचे लेबल्स प्रकारानुसार डायनॅमिक दिसणार 🎯)
  // =========================================================================
  if (!isEditMode) {
    return (
      <div className="w-full space-y-5 animate-in fade-in duration-150 p-0 m-0 text-left">
        
{/* 🚩 मुख्य ब्रँडिंग डार्क बॅनर */}
        <div className="bg-gradient-to-r from-[#0b132b] to-[#1c2541] text-white p-6 rounded-3xl shadow-sm relative overflow-hidden w-full">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#ff6600] opacity-15 blur-3xl rounded-full"></div>
          
          {/* 🎯 फिक्स: मोबाईलवर बटणे ओव्हरलॅप न होता खाली सुबक सेट होण्यासाठी flex-wrap लेआउट आणि top-4 right-4 ची जागा सुटसुटीत केली */}
          <div className="sm:absolute top-4 right-4 z-20 flex flex-wrap items-center gap-2 mb-4 sm:mb-0 justify-center sm:justify-end">

          {/* 🖨️ नवीन विंडो आधारित प्रिमियम प्रिंट बटण */}
          <button 
            onClick={() => handleProfilePrint(teamData, user, logoIcon)} // 👈 डायरेक्ट डेटा ओढला!
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1.5 backdrop-blur-sm group cursor-pointer active:scale-95 text-xs font-bold"
          >
            <Printer size={14} className="group-hover:scale-110 transition-transform text-orange-400" />
            <span>PDF प्रिंट करा</span>
          </button>

            {user?.role !== "superadmin" && (
              <button 
                onClick={() => setIsEditMode(true)} 
                className="bg-white text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95 text-xs font-bold"
                title="माहिती सुधारा"
              >
                <Edit2 size={13} />
                <span>माहिती सुधारा</span>
              </button>
            )}
          </div>

          {/* बाकीचा बॅनरचा आतील डेटा जसाच्या तसा */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left pr-0 sm:pr-48">
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
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white">{teamData?.teamName || user?.teamName || "संघ उपलब्ध नाही"}</h2>
                <div className="flex items-center space-x-1.5 self-center sm:self-auto">
                  <span className="text-[9px] bg-blue-600/30 text-blue-300 font-black px-2 py-0.5 rounded border border-blue-500/20">
                    {teamData?.teamCategory === 'Women' ? '👩‍👧 महिला पथक' : teamData?.teamCategory === 'Both' ? '👨‍👩‍👦  दोनोंही' : '👨‍👦 पुरुष पथक'}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${teamData?.hasInsurance ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/20' : 'bg-red-600/20 text-red-300 border-red-500/20'}`}>
                    {teamData?.hasInsurance ? '●  विमा सुरक्षित' : '●  विमा अपूर्ण'}
                  </span>
                </div>
              </div>
              
              {teamData?.slogan && <p className="text-xs text-slate-300 italic font-medium">"{teamData.slogan}"</p>}
              
              <div className="font-mono text-[9px] font-black px-2 py-0.5 rounded bg-white/10 text-slate-400 tracking-wide inline-block">
                UID: {teamData?.uid || user?.teamUID || user?.uid || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* 📊 ३ स्वतंत्र समान बॉक्सेस ग्रीड */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 w-full items-stretch">
          
          {/* 📦 बॉक्स १: मंडळाची अधिकृत माहिती */}
          <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between w-full">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center space-x-1">
                <FileText size={13} className="text-slate-400" /> <span>📋  मंडळाची माहिती</span>
              </h3>
              
              <div className="space-y-4 text-xs font-bold text-slate-600">
                <div className="flex items-start space-x-3">
                  <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase">पत्ता / परिसर</p>
                    <p className="text-slate-800 mt-0.5 font-extrabold">{teamData?.address || '—'}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {teamData?.areaName && <span className="bg-slate-50 text-slate-500 text-[9px] px-1.5 py-0.5 rounded border">{teamData.areaName}</span>}
                      {teamData?.pincode && <span className="bg-slate-50 text-slate-600 text-[9px] font-mono px-1.5 py-0.5 rounded border">PIN: {teamData.pincode}</span>}
                      {teamData?.district && <span className="bg-slate-50 text-slate-400 text-[9px] px-1.5 py-0.5 rounded border">{teamData.district}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase">स्थापना वर्ष</p>
                    <p className="text-slate-800 font-sans font-extrabold mt-0.5 text-sm">{teamData?.establishedYear || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed">
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase flex items-center space-x-1"><User size={10}/> <span>मार्गदर्शक (Coach)</span></p>
                    <p className="text-slate-800 font-extrabold text-[11px] mt-0.5 truncate">{teamData?.coachName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase flex items-center space-x-1"><User size={10}/> <span>कर्णधार (Captain)</span></p>
                    <p className="text-slate-800 font-extrabold text-[11px] mt-0.5 truncate">{teamData?.captainName || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">सोशल नेटवर्क:</span>
              <div className="flex flex-wrap gap-1.5">
                {teamData?.socialLinks?.instagram ? (
                  <a href={teamData.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-all text-[11px] font-black flex items-center space-x-1"><Link size={11} /> <span>Instagram</span></a>
                ) : <span className="text-[9px] text-slate-300 italic">नो इंस्टाग्राम</span>}
                {teamData?.socialLinks?.facebook ? (
                  <a href={teamData.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-[11px] font-black flex items-center space-x-1"><Link size={11} /> <span>Facebook</span></a>
                ) : <span className="text-[9px] text-slate-300 italic ml-1">नो फेसबुक</span>}
                {teamData?.socialLinks?.youtube ? (
                  <a href={teamData.socialLinks.youtube} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all text-[11px] font-black flex items-center space-x-1"><Link size={11} /> <span>YouTube</span></a>
                ) : <span className="text-[9px] text-slate-300 italic ml-1">नो यूट्यूब</span>}
              </div>
            </div>
          </div>

          {/* 📦 बॉक्स २: उत्सव सद्यस्थिती व ऐतिहासिक रेकॉर्ड्स */}
          <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 w-full flex flex-col justify-between">
            <div className="space-y-3.5 flex-1 flex flex-col">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center space-x-1 flex-shrink-0">
                <Trophy size={13} className="text-amber-500" /> <span>📊  उत्सव कामगिरी व इतिहास</span>
              </h3>

              <div className="bg-orange-50/40 p-2.5 rounded-xl border border-orange-100 text-xs flex-shrink-0">
                <span className="block font-black text-orange-800 uppercase tracking-wider text-[9px]">सर्वोत्कृष्ट कामगिरी (Record)</span>
                <p className="text-slate-700 font-extrabold mt-0.5">{teamData?.bestPerformance || '—'}</p>
              </div>

              <div className="bg-slate-50/60 p-2.5 rounded-xl border text-xs flex-1 flex flex-col min-h-[120px] max-h-[180px] lg:max-h-[220px]">
                <span className="block font-black text-slate-400 uppercase tracking-wider text-[9px] flex-shrink-0 mb-1">संघाबद्दल संक्षिप्त इतिहास</span>
                <div className="overflow-y-auto pr-1 text-slate-600 font-medium leading-relaxed text-[11px] whitespace-pre-wrap flex-1 scrollbar-thin">
                  {teamData?.aboutTeam || '—'}
                </div>
              </div>

              {/* 🏆 थरांचे ऐतिहासिक माइलस्टोन्स व्ह्यू */}
              <div className="pt-2 border-t border-dashed space-y-1.5 flex-shrink-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">🏆  ऐतिहासिक थर रेकॉर्ड्स</span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-slate-50 p-1.5 rounded-lg border">
                    <span className="text-slate-400 font-medium">{teamData?.teamCategory === 'Women' ? '५ थर:' : '७ थर:'}</span> 
                    <span className="text-slate-800 font-black block truncate">{teamData?.milestone7 || '—'}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border">
                    <span className="text-slate-400 font-medium">{teamData?.teamCategory === 'Women' ? '६ थर:' : '८ थर:'}</span> 
                    <span className="text-slate-800 font-black block truncate">{teamData?.milestone8 || '—'}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border">
                    <span className="text-slate-400 font-medium">{teamData?.teamCategory === 'Women' ? '७ थर:' : '९ थर:'}</span> 
                    <span className="text-slate-800 font-black block truncate">{teamData?.milestone9 || '—'}</span>
                  </div>
                  {teamData?.teamCategory !== 'Women' && (
                    <div className="bg-slate-50 p-1.5 rounded-lg border">
                      <span className="text-slate-400 font-medium">१० थर:</span> 
                      <span className="text-slate-800 font-black block truncate">{teamData?.milestone10 || '—'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 📦 बॉक्स ३: सलामी क्षणचित्र */}
          <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between w-full h-full min-h-[460px] lg:min-h-[520px]">
            <div className="w-full h-full flex flex-col flex-1">
              <span className="block font-black text-slate-800 uppercase tracking-wider text-[10px] border-b pb-2 mb-3 flex-shrink-0">
                📸  सलामी क्षणचित्र (Vertical Format)
              </span>
              
              <div className="flex-1 w-full rounded-2xl border border-slate-900/10 overflow-hidden bg-slate-950 shadow-inner relative min-h-[380px] lg:min-h-[440px]">
                {teamData?.bestPerformanceUrl ? (
                  <img 
                    src={teamData.bestPerformanceUrl} 
                    alt="Best Performance Vertical" 
                    className="absolute inset-0 w-full h-full object-contain md:object-cover hover:object-contain transition-all duration-300" 
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-500 bg-slate-50">
                    <ImageIcon size={26} className="text-slate-300" />
                    <p className="text-[11px] font-bold mt-1 text-slate-500">सलामीचा फोटो उपलब्ध नाही</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

{/* 🖨️ प्रिंट कप्पा (🎯 फिक्स: 'team' सोबत 'user' प्रॉप देखील पास केला आहे) */}
        <div className="hidden print:block fixed inset-0 bg-white z-[99999] m-0 p-0">
          <PrintableTeamProfile 
            team={teamData} 
            user={user} // 👈 हा तो बदल ज्यामुळे 'संघ उपलब्ध नाही' दुरुस्त होईल 🚀
            logoIcon={logoIcon} 
          />
        </div>

      </div>
    );
  }

  // =========================================================================
  // 📝 SECTION 4: EDIT MODE (डेटा मॉडेलमध्ये अचूक येण्यासाठी फिक्स 🎯)
  // =========================================================================
  return (
    <form onSubmit={handleSaveProfile} className="w-full space-y-4 pt-1 text-xs font-bold text-slate-600 animate-in fade-in duration-150 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-0.5">✏️  संघ प्रोफाईल संपादन</h3>
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
        <span className="text-[10px] uppercase font-black tracking-wider text-orange-500 block">📍  शहर आणि परिसर तपशील</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500">परिसर (Area)</label><input type="text" value={areaName} onChange={(e) => setAreaName(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" /></div>
          <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500">पिनकोड (Pincode)</label><input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" /></div>
          <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500">शहर (City)</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" /></div>
          <div className="flex flex-col space-y-1"><label className="text-[10px] text-slate-500">जिल्हा (District)</label><input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none" /></div>
        </div>
      </div>

      {/* 🏆 डायनॅमिक ऐतिहासिक थर माइलस्टोन्स इनपुट्स */}
      <div className="bg-slate-50/50 border p-3 rounded-2xl space-y-2 w-full">
        <span className="text-[10px] uppercase font-black tracking-wider text-amber-600 block flex items-center space-x-1"><Award size={12}/> <span>🏆  ऐतिहासिक थर रेकॉर्ड्स (वर्ष किंवा उत्सव नाव लिहा)</span></span>
        
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
          <span className={`text-[10px] font-mono ${aboutTeam.length > 450 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>{aboutTeam.length}/500</span>
        </div>
        <textarea rows="3" value={aboutTeam} maxLength={500} onChange={(e) => setAboutTeam(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 resize-none focus:bg-white focus:outline-none" placeholder="मंडळाचा संक्षिप्त इतिहास लिहा..." />
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