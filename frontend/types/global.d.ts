/**
 * Global type declarations for the frontend
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
    invalidateSize(): this;
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

  function map(element: unknown, options?: MapOptions): Map;
  function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;
  function circleMarker(latlng: [number, number], options?: CircleMarkerOptions): CircleMarker;
}
