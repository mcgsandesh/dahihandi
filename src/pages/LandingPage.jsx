import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import logoIcon from '/icon-512.png';
import loginBgImg from '/login-bg.png';
import { Image, Calendar, Clock, Megaphone, Trophy, Users, MapPin, ArrowRight, Layers, LogIn, ExternalLink, X } from 'lucide-react';

import AdSenseBanner from '../components/AdSenseBanner';




// Vite मधून डिफाइन केलेला ग्लोबल व्हर्जन नंबर सुरक्षितपणे ओढणे
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
const LANDING_CACHE_KEY = 'govinda_landing_cache';
const LANDING_CACHE_TIME_KEY = 'govinda_landing_cache_time';
const CACHE_DURATION = 15 * 60 * 1000; 

const DEFAULT_IMAGES = {
  practice_start: "https://i.ibb.co/ns8bcPJD/Start-PRactice.jpg", 
  practice_session: "https://i.ibb.co/cStW7GyL/Sarav-Shibit-events.jpg", 
  dahihandi_venue: "https://i.ibb.co/6Jf3Dd9v/dahihandi-events.jpg",  
  competition: "https://img.magnific.com/free-photo/colombian-national-soccer-team-concept-still-life_23-2150257157.jpg?semt=ais_hybrid&w=740&q=80" 
};



export default function LandingPage({ handleLogin, handleExploreAsGuest, loading, error, setCurrentPublicPage }) {
  const [lang, setLang] = useState('mr');
  
  const [latestRecords, setLatestRecords] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]); 
  const [stats, setStats] = useState({ totalTeams: 0, menTeams: 0, womenTeams: 0, districts: 0 });

  // 🎯 प्रिमियम फुल-स्क्रीन पॉपअपसाठी स्टेट इंजिन
  const [selectedPopupData, setSelectedPopupData] = useState(null);

  const recordsRef = useRef(null);
  const eventsRef = useRef(null);

    // Helper function: इव्हेंटच्या कॅटेगरीनुसार अचूक डिफॉल्ट इमेज निवडणे
