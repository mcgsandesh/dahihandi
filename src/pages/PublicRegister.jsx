import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, ChevronRight, AlertTriangle, MapPin, Calendar, Shirt } from 'lucide-react';

export default function PublicRegister() {
  
  // ==========================================
  // 📌 SECTION 1: STATES & URL VALIDATION
  // ==========================================
  const [teamInfo, setTeamInfo] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // खेळाडू फॉर्म इनपुट स्टेट्स
  const [playerName, setPlayerName] = useState('');
  const [gender, setGender] = useState('Male'); 
  const [birthDate, setBirthDate] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [tshirtSize, setTshirtSize] = useState('M');
  const [shortsSize, setShortsSize] = useState('32');
  const [needBelt, setNeedBelt] = useState('No');
  const [needTowel, setNeedTowel] = useState('No');
  const [pyramidPlace, setPyramidPlace] = useState('Base');

  // URL चेक आणि टीम व्हॅलिडेशन
  useEffect(() => {
    const validateLink = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const encryptedUid = urlParams.get('t');

        if (!encryptedUid) {
          setChecking(false);
          return;
        }

        const decryptedUid = atob(encryptedUid);

        const q = query(collection(db, "users"), where("uid", "==", decryptedUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setTeamInfo(docData);
          
          if (docData.teamCategory === 'Women') {
            setGender('Female');
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

  // ==========================================
  // 📌 SECTION 2: DATA SUBMIT HANDLER
  // ==========================================
  const handleSubmitPlayer = async (e) => {
    e.preventDefault();

      // तारीख फॉरमॅट करणे: YYYY-MM-DD -> DD/MM/YYYY
    let formattedDate = birthDate;
    if (birthDate.includes('-')) {
      const [year, month, day] = birthDate.split('-');
      formattedDate = `${day}/${month}/${year}`;
    }


    if (!playerName || !birthDate || !mobileNumber) {
      alert("कृपया आवश्यक माहिती अचूक भरा!");
      return;
    }
    setLoading(true);

    try {
      const playerId = `PLY_PUB_${Date.now()}`;
      await setDoc(doc(db, "players", playerId), {
        name: playerName.trim(),
        gender: gender,
        dob: formattedDate,
        mobile: mobileNumber.trim(),
        blood: bloodGroup,
        tshirt: tshirtSize,
        shorts: shortsSize,
        belt: needBelt,
        towel: needTowel,
        pyramidPlace: pyramidPlace,
        insurance: "प्रलंबित", 
        teamName: teamInfo.teamName, 
        year: teamInfo.currentYear || "2026", 
        registeredVia: "public_link",
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("नोंदणी करताना अडचण आली.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateMask = (value) => {
  const v = value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) {
    return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 8)}`;
  } else if (v.length >= 3) {
    return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
  }
  return v;
};

  // ==========================================
  // 📌 SECTION 3: CONDITIONAL SCREENS
  // ==========================================
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
          <p className="text-xs text-slate-500 leading-relaxed">या पथकाची ऑनलाईन नोंदणी प्रक्रिया बंद करण्यात आली आहे.</p>
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

  // ==========================================
  // 📌 SECTION 4: MAIN FORM UI
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col justify-between p-4 md:p-8 font-sans relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#ff6600] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl p-5 md:p-6 shadow-2xl border border-slate-100 space-y-5">
        
        <div className="text-center border-b border-slate-100 pb-4">
          {teamInfo.logoUrl && (
            <img src={teamInfo.logoUrl} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-2 rounded-xl shadow-sm" />
          )}
          <h1 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-wide">
            {teamInfo.teamName}
          </h1>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">अधिकृत गोविंदा खेळाडू नोंदणी पत्रक — {teamInfo.currentYear}</p>
        </div>

        <form onSubmit={handleSubmitPlayer} className="space-y-4">
          
          {/* विभाग १: वैयक्तिक माहिती */}
          <div className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-[#ff6600] uppercase tracking-wider">— वैयक्तिक माहिती —</p>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">खेळाडूचे पूर्ण नाव</label>
              <input type="text" required value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="उदा. राहुल पाटील" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6600] bg-white font-medium text-slate-800" />
            </div>

            {/* 🛠️ लिंग निवड रेडिओ बटन्स (कंस पूर्णपणे फिक्स केले) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">लिंग (Gender)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`py-2 px-4 rounded-xl border text-xs font-bold text-center transition-all ${
                    gender === 'Male' 
                      ? 'bg-[#ff6600] text-white border-[#ff6600] shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  पुरुष (Male)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`py-2 px-4 rounded-xl border text-xs font-bold text-center transition-all ${
                    gender === 'Female' 
                      ? 'bg-[#ff6600] text-white border-[#ff6600] shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  महिला (Female)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">रक्त गट</label>
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700">
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">थर रचना स्थान</label>
                <select value={pyramidPlace} onChange={(e) => setPyramidPlace(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700">
                  {['Base', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Back Shidi', 'Front Shidi', 'Left Shidi', 'Right Shidi', 'Coach', 'Captain', 'Administration'].map((place) => (
                    <option key={place} value={place}>{place}</option>
                  ))}
                </select>
              </div>
            </div>




<div className="grid grid-cols-2 gap-3">
    <div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1">जन्म तारीख</label>
      <input 
        type="text" 
        required 
        placeholder="DD/MM/YYYY"
        value={birthDate} 
        onFocus={(e) => (e.target.type = 'date')} // क्लिक केल्यावर कॅलेंडर ओपन होईल
        onBlur={(e) => {
            if (!e.target.value) e.target.type = 'text'; // बाहेर क्लिक केल्यावर पुन्हा टेक्स्ट दिसेल
        }}
        onChange={(e) => setBirthDate(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:border-[#ff6600]" 
      />
    </div>
  <div>
    <label className="block text-[11px] font-bold text-slate-600 mb-1">मोबाईल नंबर</label>
    <input 
      type="tel" 
      required 
      maxLength="10" 
      value={mobileNumber} 
      onChange={(e) => setMobileNumber(e.target.value)} 
      placeholder="9876543210" 
      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white font-medium text-slate-800" 
    />
  </div>
</div>



          </div>

          {/* विभाग २: युनिफॉर्म मापे */}
          <div className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-[#ff6600] uppercase tracking-wider">— युनिफॉर्म —</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">टी-शर्ट साईझ</label>
                <select value={tshirtSize} onChange={(e) => setTshirtSize(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700">
                  <option value="S">S - 36–38</option>
                  <option value="M">M - 38–40</option>
                  <option value="L">L - 40–42</option>
                  <option value="XL">XL - 42–44</option>
                  <option value="2XL">2XL - 44–46</option>
                  <option value="3XL">3XL - 46–48</option>
                  <option value="4XL">4XL - 48–50</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">शॉर्ट्स साईझ</label>
                <select value={shortsSize} onChange={(e) => setShortsSize(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700">
                  <option value="S">S - 36–38</option>
                  <option value="M">M - 38–40</option>
                  <option value="L">L - 40–42</option>
                  <option value="XL">XL - 42–44</option>
                  <option value="2XL">2XL - 44–46</option>
                  <option value="3XL">3XL - 46–48</option>
                  <option value="4XL">4XL - 48–50</option>
                </select>
              </div>
            </div>
          </div>

          {/* विभाग ३: अतिरिक्त साहित्य */}
          <div className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-[#ff6600] uppercase tracking-wider">— अतिरिक्त साहित्य —</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">पट्टा (Belt)</label>
                <select value={needBelt} onChange={(e) => setNeedBelt(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700">
                  <option>No</option><option>Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">टॉवेल (Towel)</label>
                <select value={needTowel} onChange={(e) => setNeedTowel(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700">
                  <option>No</option><option>Yes</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#0b132b] hover:bg-[#162244] text-white py-3.5 rounded-xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2">
            <span>{loading ? 'नोंदणी होत आहे...' : 'माहिती सादर करा'}</span>
            <ChevronRight size={16} />
          </button>
          <div className="text-center pt-6">
          <p className="text-slate-400 text-[10px] tracking-wider font-bold uppercase">
              Dahihandi Management | An Initiative by Sandesh Mahadik 
          </p>
        </div>
        </form>
      </div>

      <div className="text-center pt-6">
        <p className="text-slate-500 text-[10px] tracking-wider font-medium">Powered by Maharashtracha Govinda</p>
      </div>
    </div>
  );
}