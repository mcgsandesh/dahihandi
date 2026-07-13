import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, getDocs, getDocsFromCache, serverTimestamp, query, where, writeBatch } from 'firebase/firestore'; 
import { Users, PlusCircle, LogOut, Menu, X, Plus, Search, Edit2, Trash2, Link2, RotateCcw, CheckSquare, Square, Bell, Layers, BarChart3, BookOpen, Eye, UploadCloud, Send, Filter, Settings, Megaphone, Calendar, Trophy } from 'lucide-react';
import Swal from 'sweetalert2';

// 🎯 कॉम्पोनेंट्स इम्पोर्ट हब
import PublicDirectory from '../components/PublicDirectory';
import PublicStats from '../components/PublicStats';
import PublicInfo from '../components/PublicInfo';
import PublicTeamProfile from '../components/PublicTeamProfile'; 
import PublicNews from '../components/PublicNews';
import PublicEvents from '../components/PublicEvents';
import PublicRecords from '../components/PublicRecords';
import ManageMaintenance from '../components/ManageMaintenance';

// ✅ दुरुस्त केलेली ओळ: फक्त ही एक ओळ इथे जोडून घ्या भाऊ 🚀
import TeamProfile from '../components/TeamProfile';

// संघ व्यवस्थापन कॉम्पोनेंट
import ManageTeams from '../components/ManageTeams';

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
  
  const [viewTab, setViewTab] = useState('active'); 
  const [categoryFilter, setCategoryFilter] = useState('All'); 
  
  // UI states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamUid, setEditingTeamUid] = useState(null); 
  const [activeMenu, setActiveMenu] = useState('teams'); 
  const [importLoading, setImportLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null); 

  // ✅ दुरुस्त केलेली ओळ: फक्त ही एक ओळ इथे जोडून घ्या भाऊ 🚀
  const [isFullEditMode, setIsFullEditMode] = useState(false);
  

  // 📂 CSV बल्क इम्पोर्ट लॉजिक (सुरक्षित जसेच्या तसे)
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
        if (rows.length === 0) {
          Swal.fire({ icon: 'error', title: 'फाईल रिकामी आहे!' });
          setImportLoading(false);
          return;
        }
        
        try {
          const currentYear = new Date().getFullYear().toString();
          const chunkSize = 400; 
          let totalProcessed = 0;

          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            let chunkValidRowsCount = 0;

            chunk.forEach((row) => {
              if (!row.UID || !row.TeamName) return; 

              chunkValidRowsCount++;
              const docId = row.UID.toString().trim(); 
              const emailLower = row.AdminEmail ? row.AdminEmail.toString().trim().toLowerCase() : '';
              const adminArray = emailLower ? emailLower.split(',').map(em => em.trim()).filter(em => em !== '') : [];

              let mobileArray = [];
              if (row.Mobiles) {
                mobileArray = row.Mobiles.toString().split(',').map(num => num.trim()).filter(num => num !== '');
              }

              let cleanName = row.TeamName.toString().trim();
              cleanName = cleanName.replace(/\s*-\s*.+$/gi, '').replace(/\s*\(.+?\)/gi, '');
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
              
              batch.set(docRef, {
                uid: docId, teamName: cleanName, 
                name: row.AdminName ? row.AdminName.toString().trim() : 'प्रमुख ॲдमीन', 
                email: emailLower, admins: adminArray, mobiles: mobileArray,            
                role: "admin", teamSlug: teamSlug, teamCategory: row.Category || 'Men',
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
                currentYear: currentYear, isDeleted: false, isFormActive: false, 
                allowInAppForm: false, isProfileComplete: true, hasPendingEdits: false, verificationStatus: "approved",
                profileUpdatedAt: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp()
              });
            });

            if (chunkValidRowsCount > 0) {
              await batch.commit();
              totalProcessed += chunkValidRowsCount;
            }
          }

          Swal.fire({ icon: 'success', title: 'इम्पोर्ट कडक पूर्ण! 🎉', text: `एकूण ${totalProcessed} संघांचा डेटाबेसमधून रेकॉर्ड तयार झाला.` });
          fetchTeams();
        } catch (err) {
          console.error(err);
          Swal.fire({ icon: 'error', title: 'रायटिंग एरर!', text: err.message });
        } finally {
          setImportLoading(false);
          e.target.value = ''; 
        }
      }
    });
  };

  // डेटा ओढण्याचे कोअर फंक्शन
