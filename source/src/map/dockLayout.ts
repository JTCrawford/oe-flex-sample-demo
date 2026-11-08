/**
 * Places edge tabs in a rail and open cards beside that rail so the two never
 * share pixels. Right-edge cards sit to the left of the right rail. On a narrow
 * screen every tab is one bottom rail and open cards stack above it.
 */
import { useLayoutEffect } from 'react';

const PAD = 8;
const GAP = 8;

function shown(el: HTMLElement): boolean {
  if (el.closest('.dock-minimized')) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}

function byIndex(a: HTMLElement, b: HTMLElement): number {
  return Number(a.dataset.dockIndex ?? 0) - Number(b.dataset.dockIndex ?? 0);
}

function pin(el: HTMLElement, box: { left?: number; right?: number; top: number; z: number }) {
  el.style.position = 'absolute';
  el.style.margin = '0';
  el.style.bottom = 'auto';
  el.style.zIndex = String(box.z);
  el.style.pointerEvents = 'auto';
  el.style.top = `${Math.round(box.top)}px`;
  if (box.left != null) {
    el.style.left = `${Math.round(box.left)}px`;
    el.style.right = 'auto';
  }
  if (box.right != null) {
    el.style.right = `${Math.round(box.right)}px`;
    el.style.left = 'auto';
  }
}

function stackCards(
  cards: HTMLElement[],
  box: { left?: number; right?: number; top: number; bottom: number; width: number },
) {
  if (!cards.length) return;
  const avail = Math.max(cards.length * 56, box.bottom - box.top);
  const width = Math.max(140, box.width);
  for (const card of cards) {
    card.style.position = 'absolute';
    card.style.zIndex = '20';
    card.style.pointerEvents = 'auto';
    card.style.bottom = 'auto';
    card.style.maxHeight = 'none';
    card.style.width = `${Math.round(width)}px`;
    card.style.margin = '0';
    if (box.left != null) {
      card.style.left = `${Math.round(box.left)}px`;
      card.style.right = 'auto';
    } else {
      card.style.left = 'auto';
      card.style.right = `${Math.round(box.right ?? PAD)}px`;
    }
  }
  const natural = cards.map((card) => Math.max(72, Math.min(card.scrollHeight, 640)));
  const gapTotal = GAP * Math.max(0, cards.length - 1);
  let heights = natural.slice();
  const sum = heights.reduce((total, height) => total + height, 0) + gapTotal;
  if (sum > avail) {
    const overflow = sum - avail;
    const naturalSum = natural.reduce((total, height) => total + height, 0) || 1;
    heights = natural.map((height) => Math.max(64, height - overflow * (height / naturalSum)));
    const fitted = heights.reduce((total, height) => total + height, 0) + gapTotal;
    if (fitted > avail) {
      const equal = Math.max(64, (avail - gapTotal) / cards.length);
      heights = cards.map(() => equal);
    }
  }
  let y = box.top;
  cards.forEach((card, index) => {
    const height = Math.min(heights[index], Math.max(64, box.bottom - y));
    card.style.top = `${Math.round(y)}px`;
    card.style.maxHeight = `${Math.floor(height)}px`;
    y += height + GAP;
  });
}

function placeRail(tabs: HTMLElement[], edge: 'left' | 'right', top: number, bottom: number): number {
  let y = top;
  let widest = 0;
  for (const tab of tabs) {
    tab.style.position = 'absolute';
    tab.style.bottom = 'auto';
    tab.style.maxHeight = 'none';
    tab.style.width = 'auto';
    const height = tab.offsetHeight || 28;
    if (y + height > bottom) break;
    if (edge === 'left') pin(tab, { left: PAD, top: y, z: 18 });
    else pin(tab, { right: PAD, top: y, z: 18 });
    widest = Math.max(widest, tab.offsetWidth || 72);
    y += height + GAP;
  }
  return tabs.length ? Math.max(widest, 72) : 0;
}

