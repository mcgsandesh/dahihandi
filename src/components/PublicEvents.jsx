import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Loader2, Flame, Award, ShieldAlert, Sparkles, X, Navigation, MapPin } from 'lucide-react';

const CACHE_KEY = 'govinda_events_cache';
const CACHE_TIME_KEY = 'govinda_events_cache_time';
const CACHE_DURATION = 15 * 60 * 1000; // १५ मिनिटे कॅश

// =========================================================================
// 🖼️ SECTION 1: कॅटेगरीनुसार कडक डिफॉल्ट इमेजेस (पोस्टर नसेल तर वापरण्यासाठी)
// =========================================================================
const DEFAULT_IMAGES = {
  practice_start: "https://images2.imgbox.com/f3/2f/AyBLvxeB_o.jpg", 
  practice_session: "https://images2.imgbox.com/66/fb/xe4zGrd6_o.jpg", 
  dahihandi_venue: "https://images2.imgbox.com/de/3a/9J1QYyQq_o.jpg",  
  competition: "https://img.magnific.com/free-photo/colombian-national-soccer-team-concept-still-life_23-2150257157.jpg?semt=ais_hybrid&w=740&q=80" 
};

export default function PublicEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null); // पॉपअप मोडल स्टेट
  const [userLoc, setUserLoc] = useState(null); // युझरचे लोकल लोकेशन स्टेट

  // =========================================================================
  // 🗺️ SECTION 2: क्लायंट-साइड अंतराचे गणित (Haversine Formula - Zero Firebase Bill)
  // =========================================================================
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // पृथ्वीची त्रिज्या किमी मध्ये
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1); // उदा. "१.२"
  };

  // =========================================================================
  // 📡 SECTION 3: युझरचे लाईव्ह लोकेशन मिळवणे आणि LocalStorage मध्ये सेव्ह करणे
  // =========================================================================
  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          localStorage.setItem('user_current_location', JSON.stringify(locData));
          setUserLoc(locData); // स्टेट अपडेट
          console.log("📍 युझरचे लोकेशन लोकल स्टोरेजमध्ये सेव्ह झाले:", locData);
        },
        (error) => {
          console.log("लोकेशन परमिशन नाकारली किंवा डिव्हाइस सपोर्ट करत नाही.");
        }
      );
    }
  };

  useEffect(() => {
    const savedLoc = localStorage.getItem('user_current_location');
    if (savedLoc) {
      try {
        setUserLoc(JSON.parse(savedLoc));
      } catch (e) { console.log("लोकेशन रिडिंग एरर:", e); }
    }

    const fetchEvents = async () => {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const now = Date.now();

      if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
        console.log("⚡ [PublicEvents] लोकल कॅश डेटा वापरला.");
        setEvents(JSON.parse(cachedData));
        setLoading(false);

        // 🚀 बॅकग्राउंड सिंक
        setTimeout(async () => {
          try {
            const snap = await getDocs(query(collection(db, "events"), orderBy("fromDate", "asc")));
            const freshEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (JSON.stringify(freshEvents) !== cachedData) {
              console.log("🔄 [PublicEvents Sync] नवीन डेटा सापडला!");
              localStorage.setItem(CACHE_KEY, JSON.stringify(freshEvents));
              localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
              setEvents(freshEvents);
            }
          } catch (e) { console.log("सिंक अडчण:", e); }
        }, 1000);
        return;
      }

      try {
        const snap = await getDocs(query(collection(db, "events"), orderBy("fromDate", "asc")));
        const fetchedEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedEvents));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
        setEvents(fetchedEvents);
      } catch (err) {
        console.error("❌ Error loading events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getCategorizedEvents = (typeKey) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let categoryData = events.filter(e => e.type === typeKey);

    if (userLoc?.lat && userLoc?.lng) {
      categoryData = categoryData.map(e => {
        const dist = (e.lat && e.lng) ? calculateDistance(userLoc.lat, userLoc.lng, e.lat, e.lng) : null;
        return { ...e, distanceKm: dist };
      }).sort((a, b) => {
        if (!a.distanceKm) return 1;
        if (!b.distanceKm) return -1;
        return parseFloat(a.distanceKm) - parseFloat(b.distanceKm);
      });
    } else {
      categoryData = categoryData.map(e => ({ ...e, distanceKm: null }));
    }

    return {
      today: categoryData.filter(e => e.fromDate <= todayStr && e.toDate >= todayStr),
      upcoming: categoryData.filter(e => e.fromDate > todayStr)
    };
  };

  const sections = [
    { key: 'practice_start', label: '🚀 सराव प्रारंभ इव्हेंट्स', icon: <Sparkles size={14} className="text-amber-500" /> },
    { key: 'practice_session', label: '🎯 भव्य सराव शिबिरे', icon: <Flame size={14} className="text-orange-500" /> },
    { key: 'dahihandi_venue', label: '🏰 दहीहंडी उत्सव ठिकाणे', icon: <Award size={14} className="text-blue-500" /> },
    { key: 'competition', label: '🏆 भव्य दहिहंडी स्पर्धा', icon: <ShieldAlert size={14} className="text-yellow-500" /> }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-bold text-xs">
        <Loader2 className="animate-spin text-orange-500 mr-2" size={16} /> <span>इव्हेंट लोड होत आहेत...</span>
      </div>
    );
  }

  // 📐 मिनी कार्ड लेआउट
  const renderEventCard = (e, isToday) => {
    // 🎯 बदल ४: जर पोस्टर इमेज नसेल, तर कॅटेगरीनुसार डिफॉल्ट प्रिमियम इमेज दाखवली जाईल
    const finalImg = e.posterUrl || e.photoUrl || DEFAULT_IMAGES[e.type] || DEFAULT_IMAGES.practice_session;
    return (
      <div 
        key={e.id} 
        onClick={() => setSelectedEvent(e)}
        className={`flex-shrink-0 w-[160px] md:w-[190px] bg-white rounded-xl p-2 border transition-all flex flex-col justify-between cursor-pointer hover:border-orange-500/30 shadow-sm ${
          isToday ? 'border-orange-500/20' : 'border-slate-100'
        }`}
      >
        <div className="space-y-2">
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-950 relative border border-slate-50">
            <img src={finalImg} alt={e.title_mr} className="w-full h-full object-contain" />
            {isToday && <span className="absolute top-1 left-1 bg-orange-600 text-white font-black text-[7px] px-1 py-0.2 rounded animate-pulse">LIVE</span>}
          </div>
          <div className="text-left px-0.5">
            <h4 className="text-[11px] font-black text-slate-800 line-clamp-1 leading-tight">{e.title_mr}</h4>
            <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">🏰 {e.mandalName || 'आयोजक'}</p>
            
            {/* 📍 लाइव्ह डिस्टन्स बॅज */}
            {e.distanceKm && (
              <p className="text-[9px] font-black text-orange-600 mt-1 flex items-center bg-orange-50 px-1 py-0.5 rounded w-max">
                <MapPin size={10} className="mr-0.5 text-orange-500" /> तुमच्यापासून: {e.distanceKm} किमी
              </p>
            )}
          </div>
        </div>
        <div className="mt-1.5 pt-1 border-t border-slate-50 flex justify-between items-center text-[8px] font-mono font-bold text-slate-400">
          <span>🗓️ {e.fromDate}</span>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 🖥️ SECTION 4: प्रिमियम लोकेशन प्रॉम्ट बॉक्स आणि मुख्य रिटर्न लेआउट
  // =========================================================================
  return (
    <div className="w-full space-y-5 text-left animate-in fade-in duration-150 pb-12">
      
      {!userLoc && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/25 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="text-left">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">📍 तुमच्या जवळची दहीहंडी / सराव शिबीर पाहायचे आहे का?</h4>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">लोकेशन परमिशन दिल्यास तुमच्या सद्य स्थानापासून दहीहंडीचे अचूक अंतर किलोमीटर (km) मध्ये समजेल.</p>
          </div>
          <button onClick={requestUserLocation} className="flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-black text-[11px] px-4 py-2 rounded-xl shadow-sm transition-all text-center active:scale-95">🚩 लोकेशन परमिशन द्या</button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-dashed border-slate-200 text-xs font-bold">📅 सध्या एकही कार्यक्रम उपलब्ध नाही.</div>
      ) : (
        sections.map(sec => {
          const { today, upcoming } = getCategorizedEvents(sec.key);
          if (today.length === 0 && upcoming.length === 0) return null;

          return (
            <div key={sec.key} className="space-y-2.5 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
              <div className="flex items-center space-x-1.5 px-1">{sec.icon} <h3 className="text-[11px] md:text-xs font-black text-slate-700 uppercase tracking-wide">{sec.label}</h3></div>
              {today.length > 0 && (
                <div className="flex items-stretch space-x-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x touch-pan-x px-1">
                  {today.map(e => renderEventCard(e, true))}
                </div>
              )}
              {upcoming.length > 0 && (
                <div className="flex items-stretch space-x-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x touch-pan-x px-1">
                  {upcoming.map(e => renderEventCard(e, false))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* =========================================================================
          🖼️ SECTION 5: प्रिमियम इव्हेंट पॉपअप मोडल (स्मार्ट बटन्स आणि अचूक मॅपिंग फिक्स 🚀)
          ========================================================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-100 flex flex-col justify-between max-h-[90vh] relative animate-in zoom-in-95 duration-150">
            <button onClick={() => setSelectedEvent(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all shadow-md"><X size={16} /></button>
            <div className="w-full aspect-[16/11] bg-slate-950 border-b border-slate-100 flex items-center justify-center">
              <img 
                src={selectedEvent.posterUrl || selectedEvent.photoUrl || DEFAULT_IMAGES[selectedEvent.type] || DEFAULT_IMAGES.practice_session} 
                alt={selectedEvent.title_mr} 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="p-5 text-left space-y-3 bg-gradient-to-b from-white to-slate-50 overflow-y-auto">
              <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-orange-550/10 text-orange-600 border-orange-100 uppercase">{selectedEvent.type}</span>
              <h3 className="text-sm md:text-base font-black text-slate-900 leading-snug">{selectedEvent.title_mr}</h3>
              <p className="text-xs font-bold text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200/60">🏰 आयोजक: <span className="text-slate-900">{selectedEvent.mandalName || '—'}</span></p>
              
              {/* मोडलच्या आत लाइव्ह अंतर कॅल्क्युलेशन बॅज */}
              {(() => {
                const modalDist = (selectedEvent.lat && selectedEvent.lng && userLoc?.lat && userLoc?.lng) 
                  ? calculateDistance(userLoc.lat, userLoc.lng, selectedEvent.lat, selectedEvent.lng) 
                  : null;
                return modalDist ? (
                  <p className="text-xs font-black text-orange-600 bg-orange-50 p-2.5 rounded-xl border border-orange-100 flex items-center">
                    📍 तुमच्या सद्य स्थानापासून हे ठिकाण साधारण <b>{modalDist} किमी</b> अंतरावर आहे.
                  </p>
                ) : null;
              })()}

              <p className="text-[11px] text-slate-500 font-bold">⏱️ कालावधी: {selectedEvent.fromDate} ते {selectedEvent.toDate}</p>
              
              {/* 🎯 बदल १, २, ३: स्मार्ट सोशल मीडिया आणि अचूक गुगल मॅप शॉर्ट लिंक रेंडरर */}
              <div className="space-y-2 pt-2 border-t border-slate-100 mt-3">
                
                {/* 🗺️ नियम १: जर अधिकृत गुगल मॅप शॉर्ट लिंक (mapLink) असेल, तर फक्त हेच एक मुख्य भगवं बटन दाखवा */}
                {selectedEvent.mapLink ? (
                  <a 
                    href={selectedEvent.mapLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-black py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Navigation size={14} />
                    <span>🚩 थेट गुगल मॅपवर दिशा पहा</span>
                  </a>
                ) : (
                  /* नियम २: जर mapLink रिकामी असेल पण postLink मध्ये मॅपची लिंक असेल तरच हे बॅकअप बटन उघडेल */
                  selectedEvent.postLink && selectedEvent.postLink.toLowerCase().includes('maps') && (
                    <a 
                      href={selectedEvent.postLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-black py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95"
                    >
                      <Navigation size={14} />
                      <span>🚩 थेट गुगल मॅपवर दिशा पहा</span>
                    </a>
                  )
                )}
                
                {/* 📸 नियम ३: सोशल मीडिया मूळ पोस्ट (Instagram / Facebook) लिंक बटन */}
                {selectedEvent.postLink && !selectedEvent.postLink.toLowerCase().includes('maps') && (
                  (() => {
                    const isInstagram = selectedEvent.postLink.toLowerCase().includes('instagram.com');
                    return (
                      <a 
                        href={selectedEvent.postLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className={`w-full text-white text-xs font-black py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95 ${
                          isInstagram 
                            ? 'bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045]' 
                            : 'bg-[#1877f2] hover:bg-[#166fe5]'
                        }`}
                      >
                        <span>{isInstagram ? '📸 अधिकृत इन्स्टाग्राम पोस्ट पहा' : '👥 अधिकृत फेसबुक पोस्ट पहा'}</span>
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