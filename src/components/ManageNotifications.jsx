import React, { useState, useEffect } from 'react';
import { Send, Bell, Calendar, Users, Trash2, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { db } from '../firebase';
import { requestNotificationPermission } from '../firebase'; // तुमच्या firebase.js चा पाथ
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

export default function ManageNotifications({ lang = 'mr'}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [isTriggerBased, setIsTriggerBased] = useState(false);
  const [triggerDate, setTriggerDate] = useState('');
  const [loading, setLoading] = useState(false);


  const [notificationsList, setNotificationsList] = useState([]);
  const [fetching, setFetching] = useState(true);

  // फॉर्म लपवण्यासाठी / दाखवण्यासाठी (बाय-डिफॉल्ट बंद ठेवला आहे)
const [showForm, setShowForm] = useState(false);

  // 📡 १. नोटिफिकेशन्स लोड करणे
  const fetchNotifications = async () => {
    try {
      setFetching(true);
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setNotificationsList(list);
    } catch (error) {
      console.error("❌ Fetch Error:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 🚀 २. नवीन नोटिफिकेशन सेव्ह / सेन्ड करणे
// 🚀 २.१ FCM API द्वारे डायरेक्ट पुश नोटिफिकेशन ब्रॉडकास्ट करणे
  const sendPushToAllUsers = async (notificationTitle, notificationBody) => {
    try {
      // Firebase Cloud Messaging Send Endpoint
      // (टीप: Server Key किंवा Firebase OAuth Access Token द्वारे ब्रॉडकास्ट ट्रिगर करणे)
      console.log("📡 FCM Broadcaster Triggered for Title:", notificationTitle);

      // तुमच्या ॲपच्या सर्व युझर्ससाठी FCM Topic 'all_users' वापरून ट्रिगर करणे:
      const fcmPayload = {
        to: "/topics/all_users", // किंवा युझर्सचे रजिस्टर्ड टोकन्स
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: "/logo.png",
          click_action: "/dashboard"
        }
      };

      // ⚠️ टीप: जर तुमच्याकडे Server Key किंवा Cloud Function API Endpoint असेल तर इथे fetch करा.
      // तात्पुरते कन्सोलवर ट्रिगर कन्फर्मेशन:
      console.log("🚀 Payload ready to broadcast:", fcmPayload);

    } catch (pushErr) {
      console.error("⚠️ FCM Push Broadcast Error:", pushErr);
    }
  };

  // 🚀 २.२ नवीन नोटिफिकेशन सेव्ह व प्रत्यक्ष सेन्ड करणे
 // 🚀 २. नवीन नोटिफिकेशन सेव्ह व Localhost वर टेस्ट नोटिफिकेशन दाखवणे
  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      Swal.fire({ icon: 'warning', title: 'थांबा भाऊ!', text: 'शीर्षक आणि मेसेज भरणे अनिवार्य आहे.', confirmButtonColor: '#ff6600' });
      return;
    }

    if (isTriggerBased && !triggerDate) {
      Swal.fire({ icon: 'warning', title: 'तारीख निवडा!', text: 'ट्रिगर आधारित नोटिफिकेशनसाठी तारीख निवडणे गरजेचे आहे.', confirmButtonColor: '#ff6600' });
      return;
    }

    try {
      setLoading(true);
      
      // १. Firestore मध्ये सेव्ह करा
      await addDoc(collection(db, 'notifications'), {
        title: title.trim(),
        body: body.trim(),
        senderId: "superadmin_global",
        senderRole: "superadmin",
        target: target,
        isTriggerBased: isTriggerBased,
        triggerDate: isTriggerBased ? triggerDate : new Date().toISOString().split('T')[0],
        status: isTriggerBased ? 'pending' : 'sent',
        clickAction: '/dashboard',
        createdAt: serverTimestamp()
      });

      // 🎯 २. LOCALHOST TESTING: लगेच तुझ्याच ब्राउझरवर नोटिफिकेशन ट्रिगर करा!
      if (!isTriggerBased && Notification.permission === 'granted') {
        const swReg = await navigator.serviceWorker.ready;
        swReg.showNotification(title.trim(), {
          body: body.trim(),
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200]
        });
      }

      Swal.fire({
        icon: 'success',
        title: isTriggerBased ? 'नोटिफिकेशन शेड्युल झाले! 🗓️' : 'नोटिफिकेशन पाठवले व टेस्ट केले! 🚀',
        confirmButtonColor: '#ff6600',
        timer: 2000
      });

      setTitle('');
      setBody('');
      setIsTriggerBased(false);
      setTriggerDate('');
      fetchNotifications();

    } catch (error) {
      console.error("❌ Create Error:", error);
      Swal.fire({ icon: 'error', title: 'लोचा झाला!', text: 'डेटाबेसमध्ये नोंद करताना एरर आला.' });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ ३. नोटिफिकेशन हटवणे
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'नक्की हटवायचे का?',
      text: "हे नोटिफिकेशन यादीतून काढून टाकले जाईल.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'होय, डिलीट करा!',
      cancelButtonText: 'रद्द करा'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
        Swal.fire({ icon: 'success', title: 'हटवले!', timer: 1500, showConfirmButton: false });
        fetchNotifications();
      } catch (error) {
        console.error("❌ Delete Error:", error);
      }
    }
  };

