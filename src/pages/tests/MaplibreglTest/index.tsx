import { CFMapTile } from '@/constants';
import { Map, Marker } from 'maplibre-gl';
import { useEffect, useState } from 'react';

const MaplibreglTest = () => {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  useEffect(() => {
    setMap(
      new Map({
        container: 'map',
        style: {
          version: 8,
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster',
              source: 'petal-tiles',
            },
          ],
          sources: {
            'petal-tiles': {
              type: 'raster',
              tiles: [CFMapTile],
              tileSize: 256,
            },
          },
        }, // stylesheet location
        center: [-74.5, 40], // starting position [lng, lat]
        zoom: 9, // starting zoom
      }),
    );
  }, []);

  useEffect(() => {
    // console.log(map);
    if (map) {
      console.log(map);
      map.on('click', (ev) => {
        console.log(ev);
        const marker = new Marker();
        marker.setLngLat(ev.lngLat);
        marker.addTo(map);
      });

      map.on('mouseenter', () => {
        console.log(map);
      });
    }
  }, [map]);
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw',
        maxHeight: '100vh',
        maxWidth: '100vw',
      }}
      id={'map'}
    ></div>
  );
};

export default MaplibreglTest;
