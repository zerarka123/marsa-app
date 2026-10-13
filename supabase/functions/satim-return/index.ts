// نقطة عودة المتصفح من بوابة SATIM: تتحقق من نتيجة الدفع من الخادم إلى الخادم ثم تضيف الرصيد مرة واحدة فقط.
// ⚠️ عطّل خيار «Verify JWT» لهذه الدالة (المتصفح يصلها بدون توكن).
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const siteUrl = (Deno.env.get('SITE_URL') ?? '').replace(/\/+$/, '');
  const go = (ok: boolean) =>
    new Response(null, { status: 302, headers: { Location: `${siteUrl}/?topup=${ok ? 'ok' : 'fail'}` } });

  const order = new URL(req.url).searchParams.get('order') ?? '';
  if (!/^\d{6,10}$/.test(order)) return go(false);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const satim = Deno.env.get('SATIM_URL');
  const user = Deno.env.get('SATIM_USER');
  const pass = Deno.env.get('SATIM_PASSWORD');
  if (!satim || !user || !pass) return go(false);

  const { data: t } = await admin.from('topups').select('amount,status,gateway_order_id').eq('order_id', order).maybeSingle();
  if (!t) return go(false);
  if (t.status === 'approved') return go(true);       // عودة مكررة
  if (t.status !== 'pending' || !t.gateway_order_id) return go(false);

  let ok = false;
  try {
    const res = await fetch(`${satim.replace(/\/+$/, '')}/confirmOrder.do`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ userName: user, password: pass, orderId: t.gateway_order_id, language: 'AR' }),
    });
    const r = await res.json();
    const errorCode = String(r.ErrorCode ?? r.errorCode ?? '');
    const orderStatus = String(r.OrderStatus ?? r.orderStatus ?? '');
    const resp = String(r.params?.respCode ?? r.respCode ?? '');
    const paid = r.Amount ?? r.amount;
    const amountOk = paid === undefined || paid === null || Number(paid) === Math.round(Number(t.amount) * 100);
    ok = errorCode === '0' && orderStatus === '2' && (resp === '' || resp === '00') && amountOk;
  } catch (e) {
    console.error('satim confirm exception', e);
    return go(false);       // لا نغيّر الحالة: يمكن إعادة المحاولة
  }

  const { data: status } = await admin.rpc('confirm_gateway_topup', { p_order: order, p_ok: ok, p_gateway_ref: t.gateway_order_id });
  return go(status === 'approved');
});
