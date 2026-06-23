import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { Users, PlusCircle, LogOut, Menu, X, Plus, Search, Edit2, Trash2, Link2, CheckCircle } from 'lucide-react';

export default function Dashboard({ user, onLogout }) {
  // फॉर्म इनपुट स्टेट्स
  const [teamName, setTeamName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  
  // मॅनेजमेंट आणि डेटा स्टेट्स
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [teamsList, setTeamsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // मॉडेल आणि नेव्हिगेशन स्टेट्स
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null); // एडिटिंग मोड ट्रॅकिंग करण्यासाठी

  // 🔄 १. फायरस्टोरमधून सर्व सक्रिय (Non-Deleted) टीम्स आणणे
  const fetchTeams = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const teams = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // फक्त 'admin' रोल असलेल्या आणि सॉफ्ट डिलीट न झालेल्या टीम्स यादीत दाखवणे
        if (data.role === 'admin' && !data.isDeleted) {
          teams.push(data);
        }
      });
      setTeamsList(teams);
    } catch (err) {
      console.error("टीम्सचा डेटा आणताना एरर आला:", err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // 🔓 २. सिलेक्टेड मोडनुसार (Add/Edit) मॉडेल ओपन करणे
  const openModal = (team = null) => {
    if (team) {
      // --- Edit Mode ---
      setEditingEmail(team.email);
      setTeamName(team.teamName);
      setAdminName(team.name);
      setAdminEmail(team.email);
    } else {
      // --- Add New Mode ---
      setEditingEmail(null);
      setTeamName('');
      setAdminName('');
      setAdminEmail('');
    }
    setMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  // 🔐 ३. वर्ष आणि युनीक UID नुसार ब्रँडेड पब्लिक नोंदणी लिंक तयार करणे
  const generateSecureLink = (team) => {
    if (!team.uid || !team.currentYear) return '';
    const baseUrl = window.location.origin;
    // तुमच्या गरजेनुसार कडक ब्रँडेड फॉरमॅट: baseurl/year/uid/register
    return `${baseUrl}/${team.currentYear}/${team.uid}/register`;
  };

  // 📋 ४. सुरक्षित लिंक क्लिपबोर्डमध्ये कॉपी करणे
  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link);
    alert("🔒 अधिकृत ब्रँडेड नोंदणी लिंक कॉपी झाली आहे! तुम्ही ही खेळाडूंच्या व्हॉट्सॲप ग्रुपवर शेअर करू शकता.");
  };

  // 💾 ५. संघ जोडणे किंवा अपडेट करणे (Add & Edit Same Form Submit)
  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!teamName || !adminName || !adminEmail) {
      setMessage({ type: 'error', text: 'कृपया सर्व माहिती अचूक भरा!' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const emailLower = adminEmail.trim().toLowerCase();
      const teamSlug = teamName.toLowerCase().trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');

      if (editingEmail) {
        // --- EDIT MODE OPERATE ---
        const userRef = doc(db, "users", editingEmail);
        await updateDoc(userRef, {
          name: adminName.trim(),
          teamName: teamName.trim(),
          teamSlug: teamSlug,
          updatedAt: serverTimestamp()
        });
        setMessage({ type: 'success', text: 'संघाची माहिती यशस्वीरीत्या अपडेट झाली!' });
      } else {
        // --- ADD MODE OPERATE ---
        // 🆔 'MCG' आणि ४ अंकी युनीक नंबरचा कडक कोड जनरेशन
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const generatedUid = `MCG${randomDigits}`;
        const currentYear = new Date().getFullYear().toString(); // ऑटोमॅटिक चालू वर्ष (2026) सेट होईल

        await setDoc(doc(db, "users", emailLower), {
          uid: generatedUid,
          name: adminName.trim(),
          email: emailLower,
          role: "admin",
          teamName: teamName.trim(),
          teamSlug: teamSlug,
          currentYear: currentYear, // वर्ष मेंटेन केले
          isDeleted: false,
          isProfileComplete: false, // संघ प्रमुख पहिल्या लॉगिनला ही माहिती पूर्ण करेल
          createdAt: serverTimestamp()
        });
        setMessage({ type: 'success', text: `"${teamName}" संघ ${generatedUid} आयडीसह यशस्वीरीत्या जोडला गेला!` });
      }

      // फॉर्म क्लिअर आणि रिफ्रेशमेंट
      setTeamName('');
      setAdminName('');
      setAdminEmail('');
      fetchTeams();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingEmail(null);
      }, 1200);

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'डेटा सुरक्षित करताना काहीतरी चूक झाली.' });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ ६. सॉफ्ट डिलीट सिस्टीम (Soft Delete Process)
  const handleSoftDelete = async (email) => {
    if (window.confirm("तुम्हाला खात्री आहे की हा संघ यादीतून काढून टाकायचा आहे? (याने डेटा सुरक्षित राहील)")) {
      try {
        const userRef = doc(db, "users", email);
        await updateDoc(userRef, {
          isDeleted: true,
          deletedAt: serverTimestamp()
        });
        alert("संघ यशस्वीरीत्या यादीतून काढला गेला आहे.");
        fetchTeams();
      } catch (err) {
        console.error(err);
        alert("काढून टाकताना एरर आला.");
      }
    }
  };

  // 🔍 ७. सर्च बार फिल्टरेशन (UID, टीम नाव किंवा प्रमुख नावाने शोध)
  const filteredTeams = teamsList.filter(t => 
    t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.uid && t.uid.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col md:flex-row font-sans antialiased">
      
      {/* 📱 मोबाईल हेडर */}
      <div className="md:hidden bg-[#0b132b] text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
        <span className="text-lg font-black tracking-wide">
          महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span>
        </span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 text-slate-300 hover:text-white">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 🏢 डावा साइडबार */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-[#0b132b] text-white p-6 flex flex-col justify-between z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:transform-none
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          <div className="hidden md:block mb-8">
            <h2 className="text-xl font-black tracking-wide text-white">
              महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span>
            </h2>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-0.5">Superadmin Panel</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-3 bg-[#ff6600]/10 border-l-4 border-[#ff6600] px-3 py-2.5 rounded-r-lg text-[#ff6600] font-bold text-sm">
              <Users size={18} />
              <span>टीम्स मॅनेजमेंट</span>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-4 mt-6">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#ff6600]/20 flex items-center justify-center text-xs font-bold text-[#ff6600]">SU</div>
            <p className="text-xs text-slate-400 truncate flex-1">{user.info.email}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/20">
            <LogOut size={14} />
            <span>लॉगआऊट करा</span>
          </button>
        </div>
      </div>

      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden"></div>}

      {/* 🖥️ मुख्य कार्यक्षेत्र */}
      <div className="flex-1 p-4 md:p-10 overflow-y-auto z-10">
        <div className="max-w-5xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800">संघ व्यवस्थापन (Teams)</h1>
              <p className="text-xs text-slate-500 mt-0.5">युनिक UID पॅटर्न आणि वर्षनिहाय सुरक्षित नोंदणी सिस्टीम.</p>
            </div>
            <button onClick={() => openModal()} className="hidden sm:flex bg-[#ff6600] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#e65c00] transition-all items-center space-x-2">
              <Plus size={16} />
              <span>नवीन संघ जोडा</span>
            </button>
          </div>

          {/* 🔍 सर्च बार */}
          <div className="w-full max-w-md relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={18} /></span>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="UID आयडी, संघ किंवा प्रमुख नावाने शोधा..." className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] shadow-sm font-medium transition-all" />
          </div>

          {/* नोंदणी यादी */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">नोंदणी झालेले संघ ({filteredTeams.length})</h3>
            
            {/* 🖥️ डेस्कटॉप टेबल व्ह्यू */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">UID</th>
                    <th className="p-4">संघ / टीमचे नाव</th>
                    <th className="p-4">ॲडमिन नाव</th>
                    <th className="p-4">नोंदणी लिंक (WhatsApp)</th>
                    <th className="p-4">प्रोफाईल स्थिती</th>
                    <th className="p-4 text-center">क्रिया</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 text-xs font-medium">कोणताही संघ सापडला नाही.</td>
                    </tr>
                  ) : (
                    filteredTeams.map((t, idx) => {
                      const secureLink = generateSecureLink(t);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-all text-slate-700">
                          <td className="p-4 font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{t.uid || '—'}</td>
                          <td className="p-4 font-bold text-slate-800">{t.teamName} <span className="text-[11px] text-slate-400 font-normal">({t.currentYear})</span></td>
                          <td className="p-4 font-medium">{t.name}</td>
                          <td className="p-4">
                            {t.uid ? (
                              <button 
                                onClick={() => copyToClipboard(secureLink)}
                                className="flex items-center space-x-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-600 font-bold px-3 py-1.5 rounded-lg border border-green-200/50 transition-all"
                              >
                                <Link2 size={13} />
                                <span>लिंक कॉपी करा</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">उपलब्ध नाही</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${t.isProfileComplete ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                              {t.isProfileComplete ? 'पूर्ण' : 'प्रलंबित'}
                            </span>
                          </td>
                          <td className="p-4 flex items-center justify-center space-x-2">
                            <button onClick={() => openModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={15} /></button>
                            <button onClick={() => handleSoftDelete(t.email)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={15} /></button>
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
                <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-100">कोणताही संघ सापडला नाही.</div>
              ) : (
                filteredTeams.map((t, idx) => {
                  const secureLink = generateSecureLink(t);
                  return (
                    <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-bold bg-[#ff6600]/10 text-[#ff6600] px-2 py-0.5 rounded-md">{t.uid || 'No UID'}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{t.currentYear}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 mt-2">{t.teamName}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">प्रमुख: {t.name}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button onClick={() => openModal(t)} className="p-1 text-blue-600"><Edit2 size={16} /></button>
                          <button onClick={() => handleSoftDelete(t.email)} className="p-1 text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-50 pt-2.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">प्रोफाईल स्थिती:</span>
                          <span className={`font-bold ${t.isProfileComplete ? 'text-green-600' : 'text-yellow-600'}`}>
                            {t.isProfileComplete ? 'पूर्ण झाली' : 'प्रलंबित आहे'}
                          </span>
                        </div>
                        {t.uid && (
                          <button 
                            onClick={() => copyToClipboard(secureLink)}
                            className="w-full flex items-center justify-center space-x-2 bg-green-50 active:bg-green-100 text-green-600 font-bold py-2 rounded-xl text-xs border border-green-200"
                          >
                            <Link2 size={14} />
                            <span>नोंदणी लिंक कॉपी करा</span>
                          </button>
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

      {/* 📱 मोबाईल प्लस बटण */}
      <button onClick={() => openModal()} className="sm:hidden fixed bottom-6 right-6 bg-[#ff6600] text-white p-4 rounded-full shadow-xl shadow-[#ff6600]/30 z-20"><Plus size={24} /></button>

      {/* 🗟 सामायिक नोंदणी / संपादन पॉप-अप मॉडेल */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 border border-slate-100">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
            <div className="mb-5">
              <h3 className="text-lg font-black text-slate-800">{editingEmail ? 'संघाची माहिती बदला' : 'नवीन संघ नोंदणी'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{editingEmail ? 'बदलेली माहिती डेटाबेसमध्ये अपडेट होईल.' : 'सिस्टीम मॅन्युअली कडक MCG UID जनरेट करेल.'}</p>
            </div>
            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">महोत्सव / टीमचे नाव</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="उदा. शिवनेरी गोविंदा पथक" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ॲडमिनचे नाव (प्रमुख)</label>
                <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="उदा. संदीप महाडिक" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">गुगल लॉगिन ईमेल आयडी</label>
                <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} disabled={editingEmail !== null} placeholder="उदा. admin@gmail.com" className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-slate-50 font-medium ${editingEmail ? 'text-slate-400 cursor-not-allowed' : 'focus:border-[#ff6600]'}`} />
              </div>
              {message.text && <p className={`text-xs font-bold pt-1 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>}
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