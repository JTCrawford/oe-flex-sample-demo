import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export const OVERLAY_CARDS = [
  'layers',
  'overlays',
  'scenario',
  'stage',
  'legend',
  'export',
  'about',
  'sales',
  'callout',
  'sphere',
  'ttp',
] as const;

export type OverlayCardId = (typeof OVERLAY_CARDS)[number];

const STORAGE_KEY = 'oe-flex-overlay-dock';

/** First visit: the map fills the screen. Only the compact layer picker starts open. */
const DEFAULT_OPEN: Record<OverlayCardId, boolean> = {
  layers: true,
  overlays: false,
  scenario: false,
  stage: false,
  legend: false,
  export: false,
  about: false,
  sales: false,
  callout: false,
  sphere: false,
  ttp: false,
};

interface DockSnapshot {
  hidden: boolean;
  open: Record<OverlayCardId, boolean>;
}

interface DockApi {
  hidden: boolean;
  isOpen: (id: OverlayCardId) => boolean;
  expand: (id: OverlayCardId) => void;
  collapse: (id: OverlayCardId) => void;
  hideAll: () => void;
  restore: () => void;
}

const OverlayDockContext = createContext<DockApi | null>(null);

function readSnapshot(): DockSnapshot {
  const open = { ...DEFAULT_OPEN };
  if (typeof window === 'undefined') return { hidden: false, open };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { hidden: false, open };
    const parsed = JSON.parse(raw) as { hidden?: boolean; open?: Partial<Record<OverlayCardId, boolean>> };
    for (const id of OVERLAY_CARDS) {
      if (typeof parsed.open?.[id] === 'boolean') open[id] = parsed.open[id] as boolean;
    }
    return { hidden: Boolean(parsed.hidden), open };
  } catch {
    return { hidden: false, open };
  }
}

export function OverlayDockProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DockSnapshot>(readSnapshot);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* private mode */
    }
  }, [snapshot]);

  const expand = useCallback((id: OverlayCardId) => {
    setSnapshot((current) => (current.open[id] ? current : { ...current, open: { ...current.open, [id]: true } }));
  }, []);

  const collapse = useCallback((id: OverlayCardId) => {
    setSnapshot((current) => (!current.open[id] ? current : { ...current, open: { ...current.open, [id]: false } }));
  }, []);

  const hideAll = useCallback(() => {
    setSnapshot((current) => (current.hidden ? current : { ...current, hidden: true }));
  }, []);

  const restore = useCallback(() => {
    setSnapshot((current) => (current.hidden ? { ...current, hidden: false } : current));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'h' && event.key !== 'H') return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      event.preventDefault();
      setSnapshot((current) => ({ ...current, hidden: !current.hidden }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const api = useMemo<DockApi>(
    () => ({
      hidden: snapshot.hidden,
      isOpen: (id) => snapshot.open[id],
      expand,
      collapse,
      hideAll,
      restore,
    }),
    [snapshot, expand, collapse, hideAll, restore],
  );

  return <OverlayDockContext.Provider value={api}>{children}</OverlayDockContext.Provider>;
}

export function useOverlayDock(): DockApi {
  const dock = useContext(OverlayDockContext);
  if (dock) return dock;
  return {
    hidden: false,
    isOpen: (id) => DEFAULT_OPEN[id],
    expand: () => undefined,
    collapse: () => undefined,
    hideAll: () => undefined,
    restore: () => undefined,
  };
}

export function FloatCard({
  id,
  title,
  edge,
  index,
  children,
  testId,
}: {
  id: OverlayCardId;
  title: string;
  edge: 'left' | 'right' | 'bottom';
  index: number;
  children: ReactNode;
  testId?: string;
}) {
  const dock = useOverlayDock();
  const open = dock.isOpen(id) && !dock.hidden;
  if (!open) {
    if (dock.hidden) return null;
    return (
      <button
        type="button"
        className={`dock-tab edge-${edge}`}
        data-dock-role="tab"
        data-dock-edge={edge}
        data-dock-index={index}
        data-testid={`dock-tab-${id}`}
        aria-expanded={false}
        onClick={() => dock.expand(id)}
      >
        {title}
      </button>
    );
  }
  return (
    <section
      className={`float-card edge-${edge}`}
      data-dock-role="card"
      data-dock-edge={edge}
      data-dock-index={index}
      data-testid={testId ?? `float-card-${id}`}
    >
      <header className="float-card-head">
        <h2>{title}</h2>
        <button type="button" aria-label={`Collapse ${title}`} onClick={() => dock.collapse(id)}>
          –
        </button>
      </header>
      <div className="float-card-body">{children}</div>
    </section>
  );
}

export function OverlayHideToggle() {
  const dock = useOverlayDock();
  return (
    <button
      type="button"
      className="overlay-hide-toggle"
      data-testid={dock.hidden ? 'restore-overlays' : 'hide-overlays'}
      onClick={() => (dock.hidden ? dock.restore() : dock.hideAll())}
      title={dock.hidden ? 'Restore overlays' : 'Hide all overlays (H)'}
    >
      {dock.hidden ? 'Restore' : 'Hide all'}
    </button>
  );
}
