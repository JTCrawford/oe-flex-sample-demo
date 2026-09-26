import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import type { AppState } from '../hooks/useAppState';
import { SalesCallout } from './SalesCallout';
import { SymbolIcon } from './SymbologyIcons';

interface Props {
  state: AppState;
  exportTargetRef: React.RefObject<HTMLElement | null>;
}

export function ExportBar({ state, exportTargetRef }: Props) {
  const { whiteLabel, setWhiteLabel, symbology, stage, showToast, selectedAo } =
    state;
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const downloadPng = async () => {
    const el = exportTargetRef.current;
    if (!el) {
      showToast('Nothing to export');
      return;
    }
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#0b1220',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Burn-in brand + symbology legend
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(11, 18, 32, 0.85)';
        ctx.fillRect(0, 0, canvas.width, 56 * 2);
        ctx.fillStyle = '#e8eef7';
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.fillText(
          whiteLabel
            ? 'OE Flex · White-label export (SAMPLE)'
            : 'Threat Tec · OE Flex (SAMPLE)',
          24,
          40,
        );
        ctx.font = '20px system-ui, sans-serif';
        ctx.fillStyle = '#9ab';
        ctx.fillText(
          `${stage} · ${selectedAo?.name ?? 'No AO'} · Symbology: ${symbology}`,
          24,
          72,
        );
      }

      const a = document.createElement('a');
      a.download = `oe-flex-${stage.toLowerCase()}-${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      showToast('PNG exported (symbology + brand burned in)');
    } catch (err) {
      console.error(err);
      showToast('Export failed — see console');
    }
  };

  const toggleRecord = async () => {
    if (recording && mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
      return;
    }
    const el = exportTargetRef.current;
    if (!el) return;
    try {
      // Capture via temporary canvas stream of html2canvas frames is heavy;
      // use element capture if available, else short canvas snapshot loop.
      const stream = await (
        navigator.mediaDevices as unknown as {
          getDisplayMedia: (o: object) => Promise<MediaStream>;
        }
      )
        .getDisplayMedia?.({ video: true, audio: false })
        .catch(() => null);

      if (!stream) {
        // Fallback: export a few PNG frames note
        showToast('Screen capture unavailable — use PNG export');
        return;
      }

      chunks.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorder.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'video/webm' });
        const a = document.createElement('a');
        a.download = `oe-flex-${Date.now()}.webm`;
        a.href = URL.createObjectURL(blob);
        a.click();
        stream.getTracks().forEach((t) => t.stop());
        showToast('WebM recording saved (optional)');
      };
      mr.start();
      setRecording(true);
      showToast('Recording… click again to stop');
    } catch {
      showToast('Recording not available in this browser');
    }
  };

  return (
    <div className="export-bar">
      <SalesCallout id="export" compact />
      <div className="btn-row wrap">
        <label className="toggle">
          <input
            type="checkbox"
            checked={whiteLabel}
            onChange={(e) => setWhiteLabel(e.target.checked)}
          />
          White-label (hide Threat Tec brand in export)
        </label>
        <button type="button" className="primary" onClick={downloadPng}>
          Export PNG
        </button>
        <button type="button" onClick={toggleRecord}>
          {recording ? 'Stop recording' : 'Record WebM (optional)'}
        </button>
        <span className="symbol-preview tiny">
          <SymbolIcon
            kind={selectedAo?.type === 'land' ? 'armor' : 'ship'}
            mode={symbology}
            size={22}
          />
          Symbology in export: {symbology}
        </span>
      </div>
    </div>
  );
}
