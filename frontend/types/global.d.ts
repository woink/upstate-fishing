/**
 * Global type declarations for the frontend
 *
 * This file contains type declarations for global variables and external
 * libraries loaded via CDN that are not available at compile time.
 */

/**
 * Leaflet Map Library Types
 *
 * Leaflet is loaded dynamically via CDN in the browser.
 * These type stubs provide basic type safety for our usage.
 *
 * @see https://leafletjs.com/reference.html
 */
declare namespace L {
  interface LatLngExpression {
    lat?: number;
    lng?: number;
  }

  interface MapOptions {
    center?: LatLngExpression | [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
  }

  interface TileLayerOptions {
    attribution?: string;
    maxZoom?: number;
    minZoom?: number;
  }

  interface CircleMarkerOptions {
    radius?: number;
    fillColor?: string;
    color?: string;
    weight?: number;
    opacity?: number;
    fillOpacity?: number;
  }

  interface Map {
    setView(center: [number, number], zoom: number): this;
    remove(): void;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
  }

  interface Layer {
    addTo(map: Map): this;
    remove(): this;
  }

  interface TileLayer extends Layer {
    addTo(map: Map): this;
  }

  interface CircleMarker extends Layer {
    setStyle(options: CircleMarkerOptions): this;
    bindPopup(content: string): this;
    setPopupContent(content: string): this;
    addTo(map: Map): this;
  }

  /**
   * Create a new Leaflet map instance
   */
  function map(element: HTMLElement | string, options?: MapOptions): Map;

  /**
   * Create a tile layer (e.g., OpenStreetMap tiles)
   */
  function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;

  /**
   * Create a circle marker at a position
   */
  function circleMarker(
    latlng: [number, number],
    options?: CircleMarkerOptions,
  ): CircleMarker;
}

/**
 * Declare L as a global constant
 * This allows TypeScript to recognize `L.map()`, `L.tileLayer()`, etc.
 */
declare const L: typeof L;
