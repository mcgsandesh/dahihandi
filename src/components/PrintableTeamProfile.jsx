import React from 'react';

export const handleProfilePrint = (team, user, logoIcon) => {
  if (!team) return;

  const finalTeamName = team.teamName || user?.teamName || "—";
  const finalUID = team.uid || team.id || user?.teamUID || user?.uid || "—";
  const isWomenTeam = team.teamCategory === 'Women';

  // सक्रिय रेkords गाळणी
  const milestones = [
    { label: isWomenTeam ? '५ थर' : '७ थर', value: team.milestone7 },
    { label: isWomenTeam ? '६ थर' : '८ थर', value: team.milestone8 },
    { label: isWomenTeam ? '७ थर' : '९ थर', value: team.milestone9 },
    { label: '१० थर', value: team.milestone10 },
  ].filter(m => m.value && m.value !== '0' && m.value !== 0 && m.value !== '—' && m.value.trim() !== '');

  // मंडळाच्या स्वतःच्या सोशल मीडिया लिंक्स (फूटरसाठी)
  const teamFb = team.socialLinks?.facebook || '#';
  const teamIg = team.socialLinks?.instagram || '#';
  const teamYt = team.socialLinks?.youtube || '#';

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
<html>
  <head>
    <title>${finalTeamName.toUpperCase()} OFFICIAL PROFILE</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;700;800&family=Poppins:wght@400;600;700;900&display=swap');
      @page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }
      body { font-family: 'Poppins', 'Mukta', sans-serif; margin: 0; padding: 0; color: #1e293b; background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      
      /* 🎯 फिक्स: ब्राऊझरचे डीफॉल्ट कचरा हेडर-फुटर लपवण्यासाठी आणि स्वतःची लाईन सेट करण्यासाठी */
      @media print {
        html, body { padding-top: 0px !important; }
      }

      /* 🚀 नवीन प्रिमियम टॉप पट्टीची डिझाईन */
      .custom-top-meta-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9px;
        font-weight: bold;
        font-family: monospace;
        color: #64748b;
        margin-bottom: 8px;
        width: 100%;
        border-bottom: 1px dashed #e2e8f0;
        padding-bottom: 4px;
      }
      .center-title-meta {
        font-family: 'Poppins', sans-serif;
        font-weight: 800;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* मुख्य हेडर लेआउट */
      .header-area { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ff6600; padding-bottom: 10px; margin-bottom: 15px; }
      .header-left { display: flex; align-items: center; gap: 12px; }
      .logo-main { width: 55px; height: 55px; object-fit: contain; }
      .main-title { font-size: 24px; font-weight: 900; margin: 0; color: #0f172a; line-height: 1.2; }
      .main-sub { font-size: 11px; font-weight: 700; margin: 2px 0 0 0; color: #475569; }
      
      /* 🌐 सोशल मीडिया आयकॉन्स आणि लिंक्स २ रो लेआउट वरती */
      .social-container { text-align: right; display: flex; flex-direction: column; gap: 5px; }
      .social-row { display: flex; gap: 6px; justify-content: flex-end; }
      .social-item { background: #f8fafc; padding: 4px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px; font-weight: bold; text-decoration: none; color: #334155; display: flex; align-items: center; gap: 5px; }
      .social-item svg { display: inline-block; vertical-align: middle; }

      /* डार्क टीम बॅनर */
      .team-banner { background: linear-gradient(to right, #0b132b, #1c2541); color: #fff; padding: 12px 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
      .team-left-info { display: flex; align-items: center; gap: 12px; }
      .team-logo { width: 45px; height: 45px; object-fit: contain; background: white; padding: 2px; border-radius: 8px; }
      .team-logo-missing { width: 45px; height: 45px; border-radius: 8px; background: #ff6600; color: white; font-weight: 900; font-size: 11px; display: flex; align-items: center; justify-content: center; }
      .team-name { font-size: 19px; font-weight: 900; margin: 0; text-transform: uppercase; }
      .team-slogan { font-size: 11px; color: #cbd5e1; font-style: italic; margin: 1px 0 3px 0; font-weight: 500; }
      .team-tags { display: flex; gap: 12px; font-size: 10px; font-weight: bold; color: #94a3b8; }
      .tag-value { color: #fff; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 4px; }
      .uid-box { text-align: right; font-family: monospace; font-size: 12px; font-weight: 900; color: #ff6600; background: rgba(255,102,0,0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,102,0,0.2); }

      /* मुख्य २ भाग विभागणी */
      .layout-container { display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 12px; gap: 15px; }
      .left-info-side { width: 58%; display: flex; flex-direction: column; gap: 10px; }
      .right-photo-side { width: 38%; border: 1px solid #cbd5e1; padding: 4px; background: #f8fafc; border-radius: 12px; display: flex; flex-direction: column; box-sizing: border-box; }
      
      .info-block { background: #fff; border: 1px solid #cbd5e1; padding: 12px; border-radius: 10px; font-size: 11.5px; font-weight: bold; }
      .block-heading { font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
      
      /* रो अलाइनमेंट सिस्टीम */
      .flex-baju-baju { display: flex !important; justify-content: space-between !important; align-items: center !important; gap: 10px !important; width: 100% !important; margin-bottom: 6px; }
      .flex-col-half { width: 48% !important; text-align: left !important; }
      
      .data-label { color: #64748b; font-size: 9.5px; text-transform: uppercase; display: block; margin-bottom: 1px; }
      .data-val { color: #1e293b; font-size: 11.5px; font-weight: 800; display: block; }

      .photo-frame { flex: 1; width: 100%; min-height: 140px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
      .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
      .empty-photo { height: 100%; min-height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px; font-weight: bold; background: #f1f5f9; border-radius: 8px; }

      /* 🏆 फिक्स: ऐतिहासिक थर २ कॉलम्समध्ये अत्यंत कॉम्पॅक्ट लेआउट */
      .records-block { background: #fff; border: 1px solid #cbd5e1; padding: 12px; border-radius: 10px; margin-bottom: 12px; }
      .records-grid-baju { display: flex !important; flex-wrap: wrap !important; justify-content: space-between !important; gap: 10px !important; width: 100% !important; }
      .record-box-half { width: 48% !important; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 8px; display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 11.5px; font-weight: bold; box-sizing: border-box !important; }
      .record-year-badge { background: #ff6600; color: #fff; font-family: sans-serif; font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 5px; }

      /* संक्षिप्त इतिहास */
      .history-block { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 12px; border-radius: 10px; margin-bottom: 25px; }
      .history-desc { font-size: 11px; font-weight: 500; color: #334155; line-height: 1.5; text-align: justify; margin: 2px 0 0 0; white-space: pre-wrap; word-break: break-word; }

      /* फूटर बार */
      .footer-bar { position: fixed; bottom: 0; left: 0; width: 100%; padding-top: 2px; background: #fff; display: flex; flex-direction: column; gap: 4px; z-index: 10; }
      .footer-top { display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #475569; font-weight: bold; font-family: monospace; }
      .footer-social-links { display: flex; justify-content: center; gap: 15px; font-size: 8.5px; font-weight: 800; border-top: 1px dashed #e2e8f0; padding-top: 4px; margin-top: 2px; }
    </style>
  </head>
  <body>
    
    <div style="position: relative; z-index: 10; box-sizing: border-box;">
      
      <!-- 🎯 फिक्स: स्वतःची कडक प्रिमियम टॉप लाईन (सेंटर टायटल आणि पूर्ण २०२६ वर्षासह) -->
      <div class="custom-top-meta-line">
        <div>Printed via MGDM App</div>
        <div class="center-title-meta">${finalTeamName.toUpperCase()} OFFICIAL PROFILE</div>
        <div>9 - July - 2026</div>
      </div>

      <!-- १. हेडर आणि अधिकृत रंगीत SVG आयकॉन्ससह सोशल मीडिया लिंक्स -->
      <div class="header-area">
        <div class="header-left">
          <img src="${logoIcon}" class="logo-main" alt="MCG" />
          <div>
            <h1 class="main-title">महाराष्ट्राचा <span style="color: #ff6600;">गोविंदा</span></h1>
            <p class="main-sub">प्रत्येक गोविंदासाठी</p>
          </div>
        </div>
        
        <div class="social-container">
          <div class="social-row">
            <a href="https://facebook.com/maharashtrachagovinda" target="_blank" class="social-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span>@maharashtrachagovinda</span>
            </a>
            <a href="https://instagram.com/maharashtrachagovinda" target="_blank" class="social-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="url(#ig-h-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><defs><linearGradient id="ig-h-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#fdf497" /><stop offset="45%" stop-color="#fd5949" /><stop offset="60%" stop-color="#d6249f" /><stop offset="100%" stop-color="#285AEB" /></linearGradient></defs><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              <span>@maharashtrachagovinda</span>
            </a>
          </div>
          <div class="social-row">
            <a href="https://youtube.com/maharashtrachagovinda" target="_blank" class="social-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="#FF0000" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span>maharashtrachagovinda</span>
            </a>
            <a href="https://www.maharashtrachagovinda.com" target="_blank" class="social-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span>www.maharashtrachagovinda.com</span>
            </a>
          </div>
        </div>
      </div>

      <!-- २. डार्क टीम बॅनर -->
      <div class="team-banner">
        <div class="team-left-info">
          ${team.logoUrl ? 
            `<img src="${team.logoUrl}" class="team-logo" alt="Logo" />` : 
            `<div class="team-logo-missing">MCG</div>`
          }
          <div>
            <h2 class="team-name">${finalTeamName}</h2>
            <div class="team-slogan">“${team.slogan || 'क्रियेवीण वाचाळता व्यर्थ आहे.'}”</div>
            <div class="team-tags">
              <div>Establishing Year: <span class="tag-value">${team.establishedYear || '—'}</span></div>
              <div>Team Type: <span class="tag-value">${team.teamCategory === 'Women' ? 'महिला' : team.teamCategory === 'Both' ? 'दोन्ही' : 'पुरुष'}</span></div>
            </div>
          </div>
        </div>
        <div class="uid-box">
          <span style="font-size: 7px; color: #64748b; display: block; font-weight: 900; letter-spacing: 0.5px;">TEAM IDENTIFIER</span>
          UID: ${finalUID}
        </div>
      </div>

      <!-- ३. मुख्य २ भाग विभागणी मांडणी -->
      <div class="layout-container">
        
        <!-- डावा भाग -->
        <div class="left-info-side">
          <div class="info-block">
            <div class="block-heading">📍 परिसर आणि जिल्हा तपशील</div>
            <div style="font-size: 11px; color: #1e293b; font-weight: 800; margin-bottom: 6px;">पत्ता: ${team.address || '—'}</div>
            
            <div class="flex-baju-baju">
              <div class="flex-col-half"><span class="data-label">शहर (City)</span><span class="data-val">${team.city || '—'}</span></div>
              <div class="flex-col-half"><span class="data-label">जिल्हा (District)</span><span class="data-val">${team.district || '—'}</span></div>
            </div>
            
            <div class="flex-baju-baju" style="margin-bottom: 0;">
              <div class="flex-col-half"><span class="data-label">पिनकोड (Pincode)</span><span class="data-val">${team.pincode || '—'}</span></div>
              <div class="flex-col-half"><span class="data-label">परिसर (Area)</span><span class="data-val">${team.areaName || '—'}</span></div>
            </div>
          </div>

          <div class="info-block">
            <div class="block-heading">👤 मंडळाचे मुख्य पदाधिकारी</div>
            <div class="flex-baju-baju" style="margin-bottom: 0;">
              <div class="flex-col-half"><span class="data-label">मार्गदर्शक (COACH)</span><span class="data-val">${team.coachName || '—'}</span></div>
              <div class="flex-col-half"><span class="data-label">कर्णधार (CAPTAIN)</span><span class="data-val">${team.captainName || '—'}</span></div>
            </div>
          </div>

          <div class="info-block" style="background: #fff7ed; border-color: #ffedd5; padding: 10px 12px;">
            <div class="block-heading" style="color: #c2410c; margin-bottom: 4px;">🏆 सर्वोत्कृष्ट कामगिरी (RECORD)</div>
            <div style="color: #9a3412; font-size: 11.5px; font-weight: 800;">${team.bestPerformance || '—'}</div>
          </div>
        </div>

        <!-- उजवा भाग (Vertical Photo Lock) -->
        <div class="right-photo-side">
          <span style="font-size: 7.5px; color: #64748b; font-weight: 900; text-transform: uppercase; display: block; margin-bottom: 3px;">📸 सलामीचे क्षणचित्र</span>
          <div class="photo-frame">
            ${team.bestPerformanceUrl ? 
              `<img src="${team.bestPerformanceUrl}" alt="Performance" />` : 
              `<div class="empty-photo"><span>📸</span><p style="margin:2px 0 0 0;">फोटो उपलब्ध नाही</p></div>`
            }
          </div>
        </div>

      </div>

      <!-- ४. ऐतिहासिक थर कामगिरी रेकॉर्ड्स -->
      <div class="records-block">
        <div class="block-heading" style="border: none; margin-bottom: 5px;">🏆 ऐतिहासिक थर कामगिरी रेकॉर्ड्स</div>
        <div class="records-grid-baju">
          ${milestones.length > 0 ? 
            milestones.map(m => `
              <div class="record-box-half">
                <span style="color:#475569;">${m.label}</span>
                <span class="record-year-badge">${m.value}</span>
              </div>
            `).join('') : 
            `<div style="font-size:11px; color:#94a3b8; font-weight:bold; padding: 2px;">थरांचे रेकॉर्ड्स नोंदवलेले नाहीत.</div>`
          }
        </div>
      </div>

      <!-- ५. संक्षिप्त इतिहास -->
      <div class="history-block">
        <div class="block-heading" style="border: none; margin-bottom: 2px;">📜 संघाबद्दल संक्षिप्त इतिहास</div>
        <p class="history-desc">${team.aboutTeam || '—'}</p>
      </div>

      <!-- 🔒 ६. मुख्य प्रिमियम वॉटरमार्क रचना (Opacity: 0.05) -->
      <div class="print-watermark" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.05; pointer-events: none; z-index: 0;">
        <div style="text-align: center; transform: rotate(-35deg) scale(1.3);">
          <img src="${logoIcon}" alt="MCG Watermark" style="width: 220px; height: 220px; object-fit: contain; margin: 0 auto 5px auto;" />
          <h1 style="font-size: 42px; font-weight: 900; text-transform: uppercase; tracking-spacing: 1px; color: #ff6600; margin: 0; font-family: 'Mukta', sans-serif;">महाराष्ट्राचा गोविंदा</h1>
        </div>
      </div>

      <!-- 👣 ७. अधिकृत फूटर ब्लॉक: Double Line Design Pattern 🚀 -->
      <div class="footer-bar">
        
        <!-- 🔥 वरची पहिली मजबूत रेषा -->
        <div style="border-top: 1.5px solid #0f172a; width: 100%; margin-bottom: 2px;"></div>

        <!-- मंडळाच्या स्वतःच्या सोशल लिंक्स अधिकृत रंगांच्या SVG आयकॉन्ससह -->
        <div class="footer-social-links" style="display: flex; justify-content: center; align-items: center; gap: 15px; font-size: 9px; font-weight: 800; padding-bottom: 2px; color: #1e293b;">
          <span style="color: #64748b; font-size: 8.5px; text-transform: uppercase; tracking-wider: 0.5px; margin-right: 5px;">मंडळ सोशल कनेक्ट:</span>
          
          <a href="${teamFb}" target="_blank" style="text-decoration:none; color:#475569; display: flex; align-items: center; gap: 3px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span>Facebook</span>
          </a>
          
          <a href="${teamIg}" target="_blank" style="text-decoration:none; color:#475569; display: flex; align-items: center; gap: 3px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="url(#ig-foot-grad-final-two)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><defs><linearGradient id="ig-foot-grad-final-two" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#fdf497" /><stop offset="45%" stop-color="#fd5949" /><stop offset="60%" stop-color="#d6249f" /><stop offset="100%" stop-color="#285AEB" /></linearGradient></defs><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            <span>Instagram</span>
          </a>
          
          <a href="${teamYt}" target="_blank" style="text-decoration:none; color:#475569; display: flex; align-items: center; gap: 3px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="#FF0000" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <span>YouTube</span>
          </a>
        </div>

        <!-- 🔥 खालची दुसरी मजबूत रेषा (Double Line Completes Here) -->
        <div style="border-top: 1.5px solid #0f172a; width: 100%; margin-top: 1px;"></div>

        <!-- अधिकृत मॅनेजमेंट तळ रेषा संदेश महाडिक ब्रांडिंगसह -->
        <div class="footer-top" style="width: 100%; margin-top: 3px;">
          <div>MAHARASHTRACHA GOVINDA DAHIHANDI MANAGEMENT APP</div>
          <div style="color: #ff6600;">An Initiative by Sandesh Mahadik</div>
        </div>
      </div>
    
    </div>

  </body>
</html>
  `);
  printWindow.document.close();
  printWindow.print();
};

export default function PrintableTeamProfile() {
  return null;
}