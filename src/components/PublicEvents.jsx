import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Loader2, Flame, Award, ShieldAlert, Sparkles, X, Navigation, MapPin, Search, Filter, Calendar as CalendarIcon } from 'lucide-react';

const CACHE_KEY = 'govinda_events_cache';
const CACHE_TIME_KEY = 'govinda_events_cache_time';
const CACHE_DURATION = 15 * 60 * 1000; // १५ मिनिटे कॅश

const DEFAULT_IMAGES = {
  practice_start: "https://i.ibb.co/ns8bcPJD/Start-PRactice.jpg", 
  practice_session: "https://i.ibb.co/B5jhSXfN/Sarav-Shibit-events.jpg", 
  dahihandi_venue: "https://i.ibb.co/6Jf3Dd9v/dahihandi-events.jpg",  
  competition: "https://img.magnific.com/free-photo/colombian-national-soccer-team-concept-still-life_23-2150257157.jpg?semt=ais_hybrid&w=740&q=80" 
};

const toMarathiNumber = (num) => {
  if (num === null || num === undefined) return '';
  const marathiDigits = {
    '1': '१', '2': '२', '3': '३', '4': '४', '5': '५',
    '6': '६', '7': '७', '8': '८', '9': '९', '0': '०'
  };
  return num.toString().split('').map(digit => marathiDigits[digit] || digit).join('');
};