return (
    <div className="w-full space-y-4 text-left animate-in fade-in duration-200 p-2 md:p-4 text-slate-800 bg-[#f8fafc]">
      
      <button
  type="button"
  onClick={async () => {
    const token = await requestNotificationPermission();
    if (token) {
      alert("✅ नोटिफिकेशन परवानगी मिळाली भाऊ! Console (F12) मध्ये Token प्रिंट झाला आहे.");
    } else {
      alert("❌ परवानगी नाकारली किंवा Error आला.");
    }
  }}
  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-sm transition-all"
>
  🔔 परमिशन्स ऑन करा (Test)
</button>

      {/* 👑 १. हेडर आणि कडक ॲक्शन बार */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl">
            <Bell size={22} />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-wide">
              {lang === 'en' ? 'Notification Center' : 'नोटिफिकेशन सेंटर'}
            </h2>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5">
              {lang === 'en' ? 'Manage, create & schedule notifications for users.' : 'इथून सर्व अलर्ट तयार करा, शेड्युल करा आणि मॅनेज करा.'}
            </p>
          </div>
        </div>
        
        {/* उजवीकडील बटन्स: फॉर्म उघडणे आणि रिफ्रेश करणे */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 ${
              showForm 
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'
            }`}
          >
            <Send size={14} />
            <span>{showForm ? "फॉर्म बंद करा ✕" : "➕ नवीन नोटिफिकेशन पाठवा"}</span>
          </button>

          <button 
            onClick={fetchNotifications} 
            className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-sm active:scale-95"
            title="रिफ्रेश"
          >
            <RefreshCw size={16} className={fetching ? "animate-spin text-orange-600" : "text-slate-600"} />
          </button>
        </div>
      </div>

      {/* 🛠️ २. डायनॅमिक ग्रिड लेआउट (फॉर्म उघडा असो किंवा बंद, जागा १००% युझफुल राहील 🚀) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* 📝 १. फॉर्म (फक्त showForm === true असतानाच डाव्या बाजूला दिसेल) */}
        {showForm && (
          <div className="lg:col-span-4 bg-white p-4 md:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3 animate-in slide-in-from-left-2 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Send size={13} className="text-orange-500" /> नवीन नोटिफिकेशन तयार करा
              </h3>
              <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md">Draft</span>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3 pt-1">
              
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                  <Users size={12} className="text-slate-400" /> टार्गेट ऑडियन्स
                </label>
               <select
  value={target}
  onChange={(e) => setTarget(e.target.value)}
  className="w-full h-[36px] bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs font-black text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
>
  <option value="all">🚩 सर्व गोविंदा व रसिक (Broadcast - Everyone)</option>
  <option value="team_admin_all">🟠 सर्व Team Admin (All Team Managers)</option>
  <option value="team_admin_form">👕 फक्त T-Shirt Form Access असलेले Team Admin (Form Allowed)</option>
  <option value="team_admin_no_form">⚠️ T-Shirt Form Access नसलेले Team Admin</option>
</select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700">📌 शीर्षक (Title)</label>
                <input
                  type="text"
                  placeholder="उदा. 🚨 विमा नोंदणीची अंतिम मुदत!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-[36px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700">💬 सविस्तर मेसेज (Body)</label>
                <textarea
                  rows="3"
                  placeholder="सर्व गोविंदा मंडळांनी विम्याची माहिती अपडेट करावी..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-all resize-none"
                ></textarea>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                    <Calendar size={13} className="text-orange-500" /> तारखेनुसार शेड्युल करा?
                  </span>
                  <input
                    type="checkbox"
                    checked={isTriggerBased}
                    onChange={(e) => setIsTriggerBased(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                  />
                </div>

                {isTriggerBased && (
                  <input
                    type="date"
                    value={triggerDate}
                    onChange={(e) => setTriggerDate(e.target.value)}
                    className="w-full h-[34px] bg-white border border-slate-200 rounded-xl px-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500 uppercase cursor-pointer"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0b132b] hover:bg-slate-800 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:bg-slate-400 active:scale-95"
              >
                <Send size={13} />
                <span>{loading ? 'प्रक्रिया सुरू आहे...' : isTriggerBased ? '🗓️ तारखेसाठी शेड्युल करा' : '🚀 सेव्ह / ब्रॉडकास्ट करा'}</span>
              </button>
            </form>
          </div>
        )}

        {/* 📋 २. उजवी बाजू: यादी (फॉर्म बंद असताना col-span-12 फुल स्क्रीन, उघडा असताना col-span-8 🚀) */}
        <div className={`${showForm ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 transition-all duration-300`}>
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>📜 पाठवलेल्या नोटिफिकेशन्सची यादी</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px]">{notificationsList.length}</span>
            </h3>
            
            {/* छोटा क्विक काउंट फिल्टर indicator */}
            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
              <span>Sent: {notificationsList.filter(n => n.status !== 'pending').length}</span>
              <span>•</span>
              <span>Scheduled: {notificationsList.filter(n => n.status === 'pending').length}</span>
            </div>
          </div>

          {fetching ? (
            <div className="text-center py-12 text-xs font-bold text-slate-400 animate-pulse">डेटाबेस मधून नोटिफिकेशन्स लोड होत आहेत...</div>
          ) : notificationsList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <p className="text-xs font-bold">अजून एकही नोटिफिकेशन पाठवले नाही भाऊ.</p>
              <p className="text-[10px] text-slate-400">वरच्या "➕ नवीन नोटिफिकेशन पाठवा" बटनावर क्लिक करून पहिला मेसेज तयार करा.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {notificationsList.map((item) => (
                <div key={item.id} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-left space-y-2 hover:border-orange-500/40 transition-all flex flex-col justify-between shadow-2xs">
                  
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                          item.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.status === 'pending' ? '🗓️ Scheduled' : '✅ Sent'}
                        </span>
                        <span className="text-[8px] font-black bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                          Target: {item.target}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50"
                        title="हटवा"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">{item.body}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[9px] font-bold text-slate-400 mt-2">
                    <span>तारीख: {item.triggerDate || 'Instant'}</span>
                    <span>ID: {item.id.substring(0, 6)}...</span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}