import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, getDoc, getDocs, getDocsFromCache, serverTimestamp, query, where, writeBatch } from 'firebase/firestore'; 
import { PlusCircle, X, Plus, Search, Edit2, Trash2, Link2, RotateCcw, CheckSquare, Square, Bell, Eye, UploadCloud, Send, Filter } from 'lucide-react';
import Swal from 'sweetalert2';

// 🎯 नवीन युनियन हब कॉम्पोनेंट इम्पोर्ट केला
import PublicDashboard from './PublicDashboard'; // (पाथ तुमच्या फाईल स्ट्रक्चरनुसार चेक करून घ्या)

import Sidebar from '../components/Sidebar';

import PublicDirectory from '../components/PublicDirectory';
import PublicStats from '../components/PublicStats';
import PublicInfo from '../components/PublicInfo';
import PublicTeamProfile from '../components/PublicTeamProfile'; 
import PublicNews from '../components/PublicNews';
import PublicEvents from '../components/PublicEvents';
import PublicRecords from '../components/PublicRecords';
import PublicArticles from '../components/PublicArticles';
import ManageMaintenance from '../components/ManageMaintenance';
import ManageArticles from '../components/ManageArticles';
import TeamProfile from '../components/TeamProfile';
import ManageTeams from '../components/ManageTeams';
import AdMobileBottom from '../components/AdMobileBottom';