export default function PublicEvents(lang) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [userLoc, setUserLoc] = useState(null); 

  // 🔍 फिल्टर्स स्टेट्स
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState(''); 
  const [sortByNearest, setSortByNearest] = useState(false);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1); 
  };

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          localStorage.setItem('user_current_location', JSON.stringify(locData));
          setUserLoc(locData);
        },
        () => { console.log("⚠️ GPS परमिशन नाकारली."); },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      window.currentWatchId = watchId;
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('user_current_location');
    if (savedLoc) {
      try { setUserLoc(JSON.parse(savedLoc)); } catch (e) { console.log(e); }
    }
    if (navigator.geolocation && savedLoc) { requestUserLocation(); }

    const fetchEvents = async () => {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const now = Date.now();

      if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
        setEvents(JSON.parse(cachedData));
        setLoading(false);
        setTimeout(async () => {
          try {
            const snap = await getDocs(query(collection(db, "events"), orderBy("fromDate", "asc")));
            const freshEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (JSON.stringify(freshEvents) !== cachedData) {
              localStorage.setItem(CACHE_KEY, JSON.stringify(freshEvents));
              localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
              setEvents(freshEvents);
            }
          } catch (e) { console.log(e); }
        }, 1000);
        return;
      }

      try {
        const snap = await getDocs(query(collection(db, "events"), orderBy("fromDate", "asc")));
        const fetchedEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedEvents));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
        setEvents(fetchedEvents);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    
    fetchEvents();

    return () => {
      if (window.currentWatchId) { navigator.geolocation.clearWatch(window.currentWatchId); }
    };
  }, []);

  const getProcessedEvents = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    let result = events.map(e => {
      const dist = (e.lat && e.lng && userLoc?.lat && userLoc?.lng) 
        ? calculateDistance(userLoc.lat, userLoc.lng, e.lat, e.lng) 
        : null;
      return { ...e, distanceKm: dist };
    });

    // १. जुने/संपलेले कार्यक्रम लपवणे
    result = result.filter(e => !e.toDate || e.toDate >= todayStr);

    // २. सर्च फिल्टर
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e => e.title_mr?.toLowerCase().includes(q) || e.mandalName?.toLowerCase().includes(q));
    }

    // ३. कॅटेगरी फिल्टर
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.type === selectedCategory);
    }

    // ४. तारीख फिल्टर
    if (selectedDateFilter) {
      result = result.filter(e => e.fromDate <= selectedDateFilter && e.toDate >= selectedDateFilter);
    }

    // 🎯 ५. क्रोनोलॉजिकल सॉर्टिंग ऑर्डर (महिना निहाय: जुलै -> ऑगस्ट -> सप्टेंबर) 🚀
    result.sort((a, b) => {
      if (sortByNearest && userLoc) {
        if (!a.distanceKm) return 1;
        if (!b.distanceKm) return -1;
        return parseFloat(a.distanceKm) - parseFloat(b.distanceKm);
      }
      return new Date(a.fromDate) - new Date(b.fromDate);
    });

    return result;
  };

  const processedEvents = getProcessedEvents();

  const categoryBadges = {
    dahihandi_venue: { label: '🏰 उत्सव ठिकाण', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    competition: { label: '🏆 स्पर्धा / सामने', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    practice_session: { label: '🎯 सराव शिबीर', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    practice_start: { label: '🚀 सराव प्रारंभ', bg: 'bg-slate-500/20 text-slate-400 border-slate-700' }
  };

  const formatEventDate = (dateStr) => {
    if (!dateStr) return { day: '--', month: '---' };
    const date = new Date(dateStr);
    const dayRaw = date.getDate().toString().padStart(2, '0');
    const day = toMarathiNumber(dayRaw); 
    
    const months = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
    const month = months[date.getMonth()];
    return { day, month };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-bold text-xs bg-transparent min-h-[40vh]">
        <Loader2 className="animate-spin text-orange-500 mr-2" size={16} /> <span>इव्हेंट लोड होत आहेत...</span>
      </div>
    );
  }

return (
    <div className="w-full space-y-4 text-left animate-in fade-in duration-150 pb-24 text-white">
      
      {/* 🖥️ BRANDED COMPACT HEADER & SEARCH BAR SYSTEM (FIXED 🚀) */}
      <div className="space-y-4 bg-[#0d1527] p-4 rounded-3xl border border-slate-800 backdrop-blur-md sticky top-0 z-30 shadow-2xl">
        
        {/* 👑 सुबक डार्क थीम हेडर टायटल */}
        <div className="flex flex-col text-left border-b border-slate-800 pb-2.5">
          <h2 className="text-base md:text-xl font-black text-slate-100 uppercase tracking-wide">
            {lang === 'en' ? 'Events & Practice Katta' : 'उत्सव व सराव कट्टा'}
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-0.5 leading-none">
            {lang === 'en' ? 'Upcoming festivals, practice schedules, and events' : 'येणारे आगामी उत्सव, सराव सत्रांचे वेळापत्रक आणि कार्यक्रम.'}
          </p>
        </div>

        {/* सर्च आणि तारीख फिल्टर ग्रिड */}
        <div className="grid grid-cols-3 gap-2">
          <div className="relative col-span-2">
            <Search className="absolute top-2.5 left-3 text-slate-500" size={15} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? "Search events or mandals..." : "इव्हेंट किंवा मंडळ शोधून पहा..."}
              className="w-full bg-[#03060f] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-orange-500 text-slate-200 font-semibold shadow-inner"
            />
          </div>
          
          {/* कॅलेंडर तारीख फिल्टर */}
          <div className="relative flex items-center bg-[#03060f] border border-slate-800 rounded-xl px-2 shadow-inner focus-within:border-orange-500">
            <CalendarIcon size={14} className="text-slate-500 mr-1 flex-shrink-0" />
            <input 
              type="date" 
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full bg-transparent text-[10px] font-bold text-slate-300 focus:outline-none cursor-pointer uppercase select-none"
            />
            {selectedDateFilter && (
              <button onClick={() => setSelectedDateFilter('')} className="text-slate-500 hover:text-white ml-0.5"><X size={12} /></button>
            )}
          </div>
        </div>

        {/* क्विक टॅब्स */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button 
            onClick={() => setSelectedCategory('all')} 
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all border whitespace-nowrap ${selectedCategory === 'all' ? 'bg-orange-600 text-white border-orange-600' : 'bg-[#03060f] text-slate-400 border-slate-800'}`}
          >
            🚩 {lang === 'en' ? 'All Events' : 'सर्व कार्यक्रम'}
          </button>
          <button onClick={() => setSelectedCategory('practice_session')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all border whitespace-nowrap ${selectedCategory === 'practice_session' ? 'bg-orange-600 text-white border-orange-600' : 'bg-[#03060f] text-slate-400 border-slate-800'}`}>{lang === 'en' ? '🎯 Practice Camps' : '🎯 सराव शिबीर'}</button>
          <button onClick={() => setSelectedCategory('dahihandi_venue')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all border whitespace-nowrap ${selectedCategory === 'dahihandi_venue' ? 'bg-orange-600 text-white border-orange-600' : 'bg-[#03060f] text-slate-400 border-slate-800'}`}>{lang === 'en' ? '🏰 Venues' : '🏰 उत्सव ठिकाण'}</button>
          <button onClick={() => setSelectedCategory('competition')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all border whitespace-nowrap ${selectedCategory === 'competition' ? 'bg-orange-600 text-white border-orange-600' : 'bg-[#03060f] text-slate-400 border-slate-800'}`}>{lang === 'en' ? '🏆 Competitions' : '🏆 स्पर्धा / सामने'}</button>
          <button onClick={() => setSelectedCategory('practice_start')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all border whitespace-nowrap ${selectedCategory === 'practice_start' ? 'bg-orange-600 text-white border-orange-600' : 'bg-[#03060f] text-slate-400 border-slate-800'}`}>{lang === 'en' ? '🚀 Practice Start' : '🚀 सराव प्रारंभ'}</button>
        </div>

        {userLoc && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 px-0.5">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Filter size={11} className="text-orange-500" /> {lang === 'en' ? 'Sorting Options' : 'मांडणी पर्याय'}
            </span>
            <button 
              onClick={() => setSortByNearest(!sortByNearest)}
              className={`text-[9px] font-black px-2.5 py-1 rounded-lg border transition-all ${sortByNearest ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-md' : 'bg-[#03060f] text-slate-500 border-slate-800'}`}
            >
              📍 {lang === 'en' ? 'Show Nearest First' : 'माझ्या सर्वात जवळचे आधी दाखवा'}
            </button>
          </div>
        )}
      </div>

      {/* लोकेशन बॉक्स */}
      {!userLoc && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-left">
            <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">📍 {lang === 'en' ? 'Want to see nearby Dahi Handi / Practice Camps?' : 'तुमच्या जवळची दहीहंडी / सराव शिबीर पाहायचे आहे का?'}</h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{lang === 'en' ? 'Enabling location permission calculates exact distance in kilometers.' : 'लोकेशन परमिशन दिल्यास अचूक अंतर किलोमीटरमध्ये समजेल.'}</p>
          </div>
          <button onClick={requestUserLocation} className="flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] px-3 py-2 rounded-xl transition-all">🚩 {lang === 'en' ? 'Turn On Location' : 'लोकेशन ऑन करा'}</button>
        </div>
      )}

      {/* 📅 मुख्य यादी */}
      {processedEvents.length === 0 ? (
        <div className="bg-[#0d1527] rounded-2xl p-10 text-center text-slate-500 border border-dashed border-slate-800 text-xs font-bold">
          {lang === 'en' ? 'No events available or search criteria not matched.' : 'कार्यक्रम उपलब्ध नाही किंवा सर्च मॅच झाला नाही.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedEvents.map((e) => {
            const dateInfo = formatEventDate(e.fromDate);
            const finalImg = e.posterUrl || e.photoUrl || DEFAULT_IMAGES[e.type] || DEFAULT_IMAGES.practice_session;
            const badge = categoryBadges[e.type] || categoryBadges.practice_session;
            
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = e.fromDate <= todayStr && e.toDate >= todayStr;

            return (
              <div 
                key={e.id}
                onClick={() => setSelectedEvent(e)}
                className={`bg-[#03060f] border rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer hover:border-orange-500/40 hover:shadow-lg transition-all group ${
                  isToday ? 'border-orange-500/40 bg-gradient-to-r from-orange-500/5 to-transparent' : 'border-slate-800/90'
                }`}
              >
                {/* 📆 डाव्या बाजूचा मोठा मराठी डेट बॉक्स */}
                <div className="flex flex-col items-center justify-center bg-[#0d1527] border border-slate-800 rounded-xl w-[58px] h-[64px] flex-shrink-0 shadow-inner group-hover:border-orange-500/40 transition-all">
                  <span className="text-lg font-black text-orange-500 font-mono tracking-tighter leading-none">{dateInfo.day}</span>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-1">{dateInfo.month}</span>
                </div>

                {/* इमेज थंबनेल */}
                <div className="w-[65px] h-[54px] rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800 relative">
                  <img src={finalImg} alt={e.title_mr} className="w-full h-full object-cover" />
                  {isToday && <span className="absolute top-0.5 left-0.5 bg-orange-600 text-white font-black text-[6px] px-1 py-0.2 rounded animate-pulse">LIVE</span>}
                </div>

                {/* माहिती भाग */}
                <div className="flex-1 min-w-0 text-left space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.2 rounded border ${badge.bg}`}>
                      {lang === 'en' ? (e.type?.replace('_', ' ')) : badge.label}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-black text-slate-200 line-clamp-1 group-hover:text-white transition-all leading-tight">
                    {lang === 'en' ? (e.title_en || e.title_mr) : e.title_mr}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold truncate">🏰 {e.mandalName || (lang === 'en' ? 'Organizing Mandal' : 'आयोजक मंडळ')}</p>
                </div>

                {/* 📍 उजव्या बाजूचा मोठा डिस्टन्स बॉक्स */}
                {e.distanceKm && (
                  <div className="flex flex-col items-center justify-center bg-[#0d1527]/60 border border-orange-500/20 rounded-xl w-[54px] h-[54px] flex-shrink-0 shadow-inner group-hover:border-orange-500/40 transition-all ml-auto">
                    <span className="text-sm font-black text-orange-400 font-mono tracking-tighter leading-none">
                      {toMarathiNumber(e.distanceKm)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 tracking-wide mt-1">{lang === 'en' ? 'KM' : 'किमी'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* पॉपअप मोडल */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-100 flex flex-col justify-between max-h-[90vh] relative animate-in zoom-in-95 duration-150">
            <button onClick={() => setSelectedEvent(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all shadow-md"><X size={16} /></button>
            <div className="w-full aspect-[16/11] bg-slate-950 border-b border-slate-100 flex items-center justify-center">
              <img src={selectedEvent.posterUrl || selectedEvent.photoUrl || DEFAULT_IMAGES[selectedEvent.type] || DEFAULT_IMAGES.practice_session} alt={selectedEvent.title_mr} className="w-full h-full object-contain" />
            </div>
            <div className="p-5 text-left space-y-3 bg-gradient-to-b from-white to-slate-50 overflow-y-auto">
              <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-orange-550/10 text-orange-600 border-orange-100 uppercase">
                {categoryBadges[selectedEvent.type]?.label || selectedEvent.type}
              </span>
              <h3 className="text-sm md:text-base font-black text-slate-900 leading-snug">
                {lang === 'en' ? (selectedEvent.title_en || selectedEvent.title_mr) : selectedEvent.title_mr}
              </h3>
              <p className="text-xs font-bold text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200/60">{lang === 'en' ? '🏰 Organizer:' : '🏰 आयोजक:'} <span className="text-slate-900">{selectedEvent.mandalName || '—'}</span></p>
              
              {(() => {
                const modalDist = (selectedEvent.lat && selectedEvent.lng && userLoc?.lat && userLoc?.lng) 
                  ? calculateDistance(userLoc.lat, userLoc.lng, selectedEvent.lat, selectedEvent.lng) 
                  : null;
                return modalDist ? (
                  <p className="text-xs font-black text-orange-600 bg-orange-50 p-2.5 rounded-xl border border-orange-100 flex items-center">
                    {lang === 'en' ? (
                      <>📍 This location is approximately <b>{modalDist} km</b> away from you.</>
                    ) : (
                      <>📍 तुमच्या स्थानापासून हे ठिकाण साधारण <b>{toMarathiNumber(modalDist)} किमी</b> अंतरावर आहे.</>
                    )}
                  </p>
                ) : null;
              })()}

              <p className="text-[11px] text-slate-500 font-bold">⏱️ {lang === 'en' ? 'Duration:' : 'कालावधी:'} {lang === 'en' ? selectedEvent.fromDate : toMarathiNumber(selectedEvent.fromDate)} ते {lang === 'en' ? selectedEvent.toDate : toMarathiNumber(selectedEvent.toDate)}</p>
              
              <div className="space-y-2 pt-2 border-t border-slate-100 mt-3">
                {selectedEvent.mapLink ? (
                  <a href={selectedEvent.mapLink} target="_blank" rel="noreferrer" className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-black py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95">
                    <Navigation size={14} /> <span>{lang === 'en' ? 'Get Directions on Google Maps' : '🚩 थेट गुगल मॅपवर दिशा पहा'}</span>
                  </a>
                ) : (
                  selectedEvent.postLink && selectedEvent.postLink.toLowerCase().includes('maps') && (
                    <a href={selectedEvent.postLink} target="_blank" rel="noreferrer" className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-black py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95">
                      <Navigation size={14} /> <span>{lang === 'en' ? 'Get Directions on Google Maps' : '🚩 थेट गुगल मॅपवर दिशा पहा'}</span>
                    </a>
                  )
                )}
                
                {selectedEvent.postLink && !selectedEvent.postLink.toLowerCase().includes('maps') && (
                  (() => {
                    const isInstagram = selectedEvent.postLink.toLowerCase().includes('instagram.com');
                    return (
                      <a href={selectedEvent.postLink} target="_blank" rel="noreferrer" className={`w-full text-white text-xs font-black py-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-md active:scale-95 ${isInstagram ? 'bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045]' : 'bg-[#1877f2] hover:bg-[#166fe5]'}`}>
                        <span>{isInstagram ? (lang === 'en' ? '📸 Official Instagram...' : '📸 अधिकृत इन्स्टाग्राम... ') : (lang === 'en' ? '👥 Official Facebook...' : '👥 अधिकृत फेसबुक...')}</span>
                      </a>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}