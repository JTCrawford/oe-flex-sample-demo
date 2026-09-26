/// <reference types="vite/client" />

declare module 'globe.gl' {
  export interface GlobeInstance {
    globeImageUrl(url: string): GlobeInstance;
    bumpImageUrl(url: string): GlobeInstance;
    backgroundImageUrl(url: string): GlobeInstance;
    showAtmosphere(show: boolean): GlobeInstance;
    atmosphereColor(color: string): GlobeInstance;
    atmosphereAltitude(alt: number): GlobeInstance;
    pointOfView(pov: object, transitionMs?: number): GlobeInstance;
    width(w: number): GlobeInstance;
    height(h: number): GlobeInstance;
    htmlElementsData(data: object[]): GlobeInstance;
    htmlLat(field: string): GlobeInstance;
    htmlLng(field: string): GlobeInstance;
    htmlAltitude(alt: number | string): GlobeInstance;
    htmlElement(fn: (d: object) => HTMLElement): GlobeInstance;
  }

  interface GlobeFunction {
    (element?: HTMLElement): GlobeInstance;
    new (element?: HTMLElement): GlobeInstance;
  }

  const Globe: GlobeFunction;
  export default Globe;
}
