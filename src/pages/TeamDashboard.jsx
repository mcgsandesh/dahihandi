import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { db } from '../firebase';
import { collection, doc, serverTimestamp, updateDoc, query, where, onSnapshot, setDoc, getDocs, getDocsFromCache } from 'firebase/firestore'; 
import { Plus, X, RotateCcw, Users, Shield, Shirt, User, LayoutDashboard, LogOut, Package, FileText, Settings as SettingsIcon, BarChart3, Trophy, Calendar, BookOpen, Megaphone, Edit2  } from 'lucide-react';
import Swal from 'sweetalert2';

// 🎯 नवीन युनियन हब कॉम्पोनेंट इम्पोर्ट केला
import PublicDashboard from './PublicDashboard'; 

// आपला नवीन कॉमन GLOBAL साईडबार कॉम्पोनेंट
import Sidebar from '../components/Sidebar';

// मॉड्युल्स इम्पोर्ट हब
import Reports from '../components/Reports';
import TshirtForm from '../components/TshirtForm'; 
import TeamProfile from '../components/TeamProfile'; 
import PlayersList from '../components/PlayersList'; 
import ManageInventory from '../components/ManageInventory';
import Settings from '../components/Settings'; 
import PublicDirectory from '../components/PublicDirectory';
import PublicStats from '../components/PublicStats';
import PublicInfo from '../components/PublicInfo';
import PublicNews from '../components/PublicNews';
import PublicEvents from '../components/PublicEvents';
import PublicRecords from '../components/PublicRecords';
import PublicArticles from '../components/PublicArticles';

// मोबाईलसाठी तळाची चिकटलेली ॲड बार
import AdMobileBottom from '../components/AdMobileBottom';