function placeBottomChrome(
  box: {
    width: number;
    controls: HTMLElement | null;
    layers: HTMLElement | null;
    scale: HTMLElement | null;
    live: HTMLElement | null;
  },
  bottomEdge: number,
  minTop: number,
): { top: number } {
  const { width } = box;
  const controls = box.controls && shown(box.controls) ? box.controls : null;
  const layers = box.layers && shown(box.layers) ? box.layers : null;
  const scale = box.scale && shown(box.scale) ? box.scale : null;
  const live = box.live && shown(box.live) ? box.live : null;
  if (scale) scale.style.maxWidth = 'none';
  if (layers) layers.style.maxWidth = 'none';
  const scaleW = scale?.offsetWidth ?? 220;
  const layersW = layers?.offsetWidth ?? 0;
  if (controls) {
    controls.style.position = 'absolute';
    controls.style.bottom = 'auto';
    controls.style.maxWidth = `${Math.max(200, width - layersW - scaleW - PAD * 5)}px`;
    controls.style.zIndex = '17';
    controls.style.pointerEvents = 'auto';
  }
  const controlsW = controls?.offsetWidth ?? 0;
  const controlsH = controls?.offsetHeight ?? 0;
  const layersH = layers?.offsetHeight ?? 0;
  const scaleH = scale?.offsetHeight ?? 0;
  const rowH = Math.max(controlsH, layersH, scaleH, 0);
  let rowTop = bottomEdge - rowH;
  if (controls) pin(controls, { left: PAD, top: rowTop + Math.max(0, rowH - controlsH), z: 17 });
  if (layers) {
    layers.style.position = 'absolute';
    layers.style.zIndex = '17';
    layers.style.pointerEvents = 'auto';
    pin(layers, { right: PAD, top: rowTop + Math.max(0, rowH - layersH), z: 17 });
  }
  if (scale) {
    scale.style.position = 'absolute';
    scale.style.zIndex = '17';
    scale.style.pointerEvents = 'auto';
    const leftLimit = PAD + controlsW + GAP;
    const rightLimit = width - PAD - (layers?.offsetWidth ?? 0) - GAP;
    if (rightLimit - leftLimit >= (scale.offsetWidth || scaleW) + 16) {
      const left = leftLimit + (rightLimit - leftLimit - scale.offsetWidth) / 2;
      pin(scale, { left, top: rowTop + Math.max(0, (rowH - scaleH) / 2), z: 17 });
    } else {
      rowTop -= scaleH + GAP;
      pin(scale, { left: Math.max(PAD, (width - scale.offsetWidth) / 2), top: rowTop, z: 17 });
    }
  }
  let limit = rowTop;
  if (live) {
    live.style.position = 'absolute';
    live.style.zIndex = '8';
    live.style.pointerEvents = 'none';
    live.style.maxWidth = `${Math.max(160, Math.min(420, width * 0.4))}px`;
    const liveH = live.offsetHeight || 32;
    const liveTop = Math.max(minTop, rowTop - liveH - GAP);
    pin(live, { left: PAD, top: liveTop, z: 8 });
    live.style.pointerEvents = 'none';
    limit = Math.min(limit, liveTop);
  }
  return { top: limit };
}

function signature(root: HTMLElement): string {
  const parts: string[] = [];
  const nodes = root.querySelectorAll<HTMLElement>(
    '[data-dock-role], .map-controls, .layer-switch, .scale-bar, .live-map-banner',
  );
  for (const el of nodes) {
    parts.push(
      [el.getAttribute('data-testid') || el.className, el.style.top, el.style.left, el.style.right, el.style.width, el.style.maxHeight].join(':'),
    );
  }
  return parts.join('|');
}

