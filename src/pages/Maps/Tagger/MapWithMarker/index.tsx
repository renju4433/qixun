import MapContainer from '@/components/Map/MapContainer';
import { useEffect, useState } from 'react';
import { Layer, LayerProps, Source, useMap } from 'react-map-gl/maplibre';
import styles from '../style.less';

const MapWithMarker = ({
  rounds,
  onClick,
  cluster,
}: {
  rounds: any;
  onClick?: (e: any) => void;
  cluster: boolean;
}) => {
  const { map } = useMap();
  const [features, setFeatures] = useState<JSON[]>();
  useEffect(() => {
    if (rounds) {
      setFeatures(
        rounds.map((round) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [round.lng, round.lat] },
          properties: {
            source: round.source,
            panoId: round.panoId,
            id: round.id,
          },
        })),
      );
      const bounds = rounds?.reduce(
        (acc, cur) => {
          if (cur.lat && cur.lng) {
            acc[0] = Math.min(acc[0], cur.lng);
            acc[1] = Math.min(acc[1], cur.lat);
            acc[2] = Math.max(acc[2], cur.lng);
            acc[3] = Math.max(acc[3], cur.lat);
          }
          return acc;
        },
        [180, 90, -180, -90],
      );
      map?.fitBounds(
        [
          [bounds[0] - 1, Math.max(-90, bounds[1] - 1)],
          [bounds[2] + 1, Math.min(90, bounds[3] + 1)],
        ],
        { padding: 100, duration: 500 },
      );
    }
  }, [rounds]);
  map?.on('load', () => {
    map?.loadImage(
      'https://b68v.daai.fun/biz/1662830770348_9499340182724556af66f2b42846135b_0.png',
      (error, image) => {
        if (error) throw error;
        else if (map?.hasImage('custom-marker')) return;
        else map?.addImage('custom-marker', image!);
      },
    );
  });

  const dataLayer: LayerProps = {
    id: 'data',
    type: 'symbol',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'icon-image': 'custom-marker',
      'icon-anchor': 'bottom',
      'icon-size': 0.9,
      'icon-allow-overlap': !0,
    },
  };

  const clusterLayer: LayerProps = {
    id: 'clusters',
    type: 'circle',
    filter: ['has', 'point_count'],
    paint: {
      // Use step expressions (https://maplibre.org/maplibre-style-spec/#expressions-step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        100,
        '#f1f075',
        750,
        '#f28cb1',
      ],
      'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
    },
  };

  const clusterLabelLayer: LayerProps = {
    id: 'cluster-count',
    type: 'symbol',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
  };

  return (
    <div className={styles.map}>
      <MapContainer interactiveLayerIds={['data']} onClick={onClick}>
        <Source
          type="geojson"
          data={{ type: 'FeatureCollection', features: features }}
          cluster={cluster ?? false}
          clusterMaxZoom={5}
          clusterRadius={10}
        >
          <Layer {...dataLayer}></Layer>
          <Layer {...clusterLayer}></Layer>
          {/* <Layer {...clusterLabelLayer}></Layer> */}
        </Source>
        {/* {rounds &&
          rounds.slice(0, 4000).map((round) => (
            <Marker
              key={round.id.toString()}
              latitude={round.lat}
              longitude={round.lng}
              color="orange"
            >
              <img src="https://b68v.daai.fun/biz/1662830770348_9499340182724556af66f2b42846135b_0.png" />
            </Marker>
          ))} */}
      </MapContainer>
    </div>
  );
};

export default MapWithMarker;
