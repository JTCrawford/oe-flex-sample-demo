import { salesLines, type SalesCapabilityId } from '../data/salesLines';

interface Props {
  id: SalesCapabilityId;
  compact?: boolean;
}

export function SalesCallout({ id, compact }: Props) {
  const line = salesLines[id];
  if (!line) return null;
  return (
    <aside className={`sales-callout ${compact ? 'compact' : ''}`} title={line}>
      <span className="sales-tag">Sales</span>
      <p>{line}</p>
    </aside>
  );
}
