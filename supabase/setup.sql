-- ════════════════════════════════════════════════════════════
--  مرسى — إعداد قاعدة البيانات (Supabase)
--  الصقه كاملاً في: Supabase ← SQL Editor ← New query ← Run
--  آمن لإعادة التشغيل أكثر من مرة (idempotent).
-- ════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ───────── المشرفون ─────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;   -- بدون سياسات = لا وصول من التطبيق

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ───────── الإعلانات ─────────
create table if not exists public.listings (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 100),
  category text not null check (category in ('صيد','نزهة','يخوت','جت سكي','مطاطي','صغير','معدات','مقطورات','رسو')),
  wilaya text not null check (char_length(wilaya) between 2 and 40),
  price bigint not null check (price between 1 and 1000000000),
  year int check (year is null or year between 1950 and 2100),
  length_m numeric(6,2) check (length_m is null or (length_m > 0 and length_m <= 200)),
  condition text not null default 'مستعمل' check (condition in ('جديد','مستعمل')),
  negotiable boolean not null default false,
  engine text not null default '' check (char_length(engine) <= 100),
  fuel text not null default '—' check (fuel in ('بنزين','مازوت','—')),
  description text not null default '' check (char_length(description) <= 2000),
  seller_name text not null check (char_length(seller_name) between 2 and 80),
  seller_phone text not null check (seller_phone ~ '^[0-9]{8,12}$'),
  seller_kind text not null default 'فرد' check (seller_kind in ('فرد','وكالة')),
  images text[] not null default '{}' check (cardinality(images) <= 10),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists listings_status_created on public.listings (status, created_at desc);
create index if not exists listings_user on public.listings (user_id);

-- ───────── الدليل البحري ─────────
create table if not exists public.businesses (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  kind text not null check (kind in ('مورّد','ورشة بناء سفن','قطع غيار','شركة ميكانيك','ورشة ميكانيك')),
  wilaya text not null check (char_length(wilaya) between 2 and 40),
  address text not null default '' check (char_length(address) <= 200),
  phone text not null check (phone ~ '^[0-9]{8,12}$'),
  specialties text[] not null default '{}' check (cardinality(specialties) <= 10),
  hours text not null default '' check (char_length(hours) <= 100),
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists businesses_status_created on public.businesses (status, created_at desc);

-- ───────── البلاغات ─────────
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('listing','business','app')),
  target_id bigint,
  target_label text not null default '' check (char_length(target_label) <= 120),
  reason text not null check (char_length(reason) between 3 and 80),
  details text not null default '' check (char_length(details) <= 1000),
  contact text not null default '' check (char_length(contact) <= 120),
  status text not null default 'new' check (status in ('new','reviewed','actioned','dismissed')),
  created_at timestamptz not null default now()
);

-- ───────── المحفظة والشحن ─────────
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('topup','spend','adjust')),
  amount numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  ref text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists wtx_user_created on public.wallet_transactions (user_id, created_at desc);

create table if not exists public.topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  method text not null check (method in ('baridimob','ccp','cib','edahabia')),
  amount numeric(12,2) not null check (amount >= 500 and amount <= 500000),
  reference text check (reference is null or char_length(reference) between 4 and 40),
  payer_name text check (payer_name is null or char_length(payer_name) <= 80),
  receipt_path text check (receipt_path is null or char_length(receipt_path) <= 200),
  order_id text unique,
  gateway_order_id text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','failed')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
create unique index if not exists topups_ref_unique on public.topups (method, reference)
  where reference is not null and status in ('pending','approved');
create index if not exists topups_user_created on public.topups (user_id, created_at desc);
create index if not exists topups_status on public.topups (status, created_at);

create table if not exists public.payment_settings (
  key text primary key check (key in ('baridimob_rip','baridimob_holder','ccp_number','ccp_holder','gateway_enabled')),
  value text not null default '' check (char_length(value) <= 120)
);
insert into public.payment_settings(key, value) values
  ('baridimob_rip',''), ('baridimob_holder',''), ('ccp_number',''), ('ccp_holder',''), ('gateway_enabled','false')
on conflict (key) do nothing;

-- ───────── الأمان على مستوى الصفوف (RLS) ─────────
alter table public.listings            enable row level security;
alter table public.businesses          enable row level security;
alter table public.reports             enable row level security;
alter table public.wallets             enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.topups              enable row level security;
alter table public.payment_settings    enable row level security;

-- الإعلانات
drop policy if exists listings_public_read on public.listings;
create policy listings_public_read on public.listings for select to anon, authenticated using (status = 'approved');
drop policy if exists listings_owner_read on public.listings;
create policy listings_owner_read on public.listings for select to authenticated using (user_id = auth.uid());
drop policy if exists listings_admin_read on public.listings;
create policy listings_admin_read on public.listings for select to authenticated using (public.is_admin());
drop policy if exists listings_owner_insert on public.listings;
create policy listings_owner_insert on public.listings for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and seller_kind = 'فرد');
drop policy if exists listings_owner_delete on public.listings;
create policy listings_owner_delete on public.listings for delete to authenticated using (user_id = auth.uid());