// =========================================================================
  // ⚡ SMART HYBRID ENGINE: IndexedDB कॅश मेमरी + सर्व्हेर बॅकअप (Reads सेव्हर 🚀)
  // =========================================================================
  const fetchTeams = async () => {
    try {
      console.log("🔍 [Smart Fetch]: आधी ब्राउझरच्या IndexedDB कॅशमध्ये डेटा शोधत आहे...");
      
      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      let querySnapshot;

      try {
        // १. आधी स्थानिक IndexedDB ऑफलाइन कॅशमधून डेटा ओढण्याचा प्रयत्न करणे (0 Reads ⚡)
        querySnapshot = await getDocsFromCache(adminQuery);
        
        if (querySnapshot.empty) {
          throw new Error("लोकल कॅश रिकामा आहे");
        }
        console.log("⚡ [IndexedDB Match]: सर्व संघांचा डेटा स्थानिक कॅशमधून यशस्वीरित्या ओढला!");
        
      } catch (cacheErr) {
        // २. जर लोकल कॅश रिकामा असेल किंवा पहिल्यांदा लॉगिन केले असेल, तरच थेट सर्व्हेरवरून फ्रेश डेटा आणणे
        console.warn("🌐 [Cache Missing/First Login]: लोकल कॅशमध्ये डेटा नाही. सर्व्हेरवरून फ्रेश कॉपी आणत आहे...");
        
        querySnapshot = await getDocs(adminQuery); // 👈 यामुळे एकदाच सर्व्हेर रीड्स होतील आणि डेटा IndexedDB मध्ये सेव्ह होईल
        console.log("📥 [Server Sync Success]: सर्व्हेरचा फ्रेश डेटा ब्राउझरच्या IndexedDB ऑफलाइन मेमरीमध्ये सुरक्षित साठवला!");
      }

      const teams = [];
      querySnapshot.forEach((doc) => { 
        teams.push({ id: doc.id, ...doc.data() }); 
      });

      setTeamsList(teams);
      console.log(`📊 एकूण ${teams.length} संघ डॅशबोर्ड मेमरीमध्ये रेडी आहेत.`);

    } catch (err) { 
      console.error("❌ डेटा लोड करताना कडक एरर आला भाऊ:", err);
      
      // 🚨 लाईव्ह वेबसाईटवर डेटा न दिसण्याचे मूळ कारण शोधण्यासाठी अलर्ट
      if (err.message.includes("permission-denied")) {
        Swal.fire({
          icon: 'error',
          title: 'सुरक्षा नियम लॉक आहेत! 🔐',
          text: 'फायरबेस Firestore Rules मध्ये सुपरॲडमीनला "read" ची परवानगी नाहीये भाऊ. नियम तपासा.',
          confirmButtonColor: '#ff6600'
        });
      } else if (err.message.includes("index")) {
        console.log("🔗 फायरबेस इंडेक्स लिंक कन्सोलमध्ये तपासा.");
      }
    }
  };

  useEffect(() => { fetchTeams(); }, []);