export default function TeamDashboard({ user, onLogout }) {
  
  // जर सूपरॲडमीनने फॉर्म बंद केला असेल, तर थेट 'profile' टॅब ओपन होईल
  const hasFormAccess = user.allowInAppForm !== false;
  const [activeTab, setActiveTab] = useState(hasFormAccess ? 'dashboard' : 'profile'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [playersList, setPlayersList] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);

  const [customTshirt, setCustomTshirt] = useState('');
  const [customShorts, setCustomShorts] = useState('');

  const [isFormActive, setIsFormActive] = useState(user.isFormActive !== false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); 
  const [lang, setLang] = useState('mr'); 

  const [teamData, setTeamData] = useState({
    teamCategory: user.teamCategory || 'Men',
    address: user.address || '',
    establishedYear: user.establishedYear || '',
    slogan: user.slogan || '',
    logoUrl: user.logoUrl || '',
    aboutTeam: user.aboutTeam || '', 
    bestPerformance: user.bestPerformance || '',
    inventory: user.inventory || {}
  });

  // खेळाडू फॉर्म फील्ड्स
  const [playerName, setPlayerName] = useState('');
  const [gender, setGender] = useState('Male');
  const [birthDate, setBirthDate] = useState(''); 
  const [mobileNumber, setMobileNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [tshirtSize, setTshirtSize] = useState('M');
  const [shortsSize, setShortsSize] = useState('M');
  const [needBelt, setNeedBelt] = useState('No');
  const [needTowel, setNeedTowel] = useState('No');
  const [pyramidPlace, setPyramidPlace] = useState('Base'); 
  const [insuranceStatus, setInsuranceStatus] = useState('Pending');
  const [tshirtGiven, setTshirtGiven] = useState('No'); 

  // ==========================================
  // 📌 CORE FUNCTIONS & HELPERS
  // ==========================================
  const shareLink = `${window.location.origin}${import.meta.env.BASE_URL}${(user.teamName || '').toLowerCase().trim().replace(/\s+/g, '-')}/register?t=${btoa(user.uid)}`;

  const handleCopyLink = () => {
    if (!hasFormAccess) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(shareLink); } 
      else {
        const textArea = document.createElement("textarea"); textArea.value = shareLink; document.body.appendChild(textArea);
        textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea);
      }
      setCopied(true); 
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: 'नोंदणी लिंक कॉपी झाली!', showConfirmButton: false, timer: 2000, timerProgressBar: true,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error(err); }
  };

  const getInitials = (name) => {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return `${parts[0][0]}`.toUpperCase();
  };

  const calculateAge = (dobString) => {
    if (!dobString || dobString.length < 10) return '—';
    try {
      const parts = dobString.split('/');
      if (parts.length === 3) {
        const birthYear = parseInt(parts[2], 10);
        const currentYear = new Date().getFullYear();
        if (!isNaN(birthYear)) return currentYear - birthYear;
      }
      const altParts = dobString.split('-');
      if (altParts.length === 3) {
        const birthYear = parseInt(altParts[0], 10);
        const currentYear = new Date().getFullYear();
        if (!isNaN(birthYear)) return currentYear - birthYear;
      }
      return '—';
    } catch (e) { return '—'; }
  };

  // 🔄 Master User Data Live Synchronization
  useEffect(() => {
    const teamIdentifier = user.teamUID || user.uid;
    if (!teamIdentifier) return;

    const userDocRef = doc(db, "users", teamIdentifier);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTeamData({
          teamCategory: data.teamCategory || 'Men',
          address: data.address || '',
          establishedYear: data.establishedYear || '',
          slogan: data.slogan || '',
          logoUrl: data.logoUrl || '',
          aboutTeam: data.aboutTeam || '',
          bestPerformance: data.bestPerformance || '',          
          inventory: data.inventory || {},
          areaName: data.areaName || '',
          pincode: data.pincode || '',
          city: data.city || '',
          district: data.district || '',
          state: data.state || '',
          coachName: data.coachName || '',
          captainName: data.captainName || '',
          milestone7: data.milestone7 || '',
          milestone8: data.milestone8 || '',
          milestone9: data.milestone9 || '',
          milestone10: data.milestone10 || '',
          bestPerformanceUrl: data.bestPerformanceUrl || '',
          socialLinks: {
            facebook: data.socialLinks?.facebook || data.facebook || '',
            instagram: data.socialLinks?.instagram || data.instagram || '',
            youtube: data.socialLinks?.youtube || data.youtube || ''
          }
        });
        setIsFormActive(data.isFormActive !== false);
      }
    });

    return () => unsubscribeUser();
  }, [user]);

  // 🔄 Players Cached Fetch Engine
  const fetchTeamPlayers = async (forceServer = false) => {
    const teamIdentifier = user.teamUID || user.uid;
    if (!teamIdentifier || !hasFormAccess) return;

    const playersRef = collection(db, "players");
    const q = query(playersRef, where("teamUID", "==", teamIdentifier));
    let querySnapshot;

    try {
      if (forceServer) throw new Error("Server Refresh Forced");
      querySnapshot = await getDocsFromCache(q);
    } catch (err) {
      querySnapshot = await getDocs(q);
    }

    const players = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isDeleted !== true) {
        players.push({ id: doc.id, ...data });
      }
    });
    setPlayersList(players);
  };

  useEffect(() => {
    fetchTeamPlayers(false);
  }, [user, hasFormAccess]);

  const handleFastToggleInsurance = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Done' || currentStatus === 'झालेले' ? 'Pending' : 'Done';
    try {
      await updateDoc(doc(db, "players", id), { insurance: nextStatus });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `विमा स्थिती: ${nextStatus === 'Done' ? 'झालेले' : 'प्रलंबित'}`, showConfirmButton: false, timer: 1500 });
      setPlayersList(prev => prev.map(p => p.id === id ? { ...p, insurance: nextStatus } : p));
    } catch (err) { console.error(err); }
  };

  const handleFastToggleTshirt = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Yes' ? 'No' : 'Yes';
    try {
      await updateDoc(doc(db, "players", id), { tshirtGiven: nextStatus });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `टी-शर्ट वाटप: ${nextStatus === 'Yes' ? 'दिलेला आहे' : 'बाकी आहे'}`, showConfirmButton: false, timer: 1500 });
      setPlayersList(prev => prev.map(p => p.id === id ? { ...p, tshirtGiven: nextStatus } : p));
    } catch (err) { console.error(err); }
  };

  const openPlayerModal = (player = null) => {
    if (!hasFormAccess) return;
    if (player) {
      setEditingPlayerId(player.id); setPlayerName(player.name); setGender(player.gender || 'Male'); setBirthDate(player.dob || ''); setMobileNumber(player.mobile || ''); setBloodGroup(player.blood || 'B+');
      const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
      if (player.tshirt && !standardSizes.includes(player.tshirt)) { setTshirtSize('Custom'); setCustomTshirt(player.tshirt); } else { setTshirtSize(player.tshirt || 'M'); setCustomTshirt(''); }
      if (player.shorts && !standardSizes.includes(player.shorts)) { setShortsSize('Custom'); setCustomShorts(player.shorts); } else { setShortsSize(player.shorts || 'M'); setCustomShorts(''); }
      setNeedBelt(player.belt || 'No'); setNeedTowel(player.towel || 'No'); setPyramidPlace(player.pyramidPlace || 'Base');
      setInsuranceStatus(player.insurance === 'झालेले' || player.insurance === 'Done' ? 'Done' : 'Pending');
      setTshirtGiven(player.tshirtGiven === 'Yes' || player.tshirtGiven === 'दिलेला' ? 'Yes' : 'No'); 
    } else {
      setEditingPlayerId(null); setPlayerName(''); setGender(teamData.teamCategory === 'Women' ? 'Female' : 'Male'); setBirthDate(''); setMobileNumber(''); setBloodGroup('B+'); setTshirtSize('M'); setShortsSize('M'); setCustomTshirt(''); setCustomShorts(''); setNeedBelt('No'); setNeedTowel('No'); setPyramidPlace('Base'); setInsuranceStatus('Pending'); setTshirtGiven('No'); 
    }
    setIsModalOpen(true);
  };

  const handleSavePlayer = async (e) => {
    e.preventDefault();
    if (user && user.isDeleted === true) {
      Swal.fire({ icon: 'error', title: 'प्रवेश नाकारला!', text: 'तुमचे Account बंद करण्यात आले आहे.', confirmButtonColor: '#ff6600' });
      setIsModalOpen(false); return; 
    }
    if (!playerName || birthDate.length < 10 || !mobileNumber) {
      Swal.fire({ icon: 'warning', title: 'माहिती अपूर्ण!', text: 'कृपया पूर्ण माहिती अचूक भरा.', confirmButtonColor: '#ff6600' }); return;
    }
    setLoading(true);

    const finalTshirt = tshirtSize === 'Custom' ? customTshirt.trim() : tshirtSize;
    const finalShorts = shortsSize === 'Custom' ? customShorts.trim() : shortsSize;
    const teamIdentifier = user.teamUID || user.uid;

    if (!teamIdentifier) {
      Swal.fire({ icon: 'error', title: 'त्रुटी!', text: 'संघ आयडी मिळाला नाही.', confirmButtonColor: '#ff6600' });
      setLoading(false); return;
    }

    try {
      if (editingPlayerId) {
        await updateDoc(doc(db, "players", editingPlayerId), {
          name: playerName.trim(), gender, dob: birthDate, mobile: mobileNumber.trim(), blood: bloodGroup, tshirt: finalTshirt, shorts: finalShorts, belt: needBelt, towel: needTowel, pyramidPlace, insurance: insuranceStatus, tshirtGiven: tshirtGiven, teamUID: teamIdentifier, updatedAt: serverTimestamp()
        });
        Swal.fire({ icon: 'success', title: 'यशस्वी!', text: 'खेळाडूची माहिती सुधारली!', confirmButtonColor: '#0b132b' });
      } 
      else {
        const playerId = `PLY_${Date.now()}`;
        await setDoc(doc(db, "players", playerId), {
          name: playerName.trim(), gender, dob: birthDate, mobile: mobileNumber.trim(), blood: bloodGroup, tshirt: finalTshirt, shorts: finalShorts, belt: needBelt, towel: needTowel, pyramidPlace, insurance: insuranceStatus, tshirtGiven: tshirtGiven, teamUID: teamIdentifier, teamName: user.teamName, year: user.currentYear || "2026", createdAt: serverTimestamp()
        });
        Swal.fire({ icon: 'success', title: 'नोंदणी पूर्ण!', text: 'खेळाडू यशस्वी जोडला गेला.', confirmButtonColor: '#ff6600' });
      }
      setIsModalOpen(false); fetchTeamPlayers(false);
    } catch (err) { 
      console.error(err); Swal.fire({ icon: 'error', title: 'त्रुटी!', text: 'अडचण आली.' }); 
    } finally { setLoading(false); }
  };

  const handleSoftDelete = async (id, name) => {
    Swal.fire({
      title: 'खेळाडू काढायचा का?', text: `तुम्हाला खात्री आहे का की "${name}" ला यादीतून काढून टाकायचे आहे?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#0b132b', confirmButtonText: 'होय, काढा!', cancelButtonText: 'रद्द करा'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateDoc(doc(db, "players", id), { isDeleted: true, deletedAt: serverTimestamp() });
          Swal.fire({ icon: 'success', title: 'काढून टाकले!', text: 'खेळाडू यादीतून निकाला गेला आहे.', confirmButtonColor: '#0b132b' });
          setPlayersList(prev => prev.filter(p => p.id !== id));
        } catch (err) { console.error(err); }
      }
    });
  };

  const handleToggleFormStatus = async () => {
    const nextStatus = !isFormActive; setIsFormActive(nextStatus);
    try { 
      const teamIdentifier = user.teamUID || user.uid;
      await updateDoc(doc(db, "users", teamIdentifier), { isFormActive: nextStatus }); 
    } catch (err) { setIsFormActive(isFormActive); }
  };

  const filteredPlayers = playersList.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.mobile?.includes(searchTerm));

  const mobileTabs = [
    { id: 'profile', label: 'संघ प्रोफाईल', icon: <User size={18} /> },
    { id: 'public_events', label: 'सराव कट्टा', icon: <Calendar size={18} /> },
    { id: 'public_stats', label: 'आकडेवारी', icon: <BarChart3 size={18} /> },
    { id: 'public_records', label: 'रेकॉर्ड्स', icon: <Trophy size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans antialiased pb-16 md:pb-0 text-slate-800 select-none">
      
      {/* 👑 १. इंजेक्टेड ग्लोबल सामायिक साईडबार (Admin Role) */}
      <Sidebar 
        userRole="admin"
        hasFormAccess={hasFormAccess}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMenuOpen={isDrawerOpen}
        setIsMenuOpen={setIsDrawerOpen}
        onLogout={onLogout}
        teamName={user.teamName}
        uid={user.uid}
        lang={lang}
        setEmbeddedTab={setActiveTab} 
        
      />

      {/* 🖥️ २. मुख्य कार्यक्षेत्र */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-screen pb-40 md:pb-6 w-full z-10">
        <div className="w-full space-y-4">
          
          {/* हेडर टायटल आणि लँग्वेज स्किपर पॅनेल */}
          <div className="border-b border-slate-200 pb-2.5 hidden md:flex items-center justify-between text-left">
            <div>
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                {activeTab === 'dashboard' && 'डॅशबोर्ड सारांश'}
                {activeTab === 'players' && 'खेळाडू व्यवस्थापन यादी'}
                {activeTab === 'inventory' && 'इव्हेंटरी स्टॉक मॅनेजमेंट'}
                {activeTab === 'reports' && 'रिपोर्ट पॅनेल'}
                {activeTab === 'profile' && 'संघ अधिकृत प्रोफाईल'}
                {activeTab === 'settings' && 'पॅनेल कॉन्फिगरेशन賽टिंग्ज'}
                {activeTab === 'govinda_katta' && '🚩 गोविंदा कट्टा'}
                {activeTab === 'public_stats' && 'उत्सव आकडेवारी'}
                {activeTab === 'public_info' && 'उत्सव नियमावली'}
                {activeTab === 'public_news' && 'ताज्या घडामोडी'}
                {activeTab === 'public_events' && 'उत्सव व सराव कट्टा'}
                {activeTab === 'public_records' && 'ऐतिहासिक रेकॉर्ड्स'}
                {activeTab === 'articles' && 'दहीहंडी ज्ञानपीठ'}
              </h1>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">संघाची अंतर्गत माहिती आणि डिजिटल मॅनेजमेंट पॅनेल.</p>
            </div>
            
            <div className="flex bg-slate-100 p-0.5 rounded-lg space-x-0.5 border shadow-sm">
              <button onClick={() => setLang('mr')} className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${lang === 'mr' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:text-slate-900'}`}>मराठी</button>
              <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${lang === 'en' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:text-slate-900'}`}>English</button>
            </div>
          </div>

          {/* 📊 MODERN DASHBOARD SUMMARY VIEW */}
          {activeTab === 'dashboard' && hasFormAccess && (() => {
            const tshirtCounts = {}; const shortsCounts = {}; let totalBelt = 0; let totalTowel = 0;
            playersList.forEach(p => {
              if (p.tshirt) tshirtCounts[p.tshirt] = (tshirtCounts[p.tshirt] || 0) + 1;
              if (p.shorts) shortsCounts[p.shorts] = (shortsCounts[p.shorts] || 0) + 1;
              if (p.belt === 'Yes') totalBelt++; if (p.towel === 'Yes') totalTowel++;
            });
            const recentPlayers = [...playersList].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);

            return (
              <div className="w-full space-y-4 animate-in fade-in duration-200 text-left">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="flex items-baseline space-x-2 min-w-0">
                    <h1 className="text-sm font-black text-slate-800 uppercase tracking-wider">डॅशबोर्ड सारांश</h1>
                    <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 bg-slate-50 border px-2 py-0.5 rounded-lg truncate max-w-xs">{user.teamName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => fetchTeamPlayers(true)} className="p-1.5 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl border transition-all active:scale-95" title="यादी रिफ्रेश करा"><RotateCcw size={14} /></button>
                    <button onClick={() => openPlayerModal()} className="hidden sm:flex bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs items-center space-x-1 transition-all active:scale-95"><Plus size={14} /><span>खेळाडू जोडा</span></button>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  <div onClick={() => setActiveTab('players')} className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">एकूण खेळाडू</span></div>
                    <p className="text-xl md:text-2xl font-black text-slate-800 mt-2">{playersList.length}</p>
                    <span className="text-[9px] text-blue-500 font-bold mt-1 block">विवरण पहा</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">विमा पूर्ण</span></div>
                    <p className="text-xl md:text-2xl font-black text-slate-800 mt-2">{playersList.filter(p=>p.insurance==='Done' || p.insurance==='झालेले').length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">प्रलंबित विमा</span></div>
                    <p className="text-xl md:text-2xl font-black text-orange-500 mt-2">{playersList.filter(p=>p.insurance!=='Done' && p.insurance!=='झालेले').length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">टी-शर्ट नोंद</span></div>
                    <p className="text-xl md:text-2xl font-black text-slate-800 mt-2">{playersList.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">शॉर्ट्स नोंद</span></div>
                    <p className="text-xl md:text-2xl font-black text-slate-800 mt-2">{playersList.filter(p=>p.shorts).length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-5 bg-white p-4 rounded-2xl shadow-xs border border-slate-100 space-y-4">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 tracking-wide border-b pb-1.5">टी-शर्ट साईझ वितरण</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(tshirtCounts).map(([size, count]) => (
                          <div key={size} className="bg-purple-50 text-purple-700 font-black text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-purple-100 shadow-xs"><span className="w-1 h-1 rounded-full bg-purple-600"></span><span>{size} : {count}</span></div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 tracking-wide border-b pb-1.5">शॉर्ट्स साईझ वितरण</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(shortsCounts).map(([size, count]) => (
                          <div key={size} className="bg-orange-50 text-orange-700 font-black text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-orange-100 shadow-xs"><span className="w-1 h-1 rounded-full bg-orange-500"></span><span>{size} : {count}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-white p-4 rounded-2xl shadow-xs border border-slate-100 overflow-hidden flex flex-col justify-between">
                    <div className="mb-2"><h3 className="text-xs font-black text-slate-800 tracking-wide">अलीकडील ५ नोंदणीकृत खेळाडू</h3></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50">
                            <th className="py-2 px-1.5">नाव</th>
                            <th className="py-2 px-1.5 text-center">वय</th>
                            <th className="py-2 px-1.5 text-center">टी-शर्ट</th>
                            <th className="py-2 px-1.5 text-right">विमा</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                          {recentPlayers.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/40 transition-all">
                              <td className="py-2 px-1.5 font-black text-slate-800 truncate max-w-[130px]">{p.name}</td>
                              <td className="py-2 px-1.5 text-center text-slate-400 font-medium">{calculateAge(p.dob)}</td>
                              <td className="py-2 px-1.5 text-center text-purple-600 font-mono">{p.tshirt}</td>
                              <td className="py-2 px-1.5 text-right"><span className={`px-2 py-0.2 rounded text-[9px] font-black ${p.insurance === 'Done' || p.insurance === 'झालेले' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{p.insurance === 'Done' || p.insurance === 'झालेले' ? 'झालेले' : 'प्रलंबित'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 👥 VIEW 2: PLAYERS MANAGEMENT LIST */}
          {activeTab === 'players' && hasFormAccess && (
            <PlayersList 
              filteredPlayers={filteredPlayers} searchTerm={searchTerm} setSearchTerm={setSearchTerm} calculateAge={calculateAge} getInitials={getInitials} handleFastToggleInsurance={handleFastToggleInsurance} handleFastToggleTshirt={handleFastToggleTshirt} openPlayerModal={openPlayerModal} handleSoftDelete={handleSoftDelete} setActiveTab={setActiveTab} playersList={playersList} inventoryData={teamData?.inventory} forceRefreshList={() => fetchTeamPlayers(true)}
            />
          )}

          {/* 📦 INVENTORY FULL VIEW */}
          {activeTab === 'inventory' && hasFormAccess && (
            <ManageInventory user={user} teamData={teamData} setTeamData={setTeamData} playersList={playersList} onBack={() => setActiveTab('dashboard')} />
          )}

          {/* REPORT VIEW */}
          {activeTab === 'reports' && hasFormAccess && (
            <div className="animate-in fade-in duration-300 space-y-3"><Reports userTeamName={user.teamName} onBack={() => setActiveTab('dashboard')} /></div>
          )}

          {/* PROFILE VIEW */}
          {activeTab === 'profile' && (
            <div className="w-full mx-auto animate-in fade-in duration-200">              
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs relative">
                <div className="absolute top-4 right-4"><button onClick={() => setIsEditMode(!isEditMode)} className={`p-1.5 rounded-xl transition-all shadow-xs ${isEditMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Edit2 size={14} /></button></div>
                <TeamProfile user={user} teamData={teamData} setTeamData={setTeamData} isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
              </div>
            </div>
          )}

          {/* ⚙️ SETTINGS VIEW */}
          {activeTab === 'settings' && hasFormAccess && (
            <Settings user={user} teamData={teamData} setTeamData={setTeamData} isFormActive={isFormActive} handleToggleFormStatus={handleToggleFormStatus} shareLink={shareLink} copied={copied} handleCopyLink={handleCopyLink} onBack={() => setActiveTab('dashboard')} />
          )}

          {/* 🌐 PUBLIC SYNC VIEWS */}
          {/* 🌐 PUBLIC SYNC VIEWS (🎯 कोअर फिक्स: पॅरेंट टॅब मॅपिंगनुसारच हब रेंडर होईल आणि होम क्लिकवर पूर्ण अनमाउंट होईल!) */}
{/* 🌐 PUBLIC SYNC VIEWS: 'key' मुळे स्टेट बदलताच हा कॉम्पोनेंट पूर्णपणे री-लोड होईल आणि पॅरेंटच्या मुख्य डॅशबोर्डवर उडी मारता येईल! */}
          <div key={activeTab}>
            {['govinda_katta', 'public_stats', 'public_info', 'public_news', 'public_events', 'public_records', 'articles'].includes(activeTab) ? (
              <PublicDashboard 
                isEmbeddedView={true} 
                embeddedTab={activeTab} 
                setEmbeddedTab={setActiveTab} 
                setActiveTab={setActiveTab} 
                user={user}
                handleLogin={null}
                onBackToAdmin={() => setActiveTab(hasFormAccess ? 'dashboard' : 'profile')}
              />
            ) : null}
          </div>
            
        </div>
      </div>

      <AdMobileBottom />

      {/* 📱 मोबाईल स्क्रीनसाठी बॉटम बार */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-1.5 flex justify-around items-center shadow-lg z-30 h-16">
        {mobileTabs.map((btn) => (
          <button 
            key={btn.id} 
            onClick={() => setActiveTab(btn.id)} 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${activeTab === btn.id ? 'text-orange-500 font-black scale-105' : 'text-slate-400 font-bold'}`}
          >
            {btn.icon}
            <span className="text-[9px] mt-0.5">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* मोबाईल प्लस तरंगते फ्लोटिंग बटण */}
      {hasFormAccess && (activeTab === 'dashboard' || activeTab === 'players') && (
        <button onClick={() => openPlayerModal()} className="sm:hidden fixed bottom-20 right-5 bg-orange-500 text-white p-3.5 rounded-full shadow-xl z-20 active:scale-95"><Plus size={20} /></button>
      )}

      {/* गोविंदा खेळाडू नोंदणी पॉप-अप मॉडेल */}
      {isModalOpen && hasFormAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"></div>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl relative z-10 max-h-[82vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 p-1"><X size={18} /></button>
            <div className="mb-3"><h3 className="text-sm font-black text-slate-800">{editingPlayerId ? 'खेळाडूची माहिती सुधारा' : 'गोविंदा खेळाडू नोंदणी'}</h3></div>
            <TshirtForm 
              formData={{ playerName, gender, bloodGroup, pyramidPlace, birthDate, mobileNumber, tshirtSize, shortsSize, customTshirt, customShorts, needBelt, needTowel, insuranceStatus, tshirtGiven }}
              setFormData={(callback) => {
                const updated = callback({ playerName, gender, bloodGroup, pyramidPlace, birthDate, mobileNumber, tshirtSize, shortsSize, customTshirt, customShorts, needBelt, needTowel, insuranceStatus, tshirtGiven });
                if(updated.playerName !== undefined) setPlayerName(updated.playerName); if(updated.gender !== undefined) setGender(updated.gender); if(updated.bloodGroup !== undefined) setBloodGroup(updated.bloodGroup); if(updated.pyramidPlace !== undefined) setPyramidPlace(updated.pyramidPlace); if(updated.birthDate !== undefined) setBirthDate(updated.birthDate); if(updated.mobileNumber !== undefined) setMobileNumber(updated.mobileNumber); if(updated.tshirtSize !== undefined) setTshirtSize(updated.tshirtSize); if(updated.shortsSize !== undefined) setShortsSize(updated.shortsSize); if(updated.customTshirt !== undefined) setCustomTshirt(updated.customTshirt); if(updated.customShorts !== undefined) setCustomShorts(updated.customShorts); if(updated.needBelt !== undefined) setNeedBelt(updated.needBelt); if(updated.needTowel !== undefined) setNeedTowel(updated.needTowel); if(updated.insuranceStatus !== undefined) setInsuranceStatus(updated.insuranceStatus); if(updated.tshirtGiven !== undefined) setTshirtGiven(updated.tshirtGiven);
              }}
              teamData={teamData} onSubmit={handleSavePlayer} loading={loading} buttonText={editingPlayerId ? 'बदल जतन करा' : 'नोंदणी करा'} showInsuranceSelect={true} showDistributionSelect={true} 
            />
          </div>
        </div>
      )}

    </div>
  );
}