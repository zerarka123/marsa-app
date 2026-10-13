import {
  backendReady, currentUser, onAuth, signIn, signUp, signOut, select, insert, rpc,
  uploadReceipt, compressImage, callFunction, esc, money, when, errText,
} from './common.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');

const METHODS = {
  baridimob: { label: 'بريدي موب (BaridiMob)', hint: 'حوّل المبلغ من تطبيق BaridiMob ثم أرسل رقم العملية', manual: true, key: 'baridimob_rip', holder: 'baridimob_holder', field: 'RIP' },
  ccp: { label: 'تحويل CCP بريدي', hint: 'حوّل من حسابك البريدي CCP ثم أرسل رقم الوصل', manual: true, key: 'ccp_number', holder: 'ccp_holder', field: 'CCP' },
  cib: { label: 'بطاقة CIB أو الذهبية', hint: 'دفع إلكتروني فوري وآمن عبر بوابة SATIM الرسمية', manual: false },
};
const METHOD_LABEL = { baridimob: 'بريدي موب', ccp: 'CCP', cib: 'CIB / الذهبية', edahabia: 'الذهبية' };
const STATUS_LABEL = { pending: 'قيد المراجعة', approved: 'تم الشحن', rejected: 'مرفوض', failed: 'فشل' };

let authMode = 'signin';
let method = 'baridimob';
let flash = null; // { type: 'ok'|'err', text }
let busy = false;
const bad = (m) => Object.assign(new Error(m), { user: true });

// رسالة العودة من بوابة الدفع
{
  const p = new URLSearchParams(location.search).get('topup');
  if (p === 'ok') flash = { type: 'ok', text: 'تمت عملية الدفع بنجاح، وسيظهر الرصيد المضاف أدناه.' };
  if (p === 'fail') flash = { type: 'err', text: 'لم تكتمل عملية الدفع ولم يُخصم أي مبلغ منك. يمكنك المحاولة مجدداً.' };
  if (p) history.replaceState(null, '', location.pathname);
}

const banner = () => (flash ? `<div class="notice ${flash.type}" role="status">${esc(flash.text)}</div>` : '');

function renderNav() {
  const u = currentUser();
  nav.innerHTML = u ? `<a class="ltr" href="admin.html" id="adminLink" hidden>إدارة</a> <button type="button" id="logout">خروج</button>` : '';
  const out = document.getElementById('logout');
  if (out) out.onclick = async () => { await signOut(); flash = null; };
}

// ───────── الدخول / إنشاء حساب ─────────
function authView() {
  const signup = authMode === 'signup';
  app.innerHTML = `
    <h1>${signup ? 'افتح حسابك مجانا' : 'تسجيل الدخول'}</h1>
    <p class="sub">حسابك في موقع مرسى هو نفسه حسابك في تطبيق مرسى.</p>
    ${banner()}
    <form class="card" id="authForm" novalidate>
      ${signup ? '<label class="f" for="name">الاسم</label><input id="name" maxlength="60" autocomplete="name">' : ''}
      <label class="f" for="email">البريد الإلكتروني</label>
      <input id="email" type="email" class="ltr" autocomplete="email" inputmode="email" maxlength="120">
      <label class="f" for="pass">كلمة المرور</label>
      <input id="pass" type="password" class="ltr" autocomplete="${signup ? 'new-password' : 'current-password'}" maxlength="72" placeholder="${signup ? '8 أحرف على الأقل مع حروف وأرقام' : ''}">
      ${signup ? '<label class="f" style="display:flex;gap:10px;align-items:flex-start;font-weight:500"><input id="consent" type="checkbox" style="width:20px;min-height:20px;margin-top:6px"><span>أبلغ 18 سنة فأكثر وأوافق على <a href="terms.html" target="_blank" rel="noopener">شروط الاستخدام</a> و<a href="privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a>.</span></label>' : ''}
      <div id="err"></div>
      <div class="row" style="margin-top:14px">
        <button class="btn" type="submit" id="go">${signup ? 'افتح حسابك مجانا' : 'دخول'}</button>
        <button class="btn sec" type="button" id="swap">${signup ? 'لدي حساب' : 'ليس لدي حساب'}</button>
      </div>
      ${signup ? '' : '<p class="muted">نسيت كلمة المرور؟ راسلنا من البريد المسجّل لدينا.</p>'}
    </form>`;
  const err = (t) => { document.getElementById('err').innerHTML = `<div class="notice err" role="alert">${esc(t)}</div>`; };
  document.getElementById('swap').onclick = () => { authMode = signup ? 'signin' : 'signup'; flash = null; authView(); };
  document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('pass').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('اكتب بريداً إلكترونياً صحيحاً.');
    if (!pass) return err('اكتب كلمة المرور.');
    let name = '';
    if (signup) {
      name = document.getElementById('name').value.trim();
      if (name.length < 2) return err('اكتب اسمك.');
      if (pass.length < 8 || !/[A-Za-z\u0600-\u06FF]/.test(pass) || !/\d/.test(pass)) return err('كلمة المرور: 8 أحرف على الأقل مع حروف وأرقام.');
      if (!document.getElementById('consent').checked) return err('يجب الموافقة على الشروط وسياسة الخصوصية.');
    }
    busy = true;
    const btn = document.getElementById('go');
    btn.disabled = true;
    try {
      if (signup) {
        const r = await signUp(email, pass, name);
        if (r === 'confirm') {
          flash = { type: 'ok', text: 'أرسلنا رسالة تأكيد إلى بريدك. افتحها ثم عد وسجّل الدخول.' };
          authMode = 'signin';
          busy = false;
          return authView();
        }
      } else {
        await signIn(email, pass);
      }
    } catch (ex) {
      err(errText(ex));
    } finally {
      busy = false;
      btn.disabled = false;
    }
  };
}

