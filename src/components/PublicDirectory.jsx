import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, MapPin, Trophy, Users, Eye, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import PublicTeamProfile from './PublicTeamProfile';

export default function PublicDirectory() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // फिल्टर्सच्या स्टेट्स
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All', 'Men', 'Women'
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  
  // 🎯 नवीन जोडलेली थरांची फिल्टर स्टेट (५ थर ते १० थर)
  const [selectedThar, setSelectedThar] = useState('All'); 

  // 🎯 १-Read + Version-Controlled LocalStorage कॅश इंजिन (सुरक्षित जसेच्या तसे ⚡)
  useEffect(() => {
    const fetchLiveDirectory = async () => {
      try {
        const CACHE_KEY = 'govinda_public_directory';
        const CACHE_TIME_KEY = 'govinda_directory_time';
        const CACHE_VERSION_KEY = 'govinda_directory_version';
        const FOUR_HOURS = 4 * 60 * 60 * 1000;

        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY) || '0';
        const now = Date.now();

        const cacheDocRef = doc(db, "public_site_cache", "live_directory");
        const docSnap = await getDoc(cacheDocRef);

        if (docSnap.exists()) {
          const cacheData = docSnap.data();
          const serverVersion = cacheData.version || 0;
          const allTeams = cacheData.teams || [];

          if (Number(serverVersion) > Number(cachedVersion) || !cachedData || !cachedTime || (now - cachedTime >= FOUR_HOURS)) {
            console.log("🚀 [Instant Live] सर्व्हरवर नवीन बदल सापडले! डेटा फ्रेश अपडेट केला.");
            localStorage.setItem(CACHE_KEY, JSON.stringify(allTeams));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            localStorage.setItem(CACHE_VERSION_KEY, serverVersion.toString());

            setTeams(allTeams);
            setFilteredTeams(allTeams);
          } else {
            console.log("⚡ [Smart Cache] डेटा LocalStorage मधून ओढला.");
            const localTeams = JSON.parse(cachedData);
            setTeams(localTeams);
            setFilteredTeams(localTeams);
          }
        }
      } catch (err) {
        console.error("कॅश डेटा आणताना अडचण आली:", err);
        const backupData = localStorage.getItem('govinda_public_directory');
        if (backupData) {
          const allTeams = JSON.parse(backupData);
          setTeams(allTeams);
          setFilteredTeams(allTeams);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLiveDirectory();
  }, []);

  // 🔄 २४-कॅरेट कडक फिल्टर आणि सर्च लॉजिक (मॅचिंग सिस्टीम अपग्रेड 🎯)
  useEffect(() => {
    let result = teams;

    // १. पुरुष / महिला कॅटेगरी फिल्टर
    if (selectedCategory !== 'All') {
      result = result.filter(t => t.teamCategory === selectedCategory);
    }

    // २. जिल्हा फिल्टर
    if (selectedDistrict !== 'All') {
      result = result.filter(t => t.district?.toLowerCase() === selectedDistrict.toLowerCase());
    }

// =========================================================================
    // 🏆 APPROVED FIX: डायनॅमिक थर रेकॉर्ड उपस्थिती फिल्टर (२ सेकंदात फिक्स 🚀)
    // =========================================================================
    if (selectedThar !== 'All') {
      result = result.filter(t => {
        // जर व्हॅल्यू रिकामी नसेल, कोरी नसेल आणि '—' नसेल, तरच संघाने तो थर लावला आहे असं समजणे
        const hasRecord = (val) => {
          if (!val) return false;
          const clean = val.toString().trim();
          return clean !== "" && clean !== "—" && clean !== "-" && clean.toLowerCase() !== "undefined";
        };

        // पुरुष / दोन्ही पथकांसाठी सर्वोच्च प्राधान्य लॉजिक (Highest Milestone Priority)
        if (selectedThar === '10') {
          return hasRecord(t.milestone10);
        }
        if (selectedThar === '9') {
          return hasRecord(t.milestone9) && !hasRecord(t.milestone10);
        }
        if (selectedThar === '8') {
          return hasRecord(t.milestone8) && !hasRecord(t.milestone9) && !hasRecord(t.milestone10);
        }
        if (selectedThar === '7') {
          return hasRecord(t.milestone7) && !hasRecord(t.milestone8) && !hasRecord(t.milestone9) && !hasRecord(t.milestone10);
        }

        // महिला पथकांसाठी डायनॅमिक माइलस्टोन्स (५, ६, ७ थर)
        if (selectedThar === '6') {
          return hasRecord(t.milestone8); // महिला ६ थर
        }
        if (selectedThar === '5') {
          return hasRecord(t.milestone7) && !hasRecord(t.milestone8); // महिला ५ थर
        }
        
        return false;
      });
    }


    // ४. टेक्स्ट सर्च की-वर्ड फिल्टर
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.teamName?.toLowerCase().includes(term) ||
        t.areaName?.toLowerCase().includes(term) ||
        t.city?.toLowerCase().includes(term) ||
        t.name?.toLowerCase().includes(term) ||
        t.id?.toLowerCase().includes(term)
      );
    }

    setFilteredTeams(result);
  }, [searchTerm, selectedCategory, selectedDistrict, selectedThar, teams]);

  const districts = ['All', ...new Set(teams.map(t => t.district).filter(Boolean))];

  // 🔗 मंडळाचे वैयक्तिक पब्लिक प्रोफाइल पाहण्यासाठी ॲक्शन (सुरक्षित जसेच्या तसे)
  const handleViewProfile = (team) => {
    const isUserLoggedIn = localStorage.getItem('govinda_user');

    if (!isUserLoggedIn) {
      Swal.fire({
        icon: 'info',
        title: 'सुरक्षा लॉक! 🔐',
        text: 'मंडळाची संपूर्ण प्रोफाइल आणि खेळाडूंची माहिती पाहण्यासाठी कृपया आधी तुमच्या गुगल अकाउंटने लॉगिन करा.',
        confirmButtonColor: '#ff6600',
        confirmButtonText: 'लॉगिन करा 🚩',
        showCancelButton: true,
        cancelButtonText: 'नाही, नंतर करतो',
        customClass: { popup: 'rounded-3xl' }
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('govinda_guest');
          window.location.href = import.meta.env.BASE_URL || '/';
        }
      });
      return;
    }
    setSelectedTeam(team);
  };

  if (selectedTeam) {
    return <PublicTeamProfile team={selectedTeam} onBack={() => setSelectedTeam(null)} />;
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-bold tracking-wide">महाराष्ट्रातील गोविंदा पथके शोधत आहे...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      
      {/* 📊 टॉप सर्च आणि सुधारित फिल्टर बार */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={18} /></span>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="मंडळाचे नाव, परिसर किंवा UID ने शोधा..." 
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] focus:bg-white font-medium transition-all"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-0.5">
          {/* श्रेणी बटन कप्पा */}
          <div className="flex bg-slate-100 p-1 rounded-xl space-x-1 self-start">
            <button onClick={() => { setSelectedCategory('All'); setSelectedThar('All'); }} className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${selectedCategory === 'All' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>सर्व पथके</button>
            <button onClick={() => { setSelectedCategory('Men'); setSelectedThar('All'); }} className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${selectedCategory === 'Men' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>👨‍👦 पुरुष</button>
            <button onClick={() => { setSelectedCategory('Women'); setSelectedThar('All'); }} className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${selectedCategory === 'Women' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>👩‍👧  महिला</button>
          </div>

          {/* 🎯 नवीन थर फिल्टर आणि जिल्हा सिलेक्टर्स कप्पा एकत्र */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            {/* डायनॅमिक थर शोधक ड्रॉपडाउन */}
            <div className="flex items-center space-x-1.5 flex-1 sm:flex-none">
              <label className="text-xs font-bold text-slate-400 whitespace-nowrap">🏆 थर फिल्टर:</label>
              <select
                value={selectedThar}
                onChange={(e) => setSelectedThar(e.target.value)}
                className="w-full sm:w-36 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#ff6600] cursor-pointer"
              >
                <option value="All">सर्व रेकॉर्ड्स</option>
                {selectedCategory === 'Women' ? (
                  <>
                    <option value="5">🏅 ५ थर लावणारे</option>
                    <option value="6">🏅 ६ थर लावणारे</option>
                    <option value="7">🔥 भव्य ७ थर रेकॉर्ड</option>
                  </>
                ) : (
                  <>
                    <option value="7">🏅 ७ थर लावणारे</option>
                    <option value="8">🏅 ८ थर लावणारे</option>
                    <option value="9">⚡ भव्य ९ थर रेकॉर्ड</option>
                    <option value="10">👑 जागतिक १० थर विश्वविक्रम</option>
                  </>
                )}
              </select>
            </div>

            {/* जिल्हा ड्रॉपडाउन */}
            <div className="flex items-center space-x-1.5 flex-1 sm:flex-none">
              <label className="text-xs font-bold text-slate-400 whitespace-nowrap">📍 जिल्हा:</label>
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full sm:w-36 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#ff6600] cursor-pointer"
              >
                {districts.map((dist, idx) => (
                  <option key={idx} value={dist}>{dist === 'All' ? 'सर्व जिल्हे' : dist}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* 🟢 मुख्य यादी विभाग */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-sm font-medium">क्षमस्व, या फिल्टरमध्ये कोणतेही मंडळ सापडले नाही. 🚩</p>
        </div>
      ) : (
        <>
          {/* 🖥️ १. डेस्कटॉपसाठी प्रिमियम टेबल व्ह्यू */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold Explo text-slate-500 uppercase tracking-wider">
                  <th className="p-4 w-24">UID</th>
                  <th className="p-4">मंडळ / पथकाचे नाव</th>
                  <th className="p-4">श्रेणी</th>
                  <th className="p-4">परिसर / जिल्हा</th>
                  <th className="p-4 text-center w-32">प्रोफाइल</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {filteredTeams.map((team, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-all text-slate-700 font-medium">
                    <td className="p-4 font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{team.id || team.uid || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center p-0.5 overflow-hidden flex-shrink-0">
                          {team.logoUrl ? <img src={team.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-md" /> : <span className="text-[10px] text-slate-400 font-bold">{team.id?.substring(0,2)}</span>}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-black text-slate-900 uppercase tracking-wide">{team.teamName}</span>
                            {/* 🎯 व्हेरीफाईड बॅज (Verified Badge Display) */}
                            {team.isProfileComplete !== false && (
                              <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-50" title="समिती व्हेरिफाइड पथक" />
                            )}
                          </div>
                          {team.establishedYear && <span className="text-[11px] text-slate-400 font-bold font-sans">(स्था. {team.establishedYear})</span>}
                          {team.slogan && <p className="text-[11px] text-slate-400 italic font-medium mt-0.5">"{team.slogan}"</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${team.teamCategory === 'Women' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                        {team.teamCategory === 'Women' ? 'महिला' : 'पुरुष'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-bold">
                      {team.areaName || team.city || 'महाराष्ट्र'}, <span className="text-slate-400 text-xs">{team.district}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleViewProfile(team)} className="bg-slate-900 hover:bg-[#ff6600] text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm flex items-center space-x-1 mx-auto active:scale-95">
                        <Eye size={12} /><span>पहा</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📱 २. मोबाईलसाठी कॉम्पॅक्ट कार्ड्स ग्रीड */}
          <div className="block md:hidden space-y-2">
            {filteredTeams.map((team) => (
              <div key={team.id || team.uid} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex flex-col justify-between hover:border-slate-200 transition-all">
                <div>
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5 flex-shrink-0 overflow-hidden">
                      {team.logoUrl ? <img src={team.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-md" /> : <span className="text-[9px] font-black text-slate-400 font-mono">{team.id?.substring(0, 2)}</span>}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-x-1">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide truncate max-w-[75%]">{team.teamName}</h4>
                        {team.isProfileComplete !== false && (
                          <CheckCircle2 size={12} className="text-emerald-500 fill-emerald-50 flex-shrink-0" />
                        )}
                        {team.establishedYear && (
                          <span className="text-[10px] text-slate-400 font-black font-sans">(स्था. {team.establishedYear})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="font-mono text-[10px] font-black px-1 rounded bg-slate-100 text-slate-500">{team.id || team.uid}</span>
                        <span className={`text-[8px] font-black px-1 rounded ${team.teamCategory === 'Women' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>{team.teamCategory === 'Women' ? 'महिला' : 'पुरुष'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 min-w-0 text-[10px] font-bold text-slate-400">
                    <MapPin size={11} className="flex-shrink-0" />
                    <span className="truncate text-slate-500">{team.areaName || team.city || 'महाराष्ट्र'}, {team.district}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleViewProfile(team)}
                    className="bg-slate-900 text-white active:bg-[#ff6600] px-2.5 py-1 rounded-md text-[10px] font-black tracking-wide transition-all flex items-center space-x-1 flex-shrink-0 shadow-sm"
                  >
                    <Eye size={11} />
                    <span>प्रोफाइल पहा</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}