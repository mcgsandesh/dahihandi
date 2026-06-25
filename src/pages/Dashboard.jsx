import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, getDocs, getDocsFromCache, serverTimestamp, query, where } from 'firebase/firestore'; 
import { Users, PlusCircle, LogOut, Menu, X, Plus, Search, Edit2, Trash2, Link2, RotateCcw, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Dashboard({ user, onLogout }) {
  // फॉर्म इनपुट स्टेट्स
  const [teamName, setTeamName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [allowInAppForm, setAllowInAppForm] = useState(true); // 👈 नवीन स्टेट: फॉर्म कंट्रोल्ससाठी
  
  // मॅनेजमेंट आणि डेटा स्टेट्स
  const [loading, setLoading] = useState(false);
  const [teamsList, setTeamsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTab, setViewTab] = useState('active'); 
  
  // मॉडेल आणि नेव्हिगेशन स्टेट्स
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);

  // 🔄 १. डेटाबेस लेव्हलवर फक्त 'admin' फिल्टर करून Reads वाचवणारे फेच फंक्शन 🔥
  const fetchTeams = async () => {
    try {
      console.log("🚀 [SuperAdmin] fetchTeams सुरू झाले आहे...");
      const usersRef = collection(db, "users");
      const adminQuery = query(usersRef, where("role", "==", "admin"));
      let querySnapshot;

      try {
        querySnapshot = await getDocsFromCache(adminQuery);
        if (querySnapshot.empty || querySnapshot.size < 2) {
          throw new Error("कॅश डेटा अपूर्ण आहे"); 
        }
        console.log(`👑 [SuperAdmin] कॅशमधून यशस्वी ओढला! एकूण एंट्रीज: ${querySnapshot.size} 🔥`);
      } catch (cacheErr) {
        querySnapshot = await getDocs(adminQuery);
        console.log(`🌍 [SuperAdmin] सर्व्हर रीड पूर्ण! एकूण फ्रेश एंट्रीज: ${querySnapshot.size} 🌍`);
      }

      const teams = [];
      querySnapshot.forEach((doc) => {
        teams.push({ id: doc.id, ...doc.data() });
      });
      setTeamsList(teams);
    } catch (err) {
      console.error("❌ [SuperAdmin Error] टीम्सचा डेटा आणताना मुख्य एरर आला:", err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openModal = (team = null) => {
    if (team) {
      setEditingEmail(team.email);
      setTeamName(team.teamName);
      setAdminName(team.name);
      setAdminEmail(team.email);
      setAllowInAppForm(team.allowInAppForm !== false); // 👈 एडिट करताना जुनी व्हॅल्यू लोड होईल
    } else {
      setEditingEmail(null);
      setTeamName('');
      setAdminName('');
      setAdminEmail('');
      setAllowInAppForm(true); // बाय डिफॉल्ट 'True' राहील
    }
    setIsModalOpen(true);
  };

  // 🔐 २. अधिक कडक आणि युनिक नोंदणी लिंक जनरेटर
  const generateSecureLink = (team) => {
    // 🎯 बदल: जर सुपरॲडमीनने फॉर्मला परवानगी दिली नसेल (`allowInAppForm === false`), तर लिंक जनरेट होणार नाही!
    if (team.allowInAppForm === false || !team.teamSlug || !team.uid) return '';
    const baseUrl = window.location.origin;
    let baseRoute = import.meta.env.BASE_URL || '/';
    if (!baseRoute.endsWith('/')) baseRoute += '/';
    if (!baseRoute.startsWith('/')) baseRoute = '/' + baseRoute;
    
    return `${baseUrl}${baseRoute}${team.teamSlug}/register?t=${btoa(team.uid)}`;
  };

  const copyToClipboard = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    Swal.fire({
      icon: 'success',
      title: '🔒 लिंक कॉपी झाली!',
      text: 'अधिकृत ब्रँडेड नोंदणी लिंक कॉपी झाली आहे.',
      confirmButtonColor: '#ff6600',
      customClass: { popup: 'rounded-3xl' },
      timer: 2500
    });
  };

  // 🚀 ३. सुधारित: कडक इन-ॲप फॉर्म परमिशन डेटाबेस सेव्हिंग लॉजिक
  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!teamName || !adminName || !adminEmail) {
      Swal.fire({ icon: 'warning', title: 'माहिती अपूर्ण!', text: 'कृपया सर्व माहिती अचूक भरा!', confirmButtonColor: '#ff6600' });
      return;
    }
    setLoading(true);

    try {
      const emailLower = adminEmail.trim().toLowerCase();
      const teamSlug = teamName.toLowerCase().trim().replace(/[^a-zA-Z0-9\s-\u0900-\u097F]/g, '').replace(/\s+/g, '-');

      if (editingEmail) {
        const userRef = doc(db, "users", editingEmail);
        await updateDoc(userRef, {
          name: adminName.trim(),
          teamName: teamName.trim(),
          teamSlug: teamSlug,
          allowInAppForm: allowInAppForm, // 👈 एडिट मोडमध्ये परमिशन अपडेट
          updatedAt: serverTimestamp()
        });
        
        Swal.fire({ icon: 'success', title: 'माहिती अपडेट झाली!', text: 'संघाची माहिती यशस्वीरीत्या बदलण्यात आली आहे.', showConfirmButton: false, timer: 1500 });
      } else {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const generatedUid = `MCG${randomDigits}`;
        const currentYear = new Date().getFullYear().toString();

        await setDoc(doc(db, "users", emailLower), {
          uid: generatedUid,
          name: adminName.trim(),
          email: emailLower,
          role: "admin",
          teamName: teamName.trim(),
          teamSlug: teamSlug,
          currentYear: currentYear,
          isDeleted: false,
          isFormActive: allowInAppForm, // जर फॉर्म अलाऊ केला तर सुरुवातीला तो ऑन (True) राहील
          allowInAppForm: allowInAppForm, // 👈 डेटाबेसमध्ये परमिशन लॉक झाली
          isProfileComplete: false,
          createdAt: serverTimestamp()
        });
        
        Swal.fire({ icon: 'success', title: 'संघ यशस्वी जोडला!', text: `"${teamName}" संघ जोडला गेला आहे.`, confirmButtonColor: '#ff6600' });
      }

      setTeamName('');
      setAdminName('');
      setAdminEmail('');
      setIsModalOpen(false);
      setEditingEmail(null);
      fetchTeams();

    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'त्रुटी आली!', text: 'डेटा सुरक्षित करताना तांत्रिक चूक झाली.', confirmButtonColor: '#ff6600' });
    } finally {
      setLoading(false);
    }
  };

  // 🛑 ४. सॉफ्ट डी-ॲक्टिव्हेट करणे
  const handleToggleActiveStatus = async (email, currentStatus) => {
    const actionText = currentStatus ? "पुन्हा सक्रिय (Activate)" : "डी-ॲक्टिव्हेट (Deactivate)";
    const result = await Swal.fire({
      title: 'तुम्हाला खात्री आहे का?',
      text: `तुम्हाला या संघाला ${actionText} करायचे आहे का?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#16a34a' : '#dc2626', 
      cancelButtonColor: '#64748b',
      confirmButtonText: currentStatus ? 'हो, सक्रिय करा!' : 'हो, बंद करा!',
      cancelButtonText: 'रद्द करा'
    });

    if (result.isConfirmed) {
      try {
        const userRef = doc(db, "users", email);
        await updateDoc(userRef, {
          isDeleted: !currentStatus,
          isFormActive: currentStatus ? true : false, 
          deletedAt: serverTimestamp()
        });
        Swal.fire({ icon: 'success', title: 'यशस्वी बदल!', text: `संघ यशस्वीरीत्या ${currentStatus ? 'सक्रिय' : 'बंद'} केला गेला.`, showConfirmButton: false, timer: 1500 });
        fetchTeams();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredTeams = teamsList.filter(t => {
    const matchesSearch = t.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.uid && t.uid.toLowerCase().includes(searchTerm.toLowerCase()));
    return viewTab === 'active' ? (matchesSearch && !t.isDeleted) : (matchesSearch && t.isDeleted);
  });

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col md:flex-row font-sans antialiased">
      
      {/* 📱 मोबाईल हेडर */}
      <div className="md:hidden bg-[#0b132b] text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
        <span className="text-base font-black tracking-wide">महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span></span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 text-slate-300 hover:text-white">
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* 🏢 डावा साइडबार */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[#0b132b] text-white p-6 flex flex-col justify-between z-40 transform transition-transform duration-300 ease-in-out md:relative md:transform-none ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div>
          <div className="hidden md:block mb-8">
            <h2 className="text-lg font-black tracking-wide text-white">महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span></h2>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-0.5">Superadmin Panel</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-3 bg-[#ff6600]/10 border-l-4 border-[#ff6600] px-3 py-2.5 rounded-r-lg text-[#ff6600] font-bold text-sm">
              <Users size={18} /><span>टीम्स मॅनेजमेंट</span>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-4 mt-6">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#ff6600]/20 flex items-center justify-center text-xs font-bold text-[#ff6600]">SU</div>
            <p className="text-xs text-slate-400 truncate flex-1">{user?.info?.email || 'admin@govinda.com'}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/20">
            <LogOut size={14} /><span>लॉगआऊट करा</span>
          </button>
        </div>
      </div>

      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden"></div>}

      {/* 🖥️ मुख्य कार्यक्षेत्र */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto z-10 w-full">
        <div className="w-full space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800">संघ व्यवस्थापन (Teams)</h1>
              <p className="text-xs text-slate-500 mt-0.5">युनिक UID पॅटर्न आणि फ्रंट-एंड एक्टिव्ह/डी-एक्टिव्ह सिस्टीम.</p>
            </div>
            <button onClick={() => openModal()} className="hidden sm:flex bg-[#ff6600] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#e65c00] transition-all items-center space-x-2">
              <Plus size={16} /><span>नवीन संघ जोडा</span>
            </button>
          </div>

          <div className="flex space-x-2 border-b border-slate-200 pb-1">
            <button onClick={() => setViewTab('active')} className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${viewTab === 'active' ? 'bg-[#0b132b] text-white' : 'bg-white text-slate-600 border border-slate-200 border-b-0'}`}>🟢 सक्रिय संघ ({teamsList.filter(t => !t.isDeleted).length})</button>
            <button onClick={() => setViewTab('deactive')} className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${viewTab === 'deactive' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200 border-b-0'}`}>🔴 बंद केलेले संघ ({teamsList.filter(t => t.isDeleted).length})</button>
          </div>

          <div className="w-full max-w-md relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={17} /></span>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="UID, संघ किंवा प्रमुख नावाने shoadh..." className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] shadow-sm font-medium transition-all" />
          </div>

          <div className="space-y-3">
            {/* 🖥️ डेस्कटॉप टेबल व्ह्यू */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 w-24">UID</th>
                    <th className="p-4">संघ / टीमचे नाव</th>
                    <th className="p-4">ॲडमीन नाव</th>
                    <th className="p-4">नोंदणी लिंक (WhatsApp)</th>
                    <th className="p-4">स्थितী</th>
                    <th className="p-4 text-center w-28">क्रिया</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {filteredTeams.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-slate-400 text-xs font-medium">या टॅबमध्ये कोणताही संघ उपलब्ध नाही.</td></tr>
                  ) : (
                    filteredTeams.map((t, idx) => {
                      const secureLink = generateSecureLink(t);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-all text-slate-700">
                          <td className="p-4 font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{t.uid || '—'}</td>
                          <td className="p-4 font-black text-slate-900 uppercase tracking-wide">{t.teamName} <span className="text-[11px] text-slate-400 font-normal">({t.currentYear})</span></td>
                          <td className="p-4 font-medium">{t.name}</td>
                          <td className="p-4">
                            {/* 🎯 बदल: जर इन-ॲप फॉर्म अलाऊ नसेल तर सुंदर ग्रे बॅज दिसेल */}
                            {t.allowInAppForm !== false && !t.isDeleted ? (
                              <button onClick={() => copyToClipboard(secureLink)} className="flex items-center space-x-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-600 font-bold px-3 py-1.5 rounded-lg border border-green-200/50 transition-all">
                                <Link2 size={13} /><span>लिंक कॉपी करा</span>
                              </button>
                            ) : (
                              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md font-bold font-mono">📋 फ्री प्लॅन (माहिती फक्त)</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${t.isDeleted ? 'bg-red-50 text-red-600' : (t.isProfileComplete ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600')}`}>
                              {t.isDeleted ? 'बंद' : (t.isProfileComplete ? 'पूर्ण' : 'प्रलंबित')}
                            </span>
                          </td>
                          <td className="p-4 flex items-center justify-center space-x-2">
                            {!t.isDeleted && <button onClick={() => openModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={15} /></button>}
                            <button onClick={() => handleToggleActiveStatus(t.email, t.isDeleted)} className={`p-2 rounded-xl transition-all ${t.isDeleted ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}>
                              {t.isDeleted ? <RotateCcw size={15} /> : <Trash2 size={15} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 📱 मोबाईल कार्ड व्ह्यू */}
            <div className="block md:hidden space-y-3">
              {filteredTeams.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-100">या टॅबमध्ये कोणताही संघ उपलब्ध नाही.</div>
              ) : (
                filteredTeams.map((t, idx) => {
                  const secureLink = generateSecureLink(t);
                  return (
                    <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${t.isDeleted ? 'bg-red-50 text-red-600' : 'bg-[#ff6600]/10 text-[#ff6600]'}`}>{t.uid || 'No UID'}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{t.currentYear}</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide mt-2">{t.teamName}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">प्रमुख: {t.name}</p>
                        </div>
                        <div className="flex space-x-1">
                          {!t.isDeleted && <button onClick={() => openModal(t)} className="p-1 text-blue-600"><Edit2 size={16} /></button>}
                          <button onClick={() => handleToggleActiveStatus(t.email, t.isDeleted)} className={`p-1 ${t.isDeleted ? 'text-green-600' : 'text-red-500'}`}>{t.isDeleted ? <RotateCcw size={16} /> : <Trash2 size={16} />}</button>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-50 pt-2.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">स्थिती:</span>
                          <span className={`font-bold ${t.isDeleted ? 'text-red-600' : (t.isProfileComplete ? 'text-green-600' : 'text-yellow-600')}`}>{t.isDeleted ? 'बंद (Deactive)' : (t.isProfileComplete ? 'पूर्ण झाली' : 'प्रलंबित आहे')}</span>
                        </div>
                        {/* 🎯 मोबाईलमध्येही कडक बॅज */}
                        {t.allowInAppForm !== false && !t.isDeleted ? (
                          <button onClick={() => copyToClipboard(secureLink)} className="w-full flex items-center justify-center space-x-2 bg-green-50 active:bg-green-100 text-green-600 font-bold py-2 rounded-xl text-xs border border-green-200">
                            <Link2 size={14} /><span>नोंदणी लिंक कॉपी करा</span>
                          </button>
                        ) : (
                          <div className="w-full text-center bg-slate-50 text-slate-500 py-2 rounded-xl text-xs font-black border border-slate-200/60">📋 फ्री प्लॅन (माहिती फक्त)</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      <button onClick={() => openModal()} className="sm:hidden fixed bottom-6 right-6 bg-[#ff6600] text-white p-4 rounded-full shadow-xl shadow-[#ff6600]/30 z-20"><Plus size={24} /></button>

      {/* 🗟 पॉप-अप मॉडेल (सुधारित व्हर्जन) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
            <div className="mb-5">
              <h3 className="text-lg font-black text-slate-800">{editingEmail ? 'संघाची माहिती बदला' : 'नवीन संघ नोंदणी'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">सिस्टीम मॅन्युअली कडक आणि युनिक MCG UID जनरेट करेल.</p>
            </div>
            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">टीमचे नाव</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="उदा. शिवनेरी गोविंदा पथक" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium text-slate-800" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ॲडमीनचे नाव (प्रमुख)</label>
                <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="उदा. संदीप महाडिक" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium text-slate-800" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">गुगल लॉगिन ईमेल आयडी</label>
                <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} disabled={editingEmail !== null} placeholder="उदा. admin@gmail.com" className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-slate-50 font-medium ${editingEmail ? 'text-slate-400 cursor-not-allowed' : 'focus:border-[#ff6600] text-slate-800'}`} />
              </div>
              
              {/* 🎯 कडक बदल: इन-ॲप फॉर्म रजिस्ट्रेशनचा ॲक्सेस द्यायचा की नाही ते ठरवणारा प्रिमियम चेकबॉक्स */}
              <div className="pt-2 pb-1 border-t border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-black text-slate-800">In-App Registration Form</span>
                  <span className="block text-[10px] text-slate-400 font-medium mt-0.5">खेळाडू व टी-शर्ट नोंदणीचा फॉर्म चालू करावा का?</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setAllowInAppForm(!allowInAppForm)}
                  className={`p-1.5 rounded-xl transition-all ${allowInAppForm ? 'text-[#ff6600]' : 'text-slate-300'}`}
                >
                  {allowInAppForm ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#ff6600] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#e65c00] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2">
                <PlusCircle size={16} />
                <span>{loading ? 'प्रोसेस होत आहे...' : editingEmail ? 'माहिती अपडेट करा' : 'संघ नोंदणी करा'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}