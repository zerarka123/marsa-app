-- ════════════════════════════════════════════════════════════
--  مرسى — تحديث قاعدة البيانات لفرع «ميكانيك السفن»
--  الصقه في: Supabase ← SQL Editor ← New query ← Run   (مرة واحدة، وآمن لو أعدته)
--  لا يمس أي بيانات موجودة؛ يوسّع فقط الأنواع المسموحة في جدول businesses.
-- ════════════════════════════════════════════════════════════

-- ───────── تحديث: إضافة فرع «ميكانيك السفن» (شركات + ورشات خاصة) ─────────
-- للقواعد المنشأة سابقاً: يستبدل قيد الأنواع بقيد جديد يقبل النوعين الجديدين. آمن لإعادة التشغيل.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.businesses'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) like '%kind%'
  loop
    execute format('alter table public.businesses drop constraint %I', c.conname);
  end loop;
  alter table public.businesses add constraint businesses_kind_check
    check (kind in ('مورّد','ورشة بناء سفن','قطع غيار','شركة ميكانيك','ورشة ميكانيك'));
end $$;
