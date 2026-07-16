import React, { useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Trophy, Users, Shield, Calendar, Share2, 
  User, Award, Link as LinkIcon, Info, FileText, Image as ImageIcon, Edit2 
} from 'lucide-react';
import Swal from 'sweetalert2';

// 🎯 अधिकृत ॲड मोबाईल बॉटम कॉम्पोनेंट इम्पोर्ट
import AdMobileBottom from '../components/AdMobileBottom';

export default function PublicTeamProfile({ team, onBack, isSuperAdminView, onEditClick }) {
  
  useEffect(() => {
    console.log("=== 📜 [PUBLIC TEAM PROFILE DEBUG START] ===");
    console.log("📥 आलेला संपूर्ण संघ डेटा (team Object):", team);
    console.log("🏠 संघाचा पत्ता (Address Check):", team?.address);
    console.log("👥 मार्गदर्शक व कर्णधार:", team?.coachName, " | ", team?.captainName);
    console.log("⚙️ [PROPS CHECK] isSuperAdminView ची सद्यस्थिती:", isSuperAdminView);
    console.log("=== 📜 [PUBLIC TEAM PROFILE DEBUG END] ===");
  }, [team, isSuperAdminView, onEditClick]);

  // 🎯 व्हॅलिडेशन सुधारणा: जर एखादी फील्ड '—' किंवा रिकामी असेल तर ती अचूक तपासणे
  const hasValidText = (val) => val && val.trim() !== '' && val.trim() !== '—';

  // 🔐 पब्लिक शेअर लिंक लॉक करण्यासाठी कडक व्हॅलिडेशन चेक (१००% मॅच विथ डेटाबेस) 🚀
  const isProfileReadyForShare = 
    (team?.aboutTeam && team.aboutTeam.trim().length >= 300) && 
    //team?.address && 
    team?.logoUrl && 
    team?.slogan && 
    team?.bestPerformance && 
    team?.bestPerformanceUrl &&
    team?.coachName && // मार्गदर्शक अनिवार्य
    team?.captainName && // कर्णधार अनिवार्य
    (hasValidText(team?.milestone7) || hasValidText(team?.milestone8) || hasValidText(team?.milestone9) || hasValidText(team?.milestone10));

  // युनियन फ्रेंडली युआरएल स्लॅग जनरेशन (नावासोबत UID मिक्स)
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

  if (!team) return null;

  return (
    <div className="space-y-5 animate-in fade-in duration-200 w-full p-0 m-0 text-left text-slate-900 bg-[#f8fafc]">
      
      {/* 🔙 १. नेव्हिगेशन व शेअर बार */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm w-full">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-black text-slate-700 hover:text-[#ff6600] transition-all bg-slate-50 px-3 py-2 rounded-xl active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>मडंळ यादीकडे मागे जा</span>
        </button>

        {/* 🔗 शेअर बटण - कडक व्हॅलिडेशन लॉकसह */}
        {isProfileReadyForShare ? (
          <button 
            onClick={handleShare}
            className="flex items-center space-x-1.5 text-xs font-black bg-orange-50 text-orange-600 border border-orange-100 px-3 py-2 rounded-xl transition-all active:scale-95"
            title="मंडळ प्रोफाइल शेअर करा"
          >
            <Share2 size={14} />
            <span>लिंक शेअर करा</span>
          </button>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-2 rounded-xl text-[10px] font-black leading-tight" title="माहिती अपूर्ण असल्यामुळे शेअर बंद आहे भाऊ">
            ⚠️ शेअर लॉक आहे
          </div>
        )}
      </div>

      {/* 🚩 २. मुख्य ब्रँडिंग हेडर बॅनर (मोबाईल ओव्हरलॅप फ्री - अल्ट्रा स्लिम) */}
      <div className="bg-gradient-to-br from-[#070b19] via-[#0f172a] to-[#1e293b] text-white p-4 md:p-6 rounded-3xl shadow-xl relative overflow-hidden w-full border border-slate-800">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-orange-600 opacity-10 blur-3xl rounded-full pointer-events-none"></div>
        
        {isSuperAdminView && (
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={onEditClick}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1.5 text-xs font-black border border-orange-400/20 active:scale-95"
            >
              <Edit2 size={13} />
              <span className="hidden sm:inline">माहिती सुधारा</span>
              <span className="sm:hidden">Edit</span>
            </button>
          </div>
        )}
        
        {/* मुख्य माहिती रो (Row) मांडणी */}
        <div className="flex flex-row items-center md:items-start gap-4 relative z-10 pr-16 md:pr-48">
          {/* मंडळाचा लोगो */}
          <div className="w-16 h-16 md:w-28 md:h-28 bg-white rounded-xl md:rounded-2xl border border-slate-700/40 flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden shadow-2xl">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                <ImageIcon size={22} />
              </div>
            )}
          </div>

          {/* नाव, स्लोगन, प्रकार */}
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-base md:text-3xl font-black uppercase tracking-wide text-white leading-tight truncate">
              {team.teamName || "संघ उपलब्ध नाही"}
            </h1>
            
            {team.slogan && (
              <p className="text-[10px] md:text-sm text-slate-300 italic font-medium tracking-wide truncate">
                "{team.slogan}"
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className={`text-[7px] md:text-[10px] text-white font-black px-1.5 py-0.2 rounded uppercase tracking-wider ${team.teamCategory === 'Women' ? 'bg-pink-600' : team.teamCategory === 'Both' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                {team.teamCategory === 'Women' ? '👩‍👧 महिला' : team.teamCategory === 'Both' ? '👨‍👩‍👦 दोन्ही' : '👨‍👦 पुरुष'}
              </span>
              <span className={`text-[7px] md:text-[10px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider text-white ${team.hasInsurance ? 'bg-emerald-600' : 'bg-red-600'}`}>
                {team.hasInsurance ? 'विma सुरक्षित' : 'विमा अपूर्ण'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {team.establishedYear && (
                <div className="text-[8px] md:text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/20 shadow-inner">
                  🚩 स्थापना: {team.establishedYear}
                </div>
              )}
              <div className="font-mono text-[8px] md:text-[10px] font-black px-1.5 py-0.2 rounded bg-white/10 text-slate-300 tracking-wide border border-white/5">
                ID: {team.uid || team.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 ३. २-कॉलम प्रो लेआउट */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        
        {/* डावी बाजू (कॉलम ७) */}
        <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
          
          {/* सर्वोच्च कामगिरी हायलाईट */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-4 rounded-3xl text-white shadow-md flex items-center justify-between border border-orange-400/20">
            <div className="space-y-0.5 text-left">
              <span className="block font-black uppercase tracking-widest text-[9px] text-orange-100">🏆 ऐतिहासिक सर्वोच्च विक्रम</span>
              <p className="text-sm md:text-base font-black leading-tight">{team.bestPerformance || 'नमुद नाही भाऊ'}</p>
            </div>
            <Trophy size={26} className="opacity-40 flex-shrink-0 animate-bounce" />
          </div>

          {/* संघाचा इतिहास (नो स्क्रोलबार - पूर्ण वृत्त दर्शन) */}
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm text-left space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center space-x-2">
              <FileText size={14} className="text-slate-400" /> <span>संघाचा इतिहास व परंपरा</span>
            </h3>
            <div className="text-slate-700 font-extrabold leading-relaxed text-xs md:text-sm whitespace-pre-wrap">
              {team.aboutTeam || 'संघाचा संक्षिप्त इतिहास येथे नमुद केला जाईल...'}
            </div>
          </div>

          {/* ऐतिहासिक थर माइलस्टोन्स (केवळ उपलब्ध व्हॅल्यूज दिसणार) */}
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm text-left space-y-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider block flex items-center gap-1.5 border-b pb-2">
              <Award size={14} className="text-amber-500"/> अधिकृत मानवी मनोरे रेकॉर्ड्स
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {hasValidText(team?.milestone7) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <span className="text-slate-500 font-bold text-xs">{team.teamCategory === 'Women' ? '५ थर' : '७ थर'}</span> 
                  <span className="text-slate-900 font-black text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">{team.milestone7}</span>
                </div>
              )}
              {hasValidText(team?.milestone8) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <span className="text-slate-500 font-bold text-xs">{team.teamCategory === 'Women' ? '६ थर' : '८ थर'}</span> 
                  <span className="text-orange-600 font-black text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">{team.milestone8}</span>
                </div>
              )}
              {hasValidText(team?.milestone9) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <span className="text-slate-500 font-bold text-xs">{team.teamCategory === 'Women' ? '७ थर' : '९ थर'}</span> 
                  <span className="text-slate-900 font-black text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">{team.milestone9}</span>
                </div>
              )}
              {team.teamCategory !== 'Women' && hasValidText(team?.milestone10) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                  <span className="text-slate-500 font-bold text-xs">१० थर</span> 
                  <span className="text-slate-900 font-black text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">{team.milestone10}</span>
                </div>
              )}
            </div>
          </div>

          {/* पत्ता, संपर्क आणि जिल्हा */}
          <div className="bg-[#0b132b] text-white p-5 rounded-3xl shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div className="space-y-2">
                <div className="flex items-start space-x-2 text-slate-300">
                  <MapPin size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">परिसर व पत्ता</p>
                    {/* 🎯 कडक दुरुस्ती: डेटाबेसमधील पत्ता अचूक रेंडरिंग */}
                    <p className="text-white mt-0.5 font-black text-xs leading-snug">
                      {team.address || '—'}
                      {team.district && `, जिल्हा: ${team.district}`}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {team.areaName && <span className="bg-white/10 text-slate-200 text-[8px] px-1.5 py-0.5 rounded border border-white/5">{team.areaName}</span>}
                      {team.city && <span className="bg-white/10 text-slate-200 text-[8px] px-1.5 py-0.5 rounded border border-white/5">{team.city}</span>}
                      {team.pincode && <span className="bg-white/10 text-orange-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-white/5">PIN: {team.pincode}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-white/5 border border-white/5 p-3 rounded-2xl text-[11px]">
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <span className="text-[9px] text-slate-400 uppercase font-black">मार्गदर्शक:</span>
                  <span className="text-white font-black truncate max-w-[120px]">{team.coachName || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 uppercase font-black">कर्णधार:</span>
                  <span className="text-white font-black truncate max-w-[120px]">{team.captainName || '—'}</span>
                </div>
              </div>
            </div>

            {/* सोशल लिंक्स */}
            <div className="pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">वेबसाईट सोशल मीडिया जोडण्या:</span>
              <div className="flex gap-1.5">
                {team.socialLinks?.instagram && <a href={team.socialLinks.instagram} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white text-[10px] font-black flex items-center space-x-1 shadow"><LinkIcon size={10} /> <span>Instagram</span></a>}
                {team.socialLinks?.facebook && <a href={team.socialLinks.facebook} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-black flex items-center space-x-1 shadow"><LinkIcon size={10} /> <span>Facebook</span></a>}
                {team.socialLinks?.youtube && <a href={team.socialLinks.youtube} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-[10px] font-black flex items-center space-x-1 shadow"><LinkIcon size={10} /> <span>YouTube</span></a>}
              </div>
            </div>
          </div>
        </div>

        {/* उजवी बाजू (कॉलम ५) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between w-full h-full">
          
          {/* 🖼️ ऐतिहासिक क्षणचित्र गॅलरी कार्ड */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between flex-1 min-h-[360px]">
            <span className="block font-black text-slate-900 uppercase tracking-wider text-[10px] border-b pb-2 mb-3">
              📸 सलामी ऐतिहासिक क्षणचित्र (Vertical Format)
            </span>
            <div className="flex-1 w-full rounded-2xl border border-slate-900/5 overflow-hidden bg-slate-950 shadow-inner relative min-h-[300px] flex items-center justify-center">
              {team.bestPerformanceUrl ? (
                <img src={team.bestPerformanceUrl} alt="Best Performance Vertical View" className="w-full h-full object-contain md:object-cover hover:object-contain transition-all duration-300" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-50/50">
                  <ImageIcon size={32} className="text-slate-300" />
                  <p className="text-xs font-black mt-2 text-slate-400">सलामी फोटो उपलब्ध नाही</p>
                </div>
              )}
            </div>
          </div>

          {/* 🎯 अधिकृत गुगल जाहिरात स्लॉट सिस्टीम थेट तळाशी फिक्स */}
          <div className="w-full flex justify-center items-center flex-shrink-0">
            <AdMobileBottom />
          </div>

        </div>

      </div>
    </div>
  );
}