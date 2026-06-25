import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, enableIndexedDbPersistence,getDocsFromCache } from 'firebase/firestore';
import { ArrowLeft, Loader2, Shirt, Printer, ShieldCheck, Download } from 'lucide-react';
import * as XLSX from 'xlsx'; 


export default function Reports({ userTeamName, onBack }) {
  // --- STATE MANAGEMENT ---
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FIREBASE INDEXEDDB (OFFLINE PERSISTENCE) CONFIG ---
  useEffect(() => {
    const enableOffline = async () => {
      try {
        await enableIndexedDbPersistence(db);
        console.log("Firebase IndexedDB Persistence Enabled! Reads will be saved. 🔥");
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn("Persistence failed: Multiple tabs open.");
        } else if (err.code === 'unimplemented') {
          console.warn("Persistence failed: Browser does not support IndexedDB.");
        }
      }
    };
    enableOffline();
  }, []);

  // --- DATA FETCHING ---
// --- HARDCORE OFF-LINE/CACHE-FIRST DATA FETCHING ---
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        console.log("Fetching players for team:", userTeamName);
        const q = query(collection(db, "players"), where("teamName", "==", userTeamName));
        
        try {
          // 🎯 १. सर्वात आधी डेटा थेट लोकल IndexedDB (Cache) मधून मागवा (0 सर्व्हर Reads खर्च!)
          const cacheSnapshot = await getDocsFromCache(q);
          console.log("Data from Cache (IndexedDB)? true 🔥");
          setPlayers(cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (cacheErr) {
          // 🎯 २. जर कॅश रिकामी असेल (उदा. युझर पहिल्यांदाच रिपोर्ट पेजवर आलाय), तर सर्व्हरवरून आणा
          console.log("Cache is empty, fetching from server...");
          const serverSnapshot = await getDocs(q); // हा सर्व्हरवरून आणेल
          console.log("Data from Cache (IndexedDB)? false (Server Read Used) 🌍");
          setPlayers(serverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

      } catch (err) {
        console.error("Error loading players:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayers();
  }, [userTeamName]);

  // --- AGE CALCULATION LOGIC ---
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

// --- 📊 STRICT ORDER ENG-BACKEND EXCEL EXPORT FUNCTION ---
  const exportToExcel = () => {
    if (!players || players.length === 0) {
      alert("No player records found to export!");
      return;
    }

    // १. तू ठरवून दिलेला कॉलम्सचा अचूक क्रम (Strict Column Order)
    const columnOrder = [
      'Sr.No',
      'name',
      'gender',
      'dob',
      'blood',
      'mobile',
      'pyramidPlace',
      'tshirt',
      'shorts',
      'belt',
      'towel',
      'tshirtGiven',
      'insurance',
      'year',
      'registeredVia',
      'updatedAt',
      'createdAt'
    ];

    // २. डेटाबेसमधील डेटा जसाच्या तसा मॅप करणे (No Emoji, No Marathi)
    const excelData = players.map((p, index) => {
      const row = {};

      columnOrder.forEach(key => {
        if (key === 'Sr.No') {
          row[key] = index + 1; // अनुक्रम नंबर
        } else if (key === 'createdAt' || key === 'updatedAt') {
          // जर तारीख ऑब्जेक्ट स्वरूपात असेल तर तिला स्ट्रिंग बनवू, नाहीतर तशीच ठेवू
          row[key] = p[key]?.seconds 
            ? new Date(p[key].seconds * 1000).toLocaleString() 
            : (p[key] || '—');
        } else {
          // बाकी सर्व डेटाबेस व्हॅल्यूज (Pending, Done, Yes, No, Belt, Towel) जशाच्या तशा!
          row[key] = p[key] !== undefined && p[key] !== null && p[key] !== '' ? p[key] : '—';
        }
      });

      return row;
    });

    // ३. शीट आणि वर्कबुक तयार करणे
    const worksheet = XLSX.utils.json_to_sheet(excelData, { header: columnOrder });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Players_Master_List");

    // ४. कॉलमची रुंदी ऑटोमॅटिक सेट करणे (जेणेकरून नावे किंवा डिटेल्स कट होणार नाहीत)
    const max_widths = columnOrder.map(key => {
      const maxLen = Math.max(
        ...excelData.map(obj => (obj[key] ? obj[key].toString().length : 0)),
        key.length
      );
      return { wch: maxLen + 4 };
    });
    worksheet['!cols'] = max_widths;

    // ५. फाईल डाऊनलोड करणे
    const formattedTeamName = userTeamName ? userTeamName.replace(/\s+/g, '_').toUpperCase() : "TEAM";
    XLSX.writeFile(workbook, `${formattedTeamName}_RAW_BACKUP_${new Date().getFullYear()}.xlsx`);
  };

  // --- T-SHIRT PRINT FUNCTION ---
  const handleTshirtPrint = () => {
    const sizeOrder = { 'S': 1, 'M': 2, 'L': 3, 'XL': 4, '2XL': 5, '3XL': 6, '4XL': 7 };

    const sortedPlayers = [...players].sort((a, b) => {
      const orderA = sizeOrder[a.tshirt?.toUpperCase()] || 99;
      const orderB = sizeOrder[b.tshirt?.toUpperCase()] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    const counts = players.reduce((acc, p) => { 
      const sz = p.tshirt || '-';
      acc[sz] = (acc[sz] || 0) + 1; 
      return acc; 
    }, {});
    
    const sizeOrderList = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

    const countStr = sizeOrderList
      .filter(sz => counts[sz])
      .map(sz => `${sz}: ${counts[sz]}`)
      .join(' | ');

    const extraSizes = Object.entries(counts)
      .filter(([sz]) => !sizeOrderList.includes(sz.toUpperCase()))
      .map(([sz, c]) => `${sz}: ${c}`)
      .join(' | ');

    const finalCountStr = extraSizes ? `${countStr} | ${extraSizes}` : countStr;
    const totalPlayers = players.length;
    const currentYear = new Date().getFullYear();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${userTeamName.toUpperCase()} TSHIRT REPORT</title>
          <style>
            @page { size: auto; margin: 15mm 15mm 15mm 15mm; }
            body { font-family: sans-serif; margin: 0; padding: 0; color: #1e293b; }
            .header-area { border-bottom: 3px solid #ff6600; padding-bottom: 8px; margin-bottom: 15px; }
            h1 { text-transform: uppercase; margin: 0; font-size: 22px; color: #0f172a; }
            .count-summary { margin: 8px 0 0 0; font-size: 13px; font-weight: bold; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; border-bottom: 2px solid #94a3b8; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .status-badge { font-weight: bold; font-size: 11px; }
            .status-yes { color: #16a34a; }
            .status-no { color: #dc2626; }
            .custom-footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header-area">
            <h1>${userTeamName} - T-SHIRT REPORT (${currentYear})</h1>
            <div class="count-summary">एकूण खेळाडू: ${totalPlayers} | ( ${finalCountStr} )</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">अ.क्र.</th>
                <th>खेळाडूचे नाव</th>
                <th style="width: 12%;">T-Shirt Size</th>
                <th style="width: 12%;">Shorts Size</th>
                <th style="width: 25%;">टी-शर्ट स्थिती / सही</th>
              </tr>
            </thead>
            <tbody>
              ${sortedPlayers.map((p, index) => {
                const isGiven = p.tshirtGiven === 'Yes';
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td style="font-weight: 500;">${p.name}</td>
                    <td style="font-weight: bold;">${p.tshirt || '-'}</td>
                    <td>${p.shorts || '-'}</td>
                    <td>
                      <span class="status-badge ${isGiven ? 'status-yes' : 'status-no'}">
                        ${isGiven ? '👕 दिलेला आहे' : '⏳ बाकी [      ]'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="custom-footer">
            Printed via Dahihandi Management Platform | An Initiative by Sandesh Mahadik
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // --- INSURANCE PRINT FUNCTION ---
  const handleInsurancePrint = () => {
    const pendingPlayers = players.filter(p => !p.insurance || p.insurance === 'Pending');
    const totalPending = pendingPlayers.length;
    const currentYear = new Date().getFullYear();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${userTeamName.toUpperCase()} INSURANCE REPORT</title>
          <style>
            @page { size: auto; margin: 20mm 15mm 20mm 15mm; }
            body { font-family: sans-serif; margin: 0; padding: 0; }
            h1 { text-transform: uppercase; margin: 0 0 10px 0; font-size: 24px; color: #1e293b; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .count-summary { margin: 10px 0 20px 0; font-size: 15px; color: #b91c1c; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-center { text-align: center; }
            .custom-footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 12px; color: #555; border-top: 1px solid #ccc; padding-top: 8px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${userTeamName} - INSURANCE LIST (${currentYear})</h1>
          <div class="count-summary">Total Players: ${totalPending}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;" class="text-center">SR No.</th>
                <th>Name</th>
                <th style="width: 100px;" class="text-center">Age</th>
              </tr>
            </thead>
            <tbody>
              ${pendingPlayers.length > 0 ? 
                pendingPlayers.map((p, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${p.name}</td>
                    <td class="text-center">${calculateAge(p.dob || p.birthDate || p.dobString)}</td>
                  </tr>
                `).join('') 
                : `<tr><td colspan="3" class="text-center" style="padding: 20px; font-weight: bold; color: green;">सर्व खेळाडूंचा विमा पूर्ण झाला आहे! (No Pending Players)</td></tr>`
              }
            </tbody>
          </table>
          <div class="custom-footer">
            Printed via DahiHandi Management | An Initiative by Sandesh Mahadik
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // --- LOADING UI ---
  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#ff6600]" /></div>;

 // --- MAIN RENDER UI ---
  return (
    /* 🎯 बदल: 'min-h-screen' आणि मॅन्युअल पॅडिंग काढून कंटेनर एकदम फ्लॅट आणि सुटसुटीत केला, जेणेकरून तो डॅशबोर्डमध्ये परफेक्ट बसेल */
    <div className="w-full bg-transparent">
      
      {/* 🟢 मुख्य रिपोर्ट्स ग्रिड */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mb-6 mt-2">
        {/* T-Shirt Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-black mb-4 flex items-center gap-2 text-slate-800"><Shirt size={20} className="text-purple-600"/> टी-शर्ट अहवाल</h2>
            <p className="text-xs font-medium text-slate-400 mb-6">खेळाडूंच्या टी-शर्ट आणि शॉर्ट्स साईझनुसार अचूक सॉर्ट केलेला प्रिंट रिपोर्ट जनरेट करा.</p>
          </div>
          <button onClick={handleTshirtPrint} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95">
            <Printer size={16} /> प्रिंट रिपोर्ट
          </button>
        </div>

        {/* Insurance Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-black mb-4 flex items-center gap-2 text-slate-800"><ShieldCheck size={20} className="text-emerald-600"/> विमा अहवाल</h2>
            <p className="text-xs font-medium text-slate-400 mb-6">ज्या खेळाडूंचा विमा प्रलंबित (Pending) आहे, त्यांची यादी वयानुसार प्रिंट करा.</p>
          </div>
          <button onClick={handleInsurancePrint} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95">
            <Printer size={16} /> प्रिंट विमा रिपोर्ट
          </button>
        </div>
      </div>

      {/* 📊 नवीन कडक विभाग: एक्सेल डेटा बॅकअप */}
      <div className="max-w-4xl">
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 rounded-3xl border border-emerald-500/20 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-black text-emerald-800 flex items-center gap-2"><Download size={18}/> डेटाबेस बॅकअप (Excel Export)</h3>
            <p className="text-xs font-medium text-emerald-600/80 mt-1">मंडळाच्या सुरक्षिततेसाठी संपूर्ण खेळाडूंची मास्टर्स यादी मोबाईल नंबर, वयासह एका क्लिकवर सुरक्षित एक्सेल फाईलमध्ये डाउनलोड करा.</p>
          </div>
          <button 
            onClick={exportToExcel} 
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 flex-shrink-0"
          >
            <Download size={16} /> Excel मध्ये एक्सपोर्ट करा
          </button>
        </div>
      </div>

    </div>
  );
}