-- شغّل هذا بعد أن تفتح حسابك في التطبيق/الموقع بهذا البريد وتؤكّده من رسالة التأكيد.
-- (غيّر البريد إن لزم) — يجعل حسابك مشرفاً على لوحة الإدارة.
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('marsadz544@gmail.com') and email_confirmed_at is not null
on conflict (user_id) do nothing;

select u.email, (a.user_id is not null) as is_admin
from auth.users u left join public.admins a on a.user_id = u.id
where lower(u.email) = lower('marsadz544@gmail.com');
