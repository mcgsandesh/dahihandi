import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import logoIcon from '/icon-512.png';
import loginBgImg from '/login-bg.png';
import { Image, Calendar, Clock, Megaphone, Trophy } from 'lucide-react';

// ⏱️ लँडिंग पेज कॅश कॉन्फिगरेशन (१५ मिनिटे अवधी)
const LANDING_CACHE_KEY = 'govinda_landing_cache';
const LANDING_CACHE_TIME_KEY = 'govinda_landing_cache_time';
const CACHE_DURATION = 15 * 60 * 1000; 

export default function LandingPage({ handleLogin, handleExploreAsGuest, loading, error }) {
  // 🌐 भाषेचा स्टेट (मराठी / English)
  const [lang, setLang] = useState('mr');
  
  // 📊 फायरबेसमधून येणारा डायनॅमिक डेटा
  const [latestRecords, setLatestRecords] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]); 
  const [eventPosters, setEventPosters] = useState([]); 
  const [upcomingEvents, setUpcomingEvents] = useState([]); 

  // स्लायडर्सचे स्टेट्स
  const [currentGallerySlide, setCurrentGallerySlide] = useState(0);
  const [currentEventSlide, setCurrentEventSlide] = useState(0);
  const [hoveredPhoto, setHoveredPhoto] = useState(null); 
  
  const [stats] = useState({ totalTeams: 472, menTeams: 459, womenTeams: 13, districts: 28 });

  // 🔄 १. ऑटो-स्क्रोल टायमर्स
  useEffect(() => {
    if (galleryImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentGallerySlide((prev) => (prev + 1) % galleryImages.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [galleryImages.length]);

  useEffect(() => {
    if (eventPosters.length > 1) {
      const timer = setInterval(() => {
        setCurrentEventSlide((prev) => (prev + 1) % eventPosters.length);
      }, 4500);
      return () => clearInterval(timer);
    }
  }, [eventPosters.length]);

  // 🚀 २. डेटा ओढण्याचे आणि कॅश मॅनेज करण्याचे मुख्य लॉजिक (Reads Saver)
  useEffect(() => {
    const processLandingData = (allData) => {
      // अ) ताज्या बातम्या सेट करणे
      if (allData.newsData) setLatestNews(allData.newsData);

      // ब) रेकॉर्ड्स मॅनेजमेंट (२०२५ आणि २०२६ चे एकत्र करून टॉप ३ दाखवणे)
      if (allData.recordsData) {
        const rList = allData.recordsData;
        const filteredRecords = rList.filter(r => r.year === "2025" || r.year === "2026").slice(0, 3);
        setLatestRecords(filteredRecords);

        const gImages = rList.filter(r => r.showOnDashboard === true && r.photoUrl).map(r => r.photoUrl);
        if (gImages.length > 0) setGalleryImages(gImages);
      }

      // 🏰 क) सराव पोस्टर्स आणि आगामी इव्हेंट्स
      if (allData.eventsData) {
        const eList = allData.eventsData;
        const ePosters = eList
          .map(e => {
            if (e.posterUrl && e.posterUrl.trim() !== "") return e.posterUrl;
            if (e.postLink && (e.postLink.includes("http://") || e.postLink.includes("https://"))) return e.postLink;
            return null;
          })
          .filter(url => url !== null);
        setEventPosters(ePosters);

        // तारीखवार फिल्टर (पुढील ७ दिवस)
        const todayStr = new Date().toISOString().split('T')[0]; 
        const next7DaysStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const filteredEvents = eList.filter(e => e.toDate >= todayStr && e.fromDate <= next7DaysStr);
        setUpcomingEvents(filteredEvents);
      }
    };

    const fetchLandingData = async () => {
      const cachedData = localStorage.getItem(LANDING_CACHE_KEY);
      const cachedTime = localStorage.getItem(LANDING_CACHE_TIME_KEY);
      const now = Date.now();

      // 🧠 जर लोकल कॅश उपलब्ध असेल, तर तिथूनच डेटा लोड करून Reads वाचवा!
      if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
        console.log("⚡ [LandingPage] लोकल कॅशमधून डेटा लोड झाला! (Reads सेव्ह झाले 💸)");
        const parsed = JSON.parse(cachedData);
        processLandingData(parsed);

        // 🔄 बॅकग्राउंड सिंक: युझरला विना-लोडिंग फ्रेश डेटा देण्यासाठी समांतर सिंक चालवणे
        setTimeout(async () => {
          try {
            const newsSnap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3)));
            const recordsSnap = await getDocs(query(collection(db, "records"), orderBy("createdAt", "desc")));
            const eventsSnap = await getDocs(query(collection(db, "events"), orderBy("fromDate", "asc")));

            const freshBundle = {
              newsData: newsSnap.docs.map(doc => doc.data()),
              recordsData: recordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
              eventsData: eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            };

            if (JSON.stringify(freshBundle) !== cachedData) {
              console.log("🔄 [LandingPage Sync] नवीन डेटाबेसमधील बदल सापडले! कॅश अपडेट झाली.");
              localStorage.setItem(LANDING_CACHE_KEY, JSON.stringify(freshBundle));
              localStorage.setItem(LANDING_CACHE_TIME_KEY, Date.now().toString());
              processLandingData(freshBundle);
            }
          } catch (e) { console.log("बॅकग्राउंड सिंक एरर:", e); }
        }, 1200);

        return;
      }

      // 🛑 जर कॅश नसेल, तर पहिल्यांदा डेटाबेस मधून लोड करा
      console.log("🔄 [LandingPage] पहिली वेळ किंवा एक्सपायर्ड! डेटाबेस कॉल सुरू...");
      try {
        const newsSnap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3)));
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
        console.error("❌ [LANDING FETCH ERROR LOG]:", err);
      }
    };

    fetchLandingData();
  }, []);

  const content = {
    mr: {
      title: "महाराष्ट्राचा गोविंदा", subtitle: "प्रत्येक गोविंदासाठी 🚩",
      mainHeading: "दहीहंडी प्रेमींचं सर्वात आवडतं पेज",
      aboutDesc: "लहान-मोठ्या सर्व गोविंदापथकांचे कौशल्य संपूर्ण देशातील आणि विदेशातील लोकांपर्यंत पोहोचवण्याचे काम आम्ही निस्वार्थीपणे करत आहोत. महाराष्ट्रासह गुजरात राज्यातील आणि गावागावातील सर्व गोविंदांचे फोटो व व्हिडिओ पोहोचवणारे आम्ही पहिले अधिकृत डिजिटल माध्यम आहोत.",
      exploreBtn: "डिजिटल गोविंदा कट्टा पहा 🚩", adminCorner: "मंडळ लॉगिन 🔐",
      statsHeading: "📊 उत्सव संक्षिप्त आकडेवारी", recordsHeading: "🏆 ऐतिहासिक रेकॉर्ड्स (२०२५-२०२६)",
      newsHeading: "📢 ताज्या घडामोडी / सूचना", galleryTitle: "📸 Photo Gallery",
      eventsTitle: "🎯 सराव शिबिरे पोस्टर्स", upcomingTitle: "📅 आगामी इव्हेंट्स (पुढील ७ दिवस)",
      fbFollowers: "1.4L+ फॉलोअर्स", instaFollowers: "22K+ फॉलोअर्स",
      waChannel: "WhatsApp कट्टा 📲"
    },
    en: {
      title: "Maharashtracha Govinda", subtitle: "For Every Govinda 🚩",
      mainHeading: "The Ultimate Destination for DahiHandi Lovers",
      aboutDesc: "Selflessly showcasing the incredible human pyramid skills of all small and big Govinda Pathaks across the globe. We are the first dedicated portal bringing you live actions, videos, and information from every village of Maharashtra and Gujarat.",
      exploreBtn: "Explore Govinda Katta 🚩", adminCorner: "Admin Login 🔐",
      statsHeading: "📊 Festival Brief Analytics", recordsHeading: "🏆 Historic Records (2025-2026)",
      newsHeading: "📢 Latest News & Announcements", galleryTitle: "📸 Photo Gallery",
      eventsTitle: "🎯 Practice Camps Posters", upcomingTitle: "📅 Upcoming Events (Next 7 Days)",
      fbFollowers: "1.4L+ Followers", instaFollowers: "22K+ Followers",
      waChannel: "WhatsApp Katta 📲"
    }
  };

  const c = content[lang];

  return (
    <div className="min-h-screen bg-[#050811] text-white font-sans flex flex-col justify-between selection:bg-orange-600 overflow-x-hidden relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.05] pointer-events-none mix-blend-color-dodge" style={{ backgroundImage: `url(${loginBgImg})` }}></div>

      {/* 1️⃣ हेडर विभाग */}
      <header className="w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={logoIcon} alt="Logo" className="w-9 h-9 object-contain rounded-xl" />
          <div className="text-left">
            <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-white via-slate-100 to-orange-500 bg-clip-text text-transparent leading-none">{c.title}</h1>
            <span className="text-[10px] font-bold text-orange-500 tracking-wider mt-1 block">{c.subtitle}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 text-[10px] font-bold z-10">
            <button onClick={() => setLang('mr')} className={`px-2.5 py-0.5 rounded-lg transition-all ${lang === 'mr' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>मराठी</button>
            <button onClick={() => setLang('en')} className={`px-2.5 py-0.5 rounded-lg transition-all ${lang === 'en' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>EN</button>
          </div>
          <button onClick={handleLogin} className="text-slate-400 hover:text-orange-500 text-[11px] font-black transition-all border border-slate-800 bg-slate-900/50 px-3 py-1.5 rounded-xl">{c.adminCorner}</button>
        </div>
      </header>

      {/* 🚨 न्यूज टिकर */}
      <div className="w-full bg-orange-600/10 border-b border-orange-500/10 py-1.5 overflow-hidden z-10 text-[11px] font-bold text-orange-400">
        <div className="whitespace-nowrap animate-marquee flex space-x-10">
          {latestNews.map((n, i) => <span key={i}>🚩 {n.text_mr}</span>)}
        </div>
      </div>

      {/* 2️⃣ मुख्य ३-कॉलम लेआउट */}
      <main className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10">
        
        {/* 🔥 डावा कॉलम */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">{c.mainHeading}</h2>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">{c.aboutDesc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleExploreAsGuest} className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs md:text-sm py-3.5 px-6 rounded-xl shadow-lg transition-all transform active:scale-[0.98]">{c.exploreBtn}</button>
            <div className="flex bg-slate-950/80 border border-slate-900 rounded-xl p-1 text-[11px] font-bold space-x-1">
              <a href="https://www.facebook.com/maharashtrachagovinda" target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-md bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20">FB {c.fbFollowers}</a>
              <a href="https://www.instagram.com/maharashtrachagovinda" target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-md bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20">Insta {c.instaFollowers}</a>
              <a href="https://www.youtube.com/@maharashtrachagovinda" target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-md bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/20">YouTube</a>
              <a href="https://whatsapp.com/channel/0029Vaq9KmD4yltLIfDV7Q3R" target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-md bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 font-black">{c.waChannel}</a>
            </div>
          </div>

          {/* आकडेवारी */}
          <div className="space-y-3 border border-slate-900 bg-slate-950/40 p-5 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">{c.statsHeading}</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-900/40 p-2.5 border border-slate-800/60 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">एकूण</p><p className="text-sm font-black mt-0.5">{stats.totalTeams}</p></div>
              <div className="bg-slate-900/40 p-2.5 border border-slate-800/60 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">पुरुष</p><p className="text-sm font-black text-orange-400 mt-0.5">{stats.menTeams}</p></div>
              <div className="bg-slate-900/40 p-2.5 border border-slate-800/60 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">महिला</p><p className="text-sm font-black text-pink-400 mt-0.5">{stats.womenTeams}</p></div>
              <div className="bg-slate-900/40 p-2.5 border border-slate-800/60 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-500 uppercase">जिल्हे</p><p className="text-sm font-black text-amber-400 mt-0.5">{stats.districts}</p></div>
            </div>
          </div>

          {/* 🏆 ऐतिहासिक रेकॉर्ड्स (वर्ष २०२५ आणि २०२६ समाविष्ट) */}
          <div className="space-y-3 border border-slate-900 bg-slate-950/40 p-5 rounded-2xl relative">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">{c.recordsHeading}</h3>
            <div className="space-y-2">
              {latestRecords.map((rec, i) => (
                <div key={i} className="bg-slate-900/30 border border-slate-900 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2 text-left">
                      {rec.title_mr}
                      {rec.photoUrl && (
                        <button 
                          onMouseEnter={() => setHoveredPhoto(rec.photoUrl)}
                          onMouseLeave={() => setHoveredPhoto(null)}
                          onClick={() => setHoveredPhoto(hoveredPhoto === rec.photoUrl ? null : rec.photoUrl)}
                          className="text-orange-500 hover:text-orange-400 flex items-center space-x-0.5 font-black text-[10px] bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20"
                        >
                          <Image size={11} /> <span>इमेज पहा 🔗</span>
                        </button>
                      )}
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 text-left">🚩 {rec.team_mr} ({rec.year})</p>
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${rec.type === 'women' ? 'bg-pink-600/20 text-pink-400' : 'bg-orange-600/20 text-orange-400'}`}>{rec.type === 'women' ? 'महिला' : 'पुरुष'}</span>
                </div>
              ))}
            </div>

            {/* फ्लोटिंग इमेज पॉपअप */}
            {hoveredPhoto && (
              <div className="absolute top-0 right-4 z-50 w-48 aspect-[2/3] bg-slate-950 border-2 border-orange-500 p-1 rounded-xl shadow-2xl animate-in zoom-in-95 duration-100 pointer-events-none">
                <img src={hoveredPhoto} alt="Record Preview" className="w-full h-full object-cover rounded-lg" />
              </div>
            )}
          </div>

          {/* 📢 ताज्या घडामोडी */}
          <div className="space-y-3 border border-slate-900 bg-slate-950/40 p-5 rounded-2xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">{c.newsHeading}</h3>
            <div className="space-y-2.5">{latestNews.map((n, i) => <div key={i} className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl text-xs text-slate-300 text-left">{n.text_mr}</div>)}</div>
          </div>
        </div>

        {/* 📸 मधला कॉलम: Photo Gallery */}
        <div className="lg:col-span-3 space-y-4">
          <div className="border border-slate-900 bg-slate-950/40 p-4 rounded-3xl flex flex-col justify-between h-full">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider text-left mb-3">{c.galleryTitle}</h3>
            <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden border border-slate-900 shadow-2xl">
              {galleryImages.map((img, idx) => <img key={idx} src={img} alt="Gallery" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentGallerySlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} />)}
            </div>
            <div className="flex justify-center space-x-1 mt-3">
              {galleryImages.map((_, idx) => <button key={idx} className={`w-1 h-1 rounded-full ${idx === currentGallerySlide ? 'bg-orange-500 w-2' : 'bg-slate-700'}`}></button>)}
            </div>
          </div>
        </div>

        {/* 🎯 उजवा कॉलम: सराव पोस्टर्स + आगामी इव्हेंट्स */}
        <div className="lg:col-span-3 space-y-4 text-left">
          <div className="border border-slate-900 bg-slate-950/40 p-4 rounded-3xl flex flex-col justify-between h-full space-y-4">
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">{c.eventsTitle}</h3>
                <button onClick={() => alert("Events Menu वर नेव्हिगेट करा")} className="text-[10px] font-black text-orange-500 hover:underline">सर्व पहा ➡️</button>
              </div>
              
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-slate-900 shadow-2xl bg-slate-950 flex items-center justify-center group cursor-pointer">
                {eventPosters.length > 0 ? (
                  (() => {
                    const currentEvt = upcomingEvents[currentEventSlide] || {};
                    const targetLink = currentEvt?.postLink || "https://www.instagram.com/maharashtrachagovinda";
                    const currentImg = eventPosters[currentEventSlide] || "https://images.unsplash.com/photo-1620619730591-1ca2f7902047?q=80&w=600&auto=format&fit=crop";
                    
                    return (
                      <a href={targetLink} target="_blank" rel="noreferrer" className="w-full h-full block relative">
                        <img src={currentImg} alt="Event Poster" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-orange-600 text-white font-black text-[10px] px-3 py-1.5 rounded-xl shadow-lg">🚩 पेजवर मूळ पोस्ट पहा</span>
                        </div>
                      </a>
                    );
                  })()
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 text-center text-[11px] text-slate-500 italic">पोस्टर्स उपलब्ध नाहीत.</div>
                )}
              </div>
            </div>

            <div className="flex-grow flex flex-col relative">
              <h4 className="text-[11px] font-black text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar size={12} /> {c.upcomingTitle}
              </h4>
              
              <div className="space-y-2 max-h-[190px] overflow-y-auto scrollbar-none pr-1">
                {upcomingEvents.length > 0 ? upcomingEvents.map((evt) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = evt.fromDate <= todayStr && evt.toDate >= todayStr;
                  const socialTarget = evt.postLink || "https://www.instagram.com/maharashtrachagovinda";

                  return (
                    <div key={evt.id} className={`p-2 rounded-xl border text-[11px] flex flex-col justify-between relative ${isToday ? 'bg-orange-600/10 border-orange-500/30' : 'bg-slate-900/40 border-slate-900'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-200 truncate max-w-[120px]">{evt.mandalName || 'मंडळ'}</span>
                        <div className="flex items-center space-x-1.5">
                          <a href={socialTarget} target="_blank" rel="noreferrer" className="text-[9px] font-black text-white bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-0.5 rounded border border-pink-500/30 hover:scale-105 transition-transform">📸 पोस्ट पहा 🔗</a>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isToday ? 'bg-orange-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>{isToday ? 'आज' : 'आगामी'}</span>
                        </div>
                      </div>
                      <p className="text-slate-400 font-bold mt-1 truncate">{evt.title_mr}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">🗓️ {evt.fromDate} ते {evt.toDate}</p>
                    </div>
                  );
                }) : (
                  <p className="text-[11px] text-slate-500 italic p-3 text-center border border-dashed border-slate-900 rounded-xl">या आठवड्यात कोणतेही शिबीर शेड्यूल नाही.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* फुटर */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/40 px-4 md:px-8 py-4 z-10 text-center flex flex-col sm:flex-row sm:justify-between items-center text-[10px] text-slate-600 gap-2">
        <p className="font-bold uppercase tracking-wider">An Initiative by <span className="text-slate-400">Sandesh Mahadik</span></p>
        <p className="font-bold">Developed by Sandesh Mahadik</p>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 25s linear infinite; }
      `}</style>
    </div>
  );
}