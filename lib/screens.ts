export type Tab = 'home' | 'browse' | 'sell' | 'favs' | 'account';
export type Screen = Tab | 'dalil' | 'register' | 'mine';

const ALL: string[] = ['home', 'browse', 'sell', 'favs', 'account', 'dalil', 'register', 'mine'];
const TABS: string[] = ['home', 'browse', 'sell', 'favs', 'account'];

export const isScreen = (v: unknown): v is Screen => typeof v === 'string' && ALL.includes(v);
export const isTab = (s: Screen): s is Tab => TABS.includes(s);
