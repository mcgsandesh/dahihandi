import React, { useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Trophy, Users, Shield, Calendar, Share2, 
  User, Award, Link as LinkIcon, Info, FileText, Image as ImageIcon, Edit2
  
} from 'lucide-react';
import Swal from 'sweetalert2';

// 🎯 अधिकृत ॲड मोबाईल बॉटम कॉम्पोनेंट इम्पोर्ट
import AdMobileBottom from '../components/AdMobileBottom';
import logo from '../assets/logo.png'; // तुमची अधिकृत लोगो

export default function PublicTeamProfile({ team, onBack, isSuperAdminView, onEditClick, lang = 'mr', setLang }) {
  
  useEffect(() => {
    console.log("=== 📜 [PUBLIC TEAM PROFILE DEBUG START] ===");
    console.log("📥 आलेला संपूर्ण संघ डेटा (team Object):", team);
    console.log("🏠 चालू युआरएल पाथ (Current Path):", window.location.pathname);
    console.log("⚙️ isSuperAdminView ची सद्यस्थिती:", isSuperAdminView);
    console.log("=== 📜 [PUBLIC TEAM PROFILE DEBUG END] ===");
  }, [team, isSuperAdminView, onEditClick]);

  // 🎯 व्हॅलिडेशन सुधारणा
  const hasValidText = (val) => val && val.trim() !== '' && val.trim() !== '—';

  // 🔐 पब्लिक शेअर लिंक लॉक कडक व्हॅलिडेशन चेक
  const isProfileReadyForShare = 
    (team?.aboutTeam && team.aboutTeam.trim().length >= 300) && 
    team?.logoUrl && 
    team?.slogan && 
    team?.bestPerformance && 
    team?.bestPerformanceUrl &&
    team?.coachName && 
    team?.captainName && 
    (hasValidText(team?.milestone7) || hasValidText(team?.milestone8) || hasValidText(team?.milestone9) || hasValidText(team?.milestone10));

  const cleanName = (team?.teamName || 'team').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
  const cleanUID = (team?.uid || team?.id || 'id').toLowerCase();
  const shareLink = `${window.location.origin}/view/${cleanName}-${cleanUID}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: team?.teamName, text: 'गोविंदा कट्ट्यावर या संघाची अधिकृत प्रोफाईल नक्की पहा!', url: shareLink })
        .catch(err => console.log(err));
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: 'प्रोफाइल वेबसाईट लिंक कॉपी झाली! 🔗', showConfirmButton: false, timer: 2000, customClass: { popup: 'rounded-xl' }
      });
    }
  };

  // 🎯 [SIDEBAR RECOVERY TRIGGER]: मागे जाताना साईडबार परत आणण्याचा कडक तोडगा 🚀
// 🎯 [MANDATORY SIDEBAR RECOVERY]: मागे जाताना साईडबार दिसण्यासाठी १००% हार्ड रिलोड फिक्स 🚀
  const handleCustomBack = () => {
    console.log("🔄 [REFRESH NAV LOG] युझर मागे जात आहे, साईडबार रिकव्हरीसाठी हार्ड रिलोड करत आहे...");
    
    // १. मूळ डॅशबोर्डवरील क्लोजर ट्रिगर करणे
    if (typeof onBack === 'function') {
      onBack();
    }
    
    // २. थेट विंडो लोकेशन बदलून पूर्ण पेज रिलोडेड मोडमध्ये मूळ पाथवर नेणे
    window.location.href = window.location.origin + '/';
  };


  // 🚨 [MANUAL ENTRY SECURITY LOCK]: मॅन्युअल युआरएल टाईपिंग रोखण्याचा कडक तोडगा 🔒
  if (!isProfileReadyForShare) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-[#f8fafc] animate-in fade-in">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl max-w-sm space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto border border-amber-100">
            <Shield size={28} className="animate-pulse" />
          </div>
          <h3 className="text-base font-black text-slate-800">🔒 प्रोफाइल अजून लॉक आहे भाऊ!</h3>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            या मंडळाची अधिकृत माहिती (इतिहास, सर्वोच्च विक्रम, मार्गदर्शक, किंवा थरांचे रेकॉर्ड्स) अजून पूर्णपणे नोंदणीकृत झालेली नाही.
          </p>
          <button 
            onClick={handleCustomBack}
            className="w-full bg-[#0b132b] hover:bg-slate-800 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md active:scale-95"
          >
            🚩 मुख्य पानावर परत जा
          </button>
        </div>
      </div>
    );
  }

  // 🎯 याच्या खाली तुमचा मूळचा मुख्य 'return (...)' सुरू राहील जो आपण मघाशी सेट केला
  if (!team) return null;


  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full p-0 m-0 text-left text-slate-900 bg-[#f8fafc]">

      {/* 👑 [ULTRA-SLIM BRANDED GLOBAL HEADER] - १ ओळीत नाव, स्लोगन आणि सोशल मीडिया सिस्टीम */}
      <div className="flex border-b border-slate-200 pb-2 items-center justify-between text-left w-full gap-2">
        
        {/* डावी बाजू: लोगो + नाव आणि शेजारीच स्लोगन (एकत्र सिंगल लाईन 🚀) */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <img 
            src={logo} 
            alt="महाराष्ट्राचा गोविंदा लोगो" 
            className="w-8 h-8 md:w-9 md:h-9 object-contain rounded-xl shadow-sm border border-slate-100 flex-shrink-0" 
          />
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2 min-w-0">
            <h1 className="text-sm md:text-base font-black uppercase tracking-wide leading-none text-slate-800 whitespace-nowrap">
              {lang === 'en' ? (
                <><span className="text-[#ff6600]">Maharashtracha</span> <span className="text-[#0b132b]">Govinda</span></>
              ) : (
                <><span className="text-[#ff6600]">महाराष्ट्राचा</span> <span className="text-[#0b132b]">गोविंदा</span></>
              )}
            </h1>
            <p className="text-[9px] md:text-xs text-slate-400 font-bold leading-none truncate mt-0.5 sm:mt-0">
              {lang === 'en' ? '— For Every Govinda 🚩' : '— प्रत्येक गोविंदासाठी 🚩'}
            </p>
          </div>
        </div>
        
{/* उजवी बाजू: अधिकृत सोशल चॅनेल्स (मोबाईल व डेस्कटॉप दोन्हीवर १००% विजिबल आणि क्लियर डिझाईन 🚀) */}
        <div className="flex items-center flex-shrink-0">
          
          {/* 🌐 हाय-कॉन्ट्रास्ट सोशल ब्रँडिंग बार */}
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-0.5 text-[10px] font-black shadow-sm flex-wrap gap-0.5">
            <a href="https://www.facebook.com/maharashtrachagovinda" target="_blank" rel="noreferrer" className="px-2 py-0.5 rounded-lg text-blue-700 hover:bg-blue-50 transition-all font-black">
              FB
            </a>
            <a href="https://www.instagram.com/maharashtrachagovinda" target="_blank" rel="noreferrer" className="px-2 py-0.5 rounded-lg text-pink-600 hover:bg-pink-50 transition-all font-black">
              Insta
            </a>
            <a href="https://www.youtube.com/@maharashtrachagovinda" target="_blank" rel="noreferrer" className="px-2 py-0.5 rounded-lg text-red-600 hover:bg-red-50 transition-all flex items-center font-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><polygon points="10 15 15 12 10 9 10 15" fill="currentColor" /></svg>
              <span className="ml-0.5">YT</span>
            </a>
            <a href="https://whatsapp.com/channel/0029Vaq9KmD4yltLIfDV7Q3R" target="_blank" rel="noreferrer" className="px-2 py-0.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all font-black">
              WA Channel
            </a>
          </div>

        </div>
      </div>
      
      {/* 🔙 १. नेव्हिगेशन व शेअर बार */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm w-full">
        <button 
          onClick={handleCustomBack}
          className="flex items-center space-x-2 text-xs font-black text-slate-700 hover:text-[#ff6600] transition-all bg-slate-50 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>{lang === 'en' ? 'Back to List' : 'मंडळ यादीकडे मागे जा'}</span>
        </button>

        {/* 🔗 शेअर बटण */}
        {isProfileReadyForShare ? (
          <button 
            onClick={handleShare}
            className="flex items-center space-x-1.5 text-xs font-black bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            <Share2 size={13} />
            <span>{lang === 'en' ? 'Share Link' : 'लिंक शेअर करा'}</span>
          </button>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1.5 rounded-xl text-[10px] font-black leading-tight">
            ⚠️ {lang === 'en' ? 'Share Locked' : 'शेअर लॉक आहे'}
          </div>
        )}
      </div>

      {/* 🚩 २. मुख्य ब्रँडिंग हेडर बॅनर */}
      <div className="bg-gradient-to-br from-[#070b19] via-[#0f172a] to-[#1e293b] text-white p-4 md:p-5 rounded-3xl shadow-xl relative overflow-hidden w-full border border-slate-800">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-orange-600 opacity-10 blur-3xl rounded-full pointer-events-none"></div>
        
        {isSuperAdminView && (
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={onEditClick}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2.5 py-1.5 rounded-xl transition-all shadow-md flex items-center space-x-1.5 text-xs font-black border border-orange-400/20 active:scale-95"
            >
              <Edit2 size={12} />
              <span className="hidden sm:inline">{lang === 'en' ? 'Edit Info' : 'माहिती सुधारा'}</span>
              <span className="sm:hidden">Edit</span>
            </button>
          </div>
        )}
        
        <div className="flex flex-row items-center md:items-start gap-4 relative z-10 pr-16 md:pr-48">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl md:rounded-2xl border border-slate-700/40 flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden shadow-2xl">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                <ImageIcon size={20} />
              </div>
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-sm md:text-2xl font-black uppercase tracking-wide text-white leading-tight truncate">
              {team.teamName || "संघ उपलब्ध नाही"}
            </h1>
            
            {team.slogan && (
              <p className="text-[10px] md:text-xs text-slate-300 italic font-medium tracking-wide truncate">
                "{team.slogan}"
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className={`text-[7px] md:text-[9px] text-white font-black px-1.5 py-0.2 rounded uppercase tracking-wider ${team.teamCategory === 'Women' ? 'bg-pink-600' : team.teamCategory === 'Both' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                {team.teamCategory === 'Women' ? (lang === 'en' ? '👩‍👧 Women' : '👩‍👧 महिला') : team.teamCategory === 'Both' ? (lang === 'en' ? '👨‍👩‍👦 Both' : '👨‍👩‍👦 दोन्ही') : (lang === 'en' ? '👨‍👦 Men' : '👨‍👦 पुरुष')}
              </span>
              <span className={`text-[7px] md:text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider text-white ${team.hasInsurance ? 'bg-emerald-600' : 'bg-red-600'}`}>
                {team.hasInsurance ? (lang === 'en' ? 'Insured' : 'विमा सुरक्षित') : (lang === 'en' ? 'No Insurance' : 'विमा अपूर्ण')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {team.establishedYear && (
                <div className="text-[8px] md:text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/20 shadow-inner">
                  🚩 {lang === 'en' ? 'Est:' : 'स्थापना:'} {team.establishedYear}
                </div>
              )}
              <div className="font-mono text-[8px] md:text-[9px] font-black px-1.5 py-0.2 rounded bg-white/10 text-slate-300 tracking-wide border border-white/5">
                ID: {team.uid || team.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 २. २-कॉलम प्रो लेआउट */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-3.5 rounded-2xl text-white shadow-md flex items-center justify-between border border-orange-400/20">
            <div className="space-y-0.5 text-left">
              <span className="block font-black uppercase tracking-widest text-[8px] text-orange-100">🏆 {lang === 'en' ? 'Historical Best Performance' : 'ऐतिहासिक सर्वोच्च विक्रम'}</span>
              <p className="text-xs md:text-sm font-black leading-tight">{team.bestPerformance || 'नमुद नाही भाऊ'}</p>
            </div>
            <Trophy size={22} className="opacity-40 flex-shrink-0 animate-bounce" />
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm text-left space-y-2.5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-1.5 flex items-center space-x-2">
              <FileText size={13} className="text-slate-400" /> <span>{lang === 'en' ? 'Team History & Tradition' : 'संघाचा इतिहास व परंपरा'}</span>
            </h3>
            <div className="text-slate-700 font-extrabold leading-relaxed text-xs md:text-sm whitespace-pre-wrap">
              {team.aboutTeam || 'संघाचा संक्षिप्त इतिहास येथे नमुद केला जाईल...'}
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm text-left space-y-2.5">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider block flex items-center gap-1.5 border-b pb-1.5">
              <Award size={13} className="text-amber-500"/> {lang === 'en' ? 'Official Human Pyramid Records' : 'अधिकृत मानवी मनोरे रेकॉर्ड्स'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hasValidText(team?.milestone7) && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <span className="text-slate-500 font-bold text-xs">{team.teamCategory === 'Women' ? '५ थर' : '७ थर'}</span> 
                  <span className="text-slate-900 font-black text-xs bg-white px-2 py-0.5 rounded-lg border border-slate-200">{team.milestone7}</span>
                </div>
              )}
              {hasValidText(team?.milestone8) && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <span className="text-slate-500 font-bold text-xs">{team.teamCategory === 'Women' ? '६ थर' : '८ थर'}</span> 
                  <span className="text-orange-600 font-black text-xs bg-white px-2 py-0.5 rounded-lg border border-slate-200">{team.milestone8}</span>
                </div>
              )}
              {hasValidText(team?.milestone9) && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <span className="text-slate-500 font-bold text-xs">{team.teamCategory === 'Women' ? '७ थर' : '९ थर'}</span> 
                  <span className="text-slate-900 font-black text-xs bg-white px-2 py-0.5 rounded-lg border border-slate-200">{team.milestone9}</span>
                </div>
              )}
              {team.teamCategory !== 'Women' && hasValidText(team?.milestone10) && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <span className="text-slate-500 font-bold text-xs">१० थर</span> 
                  <span className="text-slate-900 font-black text-xs bg-white px-2 py-0.5 rounded-lg border border-slate-200">{team.milestone10}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0b132b] text-white p-4 rounded-2xl shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div className="space-y-1.5">
                <div className="flex items-start space-x-2 text-slate-300">
                  <MapPin size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">{lang === 'en' ? 'Area & Address' : 'परिसर व पत्ता'}</p>
                    <p className="text-white mt-0.5 font-black text-xs leading-snug">
                      {team.address || '—'}
                      {team.district && `, ${lang === 'en' ? 'Dist' : 'जिल्हा'}: ${team.district}`}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {team.areaName && <span className="bg-white/10 text-slate-200 text-[8px] px-1.5 py-0.5 rounded border border-white/5">{team.areaName}</span>}
                      {team.city && <span className="bg-white/10 text-slate-200 text-[8px] px-1.5 py-0.5 rounded border border-white/5">{team.city}</span>}
                      {team.pincode && <span className="bg-white/10 text-orange-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-white/5">PIN: {team.pincode}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 bg-white/5 border border-white/5 p-2.5 rounded-xl text-[10px]">
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <span className="text-[8px] text-slate-400 uppercase font-black">{lang === 'en' ? 'Guide/Coach:' : 'मार्गदर्शक:'}</span>
                  <span className="text-white font-black truncate max-w-[120px]">{team.coachName || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-400 uppercase font-black">{lang === 'en' ? 'Captain:' : 'कर्णधार:'}</span>
                  <span className="text-white font-black truncate max-w-[120px]">{team.captainName || '—'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Social Connections:' : 'वेबसाईट सोशल मीडिया जोडण्या:'}</span>
              <div className="flex gap-1">
                {team.socialLinks?.instagram && <a href={team.socialLinks.instagram} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white text-[9px] font-black flex items-center space-x-1 shadow"><LinkIcon size={9} /> <span>Instagram</span></a>}
                {team.socialLinks?.facebook && <a href={team.socialLinks.facebook} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[9px] font-black flex items-center space-x-1 shadow"><LinkIcon size={9} /> <span>Facebook</span></a>}
                {team.socialLinks?.youtube && <a href={team.socialLinks.youtube} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[9px] font-black flex items-center space-x-1 shadow"><LinkIcon size={9} /> <span>YouTube</span></a>}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="block font-black text-slate-900 uppercase tracking-wider text-[9px] border-b pb-1.5 mb-2.5">
              📸 {lang === 'en' ? 'Salute Historical Photo (Vertical)' : 'सलामी ऐतिहासिक क्षणचित्र (Vertical Format)'}
            </span>
            <div className="w-full rounded-xl border border-slate-900/5 overflow-hidden bg-slate-950 shadow-inner relative aspect-[3/4] flex items-center justify-center">
              {team.bestPerformanceUrl ? (
                <img src={team.bestPerformanceUrl} alt="Best Performance" className="w-full h-full object-contain hover:scale-105 transition-all duration-300" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-50/50">
                  <ImageIcon size={28} className="text-slate-300" />
                  <p className="text-xs font-black mt-2 text-slate-400">सलामी फोटो उपलब्ध नाही</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex justify-center items-center">
            <AdMobileBottom />
          </div>
        </div>

      </div>
    </div>
  );
}