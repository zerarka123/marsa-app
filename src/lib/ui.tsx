import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import ReportDialog from '../components/ReportDialog';
import LegalDialog, { type LegalDoc } from '../components/LegalDialog';

export interface ReportTarget {
  type: 'listing' | 'business' | 'app';
  id?: number;
  label?: string;
}

interface UiCtx {
  openReport: (target?: ReportTarget) => void;
  openLegal: (doc: LegalDoc) => void;
}

const Ctx = createContext<UiCtx>({ openReport: () => {}, openLegal: () => {} });

export function UiProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<{ open: boolean; target: ReportTarget }>({ open: false, target: { type: 'app' } });
  const [legal, setLegal] = useState<LegalDoc | null>(null);

  const openReport = useCallback((target?: ReportTarget) => setReport({ open: true, target: target ?? { type: 'app' } }), []);
  const openLegal = useCallback((doc: LegalDoc) => setLegal(doc), []);
  const value = useMemo(() => ({ openReport, openLegal }), [openReport, openLegal]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <ReportDialog open={report.open} target={report.target} onClose={() => setReport((r) => ({ ...r, open: false }))} />
      <LegalDialog doc={legal} onClose={() => setLegal(null)} />
    </Ctx.Provider>
  );
}

export const useUi = () => useContext(Ctx);
