// يبدأ عملية دفع بالبطاقة (CIB / الذهبية) عبر بوابة SATIM ويعيد رابط صفحة الدفع.
// الأسرار المطلوبة (Supabase ← Edge Functions ← Secrets):
//   SATIM_URL       مثال: https://test.satim.dz/payment/rest   (الاختبار) — أو رابط الإنتاج الذي يسلمه لك SATIM
//   SATIM_USER, SATIM_PASSWORD, SATIM_TERMINAL
// تتوفر SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY تلقائياً.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const satim = Deno.env.get('SATIM_URL');
  const user = Deno.env.get('SATIM_USER');
  const pass = Deno.env.get('SATIM_PASSWORD');
  const terminal = Deno.env.get('SATIM_TERMINAL');
  if (!satim || !user || !pass || !terminal) return json({ error: 'gateway_not_configured' }, 503);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: auth } = await admin.auth.getUser(token);
  if (!auth?.user) return json({ error: 'unauthorized' }, 401);

  let body: { amount?: unknown; method?: unknown } = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const amount = Number(body.amount);
  const method = body.method === 'edahabia' ? 'edahabia' : 'cib';
  if (!Number.isInteger(amount) || amount < 500 || amount > 500000) return json({ error: 'bad_amount' }, 400);

  const { data: gw } = await admin.from('payment_settings').select('value').eq('key', 'gateway_enabled').maybeSingle();
  if (gw?.value !== 'true') return json({ error: 'gateway_disabled' }, 403);

  // رقم الطلب: أرقام فقط (حد أقصى 10) وفريد
  let orderNumber = '';
  for (let i = 0; i < 5; i++) {
    orderNumber = String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const { error } = await admin.from('topups').insert({
      user_id: auth.user.id, method, amount, order_id: orderNumber, status: 'pending',
    });
    if (!error) break;
    orderNumber = '';
  }
  if (!orderNumber) return json({ error: 'order_failed' }, 500);

  const back = `${url}/functions/v1/satim-return?order=${orderNumber}`;
  const params = new URLSearchParams({
    userName: user, password: pass, orderNumber,
    amount: String(Math.round(amount * 100)), currency: '012',
    returnUrl: back, failUrl: back, description: 'Marsa wallet top-up', language: 'AR',
    jsonParams: JSON.stringify({ force_terminal_id: terminal, udf1: orderNumber }),
  });

  try {
    const res = await fetch(`${satim.replace(/\/+$/, '')}/register.do`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params,
    });
    const r = await res.json();
    const code = String(r.errorCode ?? r.ErrorCode ?? '');
    if (code !== '0' || !r.formUrl || !r.orderId) {
      await admin.rpc('confirm_gateway_topup', { p_order: orderNumber, p_ok: false, p_gateway_ref: null });
      console.error('satim register failed', code, r.errorMessage ?? r.ErrorMessage);
      return json({ error: 'gateway_error' }, 502);
    }
    await admin.from('topups').update({ gateway_order_id: String(r.orderId) }).eq('order_id', orderNumber);
    return json({ formUrl: String(r.formUrl) });
  } catch (e) {
    console.error('satim register exception', e);
    await admin.rpc('confirm_gateway_topup', { p_order: orderNumber, p_ok: false, p_gateway_ref: null });
    return json({ error: 'gateway_unreachable' }, 502);
  }
});
