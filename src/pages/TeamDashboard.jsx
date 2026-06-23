import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { LayoutDashboard, LogOut, Shield, Shirt, Users, Search, Plus, User, Image, X, Edit2, Trash2, Check, Copy, CheckCircle, Link2, FileText, Phone, MessageSquare } from 'lucide-react';
import Swal from 'sweetalert2';
import Reports from '../components/Reports';

export default function TeamDashboard({ user, onLogout }) {
  
  // ==========================================
  // 📌 SECTION 1: STATES & CONFIGURATION
  // ==========================================
  const [activeTab, setActiveTab] = useState('dashboard'); 
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
  const [teamData, setTeamData] = useState({
    teamCategory: user.teamCategory || 'Men',
    address: user.address || '',
    establishedYear: user.establishedYear || '',
    slogan: user.slogan || '',
    logoUrl: user.logoUrl || ''
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

  // ==========================================
  // 📌 SECTION 2: SMART CORE HELPERS
  // ==========================================
  const shareLink = `${window.location.origin}/${(user.teamName || '').toLowerCase().trim().replace(/\s+/g, '-')}/register?t=${btoa(user.uid)}`;

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(shareLink); } 
      else {
        const textArea = document.createElement("textarea"); textArea.value = shareLink; document.body.appendChild(textArea);
        textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea);
      }
      setCopied(true); 
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'नोंदणी लिंक कॉपी झाली!',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error(err); }
  };

  const handleDateMask = (value) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 8)}`;
    else if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    return v;
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

  const fetchPlayers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "players"));
      const players = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.teamName === user.teamName && !data.isDeleted) { 
          players.push({ id: doc.id, ...data }); 
        }
      });
      setPlayersList(players);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchPlayers(); }, []);

  // ==========================================
  // 📌 SECTION 3: EDIT, TOGGLE & DATA WRITERS
  // ==========================================
  const handleFastToggleInsurance = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Done' || currentStatus === 'झालेले' ? 'Pending' : 'Done';
    try {
      await updateDoc(doc(db, "players", id), { insurance: nextStatus });
      fetchPlayers(); 
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `विमा स्थिती: ${nextStatus === 'Done' ? 'झालेले' : 'प्रलंबित'}`,
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) { console.error(err); }
  };

  const openPlayerModal = (player = null) => {
    if (player) {
      setEditingPlayerId(player.id);
      setPlayerName(player.name);
      setGender(player.gender || 'Male');
      setBirthDate(player.dob || '');
      setMobileNumber(player.mobile || '');
      setBloodGroup(player.blood || 'B+');
      
      const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

      if (player.tshirt && !standardSizes.includes(player.tshirt)) {
        setTshirtSize('Custom'); setCustomTshirt(player.tshirt);
      } else {
        setTshirtSize(player.tshirt || 'M'); setCustomTshirt('');
      }

      if (player.shorts && !standardSizes.includes(player.shorts)) {
        setShortsSize('Custom'); setCustomShorts(player.shorts);
      } else {
        setShortsSize(player.shorts || 'M'); setCustomShorts('');
      }

      setNeedBelt(player.belt || 'No');
      setNeedTowel(player.towel || 'No');
      setPyramidPlace(player.pyramidPlace || 'Base');
      setInsuranceStatus(player.insurance === 'झालेले' || player.insurance === 'Done' ? 'Done' : 'Pending');
    } else {
      setEditingPlayerId(null);
      setPlayerName('');
      setGender(teamData.teamCategory === 'Women' ? 'Female' : 'Male');
      setBirthDate('');
      setMobileNumber('');
      setBloodGroup('B+');
      setTshirtSize('M');
      setShortsSize('M');
      setCustomTshirt('');
      setCustomShorts('');
      setNeedBelt('No');
      setNeedTowel('No');
      setPyramidPlace('Base');
      setInsuranceStatus('Pending');
    }
    setIsModalOpen(true);
  };

  const handleSavePlayer = async (e) => {
    e.preventDefault();
    if (!playerName || birthDate.length < 10 || !mobileNumber) {
      Swal.fire({ icon: 'warning', title: 'माहिती अपूर्ण!', text: 'कृपया पूर्ण माहिती अचूक भरा.', confirmButtonColor: '#ff6600' });
      return;
    }
    setLoading(true);

    const finalTshirt = tshirtSize === 'Custom' ? customTshirt.trim() : tshirtSize;
    const finalShorts = shortsSize === 'Custom' ? customShorts.trim() : shortsSize;

    try {
      if (editingPlayerId) {
        await updateDoc(doc(db, "players", editingPlayerId), {
          name: playerName.trim(), gender, dob: birthDate, mobile: mobileNumber.trim(),
          blood: bloodGroup, tshirt: finalTshirt, shorts: finalShorts, belt: needBelt, towel: needTowel,
          pyramidPlace, insurance: insuranceStatus, updatedAt: serverTimestamp()
        });
        Swal.fire({ icon: 'success', title: 'यशस्वी!', text: 'खेळाडूची माहिती सुधारली!', confirmButtonColor: '#0b132b' });
      } else {
        const playerId = `PLY_${Date.now()}`;
        await setDoc(doc(db, "players", playerId), {
          name: playerName.trim(), gender, dob: birthDate, mobile: mobileNumber.trim(),
          blood: bloodGroup, tshirt: finalTshirt, shorts: finalShorts, belt: needBelt, towel: needTowel,
          pyramidPlace, insurance: insuranceStatus, teamName: user.teamName, year: user.currentYear || "2026", createdAt: serverTimestamp()
        });
        Swal.fire({ icon: 'success', title: 'नोंदणी पूर्ण!', text: 'खेळाडू यशस्वी जोडला गेला.', confirmButtonColor: '#ff6600' });
      }
      setIsModalOpen(false);
      fetchPlayers();
    } catch (err) { Swal.fire({ icon: 'error', title: 'त्रुटी!', text: 'अडचण आली.' }); } finally { setLoading(false); }
  };

  const handleSoftDelete = async (id, name) => {
    Swal.fire({
      title: 'खेळाडू काढायचा का?',
      text: `तुम्हाला खात्री आहे का की "${name}" ला यादीतून काढून टाकायचे आहे?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#0b132b',
      confirmButtonText: 'होय, काढा!',
      cancelButtonText: 'रद्द करा'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateDoc(doc(db, "players", id), { isDeleted: true, deletedAt: serverTimestamp() });
          Swal.fire({ icon: 'success', title: 'काढून टाकले!', text: 'खेळाडू यादीतून काढला गेला आहे.', confirmButtonColor: '#0b132b' });
          fetchPlayers();
        } catch (err) { Swal.fire('त्रुटी!', 'अडचण आली.', 'error'); }
      }
    });
  };

  const handleToggleFormStatus = async () => {
    const nextStatus = !isFormActive;
    setIsFormActive(nextStatus);
    try { await updateDoc(doc(db, "users", user.info.email), { isFormActive: nextStatus }); } catch (err) { setIsFormActive(isFormActive); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.info.email), { ...teamData });
      Swal.fire({ icon: 'success', title: 'जतन झाले!', text: 'संघ प्रोफाईल अपडेट झाली.', confirmButtonColor: '#0b132b' });
      setIsEditMode(false);
    } catch (err) { Swal.fire('त्रुटी!', 'अपयश आले.', 'error'); } finally { setLoading(false); }
  };

  const filteredPlayers = playersList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.mobile.includes(searchTerm));

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans antialiased pb-16 md:pb-0 text-slate-800">
      
      {/* 📱 मोबाईल टॉप हेडर */}
      <div className="md:hidden bg-[#0b132b] text-white px-4 py-3 flex items-center justify-between shadow-md z-30 sticky top-0">
        <span className="text-base font-black tracking-wide uppercase truncate">{user.teamName}</span>
        <div className="bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ff6600] px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono">{user.uid}</div>
      </div>

      {/* 🏢 डेस्कटॉप साइडबार */}
      <div className="hidden md:flex w-64 bg-[#0b132b] text-white p-6 flex-col justify-between z-40">
        <div>
          <div className="mb-8"><h2 className="text-lg font-black text-white uppercase truncate tracking-wide">{user.teamName}</h2></div>
          <div className="space-y-1">
            {[
              { id: 'dashboard', label: 'डॅशबोर्ड', icon: <LayoutDashboard size={18} /> },
              { id: 'players', label: 'खेळाडू यादी', icon: <Users size={18} /> },
              { id: 'reports', label: 'रिपोर्ट पॅनेल', icon: <FileText size={18} /> },
              { id: 'profile', label: 'संघ प्रोफाईल', icon: <User size={18} /> }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-[#ff6600] text-white shadow-lg shadow-[#ff6600]/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{tab.icon}<span>{tab.label}</span></button>
            ))}
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-red-600/10 text-red-400 py-3 rounded-xl text-xs font-bold border border-red-500/10 hover:bg-red-600 hover:text-white transition-all"><LogOut size={14} /><span>लॉगआऊट</span></button>
      </div>

      {/* 🖥️ मुख्य कार्यक्षेत्र */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="w-full space-y-6">
          
          {/* ==========================================
          // 📊 MODERN DASHBOARD VIEW (5 CARDS IN ROW)
          // ========================================== */}
          {activeTab === 'dashboard' && (() => {
            const tshirtCounts = {};
            const shortsCounts = {};
            let totalBelt = 0;
            let totalTowel = 0;

            playersList.forEach(p => {
              if (p.tshirt) tshirtCounts[p.tshirt] = (tshirtCounts[p.tshirt] || 0) + 1;
              if (p.shorts) shortsCounts[p.shorts] = (shortsCounts[p.shorts] || 0) + 1;
              if (p.belt === 'Yes') totalBelt++;
              if (p.towel === 'Yes') totalTowel++;
            });

            const recentPlayers = [...playersList]
              .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
              .slice(0, 5);

            return (
              <div className="w-full space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">डॅशबोर्ड</h1>
                  <button onClick={() => openPlayerModal()} className="hidden sm:flex bg-[#ff6600] hover:bg-[#e65c00] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md items-center space-x-2 transition-all">
                    <Plus size={16} /><span>खेळाडू जोडा</span>
                  </button>
                </div>

                {/* 🎯 ५ कडक प्रीमियम स्टॅट्स कार्ड्स एका सरळ रेषेत (Desktop: grid-cols-5, Mobile: grid-cols-3) */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-5">
                  <div onClick={() => setActiveTab('players')} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/60 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">एकूण खेळाडू</span>
                      <div className="w-7 h-7 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><Users size={14} /></div>
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-slate-800 mt-3">{playersList.length}</p>
                    <span className="text-[10px] text-blue-500 font-bold mt-2 block">View Details</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">विमा पूर्ण</span>
                      <div className="w-7 h-7 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center"><Shield size={14} /></div>
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-slate-800 mt-3">{playersList.filter(p=>p.insurance==='Done' || p.insurance==='झालेले').length}</p>
                    <span className="text-[10px] text-emerald-500 font-bold mt-2 block">View Details</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">प्रलंबित विमा</span>
                      <div className="w-7 h-7 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"><Shield size={14} /></div>
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-orange-500 mt-3">{playersList.filter(p=>p.insurance!=='Done' && p.insurance!=='झालेले').length}</p>
                    <span className="text-[10px] text-orange-500 font-bold mt-2 block">View Details</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">टी-शर्ट नोंद</span>
                      <div className="w-7 h-7 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center"><Shirt size={14} /></div>
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-slate-800 mt-3">{playersList.length}</p>
                    <span className="text-[10px] text-purple-500 font-bold mt-2 block">View Details</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">शॉर्ट्स नोंद</span>
                      <div className="w-7 h-7 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center"><Shirt size={14} /></div>
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-slate-800 mt-3">{playersList.filter(p=>p.shorts).length}</p>
                    <span className="text-[10px] text-indigo-500 font-bold mt-2 block">View Details</span>
                  </div>
                </div>

                {/* 🏛️ २-कॉलम लेआउट (डावीकडे सुंदर चार्ट्स, उजवीकडे क्लिन टेबल) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* डावीकडील ५-कॉलम आकाराचे कडक वितरण */}
                  <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100/60 space-y-5">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-wide border-b pb-2">टी-शर्ट साईझ वितरण</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(tshirtCounts).map(([size, count]) => (
                          <div key={size} className="bg-purple-50/50 text-purple-700 font-black text-xs px-3 py-2 rounded-xl flex items-center gap-2 border border-purple-100/40 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                            <span>{size} : {count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-wide border-b pb-2">शॉर्ट्स साईझ वितरण</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(shortsCounts).map(([size, count]) => (
                          <div key={size} className="bg-orange-50/50 text-orange-700 font-black text-xs px-3 py-2 rounded-xl flex items-center gap-2 border border-orange-100/40 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            <span>{size} : {count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* अतिरिक्त साहित्य व्यवस्थापन काउंटर्स */}
                    {(totalBelt > 0 || totalTowel > 0) && (
                      <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                        {totalBelt > 0 && <div className="bg-slate-50 p-3 rounded-xl text-xs font-bold text-slate-600 flex justify-between items-center"><span>Belt :</span><span className="font-black text-slate-900 bg-white shadow-sm px-2 py-0.5 rounded-lg">{totalBelt}</span></div>}
                        {totalTowel > 0 && <div className="bg-teal-50/50 p-3 rounded-xl text-xs font-bold text-teal-700 flex justify-between items-center"><span>Towel :</span><span className="font-black text-teal-900 bg-white shadow-sm px-2 py-0.5 rounded-lg">{totalTowel}</span></div>}
                      </div>
                    )}
                  </div>

                  {/* उजवीकडील ७-कॉलम आकाराचे कडिंग 'अलीकडील नोंदी' टेबल व्ह्यू */}
                  <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-100/60 overflow-hidden flex flex-col justify-between">
                    <div className="mb-4">
                      <h3 className="text-sm font-black text-slate-800 tracking-wide">अलीकडील ५ नोंदणीकृत खेळाडू</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase bg-slate-50/50">
                            <th className="py-2.5 px-2">नाव</th>
                            <th className="py-2.5 px-2 text-center">वय</th>
                            <th className="py-2.5 px-2 text-center">टी-शर्ट</th>
                            <th className="py-2.5 px-2 text-center">शॉर्ट्स</th>
                            <th className="py-2.5 px-2 text-right">विमा स्थिती</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                          {recentPlayers.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/40 transition-all">
                              <td className="py-3 px-2 font-black text-slate-800 truncate max-w-[140px]">{p.name}</td>
                              <td className="py-3 px-2 text-center text-slate-400 font-medium">{calculateAge(p.dob)}</td>
                              <td className="py-3 px-2 text-center text-purple-600 font-mono">{p.tshirt}</td>
                              <td className="py-3 px-2 text-center text-slate-500 font-mono">{p.shorts || '—'}</td>
                              <td className="py-3 px-2 text-right">
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] ${p.insurance === 'Done' || p.insurance === 'झालेले' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                  {p.insurance === 'Done' || p.insurance === 'झालेले' ? 'झालेले' : 'प्रलंबित'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {recentPlayers.length === 0 && (
                            <tr><td colSpan="5" className="py-6 text-center text-slate-400">एकही खेळाडू नोंदवला नाही.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* जलद कृती बटन्स */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">जलद कृती</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button onClick={() => openPlayerModal()} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 text-left hover:shadow transition-all"><Plus size={16} className="text-emerald-500" /><span className="text-xs font-bold text-slate-700">खेळाडू जोडा</span></button>
                    <button onClick={() => setActiveTab('players')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 text-left hover:shadow transition-all"><Users size={16} className="text-blue-500" /><span className="text-xs font-bold text-slate-700">खेळाडू यादी</span></button>
                    <button onClick={() => setActiveTab('reports')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 text-left hover:shadow transition-all"><FileText size={16} className="text-purple-500" /><span className="text-xs font-bold text-slate-700">रिपोर्ट निर्यात</span></button>
                    <button onClick={() => setActiveTab('profile')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 text-left hover:shadow transition-all"><User size={16} className="text-orange-500" /><span className="text-xs font-bold text-slate-700">टीम प्रोफाईल</span></button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==========================================
          // 👥 VIEW 2: PLAYERS MANAGEMENT LIST
          // ========================================== */}
          {activeTab === 'players' && (
            <>
              <div className="border-b border-slate-200 pb-3"><h1 className="text-xl font-black text-slate-800">खेळाडू यादी ({filteredPlayers.length})</h1></div>
              <div className="w-full relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={18} /></span><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="नाव किंवा मोबाईलने शोधा..." className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none" /></div>
              
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                {filteredPlayers.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">एकही खेळाडू उपलब्ध नाही.</div>
                ) : (
                  filteredPlayers.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-all">
                      <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/20 flex items-center justify-center text-xs font-black text-[#ff6600] flex-shrink-0">
                          {getInitials(p.name)}
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{p.name}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>वय: {calculateAge(p.dob)}</span>
                            <span className="text-slate-300">|</span>
                            <span>T: {p.tshirt}</span>
                            <span className="text-slate-300">|</span>
                            <span>S: {p.shorts}</span>
                            <span className="text-slate-300">|</span>
                            <span 
                              onClick={() => handleFastToggleInsurance(p.id, p.insurance)}
                              className={`cursor-pointer px-2 py-0.5 rounded text-[10px] font-bold ${p.insurance === 'Done' || p.insurance === 'झालेले' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
                            >
                              {p.insurance === 'Done' || p.insurance === 'झालेले' ? 'विमा पूर्ण' : 'विमा प्रलंबित'}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 pl-2">
                        <a href={`tel:${p.mobile}`} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"><Phone size={14} /></a>
                        <a href={`https://wa.me/91${p.mobile}`} target="_blank" rel="noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><MessageSquare size={14} /></a>
                        <button onClick={() => openPlayerModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => handleSoftDelete(p.id, p.name)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
{/* REPORT VIEW */}
{activeTab === 'reports' && (
  <div className="animate-in fade-in duration-300">
    <Reports userTeamName={user.teamName} />
  </div>
)}

          {/* PROFILE VIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden">
                      {teamData.logoUrl ? <img src={teamData.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Image className="text-slate-400" size={24} />}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">{user.teamName}</h2>
                      <p className="text-xs text-[#ff6600] font-bold">{teamData.teamCategory === 'Women' ? 'महिला गोविंदा पथक' : 'पुरुष गोविंदा पथक'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">स्थापना: {teamData.establishedYear || '—'} | पत्ता: {teamData.address || '—'}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsEditMode(!isEditMode)} className={`p-2.5 rounded-xl transition-all ${isEditMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}><Edit2 size={16} /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">पब्लिक फॉर्म स्थिती</span>
                  <button type="button" onClick={handleToggleFormStatus} className={`w-full py-2 rounded-xl text-xs font-black transition-all shadow-sm ${isFormActive ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>{isFormActive ? '🟢 ON' : '🔴 OFF'}</button>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">नोंदणी लिंक</span>
                  <button onClick={handleCopyLink} className={`w-full py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-1 ${copied ? 'bg-emerald-600 text-white' : 'bg-[#ff6600] text-white'}`}>{copied ? <CheckCircle size={14} /> : <Copy size={14} />}<span>{copied ? 'कॉपी झाली!' : 'लिंक कॉपी'}</span></button>
                </div>
              </div>

              {isEditMode && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg">
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">पत्ता</label><input type="text" required value={teamData.address} onChange={(e) => setTeamData({...teamData, address: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50" /></div>
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">स्थापना वर्ष</label><input type="number" required value={teamData.establishedYear} onChange={(e) => setTeamData({...teamData, establishedYear: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50" /></div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#0b132b] text-white py-2.5 rounded-xl font-bold text-xs"><Check size={14} className="inline mr-1"/>जतन करा</button>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 📱 मोबाईल बॉटम बार */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 flex justify-around items-center shadow-lg z-30">
        {[
          { id: 'dashboard', label: 'डॅशबोर्ड', icon: <LayoutDashboard size={20} /> },
          { id: 'players', label: 'खेळाडू', icon: <Users size={20} /> },
          { id: 'reports', label: 'रिपोर्ट', icon: <FileText size={20} /> },
          { id: 'profile', label: 'प्रोफाईल', icon: <User size={20} /> }
        ].map((btn) => (
          <button key={btn.id} onClick={() => setActiveTab(btn.id)} className={`flex flex-col items-center space-y-0.5 transition-all ${activeTab === btn.id ? 'text-[#ff6600] font-bold' : 'text-slate-400'}`}>{btn.icon}<span className="text-[10px]">{btn.label}</span></button>
        ))}
      </div>

      {/* 📱 मोबाईल प्लस तरंगते बटण */}
      {(activeTab === 'dashboard' || activeTab === 'players') && (
        <button onClick={() => openPlayerModal()} className="sm:hidden fixed bottom-20 right-5 bg-[#ff6600] text-white p-4 rounded-full shadow-xl shadow-[#ff6600]/30 z-20"><Plus size={22} /></button>
      )}

      {/* 🗟 प्रगत संपादन मॉडेल (अचूक ड्रॉपडाऊन लेबल्स सह) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 max-h-[85vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 p-1"><X size={20} /></button>
            <div className="mb-4"><h3 className="text-lg font-black text-slate-800">{editingPlayerId ? 'खेळाडूची माहिती सुधारा' : 'गोविंदा खेळाडू नोंदणी'}</h3></div>
            <form onSubmit={handleSavePlayer} className="space-y-4">
              
              <div className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <div><label className="block text-[11px] font-bold text-slate-500 mb-1">पूर्ण नाव</label><input type="text" required value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white font-medium" /></div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">लिंग (Gender)</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">रक्त गट</label>
                    <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700">
                      <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">जन्म तारीख (DD/MM/YYYY)</label>
                    <input type="text" required maxLength="10" value={birthDate} onChange={(e) => setBirthDate(handleDateMask(e.target.value))} placeholder="DD/MM/YYYY" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white font-medium text-slate-700" />
                  </div>
                  <div><label className="block text-[11px] font-bold text-slate-500 mb-1">मोबाईल नंबर</label><input type="tel" required maxLength="10" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white font-medium" /></div>
                </div>

                {/* 💡 आकार चार्ट ड्रॉपडाऊन (S - 36-38 सिस्टीम) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">टी-शर्ट साईझ</label>
                    <select value={tshirtSize} onChange={(e) => setTshirtSize(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 font-bold">
                      <option value="S">S - 36–38</option>
                      <option value="M">M - 38–40</option>
                      <option value="L">L - 40–42</option>
                      <option value="XL">XL - 42–44</option>
                      <option value="2XL">2XL - 44–46</option>
                      <option value="3XL">3XL - 46–48</option>
                      <option value="4XL">4XL - 48–50</option>
                      <option value="Custom">✏️ Custom साईझ</option>
                    </select>
                    {tshirtSize === 'Custom' && (
                      <input type="text" placeholder="उदा. 24" value={customTshirt} onChange={(e) => setCustomTshirt(e.target.value)} className="w-full border border-purple-200 rounded-xl px-2 py-1 text-xs mt-1 bg-purple-50 font-bold" />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">शॉर्ट्स साईझ</label>
                    <select value={shortsSize} onChange={(e) => setShortsSize(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 font-bold">
                      <option value="S">S - 36–38</option>
                      <option value="M">M - 38–40</option>
                      <option value="L">L - 40–42</option>
                      <option value="XL">XL - 42–44</option>
                      <option value="2XL">2XL - 44–46</option>
                      <option value="3XL">3XL - 46–48</option>
                      <option value="4XL">4XL - 48–50</option>
                      <option value="Custom">✏️ Custom साईझ</option>
                    </select>
                    {shortsSize === 'Custom' && (
                      <input type="text" placeholder="उदा. 22" value={customShorts} onChange={(e) => setCustomShorts(e.target.value)} className="w-full border border-orange-200 rounded-xl px-2 py-1 text-xs mt-1 bg-orange-50 font-bold" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Belt</label>
                    <select value={needBelt} onChange={(e) => setNeedBelt(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700">
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">टॉवेल (Towel)</label>
                    <select value={needTowel} onChange={(e) => setNeedTowel(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700">
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Pyramid Place</label>
                    <select value={pyramidPlace} onChange={(e) => setPyramidPlace(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700">
                      {['Base', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Back Shidi', 'Front Shidi', 'Left Shidi', 'Right Shidi', 'Coach', 'Captain', 'Administration'].map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">विमा स्थिती</label>
                    <select value={insuranceStatus} onChange={(e) => setInsuranceStatus(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 font-bold">
                      <option value="Pending">प्रलंबित (Pending)</option>
                      <option value="Done">झालेले (Done)</option>
                    </select>
                  </div>
                </div>

              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#ff6600] text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all"><span>{loading ? 'जतन होत आहे...' : editingPlayerId ? 'बदल जतन करा' : 'नोंदणी करा'}</span></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}