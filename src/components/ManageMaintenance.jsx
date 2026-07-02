import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { Megaphone, Calendar, Trophy, Plus, Trash2, Edit2, X, Save, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ManageMaintenance() {
  const [activeTab, setActiveTab] = useState('news'); // 'news', 'events', 'records'
  const [globalLoading, setGlobalLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 📊 डेटाबेसमधून येणारी यादी
  const [newsList, setNewsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [recordsList, setRecordsList] = useState([]);

  // 🗟 मॉडेल आणि एडिटिंग स्टेट्स (Add/Edit सामायिक मॅनेजमेंट)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); // नल असेल तर 'Add', आयडी असेल तर 'Edit'

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

  // 📝 ३. रेकॉर्ड फॉर्म स्टेटs
  const [recTitleMr, setRecTitleMr] = useState('');
  const [recTeamName, setRecTeamName] = useState('');
  const [recTeamUID, setRecTeamUID] = useState('');
  const [recYear, setRecYear] = useState('2026');
  const [recType, setRecType] = useState('men');
  const [recPhotoUrl, setRecPhotoUrl] = useState('');
  const [showOnDashboard, setShowOnDashboard] = useState(true);

  // 🌍 डेटा लोड करण्याचे कडक फंक्शन
  const fetchData = async () => {
    setGlobalLoading(true);
    console.log("🔄 [Maintenance] डेटाबेस मधून माहिती ओढणे सुरू झाले...");
    try {
      // अ) बातम्या ओढणे
      const newsSnap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
      const fetchedNews = newsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNewsList(fetchedNews);
      console.log(`✓ [News Load Success]: एकूण ${fetchedNews.length} बातम्या मिळाल्या.`);

      // ब) इव्हेंट्स ओढणे
      const eventsSnap = await getDocs(query(collection(db, "events"), orderBy("createdAt", "desc")));
      const fetchedEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEventsList(fetchedEvents);
      console.log(`✓ [Events Load Success]: एकूण ${fetchedEvents.length} इव्हेंट्स मिळाले.`);

      // क) रेकॉर्ड्स ओढणे
      const recordsSnap = await getDocs(query(collection(db, "records"), orderBy("createdAt", "desc")));
      const fetchedRecords = recordsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecordsList(fetchedRecords);
      console.log(`✓ [Records Load Success]: एकूण ${fetchedRecords.length} रेकॉर्ड्स मिळाले.`);

    } catch (err) {
      console.error("❌ [FETCH ERROR]: डेटा ओढताना मुख्य अडचण आली:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔓 मॉडेल उघडण्याचे सामायिक लॉजिक
  const openFormModal = (type, data = null) => {
    if (data) {
      // ✏️ EDIT MODE SETUP
      console.log(`📝 [Edit Mode Active]: प्रकार: ${type}, ID: ${data.id}`);
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
      // ➕ ADD MODE SETUP (Reset inputs)
      console.log(`➕ [Add Mode Active]: नवीन एंट्री फॉर्म प्रकार: ${type}`);
      setEditId(null);
      setNewsTextMr('');
      setEventTitleMr('');
      setEventType('practice_session');
      setMandalName('');
      setPostLink('');
      setPosterUrl('');
      setFromDate('');
      setToDate('');
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

  // 🚀 सबमिट फॉर्म लॉजिक (सामायिक Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    console.log(`💾 [Form Submission]: सेव्हिंग प्रोसेस सुरू... (Mode: ${editId ? 'EDIT' : 'ADD'}, Tab: ${activeTab})`);

    try {
      let collectionName = activeTab;
      let docId = editId || `${activeTab.toUpperCase()}_${Date.now()}`;
      let updateData = { updatedAt: serverTimestamp() };

      // व्हॅलिडेशन आणि डेटा बांधणी
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
          toDate
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
        // अपडेट करणे
        await updateDoc(docRef, updateData);
        console.log(`✓ [Firebase Update Success]: आयडी ${docId} यशस्वी अपडेट झाला.`);
      } else {
        // नवीन तयार करणे
        updateData.createdAt = serverTimestamp();
        await setDoc(docRef, updateData);
        console.log(`✓ [Firebase Create Success]: नवीन डॉक्युमेंट आयडी ${docId} तयार झाले.`);
      }

      Swal.fire({ icon: 'success', title: 'माहिती कडक जतन झाली! 🎉', confirmButtonColor: '#ff6600', timer: 1500 });
      setIsModalOpen(false);
      fetchData();

    } catch (err) {
      console.error(`❌ [SUBMIT TRANSACTION ERROR] (${activeTab}):`, err);
      Swal.fire({ icon: 'error', title: 'नोंदणी अपूर्ण!', text: err.message || 'तांत्रिक चूक झाली.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // 🗑️ डिलीट करण्याचे लॉजिक
  const handleDelete = async (collectionName, id) => {
    console.log(`🗑️ [Delete Request]: कलेक्शन: ${collectionName}, ID: ${id}`);
    const result = await Swal.fire({
      title: 'तुम्हाला खात्री आहे का?',
      text: "हा डेटाबेसमधून कायमचा डिलीट केला जाईल!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'हो, डिलीट करा!',
      cancelButtonText: 'रद्द करा'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        console.log(`✓ [Firebase Delete Success]: आयडी ${id} यशस्वी नष्ट केला.`);
        Swal.fire({ icon: 'success', title: 'नष्ट करण्यात आले!', showConfirmButton: false, timer: 1200 });
        fetchData();
      } catch (err) {
        console.error("❌ [DELETE FIRESTORE ERROR]:", err);
        Swal.fire({ icon: 'error', title: 'डिलीट करता आले नाही!' });
      }
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm relative">
      
      {/* 📑 अंतर्गत टॅब स्विचर सिस्टीम */}
      <div className="flex space-x-2 border-b border-slate-100 pb-3 mb-6 overflow-x-auto scrollbar-none">
        <button onClick={() => setActiveTab('news')} className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap ${activeTab === 'news' ? 'bg-[#0b132b] text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Megaphone size={14} /> <span>📢 बातम्या / सूचना</span></button>
        <button onClick={() => setActiveTab('events')} className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap ${activeTab === 'events' ? 'bg-[#0b132b] text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Calendar size={14} /> <span>📅 उत्सव व सराव कट्टा</span></button>
        <button onClick={() => setActiveTab('records')} className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap ${activeTab === 'records' ? 'bg-[#0b132b] text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Trophy size={14} /> <span>🏆 ऐतिहासिक रेकॉर्ड्स</span></button>
      </div>

      {globalLoading && (
        <div className="flex items-center justify-center space-x-2 py-10 text-slate-400 font-bold text-xs"><Loader2 className="animate-spin text-orange-500" size={16} /> <span>डेटा ओढत आहे, कृपया थांबा...</span></div>
      )}

      {/* 🔴 टॅब १: बातम्या सूची */}
      {!globalLoading && activeTab === 'news' && (
        <div className="space-y-4 animate-in fade-in duration-100 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider"> चालू लाईव्ह बातम्या</h4>
            <button onClick={() => openFormModal('news')} className="bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"><Plus size={14} /> <span>नवीन बातमी जोडा</span></button>
          </div>
          <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100 space-y-2">
            {newsList.length === 0 ? <p className="p-6 text-center text-slate-400 text-xs font-bold">एकही बातमी अद्याप डेटाबेसमध्ये नाही.</p> : newsList.map((n) => (
              <div key={n.id} className="bg-white p-3 border border-slate-100 rounded-xl flex justify-between items-center gap-4 hover:shadow-sm transition-all">
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{n.text_mr}</p>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button onClick={() => openFormModal('news', n)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete('news', n.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔵 टॅब २: इव्हेंट्स सूची */}
      {!globalLoading && activeTab === 'events' && (
        <div className="space-y-4 animate-in fade-in duration-100 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">📅 सराव शिबिरे आणि दहीहंडी ठिकाणे</h4>
            <button onClick={() => openFormModal('events')} className="bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"><Plus size={14} /> <span>नवीन इव्हेंट जोडा</span></button>
          </div>
          <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100 space-y-2">
            {eventsList.length === 0 ? <p className="p-6 text-center text-slate-400 text-xs font-bold">एकही इव्हेंट अद्याप नोंदणीकृत नाही.</p> : eventsList.map((e) => (
              <div key={e.id} className="bg-white p-3 border border-slate-100 rounded-xl flex justify-between items-center gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">{e.type}</span>
                  <h5 className="text-xs font-black text-slate-800 mt-1.5">{e.title_mr}</h5>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">🗓️ {e.fromDate} ते {e.toDate} | 🏰 {e.mandalName || '—'}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => openFormModal('events', e)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete('events', e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
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
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">🏆 ऐतिहासिक विश्वविक्रम यादी</h4>
            <button onClick={() => openFormModal('records')} className="bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"><Plus size={14} /> <span>नवीन रेकॉर्ड जोडा</span></button>
          </div>
          <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100 space-y-2">
            {recordsList.length === 0 ? <p className="p-6 text-center text-slate-400 text-xs font-bold">एकही रेकॉर्ड अद्याप डेटाबेसमध्ये नाही.</p> : recordsList.map((r) => (
              <div key={r.id} className="bg-white p-3 border border-slate-100 rounded-xl flex justify-between items-center gap-4">
                <div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${r.type === 'women' ? 'bg-pink-50 text-pink-600' : 'bg-orange-50 text-orange-600'}`}>{r.type === 'women' ? '🔴 महिला' : '🟠 पुरुष'} ({r.year})</span>
                  <h5 className="text-xs font-black text-slate-800 mt-1.5">{r.title_mr}</h5>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">📍 {r.team_mr} <span className="text-slate-300 font-mono">[{r.teamUID || 'NO UID'}]</span></p>
                  {r.showOnDashboard && <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">🖥️ गॅलरीमध्ये सक्रिय</span>}
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => openFormModal('records', r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete('records', r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🗟 सामायिक पॉपअप मॉडेल फॉर्म (Add/Edit System) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"></div>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 border border-slate-100 max-h-[85vh] overflow-y-auto scrollbar-none animate-in zoom-in-95 duration-150 text-left">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            <div className="mb-4">
              <h3 className="text-base font-black text-slate-800">{editId ? '📝 माहिती अपडेट करा' : '➕ नवीन नोंदणी कक्ष'}</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">टॅब वर्गीकरण: {activeTab}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* १) न्यूज फॉर्म अंतर्गत इनपुट्स */}
              {activeTab === 'news' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">महत्त्वाची बातमी / सूचना (मराठीत)</label>
                  <textarea value={newsTextMr} onChange={(e) => setNewsTextMr(e.target.value)} rows="3" placeholder="उदा. 🚨 गोविंदा विमा यादी जमा करण्याची अंतिम तारीख १५ ऑगस्ट आहे..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium text-slate-800 leading-relaxed" />
                </div>
              )}

              {/* २) इव्हेंट फॉर्म अंतर्गत इनपुट्स */}
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
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">सोशल मीडिया पोस्ट लिंक (Instagram/FB URL)</label>
                    <input type="url" value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder="https://instagram.com/p/..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">पोस्टर इमेज लिंक (Firebase Storage / Web URL)</label>
                    <input type="url" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-mono" />
                  </div>
                </div>
              )}

              {/* ३) रेकॉर्ड्स फॉर्म अंतर्गत इनपुट्स */}
              {activeTab === 'records' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">रेकॉर्ड / सन्मान शीर्षक</label>
                    <input type="text" value={recTitleMr} onChange={(e) => setRecTitleMr(e.target.value)} placeholder="उदा. १० थरांचा थरारक जागतिक विश्वविक्रम" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">गोविंदा पथकाचे नाव</label>
                    <input type="text" value={recTeamName} onChange={(e) => setRecTeamName(e.target.value)} placeholder="उदा. कोकण नगर गोविंदा पथक - जोगेश्वरी" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-black" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">संघ आयडी (Team UID - Optional)</label>
                      <input type="text" value={recTeamUID} onChange={(e) => setRecTeamUID(e.target.value)} placeholder="उदा. MCG6012" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">उत्सव वर्ष</label>
                      <input type="text" value={recYear} onChange={(e) => setRecYear(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-bold text-center" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">पथक वर्गीकरण (Type)</label>
                    <select value={recType} onChange={(e) => setRecType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none bg-slate-50 font-bold text-slate-700">
                      <option value="men">👨‍👦 पुरुष गोविंदा पथक</option>
                      <option value="women">👩‍👧 महिला गोविंदा पथक</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">उभा (Vertical) थर फोटो लिंक</label>
                    <input type="url" value={recPhotoUrl} onChange={(e) => setRecPhotoUrl(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none bg-slate-50 font-mono" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-700">🖥️ मुख्य होमपेज कॅरोसेलमध्ये दाखवायचा का?</span>
                    <input type="checkbox" checked={showOnDashboard} onChange={(e) => setShowOnDashboard(e.target.checked)} className="w-4 h-4 accent-orange-600 cursor-pointer" />
                  </div>
                </div>
              )}

              {/* सबमिट बटन */}
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