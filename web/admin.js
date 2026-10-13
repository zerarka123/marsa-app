import { backendReady, currentUser, rpc, select, signedReceiptUrl, esc, money, when, errText } from './common.js';

const app = document.getElementById('app');
const C = window.MARSA || {};
let tab = 'topups';

const METHOD_LABEL = { baridimob: 'بريدي موب', ccp: 'CCP', cib: 'CIB', edahabia: 'الذهبية' };
const TABS = [
  ['topups', 'طلبات الشحن'],
  ['listings', 'إعلانات'],
  ['businesses', 'أنشطة الدليل'],
  ['reports', 'بلاغات'],
  ['settings', 'إعدادات الدفع'],
];

const safeImg = (u) => (typeof u === 'string' && C.url && u.startsWith(`${C.url}/storage/`) ? u : '');
const toast = (type, text) => { const el = document.getElementById('msg'); if (el) el.innerHTML = `<div class="notice ${type}" role="status">${esc(text)}</div>`; };

async function run(fn, okText) {
  try { await fn(); toast('ok', okText); await load(); } catch (e) { toast('err', errText(e)); }
}

function frame(inner) {
  app.innerHTML = `
    <h1>لوحة الإدارة</h1>
    <div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
    <div id="msg"></div>
    <div id="list">${inner}</div>`;
  app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; load(); }; });
}

const empty = '<p class="muted">لا يوجد شيء بانتظار المراجعة 🎉</p>';

async function load() {
  frame('<p class="sub">جارٍ التحميل…</p>');
  try {
    if (tab === 'topups') await topups();
    else if (tab === 'listings') await listings();
    else if (tab === 'businesses') await businesses();
    else if (tab === 'reports') await reports();
    else await settings();
  } catch (e) {
    document.getElementById('list').innerHTML = `<div class="notice err" role="alert">${esc(errText(e))}</div>`;
  }
}

async function topups() {
  const rows = await select('topups', 'select=*&status=eq.pending&order=created_at.asc&limit=100');
  const el = document.getElementById('list');
  el.innerHTML = rows.length ? rows.map((t) => `
    <div class="item">
      <h3>${money(t.amount)} — ${esc(METHOD_LABEL[t.method] || t.method)}</h3>
      <div class="muted">${esc(when(t.created_at))}</div>
      <div>الاسم: <b>${esc(t.payer_name || '—')}</b></div>
      <div>المرجع: <b class="ltr" style="display:inline-block">${esc(t.reference || t.order_id || '—')}</b></div>
      <div class="row" style="margin-top:10px">
        ${t.receipt_path ? `<button class="btn sec sm" data-view="${esc(t.receipt_path)}">عرض الوصل</button>` : ''}
        <button class="btn ok sm" data-ok="${esc(t.id)}">قبول وإضافة الرصيد</button>
        <button class="btn bad sm" data-no="${esc(t.id)}">رفض</button>
      </div>
    </div>`).join('') : empty;
  el.querySelectorAll('[data-view]').forEach((b) => { b.onclick = async () => {
    try {
      const url = await signedReceiptUrl(b.dataset.view);
      if (!url) throw new Error('x');
      const m = document.createElement('div');
      m.className = 'modal';
      const img = document.createElement('img');
      img.alt = 'وصل الدفع'; img.src = url;
      m.appendChild(img);
      m.onclick = () => m.remove();
      document.body.appendChild(m);
    } catch (e) { toast('err', 'تعذّر عرض الوصل.'); }
  }; });
  el.querySelectorAll('[data-ok]').forEach((b) => { b.onclick = () => {
    if (confirm('تأكيد: هل وصل المبلغ فعلاً إلى حسابنا؟ سيُضاف الرصيد فوراً ولا يمكن التراجع.')) run(() => rpc('approve_topup', { p_id: b.dataset.ok }), 'تمت الموافقة وأُضيف الرصيد.');
  }; });
  el.querySelectorAll('[data-no]').forEach((b) => { b.onclick = () => {
    const note = prompt('سبب الرفض (يظهر للمستخدم):', 'لم نجد هذا التحويل في حسابنا');
    if (note !== null) run(() => rpc('reject_topup', { p_id: b.dataset.no, p_note: note }), 'تم رفض الطلب.');
  }; });
}

function moderation(table, rows, render) {
  const el = document.getElementById('list');
  el.innerHTML = rows.length ? rows.map(render).join('') : empty;
  el.querySelectorAll('[data-set]').forEach((b) => { b.onclick = () => {
    const [id, status] = b.dataset.set.split(':');
    run(() => rpc('admin_set_status', { p_table: table, p_id: Number(id), p_status: status }), 'تم التحديث.');
  }; });
}
const actions = (id, a, b) => `<div class="row" style="margin-top:10px">
  <button class="btn ok sm" data-set="${esc(id)}:${a}">قبول ونشر</button>
  <button class="btn bad sm" data-set="${esc(id)}:${b}">رفض</button></div>`;

