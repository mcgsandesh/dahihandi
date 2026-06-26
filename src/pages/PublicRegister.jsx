import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
// 🎯 सर्व महत्त्वाचे फायरबेस फंक्शन्स इथे अचूक इम्पॉर्ट केले आहेत (No 500 Error!)
import { doc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react';
import TshirtForm from '../components/TshirtForm'; 
import Swal from 'sweetalert2';

export default function PublicRegister() {
  const [teamInfo, setTeamInfo] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

    

  // 🎂 १. कॅलेंडर उघडताच सुरुवातीला २०१२ चे वर्ष दिसावे म्हणून डिफॉल्ट तारीख सेट केली
  const defaultDateForCalendar = `${new Date().getFullYear() - 14}-09-05`; // म्हणजेच 2012-01-01
  
  // 🎯 २. भविष्यातील (Future) तारीख ब्लॉक करण्यासाठी आजची कडक कमाल तारीख काढली
  const todayStrictMax = new Date().toISOString().split('T')[0];

  // सर्व स्टेट्स एकाच ऑब्जेक्टमध्ये एकत्र केल्या
  const [formState, setFormState] = useState({
    playerName: '',
    gender: 'Male',
    birthDate: defaultDateForCalendar, // 🎯 फॉर्म उघडताच थेट २०१२ चे वर्ष दाखवेल!
    mobileNumber: '',
    bloodGroup: 'B+',
    tshirtSize: 'M',
    shortsSize: 'M',
    customTshirt: '',
    customShorts: '',
    needBelt: 'No',
    needTowel: 'No',
    pyramidPlace: 'Base'
  });

  useEffect(() => {
    const validateLink = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const encryptedUid = urlParams.get('t');
        if (!encryptedUid) { setChecking(false); return; }

        const decryptedUid = atob(encryptedUid);
        const q = query(collection(db, "users"), where("uid", "==", decryptedUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setTeamInfo(docData);
          if (docData.teamCategory === 'Women') {
            setFormState(prev => ({ ...prev, gender: 'Female' }));
          }
        }
      } catch (err) { 
        console.error("Link validation error:", err); 
      } finally { 
        setChecking(false); 
      }
    };
    validateLink();
  }, []);

  //-------------------------------------------------------------------------------------//
  //यामुळे जर एखाद्या खेळाडूने फॉर्म आधीच ओपन करून ठेवला असेल आणि नंतर ॲडमीनने फॉर्म बंद केला, 
  // तरीही सबमिट बटण दाबताच सिस्टीम त्याला तिथेच रोखणार आणि डेटाबेसमध्ये एन्ट्री होऊ देणार नाही ❌.
   //-------------------------------------------------------------------------------------//
const handleSubmitPlayer = async (e) => {
    e.preventDefault();

    let formattedDate = formState.birthDate;
    if (formState.birthDate.includes('-')) {
      const [year, month, day] = formState.birthDate.split('-');
      formattedDate = `${day}/${month}/${year}`;
    }

    const cleanName = formState.playerName.trim();
    const cleanMobile = formState.mobileNumber.trim();

    // १. बेसिक माहिती अपूर्ण असल्यास मेसेज
    if (!cleanName || !formState.birthDate || !cleanMobile) {
      Swal.fire({ icon: 'warning', title: 'माहिती अपूर्ण आहे!', text: 'कृपया आवश्यक माहिती अचूक भरा!', confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
      return;
    }

    // २. नावासाठी कडक RegEx व्हॅलिडेशन
    const nameRegex = /^[a-zA-Z\u0900-\u097F\s]+$/;
    if (!nameRegex.test(cleanName) || cleanName.length < 3) {
      Swal.fire({ icon: 'error', title: 'चुकीचे नाव! 🛑', text: 'कृपया खेळाडूचे नाव योग्य अक्षरांमध्ये टाका! नावात नंबर किंवा स्पेशल कॅरेक्टर्स वापरू नका.', confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
      return;
    }

    // ३. मोबाईल नंबरसाठी कडक १० अंकी व्हॅलिडेशन
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(cleanMobile)) {
      Swal.fire({ icon: 'error', title: 'चुकीचा मोबाईल नंबर! 📱', text: 'कृपया अचूक १० अंकी मोबाईल नंबर प्रविष्ट करा!', confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
      return;
    }

    // ३.ब) जन्मदिनांक व्हॅलिडेशन
    const birthDateObj = new Date(formState.birthDate);
    const today = new Date();
    if (birthDateObj > today) {
      Swal.fire({ icon: 'error', title: 'तारीख चुकीची आहे! 🛑', text: 'जन्मदिनांक भविष्यातील असू शकत नाही. कृपया तुमची अचूक जन्म तारीख निवडा!', confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
      return;
    }
    
    setLoading(true);
    const normalizedNewName = cleanName.toLowerCase().replace(/\s+/g, ' ');

    try {
      // STRIKT SECURITY CHECK: लाईव्ह स्टेटस तपासणे
      const urlParams = new URLSearchParams(window.location.search);
      const encryptedUid = urlParams.get('t');
      if (!encryptedUid) throw new Error("Invalid Link Token");
      const decryptedUid = atob(encryptedUid);

      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("uid", "==", decryptedUid));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error("Team document not found");
      }

      const freshTeamDoc = userSnapshot.docs[0];
      const freshTeamData = freshTeamDoc.data();
      const freshTeamUID = freshTeamDoc.id; // 👈 कडक बदल: संघ आयडी शोधला

      // सुपरॲडमीन आणि ॲडमीन परमिशन ब्लॉक्स
      if (freshTeamData.allowInAppForm === false) {
        Swal.fire({ icon: 'error', title: 'प्रवेश नाकारला! 🛑', text: `सुपरॲडमीनद्वारे या संघाची ऑनलाईन नोंदणी प्रक्रिया स्थगित करण्यात आली आहे.`, confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
        setTeamInfo(freshTeamData); setLoading(false); return;
      }

      if (freshTeamData.isFormActive === false) {
        Swal.fire({ icon: 'error', title: 'नोंदणी बंद झाली आहे! 🛑', text: `क्षमस्व, या पथकाची ऑनलाईन नोंदणी प्रक्रिया चालू स्थितीमध्ये नाही.`, confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
        setTeamInfo(freshTeamData); setLoading(false); return;
      }

      if (freshTeamData.isDeleted === true) {
        Swal.fire({ icon: 'error', title: 'अवैध लिंक! ⚠️', text: `हा संघ सध्या सिस्टीममध्ये सक्रिय नाही.`, confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
        setTeamInfo(freshTeamData); setLoading(false); return;
      }

      // 🔄 ४. फ्रंटएंड मेमरी लेव्हलवर कडक डुप्लिकेशन चेक्स (teamUID नुसार)
      const playersRef = collection(db, "players");
      // 🎯 कडक बदल: 'teamName' ऐवजी थेट 'teamUID' मॅच करून डुप्लिकेशन्स चेक करणे! नाव सेम असले तरी प्रॉब्लेम मिटला!
      const teamPlayersQuery = query(playersRef, where("teamUID", "==", freshTeamUID));
      const querySnapshot = await getDocs(teamPlayersQuery);

      let isMobileDuplicate = false;
      let isNameDuplicate = false;

      querySnapshot.forEach((doc) => {
        const pData = doc.data();
        if (pData.isDeleted !== true) {
          if (pData.mobile === cleanMobile) isMobileDuplicate = true;
          if (pData.name) {
            const normalizedExistingName = pData.name.toLowerCase().trim().replace(/\s+/g, ' ');
            if (normalizedExistingName === normalizedNewName) isNameDuplicate = true;
          }
        }
      });

      if (isMobileDuplicate) {
        Swal.fire({ icon: 'error', title: 'मोबाईल नंबर आधीच वापरला आहे! 🛑', text: `एका नंबरवरून फक्त एकच नोंदणी करता येईल!`, confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
        setLoading(false); return; 
      }

      if (isNameDuplicate) {
        Swal.fire({ icon: 'error', title: 'नाव आधीच नोंदणीकृत आहे! 👤', text: `या नावाची नोंदणी यापूर्वीच झालेली आहे.`, confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
        setLoading(false); return;
      }

      // 🚀 ५. सर्व ओके असेल तरच नोंदणी आणि 'teamUID' डेटाबेसमध्ये राइट करणे
      const finalTshirt = formState.tshirtSize === 'Custom' ? formState.customTshirt.trim() : formState.tshirtSize;
      const finalShorts = formState.shortsSize === 'Custom' ? formState.customShorts.trim() : formState.shortsSize;
      const playerId = `PLY_PUB_${Date.now()}`;

      await setDoc(doc(db, "players", playerId), {
        name: cleanName,
        gender: formState.gender,
        dob: formattedDate,
        mobile: cleanMobile,
        blood: formState.bloodGroup,
        tshirt: finalTshirt,
        shorts: finalShorts,
        belt: formState.needBelt,
        towel: formState.needTowel,
        pyramidPlace: formState.pyramidPlace,
        insurance: "Pending", 
        
        // 🎯 कडक बदल: प्लेअर मॅपिंगसाठी टीम आयडी आणि नाव दोन्ही अचूक जमा केले!
        teamUID: freshTeamUID, 
        teamName: teamInfo.teamName, 
        year: teamInfo.currentYear || "2026", 
        registeredVia: "public_link",
        isDeleted: false,
        createdAt: serverTimestamp()
      });
      
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'नोंदणी अयशस्वी!', text: 'तांत्रिक अडचणीमुळे नोंदणी करता आली नाही.', confirmButtonColor: '#ff6600', customClass: { popup: 'rounded-3xl' } });
    } finally { setLoading(false); }
  };

//-----------
  if (checking) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex items-center justify-center text-white font-sans">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium tracking-widest pt-2">🔒 सुरक्षित लिंक तपासत आहे...</p>
        </div>
      </div>
    );
  }

  if (!teamInfo || teamInfo.isDeleted) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex items-center justify-center p-4 text-center font-sans">
        <div className="bg-white rounded-3xl p-6 max-w-sm shadow-2xl border border-slate-100 space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 flex items-center justify-center rounded-2xl mx-auto"><AlertTriangle size={26} /></div>
          <h2 className="text-lg font-black text-slate-800">अवैध किंवा चुकीची लिंक!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">कृपया तुमच्या संघ प्रमुखांशी संपर्क साधा.</p>
        </div>
      </div>
    );
  }

  if (teamInfo.isFormActive === false) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex items-center justify-center p-4 text-center font-sans">
        <div className="bg-white rounded-3xl p-6 max-w-sm shadow-2xl border border-slate-100 space-y-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 flex items-center justify-center rounded-2xl mx-auto"><AlertTriangle size={26} /></div>
          <h2 className="text-lg font-black text-slate-800 uppercase">{teamInfo.teamName}</h2>
          <div className="bg-red-50 text-red-600 font-bold py-1.5 rounded-xl text-xs">🔴 नोंदणी सद्यस्थिती: बंद</div>
          <p className="text-xs text-slate-500 leading-relaxed">या पथकाची On-line नोंदणी प्रक्रिया बंद करण्यात आली आहे.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex items-center justify-center p-4 text-center font-sans">
        <div className="bg-white rounded-3xl p-6 max-w-sm shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 bg-green-50 text-green-600 flex items-center justify-center rounded-2xl mx-auto"><ShieldCheck size={32} /></div>
          <h2 className="text-xl font-black text-slate-800">नोंदणी यशस्वी झाली!</h2>
          <p className="text-xs text-slate-600 font-medium">तुमची माहिती <span className="uppercase font-bold text-slate-800">{teamInfo.teamName}</span> कडे जमा झाली आहे.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col justify-between p-4 md:p-8 font-sans relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#ff6600] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl p-5 md:p-6 shadow-2xl border border-slate-100 space-y-5">
        <div className="text-center border-b border-slate-100 pb-4">
          {teamInfo.logoUrl && <img src={teamInfo.logoUrl} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-2 rounded-xl shadow-sm" />}
          <h1 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-wide">{teamInfo.teamName}</h1>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">अधिकृत गोविंदा खेळाडू नोंदणी पत्रक — {teamInfo.currentYear}</p>
        </div>

        <TshirtForm 
          formData={formState}
          setFormData={setFormState}
          teamData={teamInfo} // 👈 नवीन स्टेट नको, जो डेटा ऑलरेडी फेच केलाय तोच वापरा!
          onSubmit={handleSubmitPlayer}
          loading={loading}
          buttonText="माहिती सादर करा"
          showInsuranceSelect={false}
          maxDate={todayStrictMax} // 🎯 बदल: इथे आपण आजची तारीख पाठवली जेणेकरून फ्युचर डेट ब्लॉक होईल
        />
        
        <div className="text-center pt-6">
          <p className="text-slate-400 text-[10px] tracking-wider font-bold uppercase">
              Dahihandi Management | An Initiative by Sandesh Mahadik 
          </p>
        </div>
      </div>
      <div className="text-center pt-6"><p className="text-slate-500 text-[10px] tracking-wider font-medium">Powered by Maharashtracha Govinda</p></div>
    </div>
  );
}