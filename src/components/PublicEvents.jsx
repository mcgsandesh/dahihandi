import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { Calendar, MapPin, Link2, Loader2, Clock, Flame, Award, ShieldAlert, Sparkles, X, Navigation } from 'lucide-react';

const CACHE_KEY = 'govinda_events_cache';
const CACHE_TIME_KEY = 'govinda_events_cache_time';
const CACHE_DURATION = 15 * 60 * 1000; // १५ मिनिटे कॅश

export default function PublicEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null); // 🖼️ पॉपअप मोडल स्टेट

  useEffect(() => {
    const fetchEvents = async () => {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const now = Date.now();

      // जर कॅश फ्रेश असेल तर लोकल डेटा वापरा
      if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
        console.log("⚡ [PublicEvents] लोकल कॅश डेटा वापरला.");
        setEvents(JSON.parse(cachedData));
        setLoading(false);

        // 🚀 बॅकग्राउंड सिंक: Reads वाचवण्यासाठी फक्त नवीन डेटा आलाय का बॅकग्राउंडला चेक करणे
        setTimeout(async () => {
          try {
            const snap = await getDocs(query(collection(db, "events"), orderBy("fromDate", "asc")));
            const freshEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (JSON.stringify(freshEvents) !== cachedData) {
              console.log("🔄 [PublicEvents Sync] नवीन डेटा सापडला! लोकल कॅश अपडेट केली.");
              localStorage.setItem(CACHE_KEY, JSON.stringify(freshEvents));
              localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
              setEvents(freshEvents);
            }
          } catch (e) { console.log("बॅकग्राउंड सिंक अडचण:", e); }
        }, 1000);

        return;
      }

      // कॅश नसेल तर मुख्य फेच
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
    const categoryData = events.filter(e => e.type === typeKey);
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

  // 📐 मिनी कार्ड लेआउट (खूप छोटे कार्ड्स जे सहज स्क्रोल होतील)
  const renderEventCard = (e, isToday) => {
    const finalImg = e.posterUrl || e.photoUrl;
    return (
      <div 
        key={e.id} 
        onClick={() => setSelectedEvent(e)}
        className={`flex-shrink-0 w-[160px] md:w-[190px] bg-white rounded-xl p-2 border transition-all flex flex-col justify-between cursor-pointer hover:border-orange-500/30 shadow-sm ${
          isToday ? 'border-orange-500/20' : 'border-slate-100'
        }`}
      >
        <div className="space-y-2">
          {/* कॉम्पॅक्ट इमेज */}
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-950 relative border border-slate-50">
            {finalImg ? (
              <img src={finalImg} alt={e.title_mr} className="w-full h-full object-contain" />
            ) : (
              <span className="text-[9px] text-slate-500 italic">No Image</span>
            )}
            {isToday && <span className="absolute top-1 left-1 bg-orange-600 text-white font-black text-[7px] px-1 py-0.2 rounded animate-pulse">LIVE</span>}
          </div>
          <div className="text-left px-0.5">
            <h4 className="text-[11px] font-black text-slate-800 line-clamp-1 leading-tight">{e.title_mr}</h4>
            <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">🏰 {e.mandalName || 'आयोजक'}</p>
          </div>
        </div>
        <div className="mt-1.5 pt-1 border-t border-slate-50 flex justify-between items-center text-[8px] font-mono font-bold text-slate-400">
          <span>🗓️ {e.fromDate}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-5 text-left animate-in fade-in duration-150 pb-12">
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

      {/* 🖼️ प्रिमियम इव्हेंट पॉपअप मोडल (Zoom View) */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-100 flex flex-col justify-between max-h-[90vh] relative animate-in zoom-in-95 duration-150">
            <button onClick={() => setSelectedEvent(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all shadow-md"><X size={16} /></button>
            <div className="w-full aspect-[16/11] bg-slate-950 border-b border-slate-100 flex items-center justify-center">
              {(selectedEvent.posterUrl || selectedEvent.photoUrl) ? (
                <img src={selectedEvent.posterUrl || selectedEvent.photoUrl} alt={selectedEvent.title_mr} className="w-full h-full object-contain" />
              ) : (
                <span className="text-slate-500 text-xs italic">पोस्टर उपलब्ध नाही</span>
              )}
            </div>
            <div className="p-5 text-left space-y-3 bg-gradient-to-b from-white to-slate-50 overflow-y-auto">
              <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-orange-550/10 text-orange-600 border-orange-100 uppercase">{selectedEvent.type}</span>
              <h3 className="text-sm md:text-base font-black text-slate-900 leading-snug">{selectedEvent.title_mr}</h3>
              <p className="text-xs font-bold text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200/60">🏰 आयोजक: <span className="text-slate-900">{selectedEvent.mandalName || '—'}</span></p>
              <p className="text-[11px] text-slate-500 font-bold">⏱️ कालावधी: {selectedEvent.fromDate} ते {selectedEvent.toDate}</p>
              
              {/* 🗺️ गुगल मॅप नेव्हिगेशन फील्ड सपोर्ट */}
              {(selectedEvent.mapLink || selectedEvent.postLink) && (
                <a 
                  href={selectedEvent.mapLink || selectedEvent.postLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-black py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md"
                >
                  <Navigation size={14} />
                  <span>🚩 थेट गुगल मॅपवर दिशा पहा</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}