async function listings() {
  const rows = await select('listings', 'select=id,title,category,wilaya,price,seller_name,seller_phone,description,images,created_at&status=eq.pending&order=created_at.asc&limit=100');
  moderation('listings', rows, (r) => `
    <div class="item">
      <h3>${esc(r.title)}</h3>
      <div class="muted">${esc(r.category)} · ${esc(r.wilaya)} · ${money(r.price)} · ${esc(when(r.created_at))}</div>
      <div>البائع: ${esc(r.seller_name)} — <span class="ltr" style="display:inline-block">${esc(r.seller_phone)}</span></div>
      <p>${esc(r.description || '')}</p>
      <div class="row">${(r.images || []).map(safeImg).filter(Boolean).map((u) => `<img src="${esc(u)}" alt="" width="96" height="96" style="object-fit:cover;border-radius:10px" loading="lazy">`).join('')}</div>
      ${actions(r.id, 'approved', 'rejected')}
    </div>`);
}

async function businesses() {
  const rows = await select('businesses', 'select=*&status=eq.pending&order=created_at.asc&limit=100');
  moderation('businesses', rows, (r) => `
    <div class="item">
      <h3>${esc(r.name)}</h3>
      <div class="muted">${esc(r.kind)} · ${esc(r.wilaya)} · ${esc(r.address || '')}</div>
      <div>هاتف: <span class="ltr" style="display:inline-block">${esc(r.phone)}</span> — ${esc(r.hours || '')}</div>
      <div>${(r.specialties || []).map(esc).join('، ')}</div>
      ${actions(r.id, 'approved', 'rejected')}
    </div>`);
}

async function reports() {
  const rows = await select('reports', 'select=*&status=eq.new&order=created_at.asc&limit=100');
  const el = document.getElementById('list');
  moderation('reports', rows, (r) => `
    <div class="item">
      <h3>${esc(r.reason)}</h3>
      <div class="muted">${esc(r.target_type)} ${r.target_id ? '#' + esc(r.target_id) : ''} ${esc(r.target_label || '')} · ${esc(when(r.created_at))}</div>
      <p>${esc(r.details || '')}</p>
      ${r.contact ? `<div class="muted">تواصل: <span class="ltr" style="display:inline-block">${esc(r.contact)}</span></div>` : ''}
      <div class="row" style="margin-top:10px">
        <button class="btn ok sm" data-set="${esc(r.id)}:actioned">تم اتخاذ إجراء</button>
        <button class="btn sec sm" data-set="${esc(r.id)}:dismissed">لا مخالفة</button>
      </div>
      <p class="muted">لإزالة إعلان مخالف: افتح تبويب «إعلانات» أو Supabase ← Table Editor ← listings وغيّر status إلى rejected.</p>
    </div>`);
  void el;
}

async function settings() {
  const rows = await select('payment_settings', 'select=key,value', false);
  const v = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const F = [
    ['baridimob_rip', 'رقم RIP لحساب بريدي موب (الذي يحوّل إليه الزبائن)'],
    ['baridimob_holder', 'اسم صاحب حساب بريدي موب'],
    ['ccp_number', 'رقم حساب CCP (اختياري)'],
    ['ccp_holder', 'اسم صاحب حساب CCP'],
  ];
  document.getElementById('list').innerHTML = `
    <div class="card">
      ${F.map(([k, l]) => `<label class="f" for="s_${k}">${l}</label><div class="row" style="flex-wrap:nowrap"><input id="s_${k}" class="ltr" maxlength="120" value="${esc(v[k] || '')}"><button class="btn sm" data-save="${k}">حفظ</button></div>`).join('')}
      <label class="f" for="s_gw">الدفع بالبطاقة (CIB/الذهبية) عبر SATIM</label>
      <div class="row" style="flex-wrap:nowrap">
        <select id="s_gw"><option value="false" ${v.gateway_enabled !== 'true' ? 'selected' : ''}>معطّل</option><option value="true" ${v.gateway_enabled === 'true' ? 'selected' : ''}>مفعّل</option></select>
        <button class="btn sm" data-save="gateway_enabled">حفظ</button>
      </div>
      <p class="muted">فعّل البطاقة فقط بعد نشر الدالتين satim-register و satim-return وضبط أسرار SATIM (انظر README).</p>
    </div>`;
  document.querySelectorAll('[data-save]').forEach((b) => { b.onclick = () => {
    const k = b.dataset.save;
    const val = (document.getElementById(k === 'gateway_enabled' ? 's_gw' : `s_${k}`).value || '').trim();
    run(() => rpc('admin_set_setting', { p_key: k, p_value: val }), 'تم الحفظ.');
  }; });
}

async function boot() {
  if (!backendReady()) { app.innerHTML = '<div class="notice err">الموقع غير مهيّأ بعد.</div>'; return; }
  if (!currentUser()) { app.innerHTML = '<h1>لوحة الإدارة</h1><div class="notice info">سجّل الدخول أولاً من <a href="./">صفحة المحفظة</a> بحساب المشرف.</div>'; return; }
  try {
    const ok = await rpc('is_admin');
    if (ok !== true) { app.innerHTML = '<h1>لوحة الإدارة</h1><div class="notice err">هذا الحساب ليس مشرفاً.</div>'; return; }
  } catch (e) { app.innerHTML = `<div class="notice err">${esc(errText(e))}</div>`; return; }
  load();
}
boot();
