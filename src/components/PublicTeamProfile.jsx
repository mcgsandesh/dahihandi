import React from 'react';
import { 
  ArrowLeft, MapPin, Trophy, Users, Shield, Calendar, Share2, 
  User, Award, Link as LinkIcon, Info, FileText, Image as ImageIcon 
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function PublicTeamProfile({ team, onBack }) {
  
  // शेअर लिंक तयार करणे
  const shareLink = `${window.location.origin}${import.meta.env.BASE_URL}${(team.teamName || '').toLowerCase().trim().replace(/\s+/g, '-')}/view`;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: 'प्रोफाइल लिंक कॉपी झाली!', showConfirmButton: false, timer: 2000
      });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 w-full p-0 m-0">
      
      {/* 🔙 बॅक आणि शेअर बार */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm w-full">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-black text-slate-700 hover:text-[#ff6600] transition-all bg-slate-50 px-3 py-2 rounded-xl active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>मंडळ यादीकडे मागे जा</span>
        </button>

        <button 
          onClick={handleShare}
          className="p-2 text-slate-500 hover:text-[#ff6600] hover:bg-slate-50 rounded-xl transition-all active:scale-95"
          title="मंडळ प्रोफाइल शेअर करा"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* 🚩 मुख्य ब्रँडिंग कार्ड (भव्य डार्क लूक) */}
      <div className="bg-gradient-to-br from-[#0b132b] to-[#1c2541] text-white p-6 rounded-3xl shadow-md relative overflow-hidden w-full">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#ff6600] opacity-15 blur-3xl rounded-full"></div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
          {/* मंडळाचा भव्य लोगो */}
          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-700/50 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden shadow-lg">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ImageIcon size={24} />
              </div>
            )}
          </div>

          {/* मंडळाचे नाव व स्लोगन */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white">{team.teamName || "संघ उपलब्ध नाही"}</h2>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md self-center sm:self-auto ${team.teamCategory === 'Women' ? 'bg-pink-500/20 text-pink-300' : team.teamCategory === 'Both' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                {team.teamCategory === 'Women' ? '👩‍👧 महिला पथक' : team.teamCategory === 'Both' ? '👨‍👩‍👦 पुरुष व महिला' : '👨‍👦 पुरुष पथक'}
              </span>
            </div>
            {team.slogan && <p className="text-xs text-slate-300 italic font-medium">"{team.slogan}"</p>}
            
            <div className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-white/5 text-slate-400 tracking-wide inline-block">
              UID: {team.uid || team.id}
            </div>
          </div>
        </div>
      </div>

      {/* 📊 कडक अपग्रेड: ३ बॉक्स मॅट्रिक्स लेआउट (४-४-४ स्प्लिट डेस्कटॉपवर) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 w-full items-stretch">
        
        {/* 📦 बॉक्स १: मंडळाची कुंडली व संपर्क (४ कॉलम्स) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between w-full">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center space-x-1">
              <FileText size={13} className="text-slate-400" /> <span>📋 मंडळाची माहिती</span>
            </h3>
            
            <div className="space-y-4 text-xs font-bold text-slate-600">
              <div className="flex items-start space-x-3">
                <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">पत्ता / परिसर</p>
                  <p className="text-slate-800 mt-0.5 font-extrabold">{team.address || team.areaName || '—'}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {team.city && <span className="bg-slate-50 text-slate-500 text-[9px] px-1.5 py-0.5 rounded border">{team.city}</span>}
                    {team.pincode && <span className="bg-slate-50 text-slate-600 text-[9px] font-mono px-1.5 py-0.5 rounded border">PIN: {team.pincode}</span>}
                    {team.district && <span className="bg-slate-50 text-slate-400 text-[9px] px-1.5 py-0.5 rounded border">{team.district}</span>}
                  </div>
                </div>
              </div>

              {team.establishedYear && (
                <div className="flex items-start space-x-3">
                  <Calendar size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase">स्थापना वर्ष</p>
                    <p className="text-slate-800 font-sans font-extrabold mt-0.5 text-sm">{team.establishedYear}</p>
                  </div>
                </div>
              )}

              {/* 👥 मार्गदर्शक आणि कर्णधार डिस्प्ले */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed">
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase flex items-center space-x-1"><User size={10}/> <span>मार्गदर्शक (Coach)</span></p>
                  <p className="text-slate-800 font-extrabold text-[11px] mt-0.5 truncate">{team.coachName || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase flex items-center space-x-1"><User size={10}/> <span>कर्णधार (Captain)</span></p>
                  <p className="text-slate-800 font-extrabold text-[11px] mt-0.5 truncate">{team.captainName || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 🔗 सोशल कनेक्ट लिंक्स बटणे */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">अधिकृत सोशल नेटवर्क:</span>
            <div className="flex flex-wrap gap-1.5">
              {team.socialLinks?.instagram ? (
                <a href={team.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-all text-[11px] font-black flex items-center space-x-1"><LinkIcon size={11} /> <span>Instagram</span></a>
              ) : <span className="text-[9px] text-slate-300 italic">नो इंस्टाग्राम</span>}
              {team.socialLinks?.facebook ? (
                <a href={team.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-[11px] font-black flex items-center space-x-1"><LinkIcon size={11} /> <span>Facebook</span></a>
              ) : <span className="text-[9px] text-slate-300 italic ml-1">नो फेसबुक</span>}
              {team.socialLinks?.youtube ? (
                <a href={team.socialLinks.youtube} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all text-[11px] font-black flex items-center space-x-1"><LinkIcon size={11} /> <span>YouTube</span></a>
              ) : <span className="text-[9px] text-slate-300 italic ml-1">नो यूट्यूब</span>}
            </div>
          </div>
        </div>

        {/* 📦 बॉक्स २: उत्सव कामगिरी, रेकॉर्ड्स व इतिहास (४ कॉलम्स) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 w-full flex flex-col justify-between">
          <div className="space-y-3.5 flex-1 flex flex-col">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center space-x-1 flex-shrink-0">
              <Trophy size={13} className="text-amber-500" /> <span>📊 उत्सव कामगिरी व इतिहास</span>
            </h3>

            <div className="bg-orange-50/40 p-2.5 rounded-xl border border-orange-100 text-xs flex-shrink-0">
              <span className="block font-black text-orange-800 uppercase tracking-wider text-[9px]">सर्वोत्कृष्ट कामगिरी (Record)</span>
              <p className="text-slate-700 font-extrabold mt-0.5">{team.bestPerformance || '—'}</p>
            </div>

            {/* संक्षिप्त इतिहास स्क्रोल बॉक्स */}
            <div className="bg-slate-50/60 p-2.5 rounded-xl border text-xs flex-1 flex flex-col min-h-[120px] max-h-[180px] lg:max-h-[220px]">
              <span className="block font-black text-slate-400 uppercase tracking-wider text-[9px] flex-shrink-0 mb-1">संघाबद्दल संक्षिप्त इतिहास</span>
              <div className="overflow-y-auto pr-1 text-slate-600 font-medium leading-relaxed text-[11px] whitespace-pre-wrap flex-1 scrollbar-thin">
                {team.aboutTeam || '—'}
              </div>
            </div>

            {/* थरांचे ऐतिहासिक माइलस्टोन्स */}
            <div className="pt-2 border-t border-dashed space-y-1.5 flex-shrink-0">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">🏆 ऐतिहासिक थर रेकॉर्ड्स</span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="bg-slate-50 p-1.5 rounded-lg border"><span className="text-slate-400 font-medium">७ थर:</span> <span className="text-slate-800 font-black block truncate">{team.milestone7 || '—'}</span></div>
                <div className="bg-slate-50 p-1.5 rounded-lg border"><span className="text-slate-400 font-medium">८ थर:</span> <span className="text-slate-800 font-black block truncate">{team.milestone8 || '—'}</span></div>
                <div className="bg-slate-50 p-1.5 rounded-lg border"><span className="text-slate-400 font-medium">९ थर:</span> <span className="text-slate-800 font-black block truncate">{team.milestone9 || '—'}</span></div>
                <div className="bg-slate-50 p-1.5 rounded-lg border"><span className="text-slate-400 font-medium">१० थर:</span> <span className="text-slate-800 font-black block truncate">{team.milestone10 || '—'}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* 📦 BOX 3: भव्य व्हर्टिकल सलामी क्षणचित्र (४ कॉलम्स - High Dynamic View 🚀) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between w-full h-full min-h-[460px] lg:min-h-[520px]">
          <div className="w-full h-full flex flex-col flex-1">
            <span className="block font-black text-slate-800 uppercase tracking-wider text-[10px] border-b pb-2 mb-3 flex-shrink-0">
              📸 सलामी क्षणचित्र (Vertical Format)
            </span>
            
            {/* उंच मानवी मनोऱ्यासाठी गडद पार्श्वभूमी आणि आस्पेक्ट रेशो लॉक */}
            <div className="flex-1 w-full rounded-2xl border border-slate-900/10 overflow-hidden bg-slate-950 shadow-inner relative min-h-[380px] lg:min-h-[440px]">
              {team.bestPerformanceUrl ? (
                <img 
                  src={team.bestPerformanceUrl} 
                  alt="Best Performance Live" 
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

    </div>
  );
}