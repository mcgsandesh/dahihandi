import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, getDocs, getDocsFromCache, serverTimestamp, query, where, writeBatch } from 'firebase/firestore'; 
import { Users, PlusCircle, LogOut, Menu, X, Plus, Search, Edit2, Trash2, Link2, RotateCcw, CheckSquare, Square, Bell, Layers, BarChart3, BookOpen, Eye, UploadCloud, Send, Filter,Settings,Megaphone,Calendar ,Trophy  } from 'lucide-react'; // 🎯 नवीन आयकॉन्स इम्पोर्ट केले
import Swal from 'sweetalert2';

// 🎯 ३ स्वतंत्र सब-कॉम्पोनेंट्स इम्पॉर्ट केले
import PublicDirectory from '../components/PublicDirectory';
import PublicStats from '../components/PublicStats';
import PublicInfo from '../components/PublicInfo';
import PublicTeamProfile from '../components/PublicTeamProfile'; 
// 🆕 नवीन जोडलेले मेंटेनन्स आधारित पब्लिक कॉम्पोनेंट्स
import PublicNews from '../components/PublicNews';
import PublicEvents from '../components/PublicEvents';
import PublicRecords from '../components/PublicRecords';

// 🎯 नवीन मेंटेनन्स मॅनेजमेंट कॉम्पोनंट इम्पॉर्ट (Superadmin साठी)
import ManageMaintenance from '../components/ManageMaintenance';