// 🧹 सुधारित डेटाबेस शुद्धीकरण: विस्कळीत जिल्हे + ईमेलमधील अवतरण चिन्हे ("") ऑटो-दुरुस्त करणे 🚀
  const handleCleanDatabaseDistricts = async () => {
    setLoading(true);
    try {
      // 🎯 महत्त्वाचा बदल: सर्व ॲडमिन्सचा डेटा स्कॅन करणे
      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      const querySnapshot = await getDocs(adminQuery);
      let updatedCount = 0;

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const docRef = doc(db, "users", docSnap.id);
        
        let currentDistrict = data.district ? data.district.toString().trim() : "";
        let currentEmail = data.email ? String(data.email).trim() : "";
        let currentAdmins = Array.isArray(data.admins) ? data.admins : null;
        
        let isChanged = false;
        let updatedFields = {};

        // 1️⃣ 🗺️ जिल्ह्यांची नावे शुद्धीकरण लॉजिक (तुझा मूळ कोड जसाच्या तसा)
        if (currentDistrict) {
          let originalDist = currentDistrict;
          const lowerDist = currentDistrict.toLowerCase();
          
          if (lowerDist === "mumbai" || lowerDist === "mumbai city" || lowerDist === "mumbai-city") {
            currentDistrict = "Mumbai City";
          } else if (lowerDist === "mumbai suburban" || lowerDist === "suburban" || lowerDist === "mumbai उपनगर") {
            currentDistrict = "Mumbai Suburban";
          } else if (lowerDist === "thane" || lowerDist === "ठाणे") {
            currentDistrict = "Thane";
          } else {
            currentDistrict = currentDistrict.charAt(0).toUpperCase() + currentDistrict.slice(1);
          }

          if (originalDist !== currentDistrict) {
            updatedFields.district = currentDistrict;
            isChanged = true;
          }
        }

        // 2️⃣ 📧 'email' फील्डमधील अवतरण चिन्हे ("") साफ करणे
        if (currentEmail) {
          // सुरुवातीचे आणि शेवटचे कोट्स (" किंवा ') उडवणे
          let cleanedEmail = currentEmail.replace(/^["']|["']$/g, '').trim();
          
          if (currentEmail !== cleanedEmail) {
            updatedFields.email = cleanedEmail;
            isChanged = true;
          }
        }

        // 3️⃣ 👥 'admins' ॲरेमधील खराब ईमेल आणि रिकाम्या स्ट्रिंग्स ("") उडवणे
        if (currentAdmins) {
          const cleanedAdmins = currentAdmins
            .map(email => {
              if (typeof email !== 'string') return email;
              // ॲरेमधील प्रत्येक ईमेलभोवतीचे कोट्स उडवणे
              return email.trim().replace(/^["']|["']$/g, '').trim();
            })
            // 🎯 रिकाम्या कोट्सच्या स्ट्रिंग्स गाळून टाकणे
            .filter(email => email !== "" && email !== undefined && email !== null);

          // जर मूळ ॲरे आणि स्वच्छ केलेल्या ॲरेमध्ये बदल असेल तरच अपडेट करणे
          if (JSON.stringify(currentAdmins) !== JSON.stringify(cleanedAdmins)) {
            updatedFields.admins = cleanedAdmins;
            isChanged = true;
          }
        }

        // 4️⃣ 🎯 जर डॉक्युमेंटमध्ये कोणताही बदल झाला असेल, तरच फायरबेसला हिट मारणे
        if (isChanged) {
          await updateDoc(docRef, updatedFields);
          updatedCount++;
          console.log(`🧹 [Cleaned] Doc ID: ${docSnap.id} | Changes:`, updatedFields);
        }
      }

      // चकाचक यशाचा मेसेज!
      Swal.fire({ 
        icon: 'success', 
        title: 'डेटाबेस शुद्धीकरण पूर्ण! 🧹🚩', 
        text: `एकूण ${updatedCount} मंडळांचा डेटा (जिल्हे + ईमेल कोट्स) यशस्वीरित्या ऑटो-करेक्ट झाला.` 
      });
      
      if (typeof fetchTeams === 'function') fetchTeams();
    } catch (err) { 
      console.error("❌ डेटाबेस क्लीन करताना राडा झाला भाऊ:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  // ⚠️ नवीन फिचर: संघ संपादन विनंती मंजूर करणे (Approve)
  const handleApproveTeam = async (teamId) => {
    try {
      await updateDoc(doc(db, "users", teamId), {
        hasPendingEdits: false,
        verificationStatus: "approved",
        isProfileComplete: true
      });
      Swal.fire({ icon: 'success', title: 'बदल मंजूर केले! ✅', timer: 1500, showConfirmButton: false });
      fetchTeams();
    } catch (err) { console.error(err); }
  };

  // 💬 नवीन फिचर: रिजेक्ट करून कमेंट किंवा शेरा सुचवणे (Comment)
  const handleRejectCommentTeam = async (teamId) => {
    const { value: text } = await Swal.fire({
      title: 'सुधारणा सुचवा 💬',
      input: 'textarea',
      inputLabel: 'मंडळाला पाठवायचा संदेश लिहा:',
      inputPlaceholder: 'उदा. ७ थरांचे वर्ष बरोबर लिहा...',
      showCancelButton: true,
      confirmButtonColor: '#ff6600'
    });

    if (text) {
      try {
        await updateDoc(doc(db, "users", teamId), {
          hasPendingEdits: false,
          verificationStatus: "rejected",
          adminComment: text.trim()
        });
        Swal.fire({ icon: 'info', title: 'शेरा पाठवला!', timer: 1500, showConfirmButton: false });
        fetchTeams();
      } catch (err) { console.error(err); }
    }
  };

  const openModal = (team = null) => {
    if (team) {
      setEditingTeamUid(team.id); 
      setTeamName(team.teamName);
      setAdminName(team.name);
      setAdminEmail(team.admins ? team.admins.join(', ') : team.email || '');
      setAllowInAppForm(team.allowInAppForm !== false);
      setTeamCategory(team.teamCategory || 'Men');
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
    Swal.fire({ icon: 'success', title: '🔒 लिंक कॉपी झाली!', confirmButtonColor: '#ff6600', timer: 1500 });
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emailLower = adminEmail.trim().toLowerCase();
      const teamSlug = teamName.toLowerCase().trim().replace(/[^a-zA-Z0-9\s-\u0900-\u097F]/g, '').replace(/\s+/g, '-');
      const currentYear = new Date().getFullYear().toString();

      if (editingTeamUid) {
        await updateDoc(doc(db, "users", editingTeamUid), {
          name: adminName.trim(), email: emailLower,
          admins: adminEmail.split(',').map(e => e.trim().toLowerCase()),
          teamName: teamName.trim(), teamSlug: teamSlug, teamCategory: teamCategory, allowInAppForm: allowInAppForm, updatedAt: serverTimestamp()
        });
      } else {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const generatedUid = `MCG${randomDigits}`;
        await setDoc(doc(db, "users", generatedUid), {
          uid: generatedUid, name: adminName.trim(), email: emailLower,
          admins: adminEmail.split(',').map(e => e.trim().toLowerCase()),
          role: "admin", teamName: teamName.trim(), teamSlug: teamSlug, teamCategory: teamCategory,
          currentYear: currentYear, isDeleted: false, isFormActive: allowInAppForm,
          allowInAppForm: allowInAppForm, isProfileComplete: false, hasPendingEdits: false, createdAt: serverTimestamp()
        });
      }

      setTeamName(''); setAdminName(''); setAdminEmail(''); setTeamCategory('Men');
      setIsModalOpen(false); setEditingTeamUid(null); 
      fetchTeams();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleToggleActiveStatus = async (teamId, currentStatus) => {
    const actionText = currentStatus ? "पुन्हे सक्रिय (Activate)" : "डी-ॲक्टिव्हेट (Deactivate)";
    const result = await Swal.fire({
      title: 'तुम्हाला खात्री आहे का?',
      text: `तुम्हाला या संघाला ${actionText} करायचे आहे का?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#16a34a' : '#dc2626', 
      confirmButtonText: currentStatus ? 'हो, सक्रिय करा!' : 'हो, बंद करा!',
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, "users", teamId), {
          isDeleted: !currentStatus,
          isFormActive: currentStatus ? true : false, 
          deletedAt: serverTimestamp()
        });
        Swal.fire({ icon: 'success', title: 'यशस्वी बदल!', showConfirmButton: false, timer: 1500 });
        fetchTeams();
      } catch (err) { console.error(err); }
    }
  };

  const handlePublishLive = async () => {
    setLoading(true);
    try {
      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      const querySnapshot = await getDocs(adminQuery);
      const freshTeams = [];
      querySnapshot.forEach((doc) => { freshTeams.push({ id: doc.id, ...doc.data() }); });

      const activeTeamsData = freshTeams
        .filter(t => !t.isDeleted)
        .map(t => ({
          id: t.id || t.uid || '', uid: t.uid || t.id || '', teamName: t.teamName || '', teamSlug: t.teamSlug || '', name: t.name || '', 
          establishedYear: t.establishedYear || '', slogan: t.slogan || '', logoUrl: t.logoUrl || '',
          aboutTeam: t.aboutTeam || '', bestPerformance: t.bestPerformance || '', teamCategory: t.teamCategory || 'Men',
          city: t.city || '', district: t.district || '', state: t.state || '', areaName: t.areaName || '', pincode: t.pincode || '',
          coachName: t.coachName || '', captainName: t.captainName || '', milestone7: t.milestone7 || '',
          milestone8: t.milestone8 || '', milestone9: t.milestone9 || '', milestone10: t.milestone10 || '',
          bestPerformanceUrl: t.bestPerformanceUrl || '', isProfileComplete: t.isProfileComplete !== false,
          hasPendingEdits: t.hasPendingEdits === true, mobiles: t.mobiles || [],
          socialLinks: { facebook: t.socialLinks?.facebook || '', instagram: t.socialLinks?.instagram || '', youtube: t.socialLinks?.youtube || '' }
        }));

      await setDoc(doc(db, "public_site_cache", "live_directory"), {
        teams: activeTeamsData, totalTeams: activeTeamsData.length, lastPublishedAt: serverTimestamp(), version: Date.now() 
      });
      Swal.fire({ icon: 'success', title: 'वेबसाइट लाईव्ह झाली! 🎉', text: `एकूण ${activeTeamsData.length} संघांचा फ्रेश डेटा कॅश झाला.` });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // =========================================================================
  // 🎯 Dashboard.jsx मधील मूळ टॅब कम्बाइन फिल्टरिंग (सर्च अपग्रेड फिक्स 🚀)
  // =========================================================================
  const filteredTeams = teamsList.filter(t => {
    const term = searchTerm.toLowerCase().trim();
    
    // 🎯 कडक दुरुस्ती: मूळ डॅशबोर्ड स्तरावरच Area, Pincode आणि City मॅचिंग जोडले
    const matchesSearch = term === '' ? true : (
      t.teamName?.toLowerCase().includes(term) ||
      t.name?.toLowerCase().includes(term) ||
      (t.uid && t.uid.toLowerCase().includes(term)) ||
      t.areaName?.toLowerCase().includes(term) ||
      t.pincode?.toString().includes(term) ||
      t.city?.toLowerCase().includes(term)
    );
    
    const matchesCategory = categoryFilter === 'All' ? true : (t.teamCategory === categoryFilter);

    if (viewTab === 'active') return matchesSearch && !t.isDeleted && matchesCategory;
    if (viewTab === 'deactive') return matchesSearch && t.isDeleted && matchesCategory;
    if (viewTab === 'form_allowed') return matchesSearch && !t.isDeleted && t.allowInAppForm !== false && matchesCategory;
    if (viewTab === 'edited_pending') return matchesSearch && !t.isDeleted && t.hasPendingEdits === true && matchesCategory;
    
    return false;
  });

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col md:flex-row font-sans antialiased pb-16 md:pb-0 select-none">
      
      {/* 📱 मोबाईल हेडर */}
      <div className="md:hidden bg-[#0b132b] text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
        <span className="text-base font-black tracking-wide">महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span></span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 text-slate-300 hover:text-white"><Menu size={22} /></button>
      </div>

      {/* Side Navigation Bar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[#0b132b] text-white p-6 flex flex-col justify-between z-50 transform transition-transform duration-300 ease-in-out md:relative md:transform-none ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div>
          <div className="mb-8 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black tracking-wide text-white">महाराष्ट्राचा <span className="text-[#ff6600]">गोविंदा</span></h2>
            <p className="text-[10px] text-[#ff6600] font-bold tracking-widest uppercase mt-0.5">⚙️ Superadmin Panel</p>
          </div>
          
          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-none pr-1">
            <button onClick={() => { setActiveMenu('teams'); setIsMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${activeMenu === 'teams' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Layers size={18} /><span>टीम्स मॅनेजमेंट</span></button>
            <button onClick={() => { setActiveMenu('govinda_katta'); setIsMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${activeMenu === 'govinda_katta' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Users size={18} /><span className="text-orange-400">🚩 गोविंदा कट्टा</span></button>
            <button onClick={() => { setActiveMenu('public_stats'); setIsMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${activeMenu === 'public_stats' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><BarChart3 size={18} /><span className="text-amber-400">📊  उत्सव आकडेवारी</span></button>
            <button onClick={() => { setActiveMenu('public_info'); setIsMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${activeMenu === 'public_info' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><BookOpen size={18} /><span className="text-yellow-400">📜 उत्सव नियमावली</span></button>
            
            <div className="border-t border-slate-800/80 my-3 pt-3"><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest pl-3 mb-1">📢 सिस्टीम फीड व्ह्यू</p></div>
            <button onClick={() => { setActiveMenu('public_news'); setIsMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${activeMenu === 'public_news' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Megaphone size={18} /><span className="text-teal-400">ताज्या घडामोडी</span></button>
            <button onClick={() => { setActiveMenu('public_events'); setIsMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${activeMenu === 'public_events' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Calendar size={18} /><span className="text-blue-400">उत्सव व सराव कट्टा</span></button>
            <button onClick={() => { setActiveMenu('public_records'); setIsMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${activeMenu === 'public_records' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Trophy size={18} /><span className="text-purple-400">ऐतिहासिक रेकॉर्ड्स</span></button>
            
            <div className="border-t border-slate-800/80 my-3 pt-3"><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest pl-3 mb-1">⚙️ कोअर सिस्टीम</p></div>
            <button onClick={() => { setActiveMenu('manage_maintenance'); setIsMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${activeMenu === 'manage_maintenance' ? 'bg-[#ff6600]/10 border-l-4 border-[#ff6600] text-[#ff6600]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Settings size={18} /><span className="text-orange-500">सिस्टीम मेंटेनन्स</span></button>
            
            <button onClick={handleCleanDatabaseDistricts} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm text-emerald-400 hover:bg-white/5 transition-all text-left">
              <Settings size={18} /><span>🧹  डेटाबेस शुद्धीकरण</span>
            </button>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-4">
          <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-red-600/10 text-red-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/20"><LogOut size={14} /><span>लॉगआऊट करा</span></button>
        </div>
      </div>

      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden"></div>}

      {/* मुख्य कार्यक्षेत्र */}
      <div className="flex-1 w-full overflow-y-auto">
        {activeMenu === 'govinda_katta' && <div className="p-4 md:p-6"><PublicDirectory /></div>}
        {activeMenu === 'public_stats' && <div className="p-4 md:p-6"><PublicStats /></div>}
        {activeMenu === 'public_info' && <div className="p-4 md:p-6"><PublicInfo /></div>}
        {activeMenu === 'public_news' && <div className="p-4 md:p-6"><PublicNews /></div>}
        {activeMenu === 'public_events' && <div className="p-4 md:p-6"><PublicEvents /></div>}
        {activeMenu === 'public_records' && <div className="p-4 md:p-6"><PublicRecords /></div>}
        {activeMenu === 'manage_maintenance' && <div className="p-4 md:p-6"><ManageMaintenance /></div>}

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

      {/* 🗟 पॉप-अप मॉडेल फॉर्म */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => { setIsModalOpen(false); setEditingTeamUid(null); }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 border border-slate-100 animate-in fade-in">
            <button onClick={() => { setIsModalOpen(false); setEditingTeamUid(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
            <div className="mb-5">
              <h3 className="text-lg font-black text-slate-800">{editingTeamUid ? 'संघाची माहिती बदला' : 'नवीन संघ नोंदणी'}</h3>
            </div>
            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">संघाचे नाव</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="उदा. शिवनेरी गोविंदा पथक" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">ॲडमीनचे नाव (प्रमुख)</label>
                <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="उदा. संदीप महाडिक" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">गुगल लॉगिन ईमेल आयडी</label>
                <input type="text" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="उदा. admin@gmail.com" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">संघाचा प्रकार (Category)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'Men', label: '👨‍👦  पुरुष' }, { id: 'Women', label: '👩‍👧   महिला' }, { id: 'Both', label: '👨‍👩‍👦  दोन्ही' }].map((cat) => (
                    <button key={cat.id} type="button" onClick={() => setTeamCategory(cat.id)} className={`py-2 px-1 rounded-xl border text-xs font-black transition-all ${teamCategory === cat.id ? 'bg-[#0b132b] text-white border-[#0b132b]' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{cat.label}</button>
                  ))}
                </div>
              </div>
              <div className="pt-2 pb-1 border-t border-b flex items-center justify-between">
                <div><span className="block text-xs font-black text-slate-800">In-App Registration Form</span></div>
                <button type="button" onClick={() => setAllowInAppForm(!allowInAppForm)} className={`p-1.5 rounded-xl ${allowInAppForm ? 'text-[#ff6600]' : 'text-slate-300'}`}>
                  {allowInAppForm ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#ff6600] text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 mt-2">
                <PlusCircle size={16} /><span>{loading ? 'प्रोसेस होत आहे...' : editingTeamUid ? 'माहिती अपडेट करा' : 'संघ नोंदणी करा'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

  {/* 🖥️ सुपरॲडमीन भव्य प्रोफाइल संपादन व व्ह्यू कक्ष (Full Edit Rights Fix 🚀) */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl relative p-6">
            
            {/* बंद करा बटण */}
            <button 
              onClick={() => { setSelectedTeam(null); setIsFullEditMode(false); fetchTeams(); }} 
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-black text-xs transition-all z-50 shadow-sm cursor-pointer"
            >
              ✕ बंद करा
            </button>
            
            <div className="pt-6 text-left">
              {isFullEditMode ? (
                // 🎯 ५०+ फील्ड्सचा एडिट मोड
                <div className="mt-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center space-x-2 mb-4 border-b pb-3">
                    <Edit2 size={18} className="text-[#ff6600]" />
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-wide">संपूर्ण प्रोफाईल एडिटिंग मोड</h3>
                  </div>
                  
                  {/* 🎯 फिक्स: इथे प्रॉप्समध्ये 'isEditMode' सोबत 'setIsEditMode' म्हणून 'setIsFullEditMode' पास केले! */}
                  <TeamProfile 
                    user={{ uid: selectedTeam.id || selectedTeam.uid, role: 'superadmin' }} 
                    teamData={selectedTeam}
                    isEditMode={isFullEditMode}
                    setIsEditMode={setIsFullEditMode} // 👈 ही ती ओळ जी मिसिंग होती, यामुळे 'रद्द करा' वर क्लिक केल्यावर एरर येणार नाही 🚀
                    setTeamData={setSelectedTeam}
                  />
                </div>
              ) : (
                // 👁️ व्ह्यू मोड: 🎯 फिक्स: इथे प्रॉप्स अचूक पास केले आहेत जे कन्सोलला 'undefined' दाखवू देणार नाहीत!
                <PublicTeamProfile 
                  team={selectedTeam} 
                  isSuperAdminView={true} // 👈 हा तो मुख्य प्रॉप जो 'undefined' येत होता
                  onEditClick={() => setIsFullEditMode(true)} // 👈 हे ते मुख्य फंक्शन जे 'Missing' येत होतं
                  onBack={() => { setSelectedTeam(null); fetchTeams(); }}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}