export function layoutDock(root: HTMLElement): string {
  const width = root.clientWidth;
  const height = root.clientHeight;
  if (width < 40 || height < 40) return '';
  const banner = root.querySelector<HTMLElement>('.class-banner');
  const attrib = root.querySelector<HTMLElement>('.map-attribution');
  const bannerH = banner && shown(banner) ? banner.offsetHeight : 0;
  const attribH = attrib && shown(attrib) ? attrib.offsetHeight : 28;
  const tabs = [...root.querySelectorAll<HTMLElement>('[data-dock-role="tab"]')].filter(shown).sort(byIndex);
  const cards = [...root.querySelectorAll<HTMLElement>('[data-dock-role="card"]')].filter(shown).sort(byIndex);
  const controls = root.querySelector<HTMLElement>('.map-controls');
  const layers = root.querySelector<HTMLElement>('.layer-switch');
  const scale = root.querySelector<HTMLElement>('.scale-bar');
  const live = root.querySelector<HTMLElement>('.live-map-banner');
  const top = bannerH + PAD;

  if (width <= 720) {
    const lines: HTMLElement[][] = [[]];
    let used = 0;
    for (const tab of tabs) {
      const tabWidth = tab.offsetWidth || 72;
      if (used + tabWidth > width - PAD * 2 && lines[lines.length - 1].length) {
        lines.push([]);
        used = 0;
      }
      lines[lines.length - 1].push(tab);
      used += tabWidth + GAP;
    }
    let cursor = height - attribH - PAD;
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index];
      const lineH = Math.max(28, ...line.map((tab) => tab.offsetHeight || 28));
      cursor -= lineH;
      let x = PAD;
      for (const tab of line) {
        pin(tab, { left: x, top: cursor, z: 22 });
        x += (tab.offsetWidth || 72) + GAP;
      }
      cursor -= GAP;
    }
    const chrome = placeBottomChrome({ width, controls, layers, scale, live }, cursor, top);
    stackCards(cards, { left: PAD, top, bottom: chrome.top - GAP, width: width - PAD * 2 });
    return signature(root);
  }

  const leftTabs = tabs.filter((tab) => tab.dataset.dockEdge === 'left');
  const rightTabs = tabs.filter((tab) => tab.dataset.dockEdge !== 'left');
  const chrome = placeBottomChrome(
    { width, controls, layers, scale, live },
    height - attribH - PAD,
    top,
  );
  const leftRail = placeRail(leftTabs, 'left', top, chrome.top - GAP);
  const rightRail = placeRail(rightTabs, 'right', top, chrome.top - GAP);
  const leftCards = cards.filter((card) => card.dataset.dockEdge !== 'right');
  const rightCards = cards.filter((card) => card.dataset.dockEdge === 'right');
  const preferred = Math.min(300, Math.max(200, width * 0.26));
  const left = PAD + (leftRail ? leftRail + GAP : 0);
  const rightInset = PAD + (rightRail ? rightRail + GAP : 0);
  const free = width - left - rightInset - GAP;
  const leftWidth = Math.min(preferred, leftCards.length && rightCards.length ? free * 0.5 : free);
  const rightWidth = Math.min(preferred, Math.max(160, free - (leftCards.length ? leftWidth + GAP : 0)));
  stackCards(leftCards, { left, top, bottom: chrome.top - GAP, width: leftWidth });
  stackCards(rightCards, { right: rightInset, top, bottom: chrome.top - GAP, width: rightWidth });
  return signature(root);
}

export function useDockLayout(root: HTMLElement | null) {
  useLayoutEffect(() => {
    if (!root) return;
    let last = '';
    let frame = 0;
    last = layoutDock(root);
    const run = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let changed = false;
        for (let pass = 0; pass < 3; pass += 1) {
          const next = layoutDock(root);
          if (next === last) break;
          last = next;
          changed = true;
        }
        if (changed) root.dispatchEvent(new CustomEvent('oe-dock-layout', { bubbles: true }));
      });
    };
    const watchSizes = () => {
      root
        .querySelectorAll('.scale-bar, .map-controls, .layer-switch, .float-card, .overlay-panel, .weather-stub')
        .forEach((node) => observer.observe(node));
    };
    run();
    const observer = new ResizeObserver(() => {
      watchSizes();
      run();
    });
    observer.observe(root);
    watchSizes();
    const watch = new MutationObserver(run);
    watch.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-dock-role', 'style'],
    });
    window.addEventListener('resize', run);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      watch.disconnect();
      window.removeEventListener('resize', run);
    };
  }, [root]);
}
