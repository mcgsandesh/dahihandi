import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, MapPin, Trophy, Users, Eye, CheckCircle2, ArrowUpDown, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';
import PublicTeamProfile from './PublicTeamProfile';

export default function PublicDirectory({ handleLogin, initialDistrict, initialArea, initialThara, initialCategory, clearFilters, directSlug, items, lang }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // फिल्टर्सच्या स्टेट्स
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); 
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedThar, setSelectedThar] = useState('All'); 
  const [sortBy, setSortBy] = useState('featured'); // 🎯 नवीन सॉर्टिंग स्टेट: 'featured', 'alphabetical', 'year'

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
            console.log("🚀 [Instant Live] सर्व्हेरवर नवीन बदल सापडले! डेटा फ्रेश अपडेट केला.");
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

  // 🆕 आकडेवारी वरून आलेल्या फिल्टर्सना स्थानिकाशी सिंक करणे
  useEffect(() => {
    if (initialDistrict && initialDistrict !== '') setSelectedDistrict(initialDistrict);
    if (initialArea !== undefined) setSearchTerm(initialArea);
    if (initialThara && initialThara !== '') setSelectedThar(initialThara);
    if (initialCategory && initialCategory !== '') setSelectedCategory(initialCategory);
  }, [initialDistrict, initialArea, initialThara, initialCategory]);

  // 🔄 २४-कॅरेट कडक फिल्टर + स्मार्ट प्रायॉरिटी सॉर्टिंग इंजिन 🎯
  useEffect(() => {
    let result = [...teams];

    // १. पुरुष / महिला कॅटेगरी फिल्टर
    if (selectedCategory !== 'All') {
      result = result.filter(t => t.teamCategory?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // २. जिल्हा फिल्टर
    if (selectedDistrict !== 'All') {
      result = result.filter(t => t.district?.toLowerCase() === selectedDistrict.toLowerCase());
    }

    // ३. डायनॅमिक थर रेकॉर्ड उपस्थिती फिल्टर
    if (selectedThar !== 'All') {
      result = result.filter(t => {
        const hasRecord = (val) => {
          if (!val) return false;
          const clean = val.toString().trim();
          return clean !== "" && clean !== "—" && clean !== "-" && clean.toLowerCase() !== "undefined";
        };

        if (selectedThar === '10') return hasRecord(t.milestone10);
        if (selectedThar === '9') return hasRecord(t.milestone9) && !hasRecord(t.milestone10);
        if (selectedThar === '8') return hasRecord(t.milestone8) && !hasRecord(t.milestone9) && !hasRecord(t.milestone10);
        if (selectedThar === '7') return hasRecord(t.milestone7) && !hasRecord(t.milestone8) && !hasRecord(t.milestone9) && !hasRecord(t.milestone10);

        if (selectedThar === '6') return hasRecord(t.milestone8); 
        if (selectedThar === '5') return hasRecord(t.milestone7) && !hasRecord(t.milestone8); 
        
        return false;
      });
    }

    // ४. परिसर आणि पिनकोड निहाय मॅचिंग फिल्टर
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(t => {
        const cleanTeamName = t.teamName ? t.teamName.toLowerCase() : '';
        const cleanAreaName = t.areaName ? t.areaName.toLowerCase() : '';
        const cleanCity = t.city ? t.city.toLowerCase() : '';
        const cleanAdminName = t.name ? t.name.toLowerCase() : '';
        const cleanUid = t.id ? t.id.toLowerCase() : (t.uid ? t.uid.toLowerCase() : '');
        const cleanPincode = t.pincode ? t.pincode.toString().toLowerCase() : '';

        return (
          cleanAreaName.includes(term) ||
          cleanPincode.includes(term) ||
          cleanTeamName.includes(term) ||
          cleanCity.includes(term) ||
          cleanAdminName.includes(term) ||
          cleanUid.includes(term)
        );
      });
    }

    // 🎯 ५. स्मार्ट प्रायॉरिटी सॉर्टिंग इंजिन (Smart Priority Sorting Engine 🚀)
    result.sort((a, b) => {
      if (sortBy === 'featured') {
        // पूर्ण भरलेली प्रोफाइल (Logo + Photo + About + Milestone) ला जास्त गुण देणे
        const getScore = (item) => {
          let score = 0;
          if (item.logoUrl) score += 3;
          if (item.bestPerformanceUrl) score += 3;
          if (item.aboutTeam && item.aboutTeam.length >= 100) score += 2;
          if (item.isProfileComplete) score += 2;
          if (item.milestone10 || item.milestone9) score += 1;
          return score;
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);

        if (scoreB !== scoreA) {
          return scoreB - scoreA; // जास्त स्कोर असलेली प्रोफाईल वर दिसेल
        }
        // स्कोर समान असेल तर नावानुसार A to Z
        return (a.teamName || '').localeCompare(b.teamName || '');
      }

      if (sortBy === 'alphabetical') {
        return (a.teamName || '').localeCompare(b.teamName || '');
      }

      if (sortBy === 'year') {
        const yearA = parseInt(a.establishedYear) || 9999;
        const yearB = parseInt(b.establishedYear) || 9999;
        return yearA - yearB; // सर्वात जुने आधी
      }

      return 0;
    });

    setFilteredTeams(result);
  }, [searchTerm, selectedCategory, selectedDistrict, selectedThar, sortBy, teams]);

  const districts = ['All', ...new Set(teams.map(t => t.district).filter(Boolean))];

  // 📡 युआरएल स्लॅग मॅचिंग आणि ऑटो-ओपनिंग कक्ष
  useEffect(() => {
    if (!directSlug) return;

    const checkerInterval = setInterval(() => {
      const currentList = teams || []; 

      if (currentList && currentList.length > 0) {
        const slugParts = directSlug.split('-');
        const extractedUID = slugParts[slugParts.length - 1].toLowerCase().trim();

        const matchedTeam = currentList.find(t => {
          const teamUID = (t.uid || t.id || '').toLowerCase().trim();
          return teamUID === extractedUID;
        });

        if (matchedTeam) {
          setSelectedTeam(matchedTeam);
        }
        clearInterval(checkerInterval);
      }
    }, 500);

    return () => clearInterval(checkerInterval);
  }, [directSlug, teams]);

  const handleViewProfile = (team) => {
    setSelectedTeam(team);
  };

  const handleLocalClearAll = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedDistrict('All');
    setSelectedThar('All');
    setSortBy('featured');
    if (clearFilters) clearFilters();
  };

  if (selectedTeam) {
    return (
      <PublicTeamProfile 
        team={selectedTeam} 
        onBack={() => {
          setSelectedTeam(null);
          try {
            window.history.pushState({}, '', window.location.origin + (import.meta.env.BASE_URL || '/'));
          } catch (err) {
            console.error("URL Cleanup failed:", err);
          }
        }} 
      />
    );
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
      
      {/* 📊 टॉप सर्च आणि प्रगत फिल्टर बार */}
      <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        
        {/* रिसेट बॅज */}
        {(selectedDistrict !== 'All' || selectedThar !== 'All' || searchTerm !== '' || selectedCategory !== 'All' || sortBy !== 'featured') && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-700">
            <span>📊 फिल्टर्स सक्रिय आहेत!</span>
            <button type="button" onClick={handleLocalClearAll} className="bg-orange-600 text-white px-2 py-0.5 rounded font-black text-[10px] uppercase">फिल्टर साफ करा ✕</button>
          </div>
        )}

        {/* 👑 हेडर + सर्च बार */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
          <div className="flex-shrink-0">
            <h2 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>{lang === 'en' ? 'Govinda Directory' : 'गोविंदा डिरेक्टरी'}</span>
              <Sparkles size={16} className="text-amber-500 fill-amber-500 animate-pulse" />
            </h2>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5">
              {lang === 'en' ? 'Search registered active teams' : 'महाराष्ट्रातील अधिकृत आणि पूर्ण नोंदणीकृत गोविंदा पथके'}
            </p>
          </div>

          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'en' ? "Search by team name, area or UID..." : "मंडळाचे नाव, परिसर किंवा UID ने शोधा..."} 
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2 text-xs md:text-sm focus:outline-none focus:border-[#ff6600] focus:bg-white font-medium transition-all h-[38px]"
            />
          </div>
        </div>

        {/* 📑 फिल्टर आणि सॉर्टिंग ड्रॉपडाउन सिस्टीम */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-50">
          
          {/* डावी बाजू: कॅटेगरी बटन्स */}
          <div className="flex bg-slate-100 p-1 rounded-xl space-x-1 self-start">
            <button onClick={() => { setSelectedCategory('All'); setSelectedThar('All'); if(clearFilters) clearFilters(); }} className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${selectedCategory === 'All' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>सर्व पथके</button>
            <button onClick={() => { setSelectedCategory('Men'); setSelectedThar('All'); if(clearFilters) clearFilters(); }} className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${selectedCategory === 'Men' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>👨‍👦 पुरुष</button>
            <button onClick={() => { setSelectedCategory('Women'); setSelectedThar('All'); if(clearFilters) clearFilters(); }} className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${selectedCategory === 'Women' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>👩‍👧  महिला</button>
          </div>

          {/* उजवी बाजू: सॉर्टिंग + थर + जिल्हा ड्रॉपडाऊन */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            
            {/* 🎯 [NEW FEATURE]: प्रगत सॉर्टिंग ड्रॉपडाउन */}
            <div className="flex items-center space-x-1 flex-1 sm:flex-none">
              <label className="text-xs font-bold text-slate-400 whitespace-nowrap"><ArrowUpDown size={12} className="inline mr-0.5 text-orange-500" /> क्रमानुसार:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-36 bg-orange-50 border border-orange-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-orange-700 focus:outline-none focus:border-[#ff6600] cursor-pointer"
              >
                <option value="featured">🌟 उत्तम प्रोफाईल्स (Featured)</option>
                <option value="alphabetical">🔤 नावानुसार (A to Z)</option>
                <option value="year">🚩 जुने पथक (स्थापना)</option>
              </select>
            </div>

            {/* थर फिल्टर */}
            <div className="flex items-center space-x-1 flex-1 sm:flex-none">
              <label className="text-xs font-bold text-slate-400 whitespace-nowrap">🏆 थर:</label>
              <select
                value={selectedThar}
                onChange={(e) => setSelectedThar(e.target.value)}
                className="w-full sm:w-32 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#ff6600] cursor-pointer"
              >
                <option value="All">सर्व रेकॉर्ड्स</option>
                {selectedCategory === 'Women' ? (
                  <>
                    <option value="5">🏅 ५ थर लावणारे</option>
                    <option value="6">🏅 ६ थर लावणारे</option>
                    <option value="7">🔥 ७ थर रेकॉर्ड</option>
                  </>
                ) : (
                  <>
                    <option value="7">🏅 ७ थर लावणारे</option>
                    <option value="8">🏅 ८ थर लावणारे</option>
                    <option value="9">⚡ ९ थर रेकॉर्ड</option>
                    <option value="10">👑 १० थर विश्वविक्रम</option>
                  </>
                )}
              </select>
            </div>

            {/* जिल्हा फिल्टर */}
            <div className="flex items-center space-x-1 flex-1 sm:flex-none">
              <label className="text-xs font-bold text-slate-400 whitespace-nowrap">📍 जिल्हा:</label>
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full sm:w-32 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#ff6600] cursor-pointer"
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
          {/* 🖥️ डेस्कटॉप व्ह्यू (Table) */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 w-24">UID</th>
                  <th className="p-4">मंडळ / पथकाचे नाव</th>
                  <th className="p-4">श्रेणी</th>
                  <th className="p-4">परिसर / जिल्हा</th>
                  <th className="p-4 text-center w-32">प्रोफाइल</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {filteredTeams.map((team, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-all text-slate-700 font-medium">
                    <td className="p-4 font-mono text-xs font-bold text-slate-600 bg-slate-50/30">{team.id || team.uid || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-0.5 overflow-hidden flex-shrink-0 shadow-xs">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                          ) : (
                            <span className="text-xs font-black text-slate-400">{team.id?.substring(0, 2) || 'MG'}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-black text-slate-900 uppercase tracking-wide text-sm">{team.teamName}</span>
                            {team.isProfileComplete !== false && (
                              <CheckCircle2 size={15} className="text-emerald-500 fill-emerald-50" title="पूर्ण व्हेरीफाइड प्रोफाईल" />
                            )}
                            {/* रेकॉर्ड बॅज */}
                            {team.milestone10 ? (
                              <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-md">👑 10 थर</span>
                            ) : team.milestone9 ? (
                              <span className="text-[9px] bg-orange-500 text-white font-black px-1.5 py-0.2 rounded-md">⚡ 9 थर</span>
                            ) : null}
                          </div>
                          {team.establishedYear && <span className="text-[11px] text-slate-400 font-bold font-sans">(स्था. {team.establishedYear})</span>}
                          {team.slogan && <p className="text-[11px] text-slate-400 italic font-medium mt-0.5">"{team.slogan}"</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${team.teamCategory === 'Women' ? 'bg-pink-50 text-pink-600 border border-pink-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                        {team.teamCategory === 'Women' ? '👩‍👧 महिला' : '👨‍👦 पुरुष'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-bold">
                      {team.areaName || team.city || 'महाराष्ट्र'}, <span className="text-slate-400 text-xs">{team.district}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleViewProfile(team)} className="bg-[#0b132b] hover:bg-[#ff6600] text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center space-x-1 mx-auto active:scale-95 cursor-pointer">
                        <Eye size={13} /><span>पहा</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📱 मोबाईल व्ह्यू (Cards) */}
          <div className="block md:hidden space-y-2.5">
            {filteredTeams.map((team) => (
              <div key={team.id || team.uid} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 flex flex-col justify-between hover:border-slate-200 transition-all">
                <div>
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-0.5 flex-shrink-0 overflow-hidden shadow-xs">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <span className="text-xs font-black text-slate-400">{team.id?.substring(0, 2) || 'MG'}</span>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center flex-wrap gap-x-1">
                        <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wide truncate max-w-[75%]">{team.teamName}</h4>
                        {team.isProfileComplete !== false && (
                          <CheckCircle2 size={13} className="text-emerald-500 fill-emerald-50 flex-shrink-0" />
                        )}
                        {team.establishedYear && (
                          <span className="text-[10px] text-slate-400 font-black font-sans">(स्था. {team.establishedYear})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{team.id || team.uid}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${team.teamCategory === 'Women' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                          {team.teamCategory === 'Women' ? 'महिला' : 'पुरुष'}
                        </span>
                        {/* रेकॉर्ड बॅज */}
                        {team.milestone10 && <span className="text-[8px] bg-amber-500 text-white font-black px-1 rounded">👑 10 थर</span>}
                        {!team.milestone10 && team.milestone9 && <span className="text-[8px] bg-orange-500 text-white font-black px-1 rounded">⚡ 9 थर</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 min-w-0 text-[10px] font-bold text-slate-400">
                    <MapPin size={12} className="flex-shrink-0 text-orange-500" />
                    <span className="truncate text-slate-600 font-bold">{team.areaName || team.city || 'महाराष्ट्र'}, {team.district}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleViewProfile(team)}
                    className="bg-[#0b132b] text-white active:bg-[#ff6600] px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide transition-all flex items-center space-x-1 flex-shrink-0 shadow-xs cursor-pointer"
                  >
                    <Eye size={12} />
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