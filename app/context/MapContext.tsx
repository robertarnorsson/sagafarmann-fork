import React, { createContext, useContext, useRef } from 'react';
import type { Map } from 'ol';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Feature } from 'ol';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { Coordinate } from 'ol/coordinate';

interface MapContextType {
  map: React.MutableRefObject<Map | null>;
  setCenter: (coords: [number, number]) => void;
  setZoom: (zoomLevel: number) => void;
  flyTo: (coords: [number, number], zoom?: number) => void;
  addWaypoints: (waypoints: Coordinate[], color: string) => void;
  removeWaypoints: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const map = useRef<Map | null>(null);
  const waypointLayerRef = useRef<VectorLayer | null>(null);

  const setCenter = (coords: [number, number]) => {
    map.current?.getView().setCenter(fromLonLat(coords));
  };

  const setZoom = (zoomLevel: number) => {
    map.current?.getView().setZoom(zoomLevel);
  };

  const flyTo = (coords: [number, number], zoom?: number) => {
    const view = map.current?.getView();
    if (view) {
      const transformedCoords = fromLonLat(coords);
      view.animate({
        center: transformedCoords,
        zoom: zoom !== undefined ? zoom : view.getZoom(),
        duration: 500,
      });
    }
  };

  const addWaypoints = (waypoints: Coordinate[], color: string) => {
    if (!map.current) return;
  
    // Use a shared vector source to allow multiple trips' waypoints
    let vectorSource: VectorSource;
  
    // Check if the layer already exists; if not, create a new one
    if (!waypointLayerRef.current) {
      vectorSource = new VectorSource();
      const waypointLayer = new VectorLayer({
        source: vectorSource,
        updateWhileAnimating: true,
        updateWhileInteracting: true,
      });
  
      map.current.addLayer(waypointLayer);
      waypointLayerRef.current = waypointLayer;
    } else {
      vectorSource = waypointLayerRef.current.getSource() as VectorSource;
    }
  
    // Add features based on the number of waypoints
    if (waypoints.length === 1) {
      const pointFeature = new Feature({
        geometry: new Point(waypoints[0]),
      });
  
      const pointStyle = new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: color }),
          stroke: new Stroke({ color: '#FFFFFF', width: 2 }),
        }),
      });
  
      pointFeature.setStyle(pointStyle);
      vectorSource.addFeature(pointFeature);
    } else if (waypoints.length > 1) {
      const lineString = new LineString(waypoints);
  
      const lineFeature = new Feature({
        geometry: lineString,
      });
  
      const lineStyle = new Style({
        stroke: new Stroke({
          color: color,
          width: 2,
        }),
      });
  
      lineFeature.setStyle(lineStyle);
      vectorSource.addFeature(lineFeature);
    }
  };
  

  const removeWaypoints = () => {
    if (map.current && waypointLayerRef.current) {
      map.current.removeLayer(waypointLayerRef.current);
      waypointLayerRef.current = null;
    }
  };

  return (
    <MapContext.Provider
      value={{ map, setCenter, setZoom, flyTo, addWaypoints, removeWaypoints }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
