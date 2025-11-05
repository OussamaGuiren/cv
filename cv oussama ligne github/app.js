(function(){
  // Toast notifications helper
  function ensureToastRoot(){
    let root = document.getElementById('toast-root');
    if (!root){
      root = document.createElement('div');
      root.id = 'toast-root';
      root.className = 'toast-container';
      root.setAttribute('aria-live','polite');
      root.setAttribute('aria-atomic','true');
      document.body.appendChild(root);
    }
    return root;
  }
  function showToast(message, type='info', opts={}){
    const { duration = 4000 } = opts;
    const root = ensureToastRoot();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '✔' : (type === 'error' ? '⚠' : 'ℹ');
    const msg = document.createElement('div');
    msg.className = 'toast-message';
    msg.textContent = message;
    const close = document.createElement('button');
    close.className = 'toast-close';
    close.type = 'button';
    close.textContent = 'Fermer';
    close.addEventListener('click', ()=> removeToast());
    toast.append(icon, msg, close);
    root.appendChild(toast);
    let hideTimer = setTimeout(removeToast, duration);
    function removeToast(){
      clearTimeout(hideTimer);
      toast.style.animation = 'toast-out 220ms var(--ease-push) forwards';
      setTimeout(()=> toast.remove(), 220);
    }
    return removeToast;
  }
  // "À propos" panel logic
  const body = document.body;
  const openAboutBtn = document.getElementById('openAbout');
  const closeAboutBtn = document.getElementById('closeAbout');
  const aboutPanel = document.getElementById('aboutPanel');

  function openAbout(){
    body.classList.add('about-open');
    aboutPanel?.setAttribute('aria-hidden','false');
    openAboutBtn?.setAttribute('aria-expanded','true');
    setTimeout(()=> closeAboutBtn?.focus(), 250);
  }
  function closeAbout(){
    body.classList.remove('about-open');
    aboutPanel?.setAttribute('aria-hidden','true');
    openAboutBtn?.setAttribute('aria-expanded','false');
    setTimeout(()=> openAboutBtn?.focus(), 300);
  }
  openAboutBtn?.addEventListener('click', openAbout);
  closeAboutBtn?.addEventListener('click', closeAbout);
  window.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && body.classList.contains('about-open')) { e.preventDefault(); closeAbout(); }
  }, { passive: false });

  // Contact panel logic
  const openContactBtn = document.getElementById('emailBtn');
  const closeContactBtn = document.getElementById('closeContact');
  const contactPanel = document.getElementById('contactPanel');
  const contactScrim = document.querySelector('[data-close-contact]');
  
  // Téléphone: obfuscation + révélation au clic
  const phoneBtn = document.getElementById('phoneBtn');
  if (phoneBtn) {
    const codes = [43,51,51,55,54,55,56,48,57,55,55,57]; // "+33767809779"
    const e164 = String.fromCharCode(...codes); // "+33767809779"
    const national = '0' + e164.slice(3);      // "0767809779"
    const display = national.replace(/(\d{2})(?=\d)/g, '$1 ').trim(); // "07 67 80 97 79"
    phoneBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      if (!phoneBtn.dataset.revealed) {
        phoneBtn.dataset.revealed = '1';
        phoneBtn.textContent = display;
        phoneBtn.setAttribute('href', 'tel:' + e164);
        phoneBtn.setAttribute('aria-label', 'Appeler ' + display);
        phoneBtn.setAttribute('title', 'Cliquer à nouveau pour appeler');
        return;
      }
      window.location.href = 'tel:' + e164;
    });
  }

  function openContact(e){
    e?.preventDefault?.();
    body.classList.add('contact-open');
    contactPanel?.setAttribute('aria-hidden','false');
    setTimeout(()=> closeContactBtn?.focus(), 250);
  }
  function closeContact(){
    body.classList.remove('contact-open');
    contactPanel?.setAttribute('aria-hidden','true');
  }
  openContactBtn?.addEventListener('click', openContact);
  closeContactBtn?.addEventListener('click', closeContact);
  contactScrim?.addEventListener('click', closeContact);
  window.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && body.classList.contains('contact-open')) { e.preventDefault(); closeContact(); }
  }, { passive: false });

  // File input display
  const fileInput = document.getElementById('jobDescriptionFile');
  const fileNameDisplay = document.getElementById('fileName');
  const fileWrapper = document.querySelector('.file-upload-wrapper');
  const fileErrorEl = document.getElementById('file-error');
  const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 Mo, aligné avec Apps Script
  const ALLOWED_EXT = ['pdf','doc','docx','txt','md'];
  const ALLOWED_MIME = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]);

  function setFileError(msg){
    if (!fileErrorEl) return;
    fileErrorEl.textContent = msg || '';
    if (msg) fileErrorEl.setAttribute('role','alert'); else fileErrorEl.removeAttribute('role');
  }
  const formatBytes = (bytes)=>{
    if (!bytes && bytes !== 0) return '';
    const units=['o','Ko','Mo','Go'];
    let i=0; let v=bytes;
    while(v>=1024 && i<units.length-1){ v/=1024; i++; }
    return (Math.round(v*10)/10)+' '+units[i];
  };
  function fileExt(name){ const m = String(name||'').toLowerCase().match(/\.([a-z0-9]+)$/); return m?m[1]:''; }
  function isAllowedType(file){
    const extOk = ALLOWED_EXT.includes(fileExt(file.name));
    const mimeOk = file.type ? ALLOWED_MIME.has(file.type) : extOk; // fallback sur extension
    return extOk || mimeOk;
  }
  function displaySelectedFile(file){
    if (!fileNameDisplay) return;
    if (!file){ fileNameDisplay.textContent = 'Cliquer ou déposer un fichier (PDF, DOC/DOCX, TXT, MD)'; return; }
    const icon = '📄';
    fileNameDisplay.innerHTML = `<span class="file-chip">${icon}<span class="file-meta">${file.name} • ${formatBytes(file.size)}</span><button type="button" class="remove-file" aria-label="Retirer le fichier" title="Retirer">Retirer</button></span>`;
    const removeBtn = fileNameDisplay.querySelector('.remove-file');
    removeBtn?.addEventListener('click', ()=>{
      // Clear the native input
      if (fileInput){ fileInput.value=''; }
      displaySelectedFile(null);
      setFileError('');
    });
  }
  function validateSelectedFile(file){
    if (!file) return true;
    if (file.size > MAX_FILE_BYTES){ setFileError('Fichier trop volumineux (max 10 Mo).'); return false; }
    if (!isAllowedType(file)){ setFileError('Format non autorisé. Utilisez PDF, DOC/DOCX, TXT ou MD.'); return false; }
    setFileError('');
    return true;
  }
  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener('change', ()=>{
      const f = fileInput.files && fileInput.files[0];
      if (!validateSelectedFile(f)) { displaySelectedFile(null); return; }
      displaySelectedFile(f);
    });
    fileNameDisplay.addEventListener('click', ()=> fileInput.click());
    fileNameDisplay.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    if (fileWrapper){
      ['dragenter','dragover'].forEach(evt=> fileWrapper.addEventListener(evt, (e)=>{ e.preventDefault(); fileWrapper.classList.add('drag-over'); }));
      ['dragleave','drop'].forEach(evt=> fileWrapper.addEventListener(evt, (e)=>{ if (evt==='drop') return; fileWrapper.classList.remove('drag-over'); }));
      fileWrapper.addEventListener('drop', (e)=>{
        e.preventDefault(); fileWrapper.classList.remove('drag-over');
        const f = e.dataTransfer?.files?.[0]; if (!f) return;
        if (!validateSelectedFile(f)) { displaySelectedFile(null); return; }
        // Déposer dans le <input type=file>
        try {
          const dt = new DataTransfer(); dt.items.add(f); fileInput.files = dt.files;
        } catch {}
        displaySelectedFile(f);
      });
    }
  }

  // Validation + submission
  const form = document.getElementById('contactForm');
  const els = form ? {
    company: document.getElementById('companyName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    mission: document.getElementById('missionType'),
    message: document.getElementById('message'),
    submit: document.getElementById('submitBtn'),
    status: document.getElementById('formStatus') || document.getElementById('form-status'),
  } : {};
  const errs = form ? {
    company: document.getElementById('companyName-error'),
    email: document.getElementById('email-error'),
    phone: document.getElementById('phone-error'),
    mission: document.getElementById('missionType-error'),
    message: document.getElementById('message-error'),
  } : {};

  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  const frPhonePattern = /^(?:0[1-9]|(?:\+33|0033)[ .-]?[1-9])(?:[ .-]?\d{2}){4}$/;

  function setError(key, message){
    if (!errs[key]) return;
    errs[key].textContent = message || '';
    if (message) errs[key].setAttribute('role','alert'); else errs[key].removeAttribute('role');
  }

  function validateCompany(){
    const el = els.company; if (!el) return true;
    const v = (el.value||'').trim(); let msg='';
    if (!v) msg = "Le nom de l’entreprise est requis.";
    else if (el.minLength && v.length < el.minLength) msg = `Au moins ${el.minLength} caractères.`;
    setError('company', msg); el.setCustomValidity?.(msg); return !msg;
  }
  function validateEmail(){
    const el = els.email; if (!el) return true;
    const v = (el.value||'').trim(); let msg='';
    if (!v) msg = "L’email est requis.";
    else if (!emailPattern.test(v)) msg = 'E‑mail invalide (ex: nom@domaine.fr).';
    setError('email', msg); el.setCustomValidity?.(msg); return !msg;
  }
  function validatePhone(){
    const el = els.phone; if (!el) return true;
    const v = (el.value||'').trim(); let msg='';
    if (v && !frPhonePattern.test(v)) msg = 'Numéro FR invalide (ex: 06 12 34 56 78 ou +33 6 12 34 56 78).';
    setError('phone', msg); el.setCustomValidity?.(msg); return !msg;
  }
  function validateMission(){
    const el = els.mission; if (!el) return true;
    const v = el.value; let msg='';
    if (!v) msg = 'Veuillez sélectionner un type de collaboration.';
    setError('mission', msg); el.setCustomValidity?.(msg); return !msg;
  }
  function validateMessage(){
    const el = els.message; if (!el) return true;
    const v = (el.value||'').trim(); let msg='';
    if (!v) msg = 'Le message est requis.';
    else if (el.minLength && v.length < el.minLength) msg = `Au moins ${el.minLength} caractères.`;
    setError('message', msg); el.setCustomValidity?.(msg); return !msg;
  }
  function debounce(fn, delay=220){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), delay); } }

  if (form) {
    const markTouched = (el)=> el?.closest('.form-group')?.classList.add('touched');
    els.company?.addEventListener('input', debounce(validateCompany, 180));
    els.email?.addEventListener('input', debounce(validateEmail, 220));
    els.phone?.addEventListener('input', debounce(validatePhone, 220));
    els.mission?.addEventListener('change', validateMission);
    els.message?.addEventListener('input', debounce(validateMessage, 180));

    // Marquer les champs comme "touchés" au premier blur/change
    els.company?.addEventListener('blur', ()=>{ markTouched(els.company); validateCompany(); });
    els.email?.addEventListener('blur', ()=>{ markTouched(els.email); validateEmail(); });
    els.phone?.addEventListener('blur', ()=>{ markTouched(els.phone); validatePhone(); });
    els.mission?.addEventListener('change', ()=>{ markTouched(els.mission); validateMission(); });
    els.message?.addEventListener('blur', ()=>{ markTouched(els.message); validateMessage(); });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      const ok = [validateCompany(), validateEmail(), validatePhone(), validateMission(), validateMessage()].every(Boolean);
      if (!ok){
        form.classList.add('was-validated');
        els.status && (els.status.textContent = 'Merci de corriger les erreurs indiquées.');
        form.reportValidity?.();
        return;
      }
      els.submit && (els.submit.textContent = 'Envoi en cours...');
      els.submit && (els.submit.disabled = true);
      if (els.status) els.status.textContent = '';

      const formData = new FormData(form);
      const file = formData.get('jobDescriptionFile');
      // Validation client du fichier si présent
      if (file && file.size > 0 && !validateSelectedFile(file)) {
        if (els.submit) { els.submit.textContent = 'Envoyer'; els.submit.disabled = false; }
        return;
      }
      if (file && file.size > 0){
        const reader = new FileReader();
        reader.onloadend = function(){
          const data = Object.fromEntries(formData.entries());
          // L'Apps Script attend "fileBase64" (sans préfixe data:...)
          data.fileBase64 = reader.result.split(',')[1];
          data.fileName = file.name; data.fileType = file.type;
          sendToGoogleScript(data);
        };
        reader.readAsDataURL(file);
      } else {
        sendToGoogleScript(Object.fromEntries(formData.entries()));
      }
    });
  }

  function sendToGoogleScript(data){
    const APPS_SCRIPT_URL ='https://script.google.com/macros/s/AKfycbzkUjSMXl6hLf-hFHG-XdZvp92ciYzKJUCursVV3SjjSkYZM5oZ83OlQ4i2ejCwGrCK/exec'
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // évite les préflights CORS
        body: JSON.stringify(data)
      })
      .then(async res => {
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = null; }
        if (!res.ok) {
          console.error('HTTP error', res.status, text);
          throw new Error('HTTP '+res.status+': '+(json?.error || text || 'Erreur inconnue'));
        }
        if (!json) {
          console.error('Réponse non JSON:', text);
          throw new Error('Réponse non JSON du serveur');
        }
        if (json.ok !== true) {
          console.error('Serveur a renvoyé une erreur:', json);
          throw new Error(json.error || 'Erreur serveur');
        }
  console.log('Success:', json);
  showToast('Message envoyé avec succès !', 'success');
        form?.reset();
        // Nettoyage des états visuels après reset
        form?.classList.remove('was-validated');
        document.querySelectorAll('#contactForm .form-group').forEach(g=>g.classList.remove('touched'));
        if (fileNameDisplay) fileNameDisplay.textContent = 'Cliquer pour choisir un fichier';
      })
      .catch(error => {
        console.error('Erreur soumission formulaire:', error);
        showToast('Une erreur est survenue: ' + (error?.message || 'voir console'), 'error', { duration: 6000 });
      })
      .finally(()=>{
        if (els.submit) { els.submit.textContent = 'Envoyer'; els.submit.disabled = false; }
      });
  }

  // Anti-restauration des valeurs / autofill agressif
  (function(){
    const f = document.getElementById('contactForm');
    if (!f) return;
    f.setAttribute('autocomplete','off');
    ['companyName','email','phone'].forEach(id=>{ const el=document.getElementById(id); if (el) el.setAttribute('autocomplete','off'); });
    try { f.reset(); } catch(e) {}
    f.classList.remove('was-validated');
    document.querySelectorAll('#contactForm .form-group').forEach(g=>g.classList.remove('touched'));
    ['companyName-error','email-error','phone-error','missionType-error','message-error'].forEach(id=>{ const er=document.getElementById(id); if (er) er.textContent=''; });
    ['companyName','email','phone','missionType','message'].forEach(id=>{ const el=document.getElementById(id); if (el && el.setCustomValidity) el.setCustomValidity(''); });
    window.addEventListener('pageshow', function(e){
      if (e.persisted) {
        try { f.reset(); } catch(err) {}
        f.classList.remove('was-validated');
        document.querySelectorAll('#contactForm .form-group').forEach(g=>g.classList.remove('touched'));
        ['companyName-error','email-error','phone-error','missionType-error','message-error'].forEach(id=>{ const er=document.getElementById(id); if (er) er.textContent=''; });
        ['companyName','email','phone','missionType','message'].forEach(id=>{ const el=document.getElementById(id); if (el && el.setCustomValidity) el.setCustomValidity(''); });
      }
    });
  })();
})();
