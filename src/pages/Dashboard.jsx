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

import logo from '../assets/logo.png'; // 👈 योग्य पाथनुसार लोगो इंपोर्ट करा



export default function Dashboard({ user, onLogout }) {
  const [mobiles, setMobiles] = useState([]); // 👈 ही लाईन डॅशबोर्डच्या टॉपला ॲड कर
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
                uid: docId, teamName: cleanName, name: row.AdminName ? row.AdminName.toString().trim() : 'प्रमुख ॲडमीन', email: emailLower, admins: adminArray, mobiles: mobileArray,            
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

// =========================================================================
  // 🚩 १. सिंगल रेकॉर्ड मंजूर करून थेट कॅशमध्ये पब्लिश करणे (FIXED & LOGGED)
  // =========================================================================
  const handleApproveAndPublishLive = async (teamId) => {
    setLoading(true);
    console.log("=== 🚀 [APPROVE & PUBLISH LIVE START] ===");
    console.log("📥 टारगेट टीम आयडी (teamId):", teamId);

    try {
      const userDocRef = doc(db, "users", teamId);
      
      // 🎯 स्टेप १: आधी डेटाबेसमध्ये स्टेटस कडक मंजूर (Approve) करून अपडेट करा
      console.log("🔄 [डेटाबेस अपडेट]: users कलेक्शनमध्ये मान्यता सेट करत आहे...");
      await updateDoc(userDocRef, { 
        hasPendingEdits: false, 
        verificationStatus: "approved", 
        isProfileComplete: true 
      });
      console.log("✅ [डेटाबेस अपडेट]: users कलेक्शन यशस्वीरित्या अपडेट झाले.");

      // 🎯 स्टेप २: अपडेट झाल्यानंतरचा एकदम फ्रेश आणि लाईव्ह डेटा पुन्हा ओढा!
      const freshTeamSnap = await getDoc(userDocRef);
      if (!freshTeamSnap.exists()) throw new Error("हा संघ युझर्स डेटाबेसमध्ये सापडला नाही.");
      const t = freshTeamSnap.data();

      console.log("📦 [फ्रेश डेटा ओढला]:", { teamName: t.teamName, district: t.district, isProfileComplete: t.isProfileComplete });

      // 🎯 स्टेप ३: पब्लिक कॅश (live_directory) डॉक्युमेंट ओढा
      const cacheDocRef = doc(db, "public_site_cache", "live_directory"); 
      const cacheSnap = await getDoc(cacheDocRef);
      
      let currentTeams = [];
      let cacheData = {};

      if (cacheSnap.exists()) {
        cacheData = cacheSnap.data();
        currentTeams = cacheData.teams || [];
        console.log(`📊 [कॅश स्थिती]: सध्या कॅशमध्ये एकूण ${currentTeams.length} संघ आहेत.`);
      } else {
        console.log("⚠️ [कॅश स्थिती]: live_directory कॅश अजून तयार झालेली नाही. नवीन तयार होईल.");
      }

      // 🎯 स्टेप ४: कॅशसाठी फ्रेश डेटा फॉरमॅट करा
      const formattedCacheTeam = {
        id: teamId, // 👈 नेहमी मूळ अचूक teamId चा वापर
        uid: teamId, 
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
        pincode: t.pincode || '', 
        coachName: t.coachName || '', 
        captainName: t.captainName || '', 
        milestone7: t.milestone7 || '', 
        milestone8: t.milestone8 || '', 
        milestone9: t.milestone9 || '', 
        milestone10: t.milestone10 || '',
        bestPerformanceUrl: t.bestPerformanceUrl || '', 
        isProfileComplete: true, 
        hasPendingEdits: false, 
        mobiles: t.mobiles || [],
        socialLinks: { 
          facebook: t.socialLinks?.facebook || '', 
          instagram: t.socialLinks?.instagram || '', 
          youtube: t.socialLinks?.youtube || '' 
        }
      };

      // 🎯 स्टेप ५: कॅशच्या यादीत जुनी नोंद मॅच करून फक्त तेवढीच ओळ अपडेट करणे (Single Record Push)
      console.log("🔍 [कॅश मॅचिंग चालू]: यादीत आधीपासून हा संघ आहे का तपासत आहे...");
      const isAlreadyCached = currentTeams.some(team => team.id === teamId || team.uid === teamId);
      
      let updatedList = [];
      if (isAlreadyCached) {
        console.log("🔄 [कॅश अपडेट]: संघ आधीपासून आहे, जुनी नोंद फ्रेश डेटाने बदलत आहे...");
        updatedList = currentTeams.map(team => (team.id === teamId || team.uid === teamId) ? formattedCacheTeam : team);
      } else {
        console.log("➕ [कॅश इन्सर्ट]: हा नवीन संघ आहे, कॅश यादीत शेवटी जोडत आहे...");
        updatedList = [...currentTeams, formattedCacheTeam];
      }

      // 🎯 स्टेप ६: फायनल कॅश राईट आणि व्हर्जन कंट्रोल अपडेट (व्हर्जन बदलल्यामुळे फ्रंटएंड कॅश क्लियर होईल)
      const newVersion = Date.now();
      await setDoc(cacheDocRef, { 
        ...cacheData, 
        teams: updatedList, 
        totalTeams: updatedList.length, 
        lastPublishedAt: serverTimestamp(), 
        version: newVersion 
      }, { merge: true });

      console.log(`🚀 [SUCCESS]: कॅश यशस्वीरित्या अपडेट झाली! नवीन व्हर्जन कोड: ${newVersion}`);
      
      Swal.fire({ icon: 'success', title: 'बदल मंजूर व थेट पब्लिश झाले! 🚩', timer: 1500, showConfirmButton: false });
      fetchTeams();
    } catch (err) { 
      console.error("❌ [APPROVE & PUBLISH ERROR]:", err); 
      Swal.fire({ icon: 'error', title: 'त्रुटी आली!', text: err.message }); 
    } finally { 
      setLoading(false); 
      console.log("=== 🚀 [APPROVE & PUBLISH LIVE END] ===");
    }
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

  // const openModal = (team = null) => {
  //   if (team) {
  //     setEditingTeamUid(team.id); setTeamName(team.teamName); setAdminName(team.name);
  //     setAdminEmail(team.admins ? team.admins.join(', ') : team.email || '');
  //     setAllowInAppForm(team.allowInAppForm !== false); setTeamCategory(team.teamCategory || 'Men');
  //   } else {
  //     setEditingTeamUid(null); setTeamName(''); setAdminName(''); setAdminEmail(''); setTeamCategory('Men'); setAllowInAppForm(true); 
  //   }
  //   setIsModalOpen(true);
  // };


const openModal = (team = null) => {
    if (team) {
      // १. 🎯 तुमचे मूळ कोड जसेच्या तसे सुरक्षित (ज्याने ॲडमीनचा पॉपअप परफेक्ट चालू राहील)
      setEditingTeamUid(team.id); 
      setTeamName(team.teamName); 
      setAdminName(team.name);
      setAdminEmail(team.admins ? team.admins.join(', ') : team.email || '');
      setAllowInAppForm(team.allowInAppForm !== false); 
      setTeamCategory(team.teamCategory || 'Men');

      // २. 🚀 [पब्लिक प्रोफाईल ओव्हरलॅप फिक्स] जर डॅशबोर्डवर या स्टेट्स असतील तर त्या साफ होतील, 
      // आणि जर स्टेट्स नसतील तरीही 'typeof' चेकिंगमुळे कोड १% ही क्रॅश होणार नाही!
      if (typeof setMobiles === 'function') setMobiles(team.mobiles || []);
      if (typeof setLogoUrl === 'function') setLogoUrl(team.logoUrl || '');
      if (typeof setSlogan === 'function') setSlogan(team.slogan || '');
      if (typeof setAboutTeam === 'function') setAboutTeam(team.aboutTeam || '');
      if (typeof setBestPerformance === 'function') setBestPerformance(team.bestPerformance || '');
      if (typeof setBestPerformanceUrl === 'function') setBestPerformanceUrl(team.bestPerformanceUrl || '');
      if (typeof setCoachName === 'function') setCoachName(team.coachName || '');
      if (typeof setCaptainName === 'function') setCaptainName(team.captainName || '');
      if (typeof setAreaName === 'function') setAreaName(team.areaName || '');
      if (typeof setPincode === 'function') setPincode(team.pincode || '');
      if (typeof setCity === 'function') setCity(team.city || '');
      if (typeof setDistrict === 'function') setDistrict(team.district || '');
      if (typeof setAddress === 'function') setAddress(team.address || '');
      
      // सोशल मीडिया लिंक्स सुरक्षित क्लिनअप
      if (typeof setFacebook === 'function') setFacebook(team.socialLinks?.facebook || '');
      if (typeof setInstagram === 'function') setInstagram(team.socialLinks?.instagram || '');
      if (typeof setYoutube === 'function') setYoutube(team.socialLinks?.youtube || '');

    } else {
      // 🎯 ३. नवीन संघ जोडताना सर्व जुन्या स्टेट्स शंभर टक्के साफ (Reset) करणे
      setEditingTeamUid(null); setTeamName(''); setAdminName(''); setAdminEmail(''); setTeamCategory('Men'); setAllowInAppForm(true); 
      
      if (typeof setMobiles === 'function') setMobiles([]);
      if (typeof setLogoUrl === 'function') setLogoUrl('');
      if (typeof setSlogan === 'function') setSlogan('');
      if (typeof setAboutTeam === 'function') setAboutTeam('');
      if (typeof setBestPerformance === 'function') setBestPerformance('');
      if (typeof setBestPerformanceUrl === 'function') setBestPerformanceUrl('');
      if (typeof setCoachName === 'function') setCoachName('');
      if (typeof setCaptainName === 'function') setCaptainName('');
      if (typeof setAreaName === 'function') setAreaName('');
      if (typeof setPincode === 'function') setPincode('');
      if (typeof setCity === 'function') setCity('');
      if (typeof setDistrict === 'function') setDistrict('');
      if (typeof setAddress === 'function') setAddress('');
      if (typeof setFacebook === 'function') setFacebook('');
      if (typeof setInstagram === 'function') setInstagram('');
      if (typeof setYoutube === 'function') setYoutube('');
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
        dbTeamData = { 
          name: adminName.trim(), 
          email: emailLower, 
          admins: adminEmail.split(',').map(e => e.trim().toLowerCase()), 
          teamName: teamName.trim(), 
          teamSlug: teamSlug, 
          teamCategory: teamCategory, 
          allowInAppForm: allowInAppForm, 
          mobiles: mobiles || [], // 🆕 १. एडिट करताना फोन नंबर users कलेक्शनमध्ये सुरक्षित
          updatedAt: serverTimestamp() 
        };
        await updateDoc(doc(db, "users", editingTeamUid), dbTeamData);
      } else {
        isNewTeam = true; const randomDigits = Math.floor(1000 + Math.random() * 9000); finalUid = `MCG${randomDigits}`;
        dbTeamData = { 
          uid: finalUid, 
          id: finalUid, 
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
          hasPendingEdits: false, 
          mobiles: mobiles || [], // 🆕 २. नवीन संघ जोडताना फोन नंबर users कलेक्शनमध्ये सुरक्षित
          createdAt: serverTimestamp() 
        };
        await setDoc(doc(db, "users", finalUid), dbTeamData);
      }

      const cacheDocRef = doc(db, "public_site_cache", "live_directory"); const docSnap = await getDoc(cacheDocRef);
      if (docSnap.exists()) {
        const cacheData = docSnap.data(); const currentTeamsList = cacheData.teams || []; const existingCachedTeam = currentTeamsList.find(t => t.id === finalUid || t.uid === finalUid) || {};
        
        const formattedCacheTeam = {
          ...existingCachedTeam, 
          id: finalUid, 
          uid: finalUid, 
          teamName: teamName.trim(), 
          teamSlug: teamSlug, 
          name: adminName.trim(), 
          teamCategory: teamCategory, 
          isProfileComplete: isNewTeam ? false : (existingCachedTeam.isProfileComplete !== false), 
          hasPendingEdits: false, 
          establishedYear: existingCachedTeam.establishedYear || '', 
          slogan: existingCachedTeam.slogan || '', 
          logoUrl: existingCachedTeam.logoUrl || '', 
          aboutTeam: existingCachedTeam.aboutTeam || '', 
          bestPerformance: existingCachedTeam.bestPerformance || '', 
          city: existingCachedTeam.city || '', 
          district: existingCachedTeam.district || '', 
          state: existingCachedTeam.state || '', 
          areaName: existingCachedTeam.areaName || '', 
          pincode: existingCachedTeam.pincode || '', 
          address: existingCachedTeam.address || '', // 🎯 ३. कडक फिक्स: काल पत्ता गायब होता, तो आता कॅशमध्ये सुरक्षित जोडला!
          coachName: existingCachedTeam.coachName || '', 
          captainName: existingCachedTeam.captainName || '', 
          milestone7: existingCachedTeam.milestone7 || '', 
          milestone8: existingCachedTeam.milestone8 || '', 
          milestone9: existingCachedTeam.milestone9 || '', 
          milestone10: existingCachedTeam.milestone10 || '', 
          bestPerformanceUrl: existingCachedTeam.bestPerformanceUrl || '', 
          // 🔒 सुरक्षा: इथे आपण 'mobiles: existingCachedTeam.mobiles' काढून टाकले आहे, जेणेकरून पब्लिक कॅश पूर्णपणे प्रायव्हेट राहील!
          socialLinks: { facebook: existingCachedTeam.socialLinks?.facebook || '', instagram: existingCachedTeam.socialLinks?.instagram || '', youtube: existingCachedTeam.socialLinks?.youtube || '' }
        };
        
        let updatedTeamsList = isNewTeam ? [...currentTeamsList, formattedCacheTeam] : currentTeamsList.map(team => (team.id === finalUid || team.uid === finalUid) ? formattedCacheTeam : team);
        await setDoc(cacheDocRef, { ...cacheData, teams: updatedTeamsList, totalTeams: updatedTeamsList.length, lastPublishedAt: serverTimestamp(), version: Date.now() }, { merge: true });
      }
      
      // ➕ फॉर्म क्लिनअप आणि रीसेट
      setTeamName(''); setAdminName(''); setAdminEmail(''); setTeamCategory('Men'); setMobiles([]); setIsModalOpen(false); setEditingTeamUid(null); fetchTeams();
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
      {/* <div className="border-b border-slate-200 pb-3 mb-5 flex items-center justify-between text-left">
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
      </div> */}

   {/* 👑 ब्रँडेड हेडर पॅनेल - स्वतःचा सुरक्षित लोगो इमेज टॅग */}
      <div className="hidden md:flex border-b border-slate-200 pb-3 mb-5 items-center justify-between text-left">
        
        {/* डावी बाजू: लोगो आणि ब्रँड टायटल एकत्र */}
        <div className="flex items-center space-x-3.5">
          
          {/* 🎯 [अचूक लोगो डिस्प्ले]: assets मधील लोगो इथे पास केला आहे */}
          <img 
            src={logo} 
            alt="महाराष्ट्राचा गोविंदा लोगो" 
            className="w-12 h-12 object-contain rounded-xl shadow-sm border border-slate-100" 
          />

          <div className="flex flex-col">
            <h1 className="text-lg md:text-2xl font-black uppercase tracking-wide leading-tight">
              {lang === 'mr' ? (
                <>
                  <span className="text-[#ff6600]">महाराष्ट्राचा</span>{" "}
                  <span className="text-[#0b132b]">गोविंदा</span>
                <span className="text-xs md:text-sm text-slate-400 font-bold mt-0.5"> {lang === 'mr' ? 'प्रत्येक गोविंदासाठी 🚩' : 'For Every Govinda 🚩'}</span>
                </>
              ) : (
                <>
                  <span className="text-[#ff6600]">Maharashtracha</span>{" "}
                  <span className="text-[#0b132b]">Govinda</span>
                   <span className="text-xs md:text-sm text-slate-400 font-bold mt-0.5"> {lang === 'mr' ? 'प्रत्येक गोविंदासाठी 🚩' : 'For Every Govinda 🚩'}</span>

                </>
              )}
            </h1>
          
          </div>
        </div>
        
        {/* लँग्वेज स्विचर */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg space-x-0.5 border shadow-sm">
          <button 
            onClick={() => setLang('mr')} 
            className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${lang === 'mr' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            मराठी
          </button>
          <button 
            onClick={() => setLang('en')} 
            className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${lang === 'en' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            English
          </button>
        </div>
      </div>

      <div className="animate-in fade-in duration-200">
{/* 🎯 DRY नियम: ७ कॉम्पोनेंट्स आणि ४ फिल्टर्सचा कोड पुन्हा न लिहिता थेट हब रेंडर केले! */}
{[ 'govinda_katta', 'public_stats', 'public_info', 'public_news', 'public_events', 'public_records', 'articles' ].includes(activeMenu) && (
  <PublicDashboard isEmbeddedView={true} embeddedTab={activeMenu} setEmbeddedTab={setActiveMenu} lang={lang}  />
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
            lang={lang} // 👈 फक्त ही एक कडक ओळ कॉम्पोनेंट कॉलिंगच्या शेवटी जोडून घे भाऊ!
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
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ॲडमीनचे नाव</label>
              <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="उदा. संदीप महाडिक" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 font-medium focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">गुगल लॉगिन ईमेल</label>
              <input type="text" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="उदा. admin@gmail.com" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 font-medium focus:outline-none focus:border-orange-500" />
            </div>
            {/* 🆕 मोबाईल नंबर (Mobile Number) इनपुट फील्ड पॅच */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 text-left">मोबाईल नंबर (सुपरॲडमीनसाठी)</label>
              <input
                type="text"
                value={Array.isArray(mobiles) ? mobiles.join(', ') : mobiles || ''}
                onChange={(e) => {
                  // फक्त इंग्रजी आकडे आणि कॉमा स्वीकारण्यासाठी Regex पॅच
                  const cleanValue = e.target.value.replace(/[^0-9,\s]/g, '');
                  // कॉमा सेपरेटेड व्हॅल्यूजचे ॲरेमध्ये रूपांतर करून स्टेट अपडेट करणे
                  setMobiles(cleanValue.split(',').map(num => num.trim()));
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#ff6600]"
                placeholder="उदा. 9876543210, 9123456789"
              />
              <p className="text-[10px] text-slate-400 font-medium text-left">एकापेक्षा जास्त नंबर असल्यास कॉमा (,) द्या भाऊ. (हा डेटा पब्लिक कट्ट्यावर दिसणार नाही)</p>
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