export default function Dashboard({ user, onLogout }) {
  const [teamName, setTeamName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [allowInAppForm, setAllowInAppForm] = useState(true); 
  const [teamCategory, setTeamCategory] = useState('Men');
  
  const [loading, setLoading] = useState(false);
  const [teamsList, setTeamsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTab, setViewTab] = useState('active'); 
  const [categoryFilter, setCategoryFilter] = useState('All'); 
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamUid, setEditingTeamUid] = useState(null); 
  const [activeMenu, setActiveMenu] = useState('teams'); 
  const [importLoading, setImportLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null); 
  const [isFullEditMode, setIsFullEditMode] = useState(false);
  const [pendingTeamsList, setPendingTeamsList] = useState([]);

  // डॅशबोर्डमधील फिल्टर्स स्टेट्स (आकडेवारीवरून कट्ट्याकडे उडी मारण्यासाठी)
const [statsCategoryFilter, setStatsCategoryFilter] = useState('All');
const [statsTharaFilter, setStatsTharaFilter] = useState('All');
const [statsDistrictFilter, setStatsDistrictFilter] = useState('All');
const [statsAreaFilter, setStatsAreaFilter] = useState('');
  
  const [lang, setLang] = useState('mr'); 

  // 📂 CSV बल्क इम्पोर्ट लॉजिक
  const handleBulkImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    Papa.parse(file, {
      header: true, skipEmptyLines: true, dynamicTyping: true, quoteChar: '"', escapeChar: '"',
      complete: async (results) => {
        const rows = results.data;
        if (rows.length === 0) { Swal.fire({ icon: 'error', title: 'फाईल रिकामी आहे!' }); setImportLoading(false); return; }
        try {
          const currentYear = new Date().getFullYear().toString();
          const chunkSize = 400; let totalProcessed = 0;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize); const batch = writeBatch(db); let chunkValidRowsCount = 0;
            chunk.forEach((row) => {
              if (!row.UID || !row.TeamName) return; 
              chunkValidRowsCount++;
              const docId = row.UID.toString().trim(); 
              const emailLower = row.AdminEmail ? row.AdminEmail.toString().trim().toLowerCase() : '';
              const adminArray = emailLower ? emailLower.split(',').map(em => em.trim()).filter(em => em !== '') : [];
              let mobileArray = []; if (row.Mobiles) mobileArray = row.Mobiles.toString().split(',').map(num => num.trim()).filter(num => num !== '');
              let cleanName = row.TeamName.toString().trim().replace(/\s*-\s*.+$/gi, '').replace(/\s*\(.+?\)/gi, '');
              cleanName = cleanName.replace(/\s*(Govinda?\s*P[ha]+t[ha]k|Dahi\s*Handi\s*P[ha]+t[ha]k|P[ha]+t[ha]k|Govinda?)/gi, '').replace(/\s*(गोविंदा\s*पथक|गोविंद\s*पथक|दहीहंडी\s*पथक|पथक|गोविंदा)/gi, '');
              const trailingWordsToRemove = ['jogeshwari', 'west', 'east', 'malad', 'kalyan', 'mumbai', 'thane', 'डोबिवली', 'कल्याण', 'मुंबई', 'ठाणे'];
              trailingWordsToRemove.forEach(word => { const regex = new RegExp(`\\s+${word}\\s*$` , 'gi'); cleanName = cleanName.replace(regex, ''); });
              cleanName = cleanName.replace(/\s+/g, ' ').trim(); if (!cleanName) cleanName = row.TeamName.toString().trim();
              const teamSlug = cleanName.toLowerCase().replace(/[^a-zA-Z0-9\s-\u0900-\u097F]/g, '').replace(/\s+/g, '-');
              batch.set(doc(db, "users", docId), {
                uid: docId, teamName: cleanName, name: row.AdminName ? row.AdminName.toString().trim() : 'प्रमुख ॲдमीन', email: emailLower, admins: adminArray, mobiles: mobileArray,            
                role: "admin", teamSlug: teamSlug, teamCategory: row.Category || 'Men', coachName: row.CoachName ? row.CoachName.toString().trim() : '', captainName: row.CaptainName ? row.CaptainName.toString().trim() : '',
                isRegistered: row.IsRegistered === 'Yes' || row.IsRegistered === true, regNumber: row.RegNumber ? row.RegNumber.toString().trim() : '', address: row.Address ? row.Address.toString().trim() : row.TeamName.toString().trim(), 
                areaName: row.AreaName ? row.AreaName.toString().trim() : '', pincode: row.Pincode ? row.Pincode.toString().trim() : '', city: row.City ? row.City.toString().trim() : '', district: row.District ? row.District.toString().trim() : '',
                state: row.State ? row.State.toString().trim() : '', slogan: row.Slogan ? row.Slogan.toString().trim() : '', establishedYear: row.EstablishedYear ? row.EstablishedYear.toString().trim() : '', aboutTeam: row.AboutTeam ? row.AboutTeam.toString().trim() : '',
                bestPerformance: row.BestPerformance ? row.BestPerformance.toString().trim() : '', bestPerformanceUrl: row.BestPerformanceUrl ? row.BestPerformanceUrl.toString().trim() : '', logoUrl: row.LogoUrl ? row.LogoUrl.toString().trim() : '',
                hasInsurance: true, milestone7: row.Milestone7 ? row.Milestone7.toString().trim() : '', milestone8: row.Milestone8 ? row.Milestone8.toString().trim() : '', milestone9: row.Milestone9 ? row.Milestone9.toString().trim() : '', milestone10: row.Milestone10 ? row.Milestone10.toString().trim() : '',
                socialLinks: { facebook: row.Facebook ? row.Facebook.toString().trim() : '', instagram: row.Instagram ? row.Instagram.toString().trim() : '', youtube: row.Youtube ? row.Youtube.toString().trim() : '' },
                currentYear: currentYear, isDeleted: false, isFormActive: false, allowInAppForm: false, isProfileComplete: true, hasPendingEdits: false, verificationStatus: "approved", profileUpdatedAt: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp()
              });
            });
            if (chunkValidRowsCount > 0) { await batch.commit(); totalProcessed += chunkValidRowsCount; }
          }
          Swal.fire({ icon: 'success', title: 'इम्पोर्ट कडक पूर्ण! 🎉', text: `एकूण ${totalProcessed} संघांचा डेटाबेसमधून रेकॉर्ड तयार झाला.` });
          fetchTeams();
        } catch (err) { console.error(err); Swal.fire({ icon: 'error', title: 'रायटिंग एरर!', text: err.message }); }
        finally { setImportLoading(false); e.target.value = ''; }
      }
    });
  };

  const fetchTeams = async () => {
    try {
      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      let querySnapshot;
      try { querySnapshot = await getDocsFromCache(adminQuery); } catch (err) { querySnapshot = await getDocs(adminQuery); }
      const teams = []; querySnapshot.forEach((doc) => { teams.push({ id: doc.id, ...doc.data() }); });
      setTeamsList(teams);

      const serverSnapshot = await getDocs(adminQuery); 
      const allServerTeams = []; serverSnapshot.forEach((doc) => { allServerTeams.push({ id: doc.id, ...doc.data() }); });
      const pendingOnly = allServerTeams.filter(t => !t.isDeleted && (t.hasPendingEdits === true || t.isProfileComplete === false));
      setPendingTeamsList(pendingOnly);
      setTeamsList(allServerTeams);
    } catch (err) { console.error("❌ Fetch Error:", err); }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleCleanDatabaseDistricts = async () => {
    setLoading(true);
    try {
      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      const querySnapshot = await getDocs(adminQuery);
      let updatedCount = 0;
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data(); const docRef = doc(db, "users", docSnap.id);
        let currentDistrict = data.district ? data.district.toString().trim() : "";
        let currentEmail = data.email ? String(data.email).trim() : "";
        let currentAdmins = Array.isArray(data.admins) ? data.admins : null;
        let isChanged = false; let updatedFields = {};
        if (currentDistrict) {
          let originalDist = currentDistrict; const lowerDist = currentDistrict.toLowerCase();
          if (lowerDist === "mumbai" || lowerDist === "mumbai city" || lowerDist === "mumbai-city") currentDistrict = "Mumbai City";
          else if (lowerDist === "mumbai suburban" || lowerDist === "suburban" || lowerDist === "mumbai उपनगर") currentDistrict = "Mumbai Suburban";
          else if (lowerDist === "thane" || lowerDist === "ठाणे") currentDistrict = "Thane";
          else currentDistrict = currentDistrict.charAt(0).toUpperCase() + currentDistrict.slice(1);
          if (originalDist !== currentDistrict) { updatedFields.district = currentDistrict; isChanged = true; }
        }
        if (currentEmail) { let cleanedEmail = currentEmail.replace(/^["']|["']$/g, '').trim(); if (currentEmail !== cleanedEmail) { updatedFields.email = cleanedEmail; isChanged = true; } }
        if (currentAdmins) {
          const cleanedAdmins = currentAdmins.map(email => { if (typeof email !== 'string') return email; return email.trim().replace(/^["']|["']$/g, '').trim(); }).filter(email => email !== "" && email !== undefined && email !== null);
          if (JSON.stringify(currentAdmins) !== JSON.stringify(cleanedAdmins)) { updatedFields.admins = cleanedAdmins; isChanged = true; }
        }
        if (isChanged) { await updateDoc(docRef, updatedFields); updatedCount++; }
      }
      Swal.fire({ icon: 'success', title: 'डेटाबेस शुद्धीकरण पूर्ण! 🧹🚩', text: `एकूण ${updatedCount} मंडळांचा डेटा ऑटो-करेक्ट झाला.` });
      fetchTeams();
    } catch (err) { console.error("❌ डेटाबेस क्लीन एरर:", err); } finally { setLoading(false); }
  };

  const handleApproveAndPublishLive = async (teamId) => {
      setLoading(true);
      try {
        const userDocRef = doc(db, "users", teamId); const teamSnap = await getDoc(userDocRef);
        if (!teamSnap.exists()) throw new Error("संघ सापडला नाही."); const t = teamSnap.data();
        await updateDoc(userDocRef, { hasPendingEdits: false, verificationStatus: "approved", isProfileComplete: true });
        const cacheDocRef = doc(db, "public_site_cache", "live_directory"); const cacheSnap = await getDoc(cacheDocRef);
        if (cacheSnap.exists()) {
          const cacheData = cacheSnap.data(); const currentTeams = cacheData.teams || [];
          const formattedCacheTeam = {
            id: t.id || t.uid || teamId, uid: t.uid || t.id || teamId, teamName: t.teamName || '', teamSlug: t.teamSlug || '', name: t.name || '', establishedYear: t.establishedYear || '',
            slogan: t.slogan || '', logoUrl: t.logoUrl || '', aboutTeam: t.aboutTeam || '', bestPerformance: t.bestPerformance || '', teamCategory: t.teamCategory || 'Men', city: t.city || '', district: t.district || '', state: t.state || '',
            areaName: t.areaName || '', pincode: t.pincode || '', coachName: t.coachName || '', captainName: t.captainName || '', milestone7: t.milestone7 || '', milestone8: t.milestone8 || '', milestone9: t.milestone9 || '', milestone10: t.milestone10 || '',
            bestPerformanceUrl: t.bestPerformanceUrl || '', isProfileComplete: true, hasPendingEdits: false, mobiles: t.mobiles || [],
            socialLinks: { facebook: t.socialLinks?.facebook || '', instagram: t.socialLinks?.instagram || '', youtube: t.socialLinks?.youtube || '' }
          };
          let updatedList = currentTeams.some(team => team.id === teamId || team.uid === teamId) ? currentTeams.map(team => (team.id === teamId || team.uid === teamId) ? formattedCacheTeam : team) : [...currentTeams, formattedCacheTeam];
          await setDoc(cacheDocRef, { ...cacheData, teams: updatedList, totalTeams: updatedList.length, lastPublishedAt: serverTimestamp(), version: Date.now() }, { merge: true });
        }
        Swal.fire({ icon: 'success', title: 'बदल मंजूर व थेट पब्लिश झाले! 🚩', timer: 1500, showConfirmButton: false });
        fetchTeams();
      } catch (err) { console.error(err); Swal.fire({ icon: 'error', title: 'त्रुटी आली!', text: err.message }); } finally { setLoading(false); }
    };

  const handleApproveTeam = async (teamId) => { await handleApproveAndPublishLive(teamId); };

  const handleRejectCommentTeam = async (teamId) => {
    const { value: text } = await Swal.fire({
      title: 'सुधारणा सुचवा 💬', input: 'textarea', inputLabel: 'मंडळाला पाठवायचा संदेश लिहा:', inputPlaceholder: 'उदा. ७ थरांचे वर्ष बरोबर लिहा...', showCancelButton: true, confirmButtonColor: '#ff6600'
    });
    if (text) {
      try {
        await updateDoc(doc(db, "users", teamId), { hasPendingEdits: false, verificationStatus: "rejected", adminComment: text.trim() });
        Swal.fire({ icon: 'info', title: 'शेरा पाठवला!', timer: 1500, showConfirmButton: false }); fetchTeams();
      } catch (err) { console.error(err); }
    }
  };

  const openModal = (team = null) => {
    if (team) {
      setEditingTeamUid(team.id); setTeamName(team.teamName); setAdminName(team.name);
      setAdminEmail(team.admins ? team.admins.join(', ') : team.email || '');
      setAllowInAppForm(team.allowInAppForm !== false); setTeamCategory(team.teamCategory || 'Men');
    } else {
      setEditingTeamUid(null); setTeamName(''); setAdminName(''); setAdminEmail(''); setTeamCategory('Men'); setAllowInAppForm(true); 
    }
    setIsModalOpen(true);
  };

  const generateSecureLink = (team) => {
    if (team.allowInAppForm === false || !team.teamSlug || !team.uid) return '';
    return `${window.location.origin}${import.meta.env.BASE_URL || '/'}${team.teamSlug}/register?t=${btoa(team.uid)}`;
  };

  const copyToClipboard = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    Swal.fire({ icon: 'success', title: '🔒 link कॉपी झाली!', confirmButtonColor: '#ff6600', timer: 1500 });
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const emailLower = adminEmail.trim().toLowerCase();
      const teamSlug = teamName.toLowerCase().trim().replace(/[^a-zA-Z0-9\s-\u0900-\u097F]/g, '').replace(/\s+/g, '-');
      const currentYear = new Date().getFullYear().toString();
      let finalUid = editingTeamUid; let isNewTeam = false; let dbTeamData = {};
      if (editingTeamUid) {
        dbTeamData = { name: adminName.trim(), email: emailLower, admins: adminEmail.split(',').map(e => e.trim().toLowerCase()), teamName: teamName.trim(), teamSlug: teamSlug, teamCategory: teamCategory, allowInAppForm: allowInAppForm, updatedAt: serverTimestamp() };
        await updateDoc(doc(db, "users", editingTeamUid), dbTeamData);
      } else {
        isNewTeam = true; const randomDigits = Math.floor(1000 + Math.random() * 9000); finalUid = `MCG${randomDigits}`;
        dbTeamData = { uid: finalUid, id: finalUid, name: adminName.trim(), email: emailLower, admins: adminEmail.split(',').map(e => e.trim().toLowerCase()), role: "admin", teamName: teamName.trim(), teamSlug: teamSlug, teamCategory: teamCategory, currentYear: currentYear, isDeleted: false, isFormActive: allowInAppForm, allowInAppForm: allowInAppForm, isProfileComplete: false, hasPendingEdits: false, createdAt: serverTimestamp() };
        await setDoc(doc(db, "users", finalUid), dbTeamData);
      }

      const cacheDocRef = doc(db, "public_site_cache", "live_directory"); const docSnap = await getDoc(cacheDocRef);
      if (docSnap.exists()) {
        const cacheData = docSnap.data(); const currentTeamsList = cacheData.teams || []; const existingCachedTeam = currentTeamsList.find(t => t.id === finalUid || t.uid === finalUid) || {};
        const formattedCacheTeam = {
          ...existingCachedTeam, id: finalUid, uid: finalUid, teamName: teamName.trim(), teamSlug: teamSlug, name: adminName.trim(), teamCategory: teamCategory, isProfileComplete: isNewTeam ? false : (existingCachedTeam.isProfileComplete !== false), hasPendingEdits: false, establishedYear: existingCachedTeam.establishedYear || '', slogan: existingCachedTeam.slogan || '', logoUrl: existingCachedTeam.logoUrl || '', aboutTeam: existingCachedTeam.aboutTeam || '', bestPerformance: existingCachedTeam.bestPerformance || '', city: existingCachedTeam.city || '', district: existingCachedTeam.district || '', state: existingCachedTeam.state || '', areaName: existingCachedTeam.areaName || '', pincode: existingCachedTeam.pincode || '', coachName: existingCachedTeam.coachName || '', captainName: existingCachedTeam.captainName || '', milestone7: existingCachedTeam.milestone7 || '', milestone8: existingCachedTeam.milestone8 || '', milestone9: existingCachedTeam.milestone9 || '', milestone10: existingCachedTeam.milestone10 || '', bestPerformanceUrl: existingCachedTeam.bestPerformanceUrl || '', mobiles: existingCachedTeam.mobiles || [],
          socialLinks: { facebook: existingCachedTeam.socialLinks?.facebook || '', instagram: existingCachedTeam.socialLinks?.instagram || '', youtube: existingCachedTeam.socialLinks?.youtube || '' }
        };
        let updatedTeamsList = isNewTeam ? [...currentTeamsList, formattedCacheTeam] : currentTeamsList.map(team => (team.id === finalUid || team.uid === finalUid) ? formattedCacheTeam : team);
        await setDoc(cacheDocRef, { ...cacheData, teams: updatedTeamsList, totalTeams: updatedTeamsList.length, lastPublishedAt: serverTimestamp(), version: Date.now() }, { merge: true });
      }
      setTeamName(''); setAdminName(''); setAdminEmail(''); setTeamCategory('Men'); setIsModalOpen(false); setEditingTeamUid(null); fetchTeams();
      Swal.fire({ icon: 'success', title: editingTeamUid ? 'माहिती सुधारित केली! 🎉' : 'नवीन संघ जोडला! 🎉', text: 'संघाचा डेटा सुरक्षितपणे सेव्ह झाला आहे.' });
    } catch (err) { console.error(err); Swal.fire({ icon: 'error', title: 'त्रुटी!', text: 'डेटा जतन करताना समस्या आली.' }); } finally { setLoading(false); }
  };

  const handleToggleActiveStatus = async (teamId, currentStatus) => {
    const actionText = currentStatus ? "पुन्हे सक्रिय (Activate)" : "डी-ॲक्टिव्हेट (Deactivate)";
    const result = await Swal.fire({ title: 'तुम्हाला खात्री आहे?', text: `तुम्हाला या संघाला ${actionText} करायचे आहे का?`, icon: 'warning', showCancelButton: true, confirmButtonColor: currentStatus ? '#16a34a' : '#dc2626', confirmButtonText: currentStatus ? 'हो, सक्रिय करा!' : 'हो, बंद करा!', });
    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, "users", teamId), { isDeleted: !currentStatus, isFormActive: currentStatus ? true : false, deletedAt: serverTimestamp() });
        Swal.fire({ icon: 'success', title: 'यशस्वी बदल!', showConfirmButton: false, timer: 1500 }); fetchTeams();
      } catch (err) { console.error(err); }
    }
  };

  const handlePublishLive = async () => {
    setLoading(true);
    try {
      const adminQuery = query(collection(db, "users"), where("role", "==", "admin")); const querySnapshot = await getDocs(adminQuery);
      const freshTeams = []; querySnapshot.forEach((doc) => { freshTeams.push({ id: doc.id, ...doc.data() }); });
      const activeTeamsData = freshTeams.filter(t => !t.isDeleted).map(t => ({
        id: t.id || t.uid || '', uid: t.uid || t.id || '', teamName: t.teamName || '', teamSlug: t.teamSlug || '', name: t.name || '', establishedYear: t.establishedYear || '', slogan: t.slogan || '', logoUrl: t.logoUrl || '', aboutTeam: t.aboutTeam || '', bestPerformance: t.bestPerformance || '', teamCategory: t.teamCategory || 'Men', city: t.city || '', district: t.district || '', state: t.state || '', areaName: t.areaName || '', pincode: t.pincode || '', coachName: t.coachName || '', captainName: t.captainName || '', milestone7: t.milestone7 || '', milestone8: t.milestone8 || '', milestone9: t.milestone9 || '', milestone10: t.milestone10 || '', bestPerformanceUrl: t.bestPerformanceUrl || '', isProfileComplete: t.isProfileComplete !== false, hasPendingEdits: t.hasPendingEdits === true, mobiles: t.mobiles || [],
        socialLinks: { facebook: t.socialLinks?.facebook || '', instagram: t.socialLinks?.instagram || '', youtube: t.socialLinks?.youtube || '' }
      }));
      await setDoc(doc(db, "public_site_cache", "live_directory"), { teams: activeTeamsData, totalTeams: activeTeamsData.length, lastPublishedAt: serverTimestamp(), version: Date.now() });
      Swal.fire({ icon: 'success', title: 'वेबसाइट लाईव्ह झाली! 🎉', text: `एकूण ${activeTeamsData.length} संघांचा फ्रेश डेटा कॅश झाला.` });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filteredTeams = teamsList.filter(t => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = term === '' ? true : (t.teamName?.toLowerCase().includes(term) || t.name?.toLowerCase().includes(term) || t.areaName?.toLowerCase().includes(term) || t.pincode?.toString().includes(term));
    const matchesCategory = categoryFilter === 'All' ? true : (t.teamCategory === categoryFilter);
    if (viewTab === 'active') return matchesSearch && !t.isDeleted && matchesCategory;
    if (viewTab === 'deactive') return matchesSearch && t.isDeleted && matchesCategory;
    if (viewTab === 'form_allowed') return matchesSearch && !t.isDeleted && t.allowInAppForm !== false && matchesCategory;
    if (viewTab === 'edited_pending') return matchesSearch && !t.isDeleted && (t.hasPendingEdits === true || t.isProfileComplete === false) && matchesCategory;
    return false;
  });

return (
  <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans antialiased pb-16 md:pb-0 select-none text-slate-700">
    
    <Sidebar 
      userRole="superadmin" hasFormAccess={true} activeTab={activeMenu} setActiveTab={setActiveMenu}
      isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} onLogout={onLogout} lang={lang}
    />

    {/* मुख्य कार्यक्षेत्र */}
    <div className="flex-1 w-full overflow-y-auto z-10 max-h-screen p-4 md:p-6">
      
      {/* 👑 युनिफॉर्म हेडर टायटल आणि लँग्वेज स्विचर पॅनेल */}
      <div className="border-b border-slate-200 pb-3 mb-5 flex items-center justify-between text-left">
        <div>
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-wide">
            {activeMenu === 'teams' && (lang === 'mr' ? 'संघ व्यवस्थापन (Teams)' : 'Teams Management')}
            {activeMenu === 'govinda_katta' && (lang === 'mr' ? 'गोविंदा कट्टा' : 'Govinda Katta')}
            {activeMenu === 'public_stats' && (lang === 'mr' ? 'उत्सव आकडेवारी' : 'Festival Stats')}
            {activeMenu === 'public_info' && (lang === 'mr' ? 'उत्सव नियमावली' : 'Festival Rules')}
            {activeMenu === 'public_news' && (lang === 'mr' ? 'ताज्या घडामोडी' : 'Latest Updates')}
            {activeMenu === 'public_events' && (lang === 'mr' ? 'उत्सव व सराव कट्टा' : 'Events & Practice')}
            {activeMenu === 'public_records' && (lang === 'mr' ? 'ऐतिहासिक रेकॉर्ड्स' : 'Historical Records')}
            {activeMenu === 'articles' && (lang === 'mr' ? 'दहीहंडी ज्ञानपीठ' : 'Govinda Knowledge Base')}
            {activeMenu === 'manage_articles' && (lang === 'mr' ? 'लेख व्यवस्थापन' : 'Manage Articles')}
            {activeMenu === 'manage_maintenance' && (lang === 'mr' ? 'सिस्टीम मेंटेनन्स' : 'System Maintenance')}
          </h1>
          <p className="text-[11px] text-slate-400 font-bold mt-0.5">
            {lang === 'mr' ? 'सुपरॲडमीन कोअर कंट्रोल आणि डिजिटल नियंत्रण पॅनेल.' : 'Superadmin core control and digital regulation panel.'}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-0.5 rounded-lg space-x-0.5 border shadow-sm">
          <button onClick={() => setLang('mr')} className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${lang === 'mr' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:text-slate-900'}`}>मराठी</button>
          <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${lang === 'en' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:text-slate-900'}`}>English</button>
        </div>
      </div>

      <div className="animate-in fade-in duration-200">
{/* 🎯 DRY नियम: ७ कॉम्पोनेंट्स आणि ४ फिल्टर्सचा कोड पुन्हा न लिहिता थेट हब रेंडर केले! */}
{[ 'govinda_katta', 'public_stats', 'public_info', 'public_news', 'public_events', 'public_records', 'articles' ].includes(activeMenu) && (
  <PublicDashboard isEmbeddedView={true} embeddedTab={activeMenu} setEmbeddedTab={setActiveMenu} />
)}
       
        {activeMenu === 'manage_maintenance' && <div className="p-0"><ManageMaintenance /></div>}
        {activeMenu === 'manage_articles' && <div className="p-0"><ManageArticles /></div>}

        {activeMenu === 'teams' && (
          <ManageTeams
            loading={loading} importLoading={importLoading} viewTab={viewTab} setViewTab={setViewTab}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
            filteredTeams={filteredTeams} teamsList={teamsList} handlePublishLive={handlePublishLive}
            handleBulkImportCSV={handleBulkImportCSV} openModal={openModal} generateSecureLink={generateSecureLink}
            copyToClipboard={copyToClipboard} setSelectedTeam={setSelectedTeam} handleToggleActiveStatus={handleToggleActiveStatus}
            handleApproveTeam={handleApproveTeam} handleRejectCommentTeam={handleRejectCommentTeam}
          />
        )}
      </div>
    </div>

    <AdMobileBottom />

    {/* मोबाईलवर 'नवीन संघ जोडा' फ्लोटिंग ॲक्शन प्लस बटण */}
    {activeMenu === 'teams' && (
      <button 
        onClick={() => openModal()} 
        className="md:hidden fixed bottom-20 right-5 bg-orange-500 text-white p-4 rounded-full shadow-2xl z-40 active:scale-95 flex items-center justify-center border border-orange-400"
      >
        <Plus size={22} />
      </button>
    )}

    {/* पॉप-अप मॉडेल फॉर्म */}
    {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div onClick={() => { setIsModalOpen(false); setEditingTeamUid(null); }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl relative z-10 border border-slate-100">
          <button onClick={() => { setIsModalOpen(false); setEditingTeamUid(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
          <div className="mb-4"><h3 className="text-sm font-black text-slate-800">{editingTeamUid ? 'संघाची माहिती बदला' : 'नवीन संघ नोंदणी'}</h3></div>
          <form onSubmit={handleSaveTeam} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">संघाचे नाव</label>
              <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="उदा. शिवनेरी गोविंदा पथक" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 font-medium focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ॲдमीनचे नाव</label>
              <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="उदा. संदीप महाडिक" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 font-medium focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">गुगल लॉगिन ईमेल</label>
              <input type="text" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="उदा. admin@gmail.com" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 font-medium focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">संघाचा प्रकार</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: 'Men', label: 'पुरुष' }, { id: 'Women', label: 'महिला' }, { id: 'Both', label: 'दोन्ही' }].map((cat) => (
                  <button key={cat.id} type="button" onClick={() => setTeamCategory(cat.id)} className={`py-1.5 px-1 rounded-xl border text-xs font-black transition-all ${teamCategory === cat.id ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{cat.label}</button>
                ))}
              </div>
            </div>
            <div className="pt-2 pb-1 border-t border-b flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">In-App Registration Form</span>
              <button type="button" onClick={() => setAllowInAppForm(!allowInAppForm)} className={`p-1 rounded-xl ${allowInAppForm ? 'text-orange-500' : 'text-slate-300'}`}>{allowInAppForm ? <CheckSquare size={20} /> : <Square size={20} />}</button>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 mt-2 hover:bg-orange-600"><PlusCircle size={14} /><span>{loading ? 'प्रोसेस होत आहे...' : editingTeamUid ? 'माहिती अपडेट करा' : 'संघ नोंदणी करा'}</span></button>
          </form>
        </div>
      </div>
    )}

    {/* सुपरॲдमीन भव्य प्रोफाइल संपादन कक्ष */}
    {selectedTeam && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative p-5">
          <button onClick={() => { setSelectedTeam(null); setIsFullEditMode(false); fetchTeams(); }} className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-black text-xs transition-all z-50 shadow-sm cursor-pointer">✕ बंद करा</button>
          <div className="pt-4 text-left">
            {isFullEditMode ? (
              <div className="mt-2 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 mb-3 border-b pb-2"><Edit2 size={16} className="text-orange-500" /><h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">संपूर्ण प्रोफाईल एडिटिंग mode</h3></div>
                <TeamProfile user={{ uid: selectedTeam.id || selectedTeam.uid, role: 'superadmin' }} teamData={selectedTeam} isEditMode={isFullEditMode} setIsEditMode={setIsFullEditMode} setTeamData={setSelectedTeam} disabledAadhaarField={true} />
              </div>
            ) : (
              <PublicTeamProfile team={selectedTeam} isSuperAdminView={true} onEditClick={() => setIsFullEditMode(true)} onBack={() => { setSelectedTeam(null); fetchTeams(); }} />
            )}
          </div>
        </div>
      </div>
    )}

  </div>
);
}