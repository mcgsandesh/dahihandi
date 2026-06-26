import React from 'react';
import { ArrowLeft, MapPin, Trophy, Users, Shield, Calendar, Share2 } from 'lucide-react';
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
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* 🔙 बॅक आणि शेअर बार */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-black text-slate-700 hover:text-[#ff6600] transition-all bg-slate-50 px-3 py-2 rounded-xl"
        >
          <ArrowLeft size={16} />
          <span>मंडळ यादीकडे मागे जा</span>
        </button>

        <button 
          onClick={handleShare}
          className="p-2 text-slate-500 hover:text-slate-850 hover:bg-slate-50 rounded-xl transition-all"
          title="मंडळ प्रोफाइल शेअर करा"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* 🚩 मुख्य ब्रँडिंग कार्ड (भव्य लूक) */}
      <div className="bg-gradient-to-br from-[#0b132b] to-[#1c2541] text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#ff6600] opacity-10 blur-3xl rounded-full"></div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
          {/* मंडळाचा भव्य लोगो */}
          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-700/50 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden shadow-lg">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <span className="text-xl font-black text-slate-400 font-mono">{team.id?.substring(0, 3)}</span>
            )}
          </div>

          {/* मंडळाचे नाव व स्लोगन */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl font-black uppercase tracking-wide text-white">{team.teamName}</h2>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md self-center sm:self-auto ${team.teamCategory === 'Women' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'}`}>
                {team.teamCategory === 'Women' ? '👩‍👧 महिला पथक' : '👨‍👦 पुरुष पथक'}
              </span>
            </div>
            {team.slogan && <p className="text-xs text-slate-300 italic font-medium">"{team.slogan}"</p>}
            
            <div className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-white/5 text-slate-400 tracking-wide inline-block">
              UID: {team.id}
            </div>
          </div>
        </div>
      </div>

      {/* 📊 माहिती आणि भविष्यातील डेटा दाखवण्यासाठी २ कॉलम्स ग्रीड */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* डावा कॉलम: मंडळाची कुंडली (बेसिक डिटेल्स) */}
        <div className="md:col-span-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-b pb-2">📋 मंडळाची माहिती</h3>
          
          <div className="space-y-3.5 text-xs font-bold text-slate-600">
            <div className="flex items-start space-x-3">
              <MapPin size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase">पत्ता / परिसर</p>
                <p className="text-slate-700 mt-0.5 font-extrabold">{team.address || team.areaName || team.city || '—'}</p>
                <p className="text-slate-500 text-[11px]">{team.district}, {team.state || 'महाराष्ट्र'}</p>
              </div>
            </div>

            {team.establishedYear && (
              <div className="flex items-start space-x-3">
                <Calendar size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">स्थापना वर्ष</p>
                  <p className="text-slate-700 font-sans font-extrabold mt-0.5 text-sm">{team.establishedYear}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* उजवा मोठा कॉलम: आकडेवारी आणि भविष्यातील गॅलरी/खेळाडू लिस्टसाठी खुली जागा */}
        <div className="md:col-span-2 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-b pb-2">📊 उत्सव सद्यस्थिती</h3>
          
          {/* २ साधे प्री-डिफाईंड कार्ड्स (भविष्यात इथे लाईव्ह खेळाडू काउंट दाखवता येईल) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-orange-50 text-[#ff6600]"><Users size={18} /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase">डिजिटल नोंदणी</p>
                <p className="text-xs text-emerald-600 font-black mt-0.5">पूर्ण झाली आहे ⚡</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Shield size={18} /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase">सुरक्षा नियम</p>
                <p className="text-xs text-blue-600 font-black mt-0.5">स्वीकृत 📜</p>
              </div>
            </div>
          </div>

          {/* 🚀 फ्यूचर स्कोप बॉक्स: भविष्यात गॅलरी किंवा खेळाडूंची नावे दाखवण्यासाठी */}
          <div className="bg-slate-50/50 p-8 rounded-2xl border border-dashed border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-bold">🎯 भविष्यातील अपडेट्स</p>
            <p className="text-[11px] text-slate-400/80 font-medium mt-0.5">लवकरच या भागात मंडळाच्या अधिकृत सलामीचे फोटो आणि थरांची आकडेवारी लाइव्ह केली जाईल.</p>
          </div>
        </div>

      </div>

    </div>
  );
}