-- الدليل
drop policy if exists biz_public_read on public.businesses;
create policy biz_public_read on public.businesses for select to anon, authenticated using (status = 'approved');
drop policy if exists biz_owner_read on public.businesses;
create policy biz_owner_read on public.businesses for select to authenticated using (user_id = auth.uid());
drop policy if exists biz_admin_read on public.businesses;
create policy biz_admin_read on public.businesses for select to authenticated using (public.is_admin());
drop policy if exists biz_owner_insert on public.businesses;
create policy biz_owner_insert on public.businesses for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and verified = false);
drop policy if exists biz_owner_delete on public.businesses;
create policy biz_owner_delete on public.businesses for delete to authenticated using (user_id = auth.uid());

-- البلاغات: الإرسال للجميع، والقراءة للمشرفين فقط
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = auth.uid()));
drop policy if exists reports_admin_read on public.reports;
create policy reports_admin_read on public.reports for select to authenticated using (public.is_admin());

-- المحفظة: قراءة الرصيد والسجل لصاحبه فقط، ولا كتابة من التطبيق إطلاقاً
drop policy if exists wallets_owner_read on public.wallets;
create policy wallets_owner_read on public.wallets for select to authenticated using (user_id = auth.uid());
drop policy if exists wtx_owner_read on public.wallet_transactions;
create policy wtx_owner_read on public.wallet_transactions for select to authenticated using (user_id = auth.uid());

-- طلبات الشحن
drop policy if exists topups_owner_read on public.topups;
create policy topups_owner_read on public.topups for select to authenticated using (user_id = auth.uid());
drop policy if exists topups_admin_read on public.topups;
create policy topups_admin_read on public.topups for select to authenticated using (public.is_admin());
drop policy if exists topups_owner_insert on public.topups;
create policy topups_owner_insert on public.topups for insert to authenticated
  with check (
    user_id = auth.uid() and status = 'pending' and method in ('baridimob','ccp')
    and reference is not null and order_id is null and gateway_order_id is null
    and reviewed_at is null and reviewed_by is null and admin_note is null
  );

-- إعدادات الدفع (أرقام الحسابات المعروضة للدافعين — غير سرية)
drop policy if exists settings_read on public.payment_settings;
create policy settings_read on public.payment_settings for select to anon, authenticated using (true);

-- صلاحيات الجداول (دفاع إضافي فوق RLS)
revoke all on public.wallets, public.wallet_transactions, public.admins from anon, authenticated;
grant select on public.wallets, public.wallet_transactions to authenticated;
revoke all on public.topups from anon, authenticated;
grant select, insert on public.topups to authenticated;
revoke all on public.payment_settings from anon, authenticated;
grant select on public.payment_settings to anon, authenticated;
revoke update, truncate, references, trigger on public.listings, public.businesses from anon, authenticated;
revoke insert, update, delete, truncate on public.listings, public.businesses from anon;
revoke all on public.reports from anon, authenticated;
grant insert on public.reports to anon, authenticated;
grant select on public.reports to authenticated;

-- ───────── حدود الاستعمال (منع الإغراق) ─────────
create or replace function public.limit_listings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.listings where user_id = new.user_id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'تجاوزت الحد اليومي (5 إعلانات). حاول غداً.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limit_listings on public.listings;
create trigger trg_limit_listings before insert on public.listings for each row execute function public.limit_listings();

create or replace function public.limit_businesses() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.businesses where user_id = new.user_id and created_at > now() - interval '1 day') >= 3 then
    raise exception 'تجاوزت الحد اليومي لتسجيل الأنشطة. حاول غداً.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limit_businesses on public.businesses;
create trigger trg_limit_businesses before insert on public.businesses for each row execute function public.limit_businesses();

create or replace function public.limit_topups() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.method in ('baridimob','ccp') and
     (select count(*) from public.topups where user_id = new.user_id and status = 'pending') >= 5 then
    raise exception 'لديك 5 طلبات شحن قيد المراجعة. انتظر معالجتها أولاً.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limit_topups on public.topups;
create trigger trg_limit_topups before insert on public.topups for each row execute function public.limit_topups();