// ───────── المحفظة ─────────
async function walletView() {
  app.innerHTML = `<h1>محفظتي</h1><p class="sub">جارٍ تحميل رصيدك…</p>`;
  let wallet; let topups; let txs; let settings;
  try {
    const u = currentUser();
    const [w, t, x, s] = await Promise.all([
      select('wallets', `select=balance&user_id=eq.${encodeURIComponent(u.id)}`),
      select('topups', 'select=id,method,amount,status,reference,admin_note,created_at&order=created_at.desc&limit=30'),
      select('wallet_transactions', 'select=id,kind,amount,balance_after,note,created_at&order=created_at.desc&limit=30'),
      select('payment_settings', 'select=key,value', false),
    ]);
    wallet = w[0] || { balance: 0 };
    topups = t; txs = x;
    settings = Object.fromEntries(s.map((r) => [r.key, r.value]));
  } catch (ex) {
    app.innerHTML = `<h1>محفظتي</h1><div class="notice err" role="alert">${esc(errText(ex))}</div><button class="btn" id="retry">إعادة المحاولة</button>`;
    document.getElementById('retry').onclick = walletView;
    return;
  }
  // إظهار رابط الإدارة للمشرفين فقط
  rpc('is_admin').then((ok) => { const a = document.getElementById('adminLink'); if (a && ok === true) a.hidden = false; }).catch(() => {});

  const avail = (k) => {
    const m = METHODS[k];
    return m.manual ? Boolean((settings[m.key] || '').trim()) : settings.gateway_enabled === 'true';
  };
  if (!avail(method)) method = Object.keys(METHODS).find(avail) || method;

  app.innerHTML = `
    <h1>محفظتي</h1>
    ${banner()}
    <section class="card balance">
      <div class="lbl">رصيدك الحالي</div>
      <div class="val">${money(wallet.balance)}</div>
    </section>

    <section class="card" id="topupCard">
      <h2>شحن الرصيد</h2>
      <form id="topupForm" novalidate>
        <label class="f" for="amount">المبلغ (دج) — من 500 إلى 500 000</label>
        <input id="amount" inputmode="numeric" class="ltr" maxlength="6" placeholder="مثال: 2000">
        <div class="chips">${[1000, 2000, 5000, 10000].map((v) => `<button type="button" class="chip" data-amt="${v}">${money(v)}</button>`).join('')}</div>

        <label class="f">طريقة الدفع</label>
        ${Object.entries(METHODS).map(([k, m]) => {
          const on = avail(k);
          return `<label class="method ${method === k ? 'sel' : ''} ${on ? '' : 'off'}">
            <input type="radio" name="method" value="${k}" ${method === k ? 'checked' : ''} ${on ? '' : 'disabled'}>
            <span><b>${esc(m.label)}</b><small>${on ? esc(m.hint) : 'غير متاحة حالياً'}</small></span></label>`;
        }).join('')}

        <div id="methodBody"></div>
        <div id="topupErr"></div>
      </form>
    </section>

    <section class="card">
      <h2>طلبات الشحن</h2>
      ${topups.length ? `<div style="overflow-x:auto"><table><tr><th>التاريخ</th><th>الطريقة</th><th>المبلغ</th><th>الحالة</th></tr>
        ${topups.map((t) => `<tr><td>${esc(when(t.created_at))}</td><td>${esc(METHOD_LABEL[t.method] || t.method)}</td><td>${money(t.amount)}</td>
          <td><span class="tag ${esc(t.status)}">${esc(STATUS_LABEL[t.status] || t.status)}</span>${t.admin_note ? `<div class="muted">${esc(t.admin_note)}</div>` : ''}</td></tr>`).join('')}
      </table></div>` : '<p class="muted">لا توجد طلبات بعد.</p>'}
    </section>

    <section class="card">
      <h2>سجل الرصيد</h2>
      ${txs.length ? `<div style="overflow-x:auto"><table><tr><th>التاريخ</th><th>العملية</th><th>المبلغ</th><th>الرصيد بعدها</th></tr>
        ${txs.map((t) => `<tr><td>${esc(when(t.created_at))}</td><td>${esc(t.note || t.kind)}</td>
          <td class="ltr">${Number(t.amount) > 0 ? '+' : ''}${money(t.amount)}</td><td>${money(t.balance_after)}</td></tr>`).join('')}
      </table></div>` : '<p class="muted">لا توجد عمليات بعد.</p>'}
    </section>`;

  const amountEl = document.getElementById('amount');
  app.querySelectorAll('.chip').forEach((c) => { c.onclick = () => { amountEl.value = c.dataset.amt; }; });
  amountEl.oninput = () => { amountEl.value = amountEl.value.replace(/\D/g, '').slice(0, 6); };
  app.querySelectorAll('input[name=method]').forEach((r) => {
    r.onchange = () => { method = r.value; flash = null; app.querySelectorAll('.method').forEach((l) => l.classList.toggle('sel', l.contains(r) && r.checked)); methodBody(settings); };
  });
  methodBody(settings);

  function methodBody(st) {
    const m = METHODS[method];
    const body = document.getElementById('methodBody');
    if (!avail(method)) { body.innerHTML = '<div class="notice info">لا توجد طريقة دفع متاحة حالياً. حاول لاحقاً.</div>'; return; }
    if (m.manual) {
      body.innerHTML = `
        <div class="pay-box">
          <div>1) حوّل المبلغ بالضبط إلى الحساب التالي:</div>
          <div>${esc(m.field)}: <code>${esc(st[m.key])}</code></div>
          ${st[m.holder] ? `<div>باسم: <b>${esc(st[m.holder])}</b></div>` : ''}
          <div class="muted">2) املأ الحقول التالية وأرفق صورة الوصل. يُضاف الرصيد بعد مراجعتنا للتحويل.</div>
        </div>
        <label class="f" for="ref">رقم العملية / مرجع الوصل</label>
        <input id="ref" class="ltr" maxlength="40" autocomplete="off">
        <label class="f" for="payer">الاسم الظاهر في التحويل</label>
        <input id="payer" maxlength="80">
        <label class="f" for="receipt">صورة الوصل (لقطة شاشة أو صورة)</label>
        <input id="receipt" type="file" accept="image/*">
        <button class="btn" type="submit" id="send" style="margin-top:14px;width:100%">إرسال طلب الشحن</button>`;
    } else {
      body.innerHTML = `
        <div class="notice info">سيتم تحويلك إلى صفحة الدفع الآمنة الخاصة ببوابة SATIM. لا نرى بيانات بطاقتك ولا نخزّنها.</div>
        <button class="btn" type="submit" id="send" style="width:100%">ادفع الآن</button>`;
    }
  }

  const terr = (t) => { document.getElementById('topupErr').innerHTML = `<div class="notice err" role="alert">${esc(t)}</div>`; };
  document.getElementById('topupForm').onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const amount = Number(amountEl.value);
    if (!Number.isInteger(amount) || amount < 500 || amount > 500000) return terr('اكتب مبلغاً بين 500 و 500 000 دج.');
    const btn = document.getElementById('send');
    if (!btn) return;
    busy = true; btn.disabled = true;
    try {
      if (METHODS[method].manual) {
        const reference = document.getElementById('ref').value.trim();
        const payer = document.getElementById('payer').value.trim();
        const file = document.getElementById('receipt').files[0];
        if (!/^[A-Za-z0-9\-_/. ]{4,40}$/.test(reference)) throw bad('رقم العملية: من 4 إلى 40 حرفاً/رقماً (بدون رموز غريبة).');
        if (payer.length < 2) throw bad('اكتب الاسم الظاهر في التحويل.');
        if (!file) throw bad('أرفق صورة الوصل.');
        if (file.size > 25 * 1024 * 1024) throw bad('الصورة كبيرة جداً.');
        btn.textContent = 'جارٍ رفع الوصل…';
        const blob = await compressImage(file);
        const path = `${currentUser().id}/${Date.now()}.jpg`;
        await uploadReceipt(blob, path);
        await insert('topups', { method, amount, reference, payer_name: payer, receipt_path: path });
        flash = { type: 'ok', text: 'وصلنا طلب الشحن، وسنراجعه ونضيف الرصيد بعد التحقق (عادةً خلال ساعات).' };
        busy = false;
        return walletView();
      }
      const r = await callFunction('satim-register', { amount, method: 'cib' });
      const url = r && typeof r.formUrl === 'string' ? r.formUrl : '';
      if (!url.startsWith('https://')) throw bad('تعذّر بدء الدفع. حاول لاحقاً.');
      location.href = url;
    } catch (ex) {
      terr(ex && ex.user ? ex.message : errText(ex));
      btn.disabled = false;
      btn.textContent = METHODS[method].manual ? 'إرسال طلب الشحن' : 'ادفع الآن';
    } finally {
      busy = false;
    }
  };
}

function notReady() {
  app.innerHTML = '<h1>مرسى</h1><div class="notice err">الموقع غير مهيّأ بعد: لم تُضبط مفاتيح الخادم.</div>';
}

function render() {
  renderNav();
  if (!backendReady()) return notReady();
  if (!currentUser()) return authView();
  return walletView();
}
let lastUid = currentUser() ? currentUser().id : null;
onAuth(() => {
  const uid = currentUser() ? currentUser().id : null;
  if (uid !== lastUid) { lastUid = uid; render(); }
});
render();