// 🎯 कॅटेगरीच्या नावानुसार अचूक डिफॉल्ट इमेज निवडणारे अंतिम इंजिन 🚀
  const getEventPoster = (evt) => {
    // १. जर युझरने स्वतःचे पोस्टर अपलोड केले असेल, तर आधी त्याला प्राधान्य द्या
    if (evt.posterUrl && evt.posterUrl.trim() !== "") return evt.posterUrl;
    if (evt.poster && evt.poster.trim() !== "") return evt.poster;
    
    // २. डेटाबेसमधून अचूक कॅटेगरी की ओढा (सर्व संभाव्य ऑप्शन्स तपासून सुरक्षितता)
    const currentCategory = evt.category || evt.eventType || evt.type || '';
    
    // ३. कन्सोलमध्ये लाईव्ह चेक करा की नक्की काय व्हॅल्यू येतेय
    console.log(`📸 [Poster Check] Event: "${evt.title_mr || 'No Title'}" | Category From DB: "${currentCategory}"`);

    // ४. जर कॅटेगरीची व्हॅल्यू रिकामी नसेल आणि थेट DEFAULT_IMAGES मध्ये उपलब्ध असेल तर तीच द्या
    if (currentCategory && DEFAULT_IMAGES[currentCategory]) {
      return DEFAULT_IMAGES[currentCategory];
    }
    
    // ५. फॉलबॅक: जर काहीच मॅच नाही झाले, तर सुरक्षितपणे 'competition' ची इमेज द्या
    return DEFAULT_IMAGES.competition;
  };

  // 📊 पब्लिक स्टॅट्स इंजिन
  useEffect(() => {
    const calculateStatsFromCache = async () => {
      try {
        const CACHE_KEY = 'govinda_public_directory';
        const cachedData = localStorage.getItem(CACHE_KEY);

        if (cachedData) {
          const allTeams = JSON.parse(cachedData);
          const total = allTeams.length;
          const men = allTeams.filter(t => t.teamCategory === 'Men' || t.teamCategory === 'Both').length;
          const women = allTeams.filter(t => t.teamCategory === 'Women').length;
          const uniqueDistricts = [...new Set(allTeams.map(t => t.district).filter(Boolean))].length;
          setStats({ totalTeams: total, menTeams: men, womenTeams: women, districts: uniqueDistricts });
        } else {
          const cacheDocRef = doc(db, "public_site_cache", "live_directory");
          const docSnap = await getDoc(cacheDocRef);

          if (docSnap.exists()) {
            const cacheData = docSnap.data();
            const allTeams = cacheData.teams || [];
            const total = allTeams.length;
            const men = allTeams.filter(t => t.teamCategory === 'Men' || t.teamCategory === 'Both').length;
            const women = allTeams.filter(t => t.teamCategory === 'Women').length;
            const uniqueDistricts = [...new Set(allTeams.map(t => t.district).filter(Boolean))].length;

            setStats({ totalTeams: total, menTeams: men, womenTeams: women, districts: uniqueDistricts });
            localStorage.setItem(CACHE_KEY, JSON.stringify(allTeams));
            localStorage.setItem('govinda_directory_time', Date.now().toString());
          }
        }
      } catch (err) {
        console.error("❌ लँडिंग पेजवर कॅश रीड करताना एरर आला भाऊ:", err);
      }
    };
    calculateStatsFromCache();
  }, []);

  // 🚀 डेटा ओढण्याचे आणि कॅश मॅनेज करण्याचे मुख्य लॉजिक
  useEffect(() => {
    const processLandingData = (allData) => {
      if (allData.newsData) setLatestNews(allData.newsData);

      if (allData.recordsData) {
        const sortedRecords = allData.recordsData.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
        setLatestRecords(sortedRecords);
      }

      if (allData.eventsData) {
        setUpcomingEvents(allData.eventsData);
      }
    };

    const fetchLandingData = async () => {
      const cachedData = localStorage.getItem(LANDING_CACHE_KEY);
      const cachedTime = localStorage.getItem(LANDING_CACHE_TIME_KEY);
      const now = Date.now();

      if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
        const parsed = JSON.parse(cachedData);
        processLandingData(parsed);
        return;
      }

      try {
        const newsSnap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(6)));
        const recordsSnap = await getDocs(query(collection(db, "records"), orderBy("createdAt", "desc")));
        const eventsSnap = await getDocs(query(collection(db, "events"), orderBy("fromDate", "asc")));

        const freshBundle = {
          newsData: newsSnap.docs.map(doc => doc.data()),
          recordsData: recordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          eventsData: eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        };

        localStorage.setItem(LANDING_CACHE_KEY, JSON.stringify(freshBundle));
        localStorage.setItem(LANDING_CACHE_TIME_KEY, now.toString());
        processLandingData(freshBundle);
      } catch (err) {
        console.error("❌ Fetch error:", err);
      }
    };

    fetchLandingData();
  }, []);

  // 🎯 कडक बदल: डेटा थेट आपल्या प्रिमियम कस्टम पॉपअप स्टेटकडे पाठवणे
  const openDetailPopup = (title, team, year, info, imgUrl, link, type) => {
    setSelectedPopupData({ title, team, year, info, imgUrl, link, type });
  };

  // 🎯 कडक नेव्हिगेशन पॅच: लॉगिन असलेल्या आणि नसलेल्या सर्वांना कट्ट्यात थेट प्रवेश देणे 🚀
  const handleSmartNavigation = (targetTab) => {
    if (typeof handleExploreAsGuest === 'function') {
      handleExploreAsGuest(targetTab);
    }
  };

  const content = {
    mr: {
      title: "महाराष्ट्राचा गोविंदा", subtitle: "प्रत्येक गोविंदासाठी 🚩",
      mainHeading: "महाराष्ट्राचा गोविंदा - दहीहंडी प्रेमींचं सर्वात आवडतं डिजिटल माध्यम",
      aboutDesc: "लहान-मोठ्या सर्व गोविंदापथकांचे कौशल्य आणि ऐतिहासिक रेकॉर्ड्स जगासमोर आणणारे हक्काचे व्यासपीठ.",
      exploreBtn: "डिजिटल गोविंदा कट्टा प्रवेश 🚩", adminCorner: "लॉगिन 🔐",
      statsHeading: "📊 उत्सव संक्षिप्त आकडेवारी", 
      recordsHeading: "🏆 ऐतिहासिक रेकॉर्ड्स गॅलरी (Year-wise)",
      eventsHeading: "🎯 आयोजित स्पर्धा व आगामी सराव शिबिरे",
      newsHeading: "📢 चालू घडामोडी / सूचना",
      fbFollowers: "1.4L+", instaFollowers: "22K+", waChannel: "WhatsApp कट्टा"
    },
    en: {
      title: "Maharashtracha Govinda", subtitle: "For Every Govinda 🚩",
      mainHeading: "The Ultimate Destination for DahiHandi Lovers",
      aboutDesc: "Showcasing the incredible human pyramid records of all Govinda Pathaks globally.",
      exploreBtn: "Enter Govinda Katta 🚩", adminCorner: "Login 🔐",
      statsHeading: "📊 Festival Brief Analytics", 
      recordsHeading: "🏆 Historic Records Gallery (Year-wise)",
      eventsHeading: "🎯 Competitions & Practice Camps",
      newsHeading: "📢 Live Updates & News",
      fbFollowers: "1.4L+", instaFollowers: "22K+", waChannel: "WhatsApp Katta"
    }
  };

  const c = content[lang];

  return (
    <div className="min-h-screen bg-[#03060f] text-slate-100 font-sans flex flex-col justify-between selection:bg-orange-600 overflow-x-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-orange-600/5 via-transparent to-transparent pointer-events-none"></div>

      {/* 1️⃣ हेडर विभाग */}
      <header className="w-full border-b border-slate-900 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50 px-4 md:px-8 py-3.5 flex justify-between items-center">
        <div className="flex items-center space-x-3 min-w-0">
          <img src={logoIcon} alt="Logo" className="w-8 h-8 object-contain rounded-xl shadow-md" />
          <div className="text-left">
            <h1 className="text-base md:text-lg font-black bg-gradient-to-r from-white to-orange-500 bg-clip-text text-transparent tracking-wide whitespace-nowrap">
              {c.title}
            </h1>
            <span className="text-[9px] font-bold text-orange-500 tracking-wider block">{c.subtitle}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[10px] font-bold">
            <button onClick={() => setLang('mr')} className={`px-2.5 py-1 rounded-lg transition-all ${lang === 'mr' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>मराठी</button>
            <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-lg transition-all ${lang === 'en' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>EN</button>
          </div>
          {/* 🎯 कडक चेंज: युझर आधीपासून लॉगिन असेल तर लँडिंग पेजवर लॉगिन बटण ऐवजी डॅशबोर्ड मेसेज दिसेल */}
          {localStorage.getItem('govinda_user') ? (
            <button onClick={() => handleSmartNavigation('directory')} className="text-orange-500 hover:text-orange-400 text-xs font-black transition-all border border-orange-500/20 bg-orange-500/5 px-3 py-1.5 rounded-xl flex items-center space-x-1 animate-pulse">
              <span>माझा कट्टा 🚩</span>
            </button>
          ) : (
            <button onClick={handleLogin} className="text-slate-300 hover:text-white text-xs font-black transition-all border border-slate-800 bg-slate-900/40 px-3 py-1.5 rounded-xl flex items-center space-x-1">
              <span>{c.adminCorner}</span>
            </button>
          )}
        </div>
      </header>

      {/* 🚨 टॉप न्यूज टिकर */}
      <div className="w-full bg-orange-600/10 border-b border-orange-500/10 py-2 overflow-hidden z-10 text-xs font-black text-orange-400">
        <div className="whitespace-nowrap animate-marquee flex space-x-16">
          {latestNews.map((n, i) => (
            <span key={i} className="inline-block">🚩 {n.text_mr || n.text_en}</span>
          ))}
        </div>
      </div>

      {/* 2️⃣ कॉम्पॅक्ट मुख्य हिरो विभाग */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-5 pb-4 z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center border-b border-slate-900/60">
        <div className="lg:col-span-5 space-y-3.5 text-left">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-white">{c.mainHeading}</h2>
            <p className="text-slate-400 text-xs font-medium">{c.aboutDesc}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* 🎯 फिक्स: लॉगिन असलेल्या युझरला देखील हे बटण थेट कट्ट्यामध्ये घेऊन जाईल */}
            <button 
              onClick={() => handleSmartNavigation('directory')} 
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs py-3.5 px-6 rounded-xl shadow-lg transition-all transform active:scale-[0.98]"
            >
              {c.exploreBtn}
            </button>
            
       
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-900/60 p-3.5 rounded-2xl backdrop-blur-sm grid grid-cols-4 gap-2">
          <div className="bg-slate-900/40 p-2 border border-slate-900 rounded-xl text-center"><p className="text-[8px] font-bold text-slate-500 uppercase">एकूण संघ</p><p className="text-base font-black text-white mt-0.5">{stats.totalTeams}</p></div>
          <div className="bg-slate-900/40 p-2 border border-slate-900 rounded-xl text-center"><p className="text-[8px] font-bold text-slate-500 uppercase">पुरुष पथक</p><p className="text-base font-black text-orange-400 mt-0.5">{stats.menTeams}</p></div>
          <div className="bg-slate-900/40 p-2 border border-slate-900 rounded-xl text-center"><p className="text-[8px] font-bold text-slate-500 uppercase">महिला पथक</p><p className="text-base font-black text-pink-400 mt-0.5">{stats.womenTeams}</p></div>
          <div className="bg-slate-900/40 p-2 border border-slate-900 rounded-xl text-center"><p className="text-[8px] font-bold text-slate-500 uppercase">जिल्हे</p><p className="text-base font-black text-amber-400 mt-0.5">{stats.districts}</p></div>
        </div>
      </section>

      {/* 3️⃣ मुख्य डेटा मांडणी लेआउट */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-4 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-5 items-start z-10">
        
        {/* 📢 चालू घडामोडी / सूचना बॉक्स */}
        <div className="col-span-1 lg:col-span-3 space-y-3">
          <div className="border border-slate-900 bg-slate-950/50 p-4 rounded-2xl text-left h-auto lg:h-[610px] overflow-y-auto scrollbar-none">
            <h3 className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Megaphone size={13} /> {c.newsHeading}
            </h3>
            <div className="space-y-2">
              {latestNews.map((n, i) => (
                <div key={i} className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl text-[11px] text-slate-300 font-bold leading-normal">
                  {n.text_mr || n.text_en}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* उजवा मुख्य विभाग */}
        <div className="col-span-1 lg:col-span-9 space-y-8">
          
          {/* 🏆 ४. ऐतिहासिक रेकॉर्ड्स (Vertical Cards Gallery) */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                <Trophy size={15} className="text-orange-500" /> {c.recordsHeading}
              </h2>
              {/* 🎯 फिक्स: लॉगिन युझर 'सर्व पहा' वरून थेट ऐतिहासिक रेकॉर्ड्स टॅबमध्ये जाईल */}
              <button onClick={() => handleSmartNavigation('public_records')} className="text-[11px] font-black text-orange-500 hover:underline">सर्व पहा ➡️</button>
            </div>

            <div ref={recordsRef} className="w-full flex space-x-4 overflow-x-auto pb-3 scrollbar-none snap-x">
              {latestRecords.map((rec, i) => (
                <div 
                  key={i}
                  onClick={() => openDetailPopup(rec.title_mr, rec.team_mr, rec.year, rec.description_mr, rec.photoUrl, rec.postLink, rec.type)}
                  className="w-[190px] md:w-[210px] flex-shrink-0 snap-start bg-slate-950 border border-slate-900 p-2.5 rounded-2xl shadow-xl hover:border-slate-800 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden relative bg-slate-900">
                    <img src={rec.photoUrl || 'https://images.unsplash.com/photo-1620619730591-1ca2f7902047?q=80&w=600&auto=format&fit=crop'} alt="Record Profile" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                    <span className="absolute bottom-2 left-2 text-[8px] font-black bg-slate-950/90 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">{rec.year}</span>
                    <span className={`absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded ${rec.type === 'women' ? 'bg-pink-600 text-white' : 'bg-orange-600 text-white'}`}>{rec.type === 'women' ? 'महिला' : 'पुरुष'}</span>
                  </div>
                  
                  <div className="mt-2.5 text-left space-y-1">
                    <h4 className="text-xs md:text-sm font-black text-slate-100 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">{rec.title_mr}</h4>
                    <p className="text-[10px] font-bold text-slate-400 truncate">🚩 {rec.team_mr}</p>
                    <p className="text-[9px] text-orange-400 font-black pt-1"><span>तपशील पहा 🔗</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

{/* 🎯 ५. आयोजित स्पर्धा व आगामी सराव शिबिरे (अचूक डिफॉल्ट इमेज इंजिनसह 🚀) */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                <Calendar size={15} className="text-orange-500" /> {c.eventsHeading}
              </h2>
              <button onClick={() => handleSmartNavigation('public_events')} className="text-[11px] font-black text-orange-500 hover:underline">सर्व पहा ➡️</button>
            </div>

            <div ref={eventsRef} className="w-full flex space-x-4 overflow-x-auto pb-3 scrollbar-none snap-x">
              {upcomingEvents.length > 0 ? upcomingEvents.map((evt) => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isToday = evt.fromDate <= todayStr && evt.toDate >= todayStr;
                
                // 🎯 फिक्स: पब्लिक इव्हेंट्स कॉम्पोनंटसारखेच अचूक डिफॉल्ट इमेजेसचे मॅपिंग लावणे
                const posterImg = getEventPoster(evt);

                return (
                  <div 
                    key={evt.id}
                    onClick={() => openDetailPopup(evt.title_mr, evt.mandalName, '2026', evt.description_mr, posterImg, evt.postLink, 'event')}
                    className={`w-[260px] md:w-[280px] flex-shrink-0 snap-start bg-slate-950 border rounded-2xl p-3 shadow-xl hover:border-slate-800 transition-all cursor-pointer group flex flex-col justify-between ${
                      isToday ? 'border-orange-500/40' : 'border-slate-900'
                    }`}
                  >
                    <div className="w-full aspect-[16/10] rounded-xl overflow-hidden relative bg-slate-900">
                      <img src={posterImg} alt="Event Cover" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                      <span className={`absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-md ${isToday ? 'bg-orange-600 text-white animate-pulse' : 'bg-slate-900/90 text-slate-400'}`}>
                        {isToday ? 'आज थेट' : 'शीबीर'}
                      </span>
                    </div>

                    <div className="mt-2.5 text-left space-y-1 flex-grow">
                      <h4 className="text-xs font-black text-white truncate">{evt.mandalName || 'आयोजक मंडळ'}</h4>
                      <p className="text-xs font-bold text-slate-300 line-clamp-1 leading-tight">{evt.title_mr}</p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-900/60 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                      <div className="flex items-center gap-0.5">
                        <Clock size={11} />
                        <span>{evt.fromDate} ते {evt.toDate}</span>
                      </div>
                      <span className="text-orange-400 font-black">पहा 🔗</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="w-full py-10 text-center border border-dashed border-slate-900 rounded-2xl bg-slate-950/20">
                  <p className="text-xs text-slate-500 italic">सध्या कोणतेही सराव शिबीर शेड्यूल नाही भाऊ.</p>
                </div>
              )}
            </div>
          </div>

 
          

        </div>
      </main>


      {/* 🎯 ६. प्रिमियम स्मार्टफोन-स्टाईल मॅजिकल पॉपअप */}
      {selectedPopupData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 w-full max-w-[370px] aspect-[9/16] rounded-[32px] overflow-hidden shadow-2xl flex flex-col justify-between relative border border-slate-200/80 animate-in zoom-in-95 duration-200">
            
            {/* 📸 इमेज विभाग */}
            <div className="w-full h-[62%] relative bg-slate-950 overflow-hidden flex items-center justify-center">
              <img 
                src={selectedPopupData.imgUrl || 'https://images.unsplash.com/photo-1620619730591-1ca2f7902047?q=80&w=600&auto=format&fit=crop'} 
                alt="Blur Background" 
                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
              />
              <img 
                src={selectedPopupData.imgUrl || 'https://images.unsplash.com/photo-1620619730591-1ca2f7902047?q=80&w=600&auto=format&fit=crop'} 
                alt="Popup Record Image" 
                className="w-full h-full object-contain relative z-10" 
              />
              <button 
                onClick={() => setSelectedPopupData(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-90 z-20"
              >
                <X size={16} strokeWidth={3} />
              </button>
              <div className="absolute bottom-4 left-4 bg-[#ff6600] text-white text-[11px] font-black px-4 py-1.5 rounded-full flex items-center space-x-1 shadow-lg shadow-orange-600/30 z-20">
                <span>🏆 उत्सव वर्ष {selectedPopupData.year}</span>
              </div>
            </div>

            {/* 📝 माहिती विभाग */}
            <div className="p-5 flex-shrink-0 h-[38%] flex flex-col justify-between text-left bg-gradient-to-b from-white to-slate-50 relative z-20">
              <div className="space-y-2 min-w-0">
                <div className="inline-block bg-orange-50 border border-orange-100 text-[#ff6600] text-[10px] font-black px-2.5 py-0.5 rounded-lg">
                  🔸 {selectedPopupData.type === 'women' ? 'अधिकृत महिला गोविंदा' : (selectedPopupData.type === 'event' ? 'सराव शिबीर / स्पर्धा' : 'अधिकृत पुरुष गोविंदा')}
                </div>
                <h3 className="text-sm md:text-base font-extrabold text-slate-900 leading-snug tracking-tight line-clamp-2">
                  {selectedPopupData.title}
                </h3>
                <div className="w-full py-2 px-3 bg-orange-500/5 border border-orange-500/10 rounded-xl text-left">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    {selectedPopupData.type === 'event' ? 'आयोजक' : 'गोविंदा पथक'}
                  </span>
                  <p className="text-sm md:text-base font-black text-orange-600 truncate mt-0.5">
                    🚩 {selectedPopupData.team}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                {selectedPopupData.info ? (
                  <p className="text-[11px] text-slate-500 font-bold leading-normal line-clamp-2 truncate-2-lines">
                    ℹ️ {selectedPopupData.info}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-bold italic">
                    ✨ अधिकृत डिजिटल रेकॉर्ड नोंदणीकृत.
                  </p>
                )}
                
                {selectedPopupData.link && (
                  <a 
                    href={selectedPopupData.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full bg-[#ff6600] hover:bg-orange-600 text-white text-xs font-black py-2.5 rounded-xl text-center flex items-center justify-center space-x-1 shadow-md shadow-orange-500/20 transition-all transform active:scale-[0.99] mt-1"
                  >
                    <span>मूळ पोस्ट / व्हिडिओ पहा 🔗</span>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
      
<AdSenseBanner />
      {/* ५. फुटर */}
{/* 5️⃣ ३ लोकांच्या व्हॉट्सॲप सपोर्टसह प्रिमियम फुटर विभाग */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 md:px-8 py-8 z-10 font-sans mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6">
          
          {/* डावा भाग: इनिशिएटिव्ह आणि डेव्हलपर क्रेडिट्स */}
        {/* डावा भाग: क्रेडिट्स आणि त्याच्या खाली सुंदर व्हर्जन टॅग */}
    <div className="text-center md:text-left space-y-1.5 w-full md:w-auto">
      <p className="text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-slate-400 to-slate-600 bg-clip-text text-transparent">
        An Initiative by <span className="text-orange-500 font-bold">Sandesh Mahadik</span>
      </p>
      <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-medium font-mono text-slate-500">
        <span>© 2026 Developed by MG Team</span>
        <span className="text-slate-800">•</span>
        <span className="text-slate-400 font-bold font-mono text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
          v{APP_VERSION}
        </span>
      </div>
    </div>

          {/* मधला भाग: १.४ लाखांच्या दहीहंडी कम्युनिटीसाठी प्रिमियम सोशल मीडिया ग्रिड */}
          <div className="flex items-center justify-center bg-slate-900/40 border border-slate-900 rounded-2xl p-1 text-[11px] font-black gap-1 shadow-inner mx-auto md:mx-0">
            <a href="https://www.facebook.com/maharashtrachagovinda" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-all flex items-center space-x-1">
              <span>FB {c.fbFollowers}</span>
            </a>
            <a href="https://www.instagram.com/maharashtrachagovinda" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl text-pink-400 hover:bg-pink-500/10 transition-all flex items-center space-x-1">
              <span>Insta {c.instaFollowers}</span>
            </a>
            <a href="https://www.youtube.com/@maharashtrachagovinda" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><polygon points="10 15 15 12 10 9 10 15" fill="currentColor" /></svg>
              <span className="ml-1">YT</span>
            </a>
            <a href="https://whatsapp.com/channel/0029Vaq9KmD4yltLIfDV7Q3R" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-all font-black">
              <span>{c.waChannel}</span>
            </a>
          </div>

          {/* उजवा भाग: पॉलिसी लिंक्स आणि ३ लोकांचा कडक व्हॉट्सॲप सपोर्ट */}
          <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
            {/* वरची ओळ: पॉलिसी लिंक्स */}
            <div className="flex flex-wrap justify-center gap-x-3 text-[11px] font-bold text-slate-400">
              <button onClick={() => setCurrentPublicPage('about')} className="hover:text-orange-500 transition-colors">ℹ️ आमच्याबद्दल</button>
              <span className="text-slate-800">|</span>
              <button onClick={() => setCurrentPublicPage('faq')} className="hover:text-orange-500 transition-colors">❓ FAQ & नियमावली</button>
              <span className="text-slate-800">|</span>
              <button onClick={() => setCurrentPublicPage('privacy')} className="hover:text-orange-500 transition-colors">🔒 Privacy</button>
            </div>

            {/* खालची ओळ: 🎯 ३ लोकांचा व्हॉट्सॲप सपोर्ट ग्रिड (इथे तुझे मोबाईल नंबर टाक भाऊ) */}
            <div className="text-[10px] text-slate-500 font-bold flex flex-wrap justify-center items-center gap-x-2 gap-y-1 bg-slate-900/20 px-3 py-1.5 rounded-xl border border-slate-900/60">
              <span className="text-slate-400">🛠️ मदत कट्टा:</span>
              
              {/* मेंबर १ */}
              <a href="https://wa.me/919819000880?text=Hello%20Govinda%20Support" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-emerald-400 flex items-center gap-0.5 transition-colors">
                <span>Sandesh</span>
                <span className="text-[9px] text-emerald-500 font-extrabold">💬</span>
              </a>
              <span className="text-slate-800">•</span>

              {/* मेंबर २ */}
              <a href="https://wa.me/918779400932?text=Hello%20Govinda%20Support" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-emerald-400 flex items-center gap-0.5 transition-colors">
                <span>Pranay</span>
                <span className="text-[9px] text-emerald-500 font-extrabold">💬</span>
              </a>
              <span className="text-slate-800">•</span>

              {/* मेंबर ३ */}
              <a href="https://wa.me/918286810808?text=Hello%20Govinda%20Support" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-emerald-400 flex items-center gap-0.5 transition-colors">
                <span>Aashish</span>
                <span className="text-[9px] text-emerald-500 font-extrabold">💬</span>
              </a>
            </div>
          </div>

        </div>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 32s linear infinite; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}