-- ───────── إنشاء محفظة لكل مستخدم جديد ─────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.wallets(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.wallets(user_id) select id from auth.users on conflict (user_id) do nothing;

-- ───────── دوال الرصيد (داخلية — لا تُستدعى من التطبيق) ─────────
create or replace function public.credit_wallet(p_user uuid, p_amount numeric, p_kind text, p_ref text, p_note text)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_bal numeric;
begin
  if p_amount is null or p_amount = 0 then raise exception 'مبلغ غير صالح'; end if;
  insert into public.wallets(user_id) values (p_user) on conflict (user_id) do nothing;
  update public.wallets set balance = balance + p_amount, updated_at = now()
   where user_id = p_user returning balance into v_bal;
  insert into public.wallet_transactions(user_id, kind, amount, balance_after, ref, note)
   values (p_user, p_kind, p_amount, v_bal, p_ref, p_note);
  return v_bal;
end $$;
revoke all on function public.credit_wallet(uuid, numeric, text, text, text) from public, anon, authenticated;

-- موافقة المشرف على طلب شحن يدوي (بريدي موب / CCP)
create or replace function public.approve_topup(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t public.topups;
begin
  if not public.is_admin() then raise exception 'غير مصرّح'; end if;
  select * into t from public.topups where id = p_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if t.status <> 'pending' then raise exception 'تمت معالجة هذا الطلب سابقاً'; end if;
  if t.user_id is null then raise exception 'صاحب الطلب غير موجود'; end if;
  perform public.credit_wallet(t.user_id, t.amount, 'topup', coalesce(t.reference, t.order_id, t.id::text), 'شحن عبر ' || t.method);
  update public.topups set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() where id = p_id;
end $$;
revoke all on function public.approve_topup(uuid) from public, anon;
grant execute on function public.approve_topup(uuid) to authenticated;

create or replace function public.reject_topup(p_id uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'غير مصرّح'; end if;
  update public.topups set status = 'rejected', admin_note = left(coalesce(p_note, ''), 200),
         reviewed_at = now(), reviewed_by = auth.uid()
   where id = p_id and status = 'pending';
  if not found then raise exception 'الطلب غير موجود أو تمت معالجته'; end if;
end $$;
revoke all on function public.reject_topup(uuid, text) from public, anon;
grant execute on function public.reject_topup(uuid, text) to authenticated;

-- تأكيد دفع عبر البوابة الإلكترونية — تستدعيه الدالة الخلفية فقط (service_role)
create or replace function public.confirm_gateway_topup(p_order text, p_ok boolean, p_gateway_ref text) returns text
language plpgsql security definer set search_path = public as $$
declare t public.topups;
begin
  select * into t from public.topups where order_id = p_order for update;
  if not found then return 'not_found'; end if;
  if t.status <> 'pending' then return t.status; end if;          -- لا تُحسب العملية مرتين
  if p_ok and t.user_id is not null then
    perform public.credit_wallet(t.user_id, t.amount, 'topup', coalesce(p_gateway_ref, t.order_id), 'شحن عبر ' || t.method);
    update public.topups set status = 'approved', reviewed_at = now(), gateway_order_id = coalesce(p_gateway_ref, gateway_order_id) where id = t.id;
    return 'approved';
  end if;
  update public.topups set status = 'failed', reviewed_at = now() where id = t.id;
  return 'failed';
end $$;
revoke all on function public.confirm_gateway_topup(text, boolean, text) from public, anon, authenticated;
grant execute on function public.confirm_gateway_topup(text, boolean, text) to service_role;

-- أدوات المشرف
create or replace function public.admin_set_status(p_table text, p_id bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'غير مصرّح'; end if;
  if p_table = 'listings' and p_status in ('pending','approved','rejected') then
    update public.listings set status = p_status where id = p_id;
  elsif p_table = 'businesses' and p_status in ('pending','approved','rejected') then
    update public.businesses set status = p_status where id = p_id;
  elsif p_table = 'reports' and p_status in ('new','reviewed','actioned','dismissed') then
    update public.reports set status = p_status where id = p_id;
  else
    raise exception 'طلب غير صالح';
  end if;
end $$;
revoke all on function public.admin_set_status(text, bigint, text) from public, anon;
grant execute on function public.admin_set_status(text, bigint, text) to authenticated;

create or replace function public.admin_set_setting(p_key text, p_value text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'غير مصرّح'; end if;
  update public.payment_settings set value = left(coalesce(p_value, ''), 120) where key = p_key;
  if not found then raise exception 'إعداد غير معروف'; end if;
end $$;
revoke all on function public.admin_set_setting(text, text) from public, anon;
grant execute on function public.admin_set_setting(text, text) to authenticated;

-- حذف الحساب (يُستدعى من التطبيق؛ الإعلانات تُحذف تلقائياً، وسجلات المحاسبة تبقى مجهولة الهوية)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'غير مسجّل الدخول'; end if;
  update public.topups set payer_name = null, receipt_path = null where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ───────── تخزين الصور ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('listing-images', 'listing-images', true, 3145728, array['image/jpeg','image/png','image/webp']),
  ('receipts',       'receipts',       false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "li_insert_own" on storage.objects;
create policy "li_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "li_delete_own" on storage.objects;
create policy "li_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "rc_insert_own" on storage.objects;
create policy "rc_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "rc_read_own_or_admin" on storage.objects;
create policy "rc_read_own_or_admin" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists "rc_delete_own" on storage.objects;
create policy "rc_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

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