export default function Dashboard({ user, onLogout }) {
  // Form input states
  const [teamName, setTeamName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [allowInAppForm, setAllowInAppForm] = useState(true); 
  const [teamCategory, setTeamCategory] = useState('Men');
  // Data states
  const [loading, setLoading] = useState(false);
  const [teamsList, setTeamsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTab, setViewTab] = useState('active'); // 'active', 'deactive', 'form_allowed' 🎯 नवीन टॅब सपोर्ट
  const [categoryFilter, setCategoryFilter] = useState('All'); // 🎯 'All', 'Men', 'Women', 'Both' फिल्टर स्टेट
  
  // UI states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamUid, setEditingTeamUid] = useState(null); 

  const [activeMenu, setActiveMenu] = useState('teams'); 

  const [importLoading, setImportLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null); 

  const handleBulkImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportLoading(true);
    console.log("📂 [File Selected]: फाईल सापडली:", file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, 
      quoteChar: '"',      
      escapeChar: '"',
      complete: async (results) => {
        const rows = results.data;
        
        console.log("📊 [CSV Parse Success]: एकूण ओळी (Rows) वाचल्या:", rows.length);
        console.log("🔍 [First Row Sample]: पहिल्या ओळीचा डेटा कसा दिसतोय:", rows[0]);

        if (rows.length === 0) {
          Swal.fire({ icon: 'error', title: 'फाईल रिकामी आहे!', text: 'निवडलेल्या CSV फाईलमध्ये कोणताही डेटा सापडला नाही.' });
          setImportLoading(false);
          return;
        }
        
        try {
          const currentYear = new Date().getFullYear().toString();
          const chunkSize = 400; 
          let totalProcessed = 0;

          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            console.log(`📦 [Processing Chunk]: ओळ क्रमांक ${i} ते ${i + chunk.length} प्रोसेस होत आहे...`);
            
            const batch = writeBatch(db);
            let chunkValidRowsCount = 0;

            chunk.forEach((row, index) => {
              if (!row.UID || !row.TeamName) {
                console.warn(`⚠️ [Skipped Row ${i + index + 1}]: UID किंवा TeamName सापडले नाही! तपासणी करा:`, row);
                return; 
              }

              chunkValidRowsCount++;
              const docId = row.UID.toString().trim(); 
              const emailLower = row.AdminEmail ? row.AdminEmail.toString().trim().toLowerCase() : '';
              const adminArray = emailLower ? emailLower.split(',').map(em => em.trim()).filter(em => em !== '') : [];

              let mobileArray = [];
              if (row.Mobiles) {
                mobileArray = row.Mobiles.toString().split(',').map(num => num.trim()).filter(num => num !== '');
              }

              let cleanName = row.TeamName.toString().trim();
              cleanName = cleanName.replace(/\s*-\s*.+$/gi, '');
              cleanName = cleanName.replace(/\s*\(.+?\)/gi, '');
              cleanName = cleanName.replace(/\s*(Govinda?\s*P[ha]+t[ha]k|Dahi\s*Handi\s*P[ha]+t[ha]k|P[ha]+t[ha]k|Govinda?)/gi, '');
              cleanName = cleanName.replace(/\s*(गोविंदा\s*पथक|गोविंद\s*पथक|दहीहंडी\s*पथक|पथक|गोविंदा)/gi, '');

              const trailingWordsToRemove = ['jogeshwari', 'west', 'east', 'malad', 'kalyan', 'mumbai', 'thane', 'डोबिवली', 'कल्याण', 'मुंबई', 'ठाणे'];
              trailingWordsToRemove.forEach(word => {
                const regex = new RegExp(`\\s+${word}\\s*$` , 'gi');
                cleanName = cleanName.replace(regex, '');
              });

              cleanName = cleanName.replace(/\s+/g, ' ').trim();
              if (!cleanName) cleanName = row.TeamName.toString().trim();

              const teamSlug = cleanName.toLowerCase().replace(/[^a-zA-Z0-9\s-\u0900-\u097F]/g, '').replace(/\s+/g, '-');

              const docRef = doc(db, "users", docId);
              
              const uploadData = {
                uid: docId,
                teamName: cleanName, 
                name: row.AdminName ? row.AdminName.toString().trim() : 'प्रमुख ॲडमीन', 
                email: emailLower,
                admins: adminArray,
                mobiles: mobileArray,            
                role: "admin",
                teamSlug: teamSlug,
                teamCategory: row.Category || 'Men',
                coachName: row.CoachName ? row.CoachName.toString().trim() : '',
                captainName: row.CaptainName ? row.CaptainName.toString().trim() : '',
                isRegistered: row.IsRegistered === 'Yes' || row.IsRegistered === true, 
                regNumber: row.RegNumber ? row.RegNumber.toString().trim() : '',
                address: row.Address ? row.Address.toString().trim() : row.TeamName.toString().trim(), 
                areaName: row.AreaName ? row.AreaName.toString().trim() : '',
                pincode: row.Pincode ? row.Pincode.toString().trim() : '',
                city: row.City ? row.City.toString().trim() : '',
                district: row.District ? row.District.toString().trim() : '',
                state: row.State ? row.State.toString().trim() : '',
                slogan: row.Slogan ? row.Slogan.toString().trim() : '',
                establishedYear: row.EstablishedYear ? row.EstablishedYear.toString().trim() : '',
                aboutTeam: row.AboutTeam ? row.AboutTeam.toString().trim() : '',
                bestPerformance: row.BestPerformance ? row.BestPerformance.toString().trim() : '',
                bestPerformanceUrl: row.BestPerformanceUrl ? row.BestPerformanceUrl.toString().trim() : '',
                logoUrl: row.LogoUrl ? row.LogoUrl.toString().trim() : '',
                hasInsurance: true, 
                milestone7: row.Milestone7 ? row.Milestone7.toString().trim() : '',
                milestone8: row.Milestone8 ? row.Milestone8.toString().trim() : '',
                milestone9: row.Milestone9 ? row.Milestone9.toString().trim() : '',
                milestone10: row.Milestone10 ? row.Milestone10.toString().trim() : '',
                socialLinks: {
                  facebook: row.Facebook ? row.Facebook.toString().trim() : '',
                  instagram: row.Instagram ? row.Instagram.toString().trim() : '',
                  youtube: row.Youtube ? row.Youtube.toString().trim() : ''
                },
                currentYear: currentYear,
                isDeleted: false,
                isFormActive: false, 
                allowInAppForm: false,
                isProfileComplete: true, 
                profileUpdatedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };

              batch.set(docRef, uploadData);
            });

            console.log(`⏳ [Committing Batch]: ${chunkValidRowsCount} रेकॉर्ड्स फायरबेसवर पाठवत आहे...`);
            
            if (chunkValidRowsCount > 0) {
              await batch.commit();
              totalProcessed += chunkValidRowsCount;
              console.log(`✓ [Batch Success]: ${chunkValidRowsCount} रेकॉर्ड्स डेटाबेसमध्ये यशस्वी जमा झाले!`);
            } else {
              console.warn("🛑 [Batch Skipped]: या तुकड्यात एकही व्हॅलिड ओळ नव्हती.");
            }
          }

          Swal.fire({
            icon: totalProcessed > 0 ? 'success' : 'info',
            title: totalProcessed > 0 ? 'इम्पोर्ट कडक पूर्ण! 🎉' : 'डेटा अपलोड झाला नाही!',
            text: `एकूण ${totalProcessed} संघांचा डेटाबेसमध्ये रेकॉर्ड तयार झाला आहे.`,
            confirmButtonColor: '#ff6600',
            customClass: { popup: 'rounded-3xl' }
          });
          
          fetchTeams();

        } catch (err) {
          console.error("❌❌❌ [FIRESTORE WRITE ERROR]:", err);
          Swal.fire({ 
            icon: 'error', 
            title: 'फायरबेस रायटिंग एरर!', 
            text: `त्रुटी: ${err.message || 'तपशील पाहण्यासाठी कन्सोल लॉग check करा.'}` 
          });
        } finally {
          setImportLoading(false);
          e.target.value = ''; 
        }
      }
    });
  };

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
        console.log(`🌍 [SuperAdmin] सर्व्हेर रीड पूर्ण! एकूण फ्रेश एंट्रीज: ${querySnapshot.size} 🌍`);
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
      setEditingTeamUid(team.id); 
      setTeamName(team.teamName);
      setAdminName(team.name);
      
      if (team.admins && Array.isArray(team.admins)) {
        setAdminEmail(team.admins.join(', ')); 
      } else {
        setAdminEmail(team.email || '');
      }
      
      setAllowInAppForm(team.allowInAppForm !== false);
      setTeamCategory(team.teamCategory || 'Men');
    } else {
      setEditingTeamUid(null); 
      setTeamName('');
      setAdminName('');
      setAdminEmail('');
      setTeamCategory('Men');
      setAllowInAppForm(true); 
    }
    setIsModalOpen(true);
  };

  const generateSecureLink = (team) => {
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

      if (editingTeamUid) { 
        const userRef = doc(db, "users", editingTeamUid); 
        await updateDoc(userRef, {
          name: adminName.trim(),
          email: emailLower, 
          admins: adminEmail.split(',').map(e => e.trim().toLowerCase()),
          teamName: teamName.trim(),
          teamSlug: teamSlug,
          teamCategory: teamCategory,
          allowInAppForm: allowInAppForm,
          updatedAt: serverTimestamp()
        });
        Swal.fire({ icon: 'success', title: 'माहिती अपडेट झाली!', text: 'संघाची माहिती यशस्वीरीत्या बदलण्यात आली आहे.', showConfirmButton: false, timer: 1500 });
      } 
      else {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const generatedUid = `MCG${randomDigits}`; 
        const currentYear = new Date().getFullYear().toString();

        await setDoc(doc(db, "users", generatedUid), {
          uid: generatedUid, 
          name: adminName.trim(),
          email: emailLower,
          admins: adminEmail.split(',').map(e => e.trim().toLowerCase()),
          role: "admin",
          teamName: teamName.trim(),
          teamSlug: teamSlug,
          teamCategory: teamCategory,
          currentYear: currentYear,
          isDeleted: false,
          isFormActive: allowInAppForm,
          allowInAppForm: allowInAppForm,
          isProfileComplete: false,
          createdAt: serverTimestamp()
        });
        Swal.fire({ icon: 'success', title: 'संघ यशस्वी जोडला!', text: `"${teamName}" संघ जोडला गेला आहे.`, confirmButtonColor: '#ff6600' });
      }

      setTeamName('');
      setAdminName('');
      setAdminEmail('');
      setTeamCategory('Men');
      setIsModalOpen(false);
      setEditingTeamUid(null); 
      fetchTeams();

    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'त्रुटी आली!', text: 'डेटा सुरक्षित करताना तांत्रिक चूक झाली.', confirmButtonColor: '#ff6600' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActiveStatus = async (teamId, currentStatus) => {
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
        const userRef = doc(db, "users", teamId); 
        await updateDoc(userRef, {
          isDeleted: !currentStatus,
          isFormActive: currentStatus ? true : false, 
          deletedAt: serverTimestamp()
        });
        Swal.fire({ icon: 'success', title: 'यशस्वी बदल!', text: `संघ यशस्वीरीत्या ${currentStatus ? 'सक्रिय' : 'बंद'} केला गेला.`, showConfirmButton: false, timer: 1500 });
        fetchTeams();
      } catch (err) {
        console.error("Status Toggle Error:", err);
      }
    }
  };

  // 🎯 सुधारित फिल्टर मॅकेनिझम: टॅब फिल्टर + कॅटेगरी ड्रॉपडाउन फिल्टर एकत्र काम करतील
  const filteredTeams = teamsList.filter(t => {
    const matchesSearch = t.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.uid && t.uid.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // १. कॅटेगरीनुसार फिल्टर लावणे (All, Men, Women, Both)
    const matchesCategory = categoryFilter === 'All' ? true : (t.teamCategory === categoryFilter);

    // २. टॅब सिलेक्शन नुसार रिटर्न करणे (नवीन फॉर्म अलाऊड टॅब सपोर्ट कडक!)
    if (viewTab === 'active') {
      return matchesSearch && !t.isDeleted && matchesCategory;
    } else if (viewTab === 'deactive') {
      return matchesSearch && t.isDeleted && matchesCategory;
    } else if (viewTab === 'form_allowed') {
      return matchesSearch && !t.isDeleted && t.allowInAppForm !== false && matchesCategory;
    }
    return false;
  });

  const handlePublishLive = async () => {
    setLoading(true);
    try {
      console.log("🔄 " + new Date().getFullYear() + " चा लाईव्ह डेटा कॅश गोळा करणे सुरू...");
      
      const activeTeamsData = teamsList
        .filter(t => !t.isDeleted)
        .map(t => ({
          id: t.id || t.uid,
          teamName: t.teamName || '',
          teamSlug: t.teamSlug || '',
          name: t.name || '', 
          establishedYear: t.establishedYear || '',
          slogan: t.slogan || '',
          logoUrl: t.logoUrl || '',
          aboutTeam: t.aboutTeam || '',
          bestPerformance: t.bestPerformance || '',
          teamCategory: t.teamCategory || 'Men',
          city: t.city || '',
          district: t.district || '',
          state: t.state || '',
          areaName: t.areaName || '',
          coachName: t.coachName || '',
          captainName: t.captainName || '',
          milestone7: t.milestone7 || '',
          milestone8: t.milestone8 || '',
          milestone9: t.milestone9 || '',
          milestone10: t.milestone10 || '',
          bestPerformanceUrl: t.bestPerformanceUrl || '',
          socialLinks: {
            facebook: t.socialLinks?.facebook || '',
            instagram: t.socialLinks?.instagram || '',
            youtube: t.socialLinks?.youtube || ''
          }
        }));

      if (activeTeamsData.length === 0) {
        Swal.fire({ icon: 'warning', title: 'डेटा उपलब्ध नाही!', text: 'कॅश करण्यासाठी एकही सक्रिय संघ सापडला नाही.', confirmButtonColor: '#ff6600' });
        setLoading(false);
        return;
      }

      const cacheRef = doc(db, "public_site_cache", "live_directory");
      await setDoc(cacheRef, {
        teams: activeTeamsData,
        totalTeams: activeTeamsData.length,
        lastPublishedAt: serverTimestamp(),
        version: Date.now() 
      });

      Swal.fire({
        icon: 'success',
        title: 'वेबсайт लाईव्ह झाली! 🎉',
        text: `एकूण ${activeTeamsData.length} संघांचा डेटा यशस्वीरित्या कॅश केला गेला आहे.`,
        confirmButtonColor: '#ff6600',
        customClass: { popup: 'rounded-3xl' }
      });

    } catch (err) {
      console.error("Cache Publish Error:", err);
      Swal.fire({ icon: 'error', title: 'पब्लिश करताना त्रुटी!', text: 'तांत्रिक अडचणीमुळे डेटा लाईव्ह करता आला नाही.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col md:flex-row font-sans antialiased pb-16 md:pb-0 select-none">
      
      {/* 📱 मोबाईल हेडर */}
      <div className="md:hidden bg-[#0b132b] text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
        <span className="text-base font-black tracking-wide">महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span></span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 text-slate-300 hover:text-white">
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

{/* 🏢 डावा साइडबार */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[#0b132b] text-white p-6 flex flex-col justify-between z-50 transform transition-transform duration-300 ease-in-out md:relative md:transform-none ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div>
          <div className="mb-8 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black tracking-wide text-white">महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span></h2>
            <p className="text-[10px] text-[#ff6600] font-bold tracking-widest uppercase mt-0.5">⚙️ Superadmin Panel</p>
          </div>
          
          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-none pr-1">
            <button 
              onClick={() => { setActiveMenu('teams'); setIsMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeMenu === 'teams' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Layers size={18} /><span>टीम्स मॅनेजमेंट</span>
            </button>

            <button 
              onClick={() => { setActiveMenu('govinda_katta'); setIsMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeMenu === 'govinda_katta' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users size={18} /><span className="text-orange-400">🚩 गोविंदा कट्टा</span>
            </button>

            <button 
              onClick={() => { setActiveMenu('public_stats'); setIsMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeMenu === 'public_stats' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <BarChart3 size={18} /><span className="text-amber-400">📊 उत्सव आकडेवारी</span>
            </button>

            <button 
              onClick={() => { setActiveMenu('public_info'); setIsMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeMenu === 'public_info' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <BookOpen size={18} /><span className="text-yellow-400">📜 उत्सव नियमावली</span>
            </button>

            {/* 🎯 नवीन विभाग सेपरेटर: सिस्टीम पब्लिक फीड मॉड्यूल्स */}
            <div className="border-t border-slate-800/80 my-3 pt-3">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest pl-3 mb-1">📢 सिस्टीम फीड व्ह्यू</p>
            </div>

            <button 
              onClick={() => { setActiveMenu('public_news'); setIsMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeMenu === 'public_news' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Megaphone size={18} /><span className="text-teal-400">📢 ताज्या घडामोडी</span>
            </button>

            <button 
              onClick={() => { setActiveMenu('public_events'); setIsMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeMenu === 'public_events' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Calendar size={18} /><span className="text-blue-400">📅 उत्सव व सराव कट्टा</span>
            </button>

            <button 
              onClick={() => { setActiveMenu('public_records'); setIsMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeMenu === 'public_records' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Trophy size={18} /><span className="text-purple-400">🏆 ऐतिहासिक रेकॉर्ड्स</span>
            </button>

            {/* 🛠️ कोअर मॅनेजमेंट विभाग */}
            <div className="border-t border-slate-800/80 my-3 pt-3">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest pl-3 mb-1">⚙️ कोअर सिस्टीम</p>
            </div>

            <button 
              onClick={() => { setActiveMenu('manage_maintenance'); setIsMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeMenu === 'manage_maintenance' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings size={18} /><span className="text-orange-500">⚙️ सिस्टीम मेंटेनन्स</span>
            </button>

            <button 
              onClick={() => { setActiveMenu('approvals'); setIsMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeMenu === 'approvals' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Bell size={18} /><span>मंजुरी कक्ष (Requests)</span>
            </button>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#ff6600]/20 flex items-center justify-center text-xs font-bold text-[#ff6600]">SU</div>
            <p className="text-xs text-slate-400 truncate flex-1">{user?.info?.email || 'admin@govinda.com'}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/20">
            <LogOut size={14} /><span>लॉगआऊट करा</span>
          </button>
        </div>
      </div>

      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden"></div>}

      {/* 🖥️ मुख्य कार्यक्षेत्र */}
      <div className="flex-1 w-full overflow-y-auto">
        
        {/* अ) गोविंदा कट्टा व्ह्यू */}
        {activeMenu === 'govinda_katta' ? (
          <div className="p-4 md:p-6 w-full animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3 mb-5 hidden md:block">
              <h1 className="text-xl md:text-2xl font-black text-slate-800">🚩 गोविंदा कट्टा</h1>
              <p className="text-xs text-slate-500 mt-0.5">नोंदणीकृत दहीहंडी मंडळांची यादी.</p>
            </div>
            <PublicDirectory />
          </div>
        ) : 
        
        /* ब) उत्सव आकडेवारी व्ह्यू */
        activeMenu === 'public_stats' ? (
          <div className="p-4 md:p-6 w-full animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3 mb-5 hidden md:block">
              <h1 className="text-xl md:text-2xl font-black text-slate-800">📊 उत्सव आकडेवारी</h1>
              <p className="text-xs text-slate-500 mt-0.5">मंडळे व पथकांचे थेट विश्लेषण आणि टक्केवारी.</p>
            </div>
            <PublicStats />
          </div>
        ) : 
        
        /* क) उत्सव नियमावली व्ह्यू */
        activeMenu === 'public_info' ? (
          <div className="p-4 md:p-6 w-full animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3 mb-5 hidden md:block">
              <h1 className="text-xl md:text-2xl font-black text-slate-800">📜 उत्सव नियमावली</h1>
              <p className="text-xs text-slate-500 mt-0.5">समन्वय समितीचे नियम व मार्गदर्शक तत्त्वे.</p>
            </div>
            <PublicInfo />
          </div>
        ) : 

        /* 🆕 ड) नवीन जोडलेला सार्वजनिक ताज्या घडामोडी व्ह्यू */
        activeMenu === 'public_news' ? (
          <div className="p-4 md:p-6 w-full animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3 mb-5 hidden md:block">
              <h1 className="text-xl md:text-2xl font-black text-slate-800">📢 ताज्या घडामोडी व सूचना</h1>
              <p className="text-xs text-slate-500 mt-0.5">सिस्टीम द्वारे प्रसारित केलेल्या सर्व अधिकृत सूचना.</p>
            </div>
            <PublicNews />
          </div>
        ) :

        /* 🆕 इ) नवीन जोडलेला उत्सव व सराव कट्टा व्ह्यू */
        activeMenu === 'public_events' ? (
          <div className="p-4 md:p-6 w-full animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3 mb-5 hidden md:block">
              <h1 className="text-xl md:text-2xl font-black text-slate-800">📅 उत्सव व सराव कट्टा</h1>
              <p className="text-xs text-slate-500 mt-0.5">मंडळांची भव्य सराव शिबिरे आणि दहीहंडीचे अचूक नकाशे / ठिकाणे.</p>
            </div>
            <PublicEvents />
          </div>
        ) :

        /* 🆕 फ) नवीन जोडलेला ऐतिहासिक रेकॉर्ड्स व्ह्यू */
        activeMenu === 'public_records' ? (
          <div className="p-4 md:p-6 w-full animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3 mb-5 hidden md:block">
              <h1 className="text-xl md:text-2xl font-black text-slate-800">🏆 ऐतिहासिक रेकॉर्ड्स आणि गॅलरी</h1>
              <p className="text-xs text-slate-500 mt-0.5">सर्वोच्च मानवी मनोरे रचणाऱ्या वीर गोविंदा पथकांची यशोगाथा.</p>
            </div>
            <PublicRecords />
          </div>
        ) :

        
        /* 🎯 ड) सिस्टीम मेंटेनन्स (News, Events, Records Management) */
        activeMenu === 'manage_maintenance' ? (
          <div className="p-4 md:p-6 w-full animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3 mb-5 hidden md:block">
              <h1 className="text-xl md:text-2xl font-black text-slate-800">⚙️ सिस्टीम मेंटेनन्स पॅनल</h1>
              <p className="text-xs text-slate-500 mt-0.5">बातम्या, सराव शिबिरे आणि ऐतिहासिक विश्वविक्रम यांचे थेट नियंत्रण.</p>
            </div>
            <ManageMaintenance />
          </div>
        ) :
        
        /* ड) मंजुरी कक्ष व्ह्यू */
        
        activeMenu === 'approvals' ? (
          <div className="p-4 md:p-6 text-center mt-12 w-full animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm max-w-md mx-auto">
              <p className="text-slate-400 text-sm font-bold animate-pulse">⏳ संघ विनंत्या (Team Requests) लवकरच येत आहेत...</p>
            </div>
          </div>
        ) : (
          
          /* इ) मूळ सुपरॲडमीन मुख्य यादी कार्यक्षेत्र */
          <div className="p-4 md:p-6 w-full">
            <div className="w-full space-y-6">
              
              <div className="flex flex-row items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-lg md:text-2xl font-black text-slate-800">संघ व्यवस्थापन (Teams)</h1>
                  <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 hidden sm:block">युनिक UID पॅटर्न आणि फ्रंट एक्टिव्ह/डी-एक्टिव्ह सिस्टीम.</p>
                </div>

                {/* 🎯 कडक बदल: मोबाईल स्क्रीन फिक्स - बटन्स एकदम लहान आयकॉन पॅटर्न मध्ये राईट साईडला सेट केले! */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  {/* १. Publish Live बटण */}
                  <button
                    onClick={handlePublishLive}
                    disabled={loading}
                    className="bg-slate-900 text-white p-2 md:px-3 md:py-2 rounded-xl font-bold text-xs shadow-md hover:bg-slate-800 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 h-[36px] w-[36px] md:w-auto"
                    title="Publish Live वेबसाइट"
                  >
                    <Send size={14} className="md:mr-0" />
                    <span className="hidden md:inline">Publish Live</span>
                  </button>

                  {/* २. Excel Import बटण */}
                  <label className={`cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white p-2 md:px-3 md:py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-95 h-[36px] w-[36px] md:w-auto ${importLoading ? 'opacity-50 pointer-events-none' : ''}`} title="Excel Import (.csv)">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleBulkImportCSV} 
                      className="hidden" 
                    />
                    <UploadCloud size={14} />
                    <span className="hidden md:inline">Excel Import</span>
                  </label>

                  {/* ३. डेस्कटॉपवर फक्त दिसणारे बटण (मोबाईलवर फ्लोटिंग आहेच) */}
                  <button onClick={() => openModal()} className="hidden md:flex bg-[#ff6600] text-white px-3 py-2 rounded-xl font-bold text-xs shadow-md hover:bg-[#e65c00] transition-all items-center space-x-1.5 h-[36px]">
                    <Plus size={14} /><span>नवीन संघ जोडा</span>
                  </button>
                </div>
              </div>

              {/* 🎯 कडक बदल: नवीन '📋 नोंदणी सुरू' टॅब वाढवला */}
              <div className="flex space-x-1.5 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-none">
                <button onClick={() => setViewTab('active')} className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${viewTab === 'active' ? 'bg-[#0b132b] text-white' : 'bg-white text-slate-600 border border-slate-200 border-b-0'}`}>🟢 सक्रिय ({teamsList.filter(t => !t.isDeleted).length})</button>
                <button onClick={() => setViewTab('form_allowed')} className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${viewTab === 'form_allowed' ? 'bg-green-600 text-white' : 'bg-white text-slate-600 border border-slate-200 border-b-0'}`}>📋 नोंदणी सुरू ({teamsList.filter(t => !t.isDeleted && t.allowInAppForm !== false).length})</button>
                <button onClick={() => setViewTab('deactive')} className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${viewTab === 'deactive' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200 border-b-0'}`}>🔴 बंद केलेले ({teamsList.filter(t => t.isDeleted).length})</button>
              </div>

              {/* 🎯 कडक बदल: सर्चच्या शेजारी कॅटेगरी (All/Men/Women/Both) फिल्टर सिस्टीम */}
              <div className="flex gap-2 w-full max-w-xl items-center">
                <div className="w-full relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={16} /></span>
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="UID, संघ किंवा प्रमुख नावाने शोध..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm focus:outline-none focus:border-[#ff6600] shadow-sm font-medium transition-all h-[38px]" />
                </div>
                
                {/* 🎯 कॅटेगरी फिल्टर ड्रॉपडाउन */}
                <div className="relative flex-shrink-0">
                  <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-500"><Filter size={13} /></span>
                  <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl pl-7 pr-7 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#ff6600] shadow-sm h-[38px] appearance-none cursor-pointer"
                  >
                    <option value="All">All Category</option>
                    <option value="Men">👨‍👦 पुरुष (Men)</option>
                    <option value="Women">👩‍👧 महिला (Women)</option>
                    <option value="Both">👨‍👩‍👦 दोन्ही (Both)</option>
                  </select>
                </div>
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
                        <th className="p-4">स्थिती</th>
                        <th className="p-4 text-center w-36">क्रिया</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      {filteredTeams.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-400 text-xs font-medium">या फिल्टरमध्ये कोणताही संघ उपलब्ध नाही.</td></tr>
                      ) : (
                        filteredTeams.map((t, idx) => {
                          const secureLink = generateSecureLink(t);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-all text-slate-700">
                              <td className="p-4 font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{t.uid || '—'}</td>
                              <td className="p-4 font-black text-slate-900 uppercase tracking-wide">
                                {t.teamName} 
                                <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{t.teamCategory || 'Men'}</span>
                                <span className="ml-1 text-[11px] text-slate-400 font-normal">({t.currentYear})</span>
                              </td>
                              <td className="p-4 font-medium">{t.name}</td>
                              <td className="p-4">
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
                              <td className="p-4 flex items-center justify-center space-x-1">
                                <button 
                                  onClick={() => setSelectedTeam(t)} 
                                  className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                                  title="पब्लिक प्रोफाईल पहा"
                                >
                                  <Eye size={15} />
                                </button>
                                {!t.isDeleted && <button onClick={() => openModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={15} /></button>}
                                <button onClick={() => handleToggleActiveStatus(t.id, t.isDeleted)} className={`p-2 rounded-xl transition-all ${t.isDeleted ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}>
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

                {/* 📱 मोबाईल कॉम्पॅक्ट लिस्ट */}
                <div className="block md:hidden space-y-2">
                  {filteredTeams.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-100">या फिल्टरमध्ये कोणताही संघ उपलब्ध नाही.</div>
                  ) : (
                    filteredTeams.map((t, idx) => {
                      const secureLink = generateSecureLink(t);
                      return (
                        <div key={idx} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span className={`font-mono text-[9px] font-black px-1.5 py-0.5 rounded-md ${t.isDeleted ? 'bg-red-50 text-red-600' : 'bg-[#ff6600]/10 text-[#ff6600]'}`}>{t.uid || 'No UID'}</span>
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">{t.teamCategory || 'Men'}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${t.isDeleted ? 'bg-red-50 text-red-500' : (t.isProfileComplete ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600')}`}>
                                {t.isDeleted ? 'बंद' : (t.isProfileComplete ? 'पूर्ण' : 'प्रलंबित')}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide truncate mt-1">{t.teamName}</h4>
                            <p className="text-[10px] text-slate-500 font-medium truncate">प्रमुख: {t.name}</p>
                          </div>
                          
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <button onClick={() => setSelectedTeam(t)} className="p-2 text-slate-700 bg-slate-50 active:bg-slate-100 rounded-lg border border-slate-100" title="पब्लिक व्ह्यू">
                              <Eye size={13} />
                            </button>
                            {t.allowInAppForm !== false && !t.isDeleted && (
                              <button onClick={() => copyToClipboard(secureLink)} className="p-2 text-green-600 bg-green-50 active:bg-green-100 rounded-lg border border-green-100" title="लिंक कॉपी">
                                <Link2 size={13} />
                              </button>
                            )}
                            {!t.isDeleted && (
                              <button onClick={() => openModal(t)} className="p-2 text-blue-600 bg-blue-50 active:bg-blue-100 rounded-lg border border-blue-100">
                                <Edit2 size={13} />
                              </button>
                            )}
                            <button onClick={() => handleToggleActiveStatus(t.id, t.isDeleted)} className={`p-2 rounded-lg border ${t.isDeleted ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-500 bg-red-50 border-red-100'}`}>
                              {t.isDeleted ? <RotateCcw size={13} /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* मोबाईल प्लस फ्लोटिंग बटण */}
      {activeMenu === 'teams' && (
        <button onClick={() => openModal()} className="sm:hidden fixed bottom-20 right-6 bg-[#ff6600] text-white p-4 rounded-full shadow-xl shadow-[#ff6600]/30 z-20">
          <Plus size={24} />
        </button>
      )}

      {/* 📱 Bottom Navigation बार */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40 flex justify-around items-center py-2 px-1">
        <button onClick={() => setActiveMenu('teams')} className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-3 rounded-xl transition-all ${activeMenu === 'teams' ? 'text-[#ff6600] font-black' : 'text-slate-400 font-bold'}`}>
          <Layers size={18} />
          <span className="text-[10px] tracking-tight">टीम्स</span>
        </button>

        <button onClick={() => setActiveMenu('govinda_katta')} className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-3 rounded-xl transition-all ${activeMenu === 'govinda_katta' ? 'text-[#ff6600] font-black' : 'text-slate-400 font-bold'}`}>
          <Users size={18} />
          <span className="text-[10px] tracking-tight">गोविंदा कट्टा</span>
        </button>

        <button onClick={() => setActiveMenu('public_stats')} className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-3 rounded-xl transition-all ${activeMenu === 'public_stats' ? 'text-[#ff6600] font-black' : 'text-slate-400 font-bold'}`}>
          <BarChart3 size={18} />
          <span className="text-[10px] tracking-tight">आकडेवारी</span>
        </button>

        <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center justify-center space-y-0.5 py-1 px-3 text-slate-400 font-bold rounded-xl transition-all">
          <Menu size={18} />
          <span className="text-[10px] tracking-tight">मेनू</span>
        </button>
      </div>

      {/* 🗟 पॉप-अप मॉडेल फॉर्म */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => { setIsModalOpen(false); setEditingTeamUid(null); }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => { setIsModalOpen(false); setEditingTeamUid(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
            <div className="mb-5">
              <h3 className="text-lg font-black text-slate-800">{editingTeamUid ? 'संघाची माहिती बदला' : 'नवीन संघ नोंदणी'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingTeamUid ? `तुम्ही ${editingTeamUid} चा ईमेल आयडी थेट बदलू शकता. आयडी स्थिर राहील.` : 'सिस्टीम मॅन्युअली कडक आणि युनिक MCG UID जनरेट करेल.'}
              </p>
            </div>
            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">संघाचे नाव</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="उदा. शिवनेरी गोविंदा पथक" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium text-slate-800" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ॲडमीनचे नाव (प्रमुख)</label>
                <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="उदा. संदीप महाडिक" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium text-slate-800" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">गुगल लॉगिन ईमेल आयडी</label>
                <input type="text" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="उदा. admin1@gmail.com, admin2@gmail.com" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-slate-50 font-medium text-slate-800" />
                <p className="text-[10px] text-slate-400 font-medium mt-1">* एकापेक्षा जास्त ॲडमीन असल्यास ईमेल्स मध्ये स्वल्पविराम ( , ) द्यावा.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">संघाचा प्रकार (Category)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Men', label: '👨‍👦 पुरुष' },
                    { id: 'Women', label: '👩‍👧 महिला' },
                    { id: 'Both', label: '👨‍👩‍👦 दोन्ही' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTeamCategory(cat.id)}
                      className={`py-2 px-1 rounded-xl border text-xs font-black transition-all text-center active:scale-95 ${
                        teamCategory === cat.id 
                          ? 'bg-[#0b132b] text-white border-[#0b132b] shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 pb-1 border-t border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-black text-slate-800">In-App Registration Form</span>
                  <span className="block text-[10px] text-slate-400 font-medium mt-0.5">खेळाडू व टी-शर्ट नोंदणीचा फॉर्म चालू करावा का?</span>
                </div>
                <button type="button" onClick={() => setAllowInAppForm(!allowInAppForm)} className={`p-1.5 rounded-xl transition-all ${allowInAppForm ? 'text-[#ff6600]' : 'text-slate-300'}`}>
                  {allowInAppForm ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#ff6600] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#e65c00] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2">
                <PlusCircle size={16} />
                <span>{loading ? 'प्रोसेस होत आहे...' : editingTeamUid ? 'माहिती अपडेट करा' : 'संघ नोंदणी करा'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🎯 सुपरॲडमीनसाठी ओरिजिनल 'PublicTeamProfile' रिव्ह्यू मोडल पॉपअप */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setSelectedTeam(null)} 
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl font-bold z-10 text-xs transition-all active:scale-95"
            >
              ✕ बंद करा
            </button>
            <div className="pt-4">
              <PublicTeamProfile team={selectedTeam} isPreviewMode={true} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}