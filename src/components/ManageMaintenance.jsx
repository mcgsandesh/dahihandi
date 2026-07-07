import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Megaphone, Calendar, Trophy, Plus, Trash2, Edit2, X, Save, Loader2, Search, Filter } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ManageMaintenance() {
  const [activeTab, setActiveTab] = useState('news'); // 'news', 'events', 'records'
  const [globalLoading, setGlobalLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 📊 डेटाबेसमधून येणारी मूळ यादी
  const [newsList, setNewsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [recordsList, setRecordsList] = useState([]);

  // =========================================================================
  // 🔍 SECTION 1: सर्च आणि सर्व टॅबच्या फिल्टर्ससाठी स्टेट्स (अचूक फिक्स 🎯)
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState('');
  
  // उत्सव व सराव कट्टा टॅबसाठी फिल्टर्स
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
  const [eventYearFilter, setEventYearFilter] = useState(new Date().getFullYear().toString()); // बाय-डिफॉल्ट चालू वर्ष (2026)

  // ऐतिहासिक रेकॉर्ड्स टॅबसाठी फिल्टर्स
  const [recYearFilter, setRecYearFilter] = useState('all');
  const [recGenderFilter, setRecGenderFilter] = useState('all');

  // 🗟 मॉडेल आणि एडिटिंग स्टेट्स
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // 📝 १. न्यूज फॉर्म स्टेट्स
  const [newsTextMr, setNewsTextMr] = useState('');

  // 📝 २. इव्हेंट फॉर्म स्टेट्स
  const [eventTitleMr, setEventTitleMr] = useState('');
  const [eventType, setEventType] = useState('practice_session');
  const [mandalName, setMandalName] = useState('');
  const [postLink, setPostLink] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [eventLat, setEventLat] = useState('');
  const [eventLng, setEventLng] = useState('');
  const [eventMapLink, setEventMapLink] = useState('');

  // 📝 ३. रेकॉर्ड फॉर्म स्टेट्स
  const [recTitleMr, setRecTitleMr] = useState('');
  const [recTeamName, setRecTeamName] = useState('');
  const [recTeamUID, setRecTeamUID] = useState('');
  const [recYear, setRecYear] = useState('2026');
  const [recType, setRecType] = useState('men');
  const [recPhotoUrl, setRecPhotoUrl] = useState('');
  const [showOnDashboard, setShowOnDashboard] = useState(true);

  // 🌍 डेटा लोड करण्याचे फंक्शन
  const fetchData = async () => {
    setGlobalLoading(true);
    try {
      const newsSnap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
      setNewsList(newsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const eventsSnap = await getDocs(query(collection(db, "events"), orderBy("createdAt", "desc")));
      setEventsList(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const recordsSnap = await getDocs(query(collection(db, "records"), orderBy("createdAt", "desc")));
      setRecordsList(recordsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("❌ [FETCH ERROR]:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔓 मॉडेल उघडण्याचे लॉजिक
  const openFormModal = (type, data = null) => {
    if (data) {
      setEditId(data.id);
      if (type === 'news') {
        setNewsTextMr(data.text_mr || '');
      } else if (type === 'events') {
        setEventTitleMr(data.title_mr || '');
        setEventType(data.type || 'practice_session');
        setMandalName(data.mandalName || '');
        setPostLink(data.postLink || '');
        setPosterUrl(data.posterUrl || '');
        setFromDate(data.fromDate || '');
        setToDate(data.toDate || '');
        setEventLat(data.lat || '');
        setEventLng(data.lng || '');
        setEventMapLink(data.mapLink || '');
      } else if (type === 'records') {
        setRecTitleMr(data.title_mr || '');
        setRecTeamName(data.team_mr || '');
        setRecTeamUID(data.teamUID || '');
        setRecYear(data.year || '2026');
        setRecType(data.type || 'men');
        setRecPhotoUrl(data.photoUrl || '');
        setShowOnDashboard(data.showOnDashboard !== false);
      }
    } else {
      setEditId(null);
      setNewsTextMr('');
      setEventTitleMr('');
      setEventType('practice_session');
      setMandalName('');
      setPostLink('');
      setPosterUrl('');
      setFromDate('');
      setToDate('');
      setEventLat('');
      setEventLng('');
      setEventMapLink('');
      setRecTitleMr('');
      setRecTeamName('');
      setRecTeamUID('');
      setRecYear('2026');
      setRecType('men');
      setRecPhotoUrl('');
      setShowOnDashboard(true);
    }
    setIsModalOpen(true);
  };

  // 🚀 सबमिट फॉर्म लॉजिक
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      let collectionName = activeTab;
      let docId = editId || `${activeTab.toUpperCase()}_${Date.now()}`;
      let updateData = { updatedAt: serverTimestamp() };

      if (activeTab === 'news') {
        if (!newsTextMr.trim()) throw new Error("मजकूर रिकामी असू शकत नाही!");
        updateData.text_mr = newsTextMr.trim();
      } else if (activeTab === 'events') {
        if (!eventTitleMr.trim() || !fromDate || !toDate) throw new Error("आवश्यक माहिती अपूर्ण आहे!");
        updateData = {
          ...updateData,
          title_mr: eventTitleMr.trim(),
          type: eventType,
          mandalName: mandalName.trim(),
          postLink: postLink.trim(),
          posterUrl: posterUrl.trim(),
          fromDate,
          toDate,
          lat: eventLat ? parseFloat(eventLat) : null,
          lng: eventLng ? parseFloat(eventLng) : null,
          mapLink: eventMapLink.trim()
        };
      } else if (activeTab === 'records') {
        if (!recTitleMr.trim() || !recTeamName.trim()) throw new Error("शीर्षक आणि पथकाचे नाव आवश्यक आहे!");
        updateData = {
          ...updateData,
          title_mr: recTitleMr.trim(),
          team_mr: recTeamName.trim(),
          teamUID: recTeamUID.trim().toUpperCase(),
          year: recYear,
          type: recType,
          photoUrl: recPhotoUrl.trim(),
          showOnDashboard
        };
      }

      const docRef = doc(db, collectionName, docId);
      if (editId) {
        await updateDoc(docRef, updateData);
      } else {
        updateData.createdAt = serverTimestamp();
        await setDoc(docRef, updateData);
      }

      Swal.fire({ icon: 'success', title: 'माहिती कडक जतन झाली! 🎉', confirmButtonColor: '#ff6600', timer: 1500 });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'नोंदणी अपूर्ण!', text: err.message || 'तांत्रिक चूक झाली.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // 🗑️ डिलीट करण्याचे लॉजिक
  const handleDelete = async (collectionName, id) => {
    const result = await Swal.fire({
      title: 'तुम्हाला खात्री आहे का?',
      text: "हा डेटाबेसमधून कायमचा डिलीट केला जाईल!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'हो, डिलीट करा!'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        Swal.fire({ icon: 'success', title: 'नष्ट करण्यात आले!', showConfirmButton: false, timer: 1200 });
        fetchData();
      } catch (err) { Swal.fire({ icon: 'error', title: 'डिलीट करता आले नाही!' }); }
    }
  };

  // =========================================================================
  // 🧠 SECTION 2: डायनॅमिक उत्सव वर्ष शोधण्याचे लॉजिक (No Hardcoding 💸)
  // =========================================================================
  const getUniqueYears = (dataList, dateField = 'fromDate') => {
    const years = dataList.map(item => {
      if (item.year) return item.year.toString(); // रेकॉर्ड्ससाठी direct string year
      if (item[dateField]) return item[dateField].split('-')[0]; // इव्हेंट्स तारीखमधून (YYYY)
      return null;
    }).filter(y => y !== null);
    
    return ['all', ...new Set(years)].sort((a, b) => b - a); // उतरत्या क्रमाने
  };

  const dynamicEventYears = getUniqueYears(eventsList, 'fromDate');
  const dynamicRecordYears = getUniqueYears(recordsList);

  // =========================================================================
  // 📋 SECTION 3: प्रोग्रेसिव्ह कम्बाइन फिल्टरिंग मॅच लॉजिक (फिल्टर न होणारा घोळ फिक्स 🚀)
  // =========================================================================
  const getFilteredData = () => {
    const queryLower = searchQuery.toLowerCase().trim();

    // अ) न्यूज टॅब फिल्टर
    if (activeTab === 'news') {
      return newsList.filter(n => n.text_mr?.toLowerCase().includes(queryLower));
    }
    
    // ब) इव्हेंट्स टॅब फिल्टर (सर्च + प्रकार + वर्ष एकत्र)
    if (activeTab === 'events') {
      return eventsList.filter(e => {
        const matchesSearch = e.title_mr?.toLowerCase().includes(queryLower) || e.mandalName?.toLowerCase().includes(queryLower);
        const matchesCategory = eventCategoryFilter === 'all' || e.type === eventCategoryFilter;
        
        const eventYear = e.fromDate ? e.fromDate.split('-')[0] : '';
        const matchesYear = eventYearFilter === 'all' || eventYear === eventYearFilter;
        
        return matchesSearch && matchesCategory && matchesYear;
      });
    }

    // क) ऐतिहासिक रेkॉर्ड्स टॅब फिल्टर (आता १-१ ड्रॉपडाउन अचूक मॅच होईल 🎯)
    if (activeTab === 'records') {
      return recordsList.filter(r => {
        const matchesSearch = r.title_mr?.toLowerCase().includes(queryLower) || 
                             r.team_mr?.toLowerCase().includes(queryLower) || 
                             r.teamUID?.toLowerCase().includes(queryLower);
                             
        const matchesYear = recYearFilter === 'all' || (r.year && r.year.toString() === recYearFilter);
        const matchesGender = recGenderFilter === 'all' || r.type === recGenderFilter;
        
        return matchesSearch && matchesYear && matchesGender;
      });
    }
    return [];
  };

  const filteredItems = getFilteredData();

  return (
    <div className="w-full bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm relative">
      
      {/* 📑 अंतर्गत टॅब स्विचर सिस्टीम */}
      <div className="flex space-x-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto scrollbar-none">
        <button onClick={() => { setActiveTab('news'); setSearchQuery(''); }} className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap ${activeTab === 'news' ? 'bg-[#0b132b] text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Megaphone size={14} /> <span>📢  बातम्या / सूचना</span></button>
        <button onClick={() => { setActiveTab('events'); setSearchQuery(''); }} className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap ${activeTab === 'events' ? 'bg-[#0b132b] text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Calendar size={14} /> <span>📅  उत्सव व सराव कट्टा</span></button>
        <button onClick={() => { setActiveTab('records'); setSearchQuery(''); }} className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap ${activeTab === 'records' ? 'bg-[#0b132b] text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Trophy size={14} /> <span>🏆  ऐतिहासिक रेकॉर्ड्स</span></button>
      </div>

      {/* =========================================================================
          🖥️ SECTION 4: प्रिमियम सर्च आणि टॅबनुसार बदलणारे प्रगत फिल्टर्स UI (दुरुस्त 🎯)
          ========================================================================= */}
      <div className="mb-5 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
        
        {/* सामायिक सर्च बार */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute top-2.5 left-3 text-slate-400" size={14} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${activeTab === 'news' ? 'बातमी शोधा...' : activeTab === 'events' ? 'इव्हेंट किंवा मंडळ शोधा...' : 'शीर्षक, पथक किंवा UID शोधा...'}`}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-[#ff6600] font-medium"
          />
        </div>

        {/* उत्सव व सराव कट्टा टॅबचे फिल्टर्स */}
        {activeTab === 'events' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select 
              value={eventCategoryFilter} 
              onChange={(e) => setEventCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="all">🎯 सर्व प्रकार पहा</option>
              <option value="practice_session">🎯 सराव शिबीर</option>
              <option value="practice_start">🚩 सराव सुरू होणार</option>
              <option value="dahihandi_venue">🏰 दहीहंडी उत्सव ठिकाण</option>
              <option value="competition">🏆 स्पर्धा / सामने</option>
            </select>

            <select 
              value={eventYearFilter} 
              onChange={(e) => setEventYearFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="all">🗓️ सर्व वर्षे</option>
              {dynamicEventYears.filter(y => y !== 'all').map(yr => (
                <option key={yr} value={yr}>{yr} चे कार्यक्रम</option>
              ))}
            </select>
          </div>
        )}

        {/* ऐतिहासिक रेकॉर्ड्स टॅबचे फिल्टर्स (🎯 onChange स्टेट्स अचूकपणे अपडेट केल्या) */}
        {activeTab === 'records' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* १. पुरुष / महिला वर्गीकरण फिल्टर */}
            <select 
              value={recGenderFilter} 
              onChange={(e) => setRecGenderFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="all">👨‍👦‍👧 सर्व पथके एकत्र पहा</option>
              <option value="men">👨‍👦  पुरुष गोविंदा पथक</option>
              <option value="women">👩‍👧  महिला गोविंदा पथक</option>
            </select>

            {/* २. डायनॅमिक उत्सव वर्ष फिल्टर */}
            <select 
              value={recYearFilter} 
              onChange={(e) => setRecYearFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="all">🗓️ सर्व वर्षे पहा</option>
              {dynamicRecordYears.filter(y => y !== 'all').map(yr => (
                <option key={yr} value={yr}>{yr} चे रेकॉर्ड्स</option>
              ))}
            </select>
            
          </div>
        )}
      </div>

      {globalLoading && (
        <div className="flex items-center justify-center space-x-2 py-10 text-slate-400 font-bold text-xs"><Loader2 className="animate-spin text-orange-500" size={16} /> <span>डेटा ओढत आहे, कृपया थांबा...</span></div>
      )}

      {/* 🔴 टॅब १: बातम्या सूची */}
      {!globalLoading && activeTab === 'news' && (
        <div className="space-y-4 animate-in fade-in duration-100 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider"> चालू लाईव्ह बातम्या ({filteredItems.length})</h4>
            <button onClick={() => openFormModal('news')} className="bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"><Plus size={14} /> <span>नवीन बातमी जोडा</span></button>
          </div>
          <div className="bg-slate-50/50 rounded-2xl p-2 border border-slate-100 space-y-1.5">
            {filteredItems.length === 0 ? <p className="p-6 text-center text-slate-400 text-xs font-bold">माहिती उपलब्ध नाही किंवा सर्च रिझल्ट मिळाला नाही.</p> : filteredItems.map((n) => (
              <div key={n.id} className="bg-white px-4 py-2.5 border border-slate-100 rounded-xl flex justify-between items-center gap-4 hover:border-slate-200 transition-all shadow-sm">
                <p className="text-xs font-bold text-slate-700 leading-relaxed truncate">{n.text_mr}</p>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button onClick={() => openFormModal('news', n)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete('news', n.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔵 टॅब २: उत्सव व सराव कट्टा यादी */}
      {!globalLoading && activeTab === 'events' && (
        <div className="space-y-4 animate-in fade-in duration-100 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">📅 सराव शिबिरे आणि दहीहंडी ठिकाणे ({filteredItems.length})</h4>
            <button onClick={() => openFormModal('events')} className="bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"><Plus size={14} /> <span>नवीन इव्हेंट जोडा</span></button>
          </div>
          <div className="bg-slate-50/50 rounded-2xl p-2 border border-slate-100 space-y-1.5">
            {filteredItems.length === 0 ? <p className="p-6 text-center text-slate-400 text-xs font-bold">निवडलेल्या फिल्टरनुसार इव्हेंट सापडला नाही.</p> : filteredItems.map((e) => (
              <div key={e.id} className="bg-white p-3 border border-slate-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 hover:border-slate-200 transition-all shadow-sm">
                <div className="flex flex-wrap items-center gap-2 md:w-1/3">
                  <span className="text-[8px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100/60 whitespace-nowrap">
                    {e.type === 'practice_session' ? '🎯 सराव शिबीर' : e.type === 'practice_start' ? '🚩 प्रारंभ' : e.type === 'dahihandi_venue' ? '🏰 उत्सव ठिकाण' : '🏆 स्पर्धा'}
                  </span>
                  <h5 className="text-xs font-black text-slate-800 truncate">{e.title_mr}</h5>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 text-[10px] md:text-xs text-slate-500 font-bold flex-1">
                  <span className="truncate max-w-[180px] text-slate-600">🏰 {e.mandalName || '—'}</span>
                  <span className="text-slate-400 font-mono">🗓️ {e.fromDate} ते {e.toDate}</span>
                  {e.lat && e.lng && <span className="text-[9px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-lg font-black border border-orange-100/50">📍 GPS मॅप सक्रिय</span>}
                </div>
                <div className="flex items-center space-x-1 justify-end border-t border-slate-50 md:border-none pt-2 md:pt-0">
                  <button onClick={() => openFormModal('events', e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete('events', e.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🟢 टॅब ३: रेकॉर्ड्स सूची */}
      {!globalLoading && activeTab === 'records' && (
        <div className="space-y-4 animate-in fade-in duration-100 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">🏆  ऐतिहासिक विश्वविक्रम यादी ({filteredItems.length})</h4>
            <button onClick={() => openFormModal('records')} className="bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"><Plus size={14} /> <span>नवीन रेकॉर्ड जोडा</span></button>
          </div>
          <div className="bg-slate-50/50 rounded-2xl p-2 border border-slate-100 space-y-1.5">
            {filteredItems.length === 0 ? <p className="p-6 text-center text-slate-400 text-xs font-bold">विक्रम सापडला नाही.</p> : filteredItems.map((r) => (
              <div key={r.id} className="bg-white p-3 border border-slate-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 hover:border-slate-200 transition-all shadow-sm">
                <div className="flex flex-wrap items-center gap-2 md:w-2/5">
                  <span className={`text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded uppercase ${r.type === 'women' ? 'bg-pink-50 text-pink-600 border border-pink-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                    {r.type === 'women' ? '👩‍👧  महिला' : '👨‍👦  पुरुष'} ({r.year})
                  </span>
                  <h5 className="text-xs font-black text-slate-800 truncate">{r.title_mr}</h5>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 text-[11px] text-slate-500 font-bold flex-1">
                  <span className="text-slate-700 truncate max-w-[220px]">🚩  {r.team_mr}</span>
                  {r.teamUID && <span className="text-slate-400 font-mono text-[10px]">[{r.teamUID}]</span>}
                  {r.showOnDashboard && <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg font-black border border-emerald-100/50">🖥️  गॅलरीमध्ये लाइव्ह</span>}
                </div>
                <div className="flex items-center space-x-1 justify-end border-t border-slate-50 md:border-none pt-2 md:pt-0">
                  <button onClick={() => openFormModal('records', r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete('records', r.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🗟 पॉपअप मॉडेल फॉर्म */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 border border-slate-100 max-h-[85vh] overflow-y-auto scrollbar-none text-left">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            <div className="mb-4">
              <h3 className="text-base font-black text-slate-800">{editId ? '📝  माहिती अपडेट करा' : '➕  नवीन नोंदणी कक्ष'}</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">टॅब वर्गीकरण: {activeTab}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'news' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">महत्त्वाची बातमी / सूचना (मराठीत)</label>
                  <textarea value={newsTextMr} onChange={(e) => setNewsTextMr(e.target.value)} rows="3" placeholder="उदा. 🚨 गोविंदा विमा यादी जमा करण्याची अंतिम तारीख..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium text-slate-800" />
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">इव्हेंट / सूचनेचे शीर्षक</label>
                    <input type="text" value={eventTitleMr} onChange={(e) => setEventTitleMr(e.target.value)} placeholder="उदा. भव्य दहीहंडी सराव शिबीर २०२६" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">इव्हेंट प्रकार</label>
                      <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none bg-slate-50 font-bold text-slate-700">
                        <option value="practice_session">🎯 सराव शिबीर</option>
                        <option value="practice_start">🚩 सराव सुरू होणार</option>
                        <option value="dahihandi_venue">🏰 दहीहंडी उत्सव ठिकाण</option>
                        <option value="competition">🏆 स्पर्धा / सामने</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">मंडळ / आयोजक नाव</label>
                      <input type="text" value={mandalName} onChange={(e) => setMandalName(e.target.value)} placeholder="उदा. शिवसाई मित्र मंडळ" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">प्रदर्शित तारीख (From)</label>
                      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-bold text-slate-700" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">अंतिम तारीख (To - Auto Hide)</label>
                      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-bold text-slate-700" />
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-500/10 space-y-2.5">
                    <span className="text-[10px] font-black text-orange-600 block uppercase tracking-wide">📍  क्लायंट-साइड मॅपिंग आणि दिशा निर्देशक</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase">अक्षांश (Latitude)</label>
                        <input type="number" step="any" value={eventLat} onChange={(e) => setEventLat(e.target.value)} placeholder="19.1843" className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase">रेखांश (Longitude)</label>
                        <input type="number" step="any" value={eventLng} onChange={(e) => setEventLng(e.target.value)} placeholder="72.9576" className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase">गुगल मॅप नेव्हिगेशन लिंक (Google Map Short URL)</label>
                      <input type="url" value={eventMapLink} onChange={(e) => setEventMapLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white font-mono" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">सोशल मीडिया पोस्ट लिंक (Instagram/FB URL)</label>
                    <input type="url" value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder="https://instagram.com/p/..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">पोस्टर इमेज लिंक (Web URL)</label>
                    <input type="url" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-mono" />
                  </div>
                </div>
              )}

              {activeTab === 'records' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">रेकॉर्ड / सन्मान शीर्षक</label>
                    <input type="text" value={recTitleMr} onChange={(e) => setRecTitleMr(e.target.value)} placeholder="उदा. १० थरांचा थरारक जागतिक विश्वविक्रम" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">गोविंदा पथकाचे नाव</label>
                    <input type="text" value={recTeamName} onChange={(e) => setRecTeamName(e.target.value)} placeholder="उदा. कोकण नगर गोविंदा पथक" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-black" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">संघ आयडी (Team UID - Optional)</label>
                      <input type="text" value={recTeamUID} onChange={(e) => setRecTeamUID(e.target.value)} placeholder="MCG6012" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">उत्सव वर्ष</label>
                      <input type="text" value={recYear} onChange={(e) => setRecYear(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-bold text-center" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">पथक वर्गीकरण (Type)</label>
                    <select value={recType} onChange={(e) => setRecType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none bg-slate-50 font-bold text-slate-700">
                      <option value="men">👨‍👦  पुरुष गोविंदा पथक</option>
                      <option value="women">👩‍👧   महिला गोविंदा पथक</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">उभा (Vertical) थर फोटो लिंक</label>
                    <input type="url" value={recPhotoUrl} onChange={(e) => setRecPhotoUrl(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-mono" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-700">🖥️   मुख्य होमपेज कॅरोसेलमध्ये दाखवायचा का?</span>
                    <input type="checkbox" checked={showOnDashboard} onChange={(e) => setShowOnDashboard(e.target.checked)} className="w-4 h-4 accent-orange-600 cursor-pointer" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={submitLoading} className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4 active:scale-[0.98]">
                {submitLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                <span>{submitLoading ? 'माहिती डेटाबेसवर जात आहे...' : editId ? 'माहिती अपडेट करा 💾' : 'कडक जतन करा ➕'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}