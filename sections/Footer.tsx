import { Flag } from 'lucide-react';
import Logo from '../components/Logo';
import { APP } from '../config';
import { goTo } from '../lib/nav';
import { useUi } from '../lib/ui';
import EmailLink from '../components/ContactActions';

const sectionLinks = [
  { id: 'acheter', label: 'قوارب للبيع' },
  { id: 'dalil', label: 'موردون وورشات وقطع غيار' },
  { id: 'vendre', label: 'انشر إعلانك' },
  { id: 'register', label: 'سجّل نشاطك' },
];

const linkBtn = 'text-start min-h-11 flex items-center link-underline hover:text-primary-foreground transition-colors';

export default function Footer() {
  const { openLegal, openReport } = useUi();
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Logo className="w-10 h-10" />
              <span className="font-display font-extrabold text-3xl">مرسى</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
              السوق البحري الجزائري: بيع وشراء القوارب والمعدات، ودليل للورشات ومحلات قطع الغيار —
              من الصياد إلى الصياد، بدون تعقيدات.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold mb-3">أقسام السوق</h4>
            <ul className="text-sm text-primary-foreground/70">
              {sectionLinks.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => goTo(l.id)} className={linkBtn}>{l.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-3">المساعدة والقانونية</h4>
            <ul className="text-sm text-primary-foreground/70">
              <li><button type="button" onClick={() => openLegal('privacy')} className={linkBtn}>سياسة الخصوصية</button></li>
              <li><button type="button" onClick={() => openLegal('terms')} className={linkBtn}>شروط الاستخدام</button></li>
              <li><button type="button" onClick={() => openLegal('delete')} className={linkBtn}>حذف الحساب والبيانات</button></li>
              <li>
                <button type="button" onClick={() => openReport()} className={`${linkBtn} gap-2`}>
                  <Flag className="w-4 h-4" /> إبلاغ عن محتوى أو مشكلة
                </button>
              </li>
              <li className="pt-2 text-primary-foreground"><EmailLink /></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/15 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/50">
          <span>© {new Date().getFullYear()} مرسى — جميع الحقوق محفوظة</span>
          <span dir="ltr">v{APP.version}</span>
        </div>
      </div>
    </footer>
  );
}
