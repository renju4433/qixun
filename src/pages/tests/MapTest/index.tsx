import { MapContainer, TileLayer } from 'react-leaflet';

import { Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRef } from 'react';
import './SmoothWheelZoom.js';

const MapTest = () => {
  const mapRef = useRef<Map>(null);

  function initMap() {
    setTimeout(() => {
      if (mapRef.current) {
        console.log(mapRef.current);
        mapRef.current.options.scrollWheelZoom = false;
      }
    }, 1000);
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <MapContainer
        style={{ height: '100%', width: '100%' }}
        center={[51.505, -0.09]}
        ref={mapRef}
        whenReady={() => {
          console.log(mapRef.current);
          initMap();
        }}
        zoom={13}
      >
        {/*<TileLayer url="https://b68a.daai.fun/tile230411/s2_z{z}_x{x}_y{y}.jpeg" />*/}
        {/*<TileLayer url="https://mapapi.cloud.huawei.com/mapApi/v1/mapService/getTile?x={x}&y={y}&z={z}&language=zh&scale=2&key=DAEDAALLJxDN3xIxrZz2g5NX2lXE%2Fqbk4v%2BzupvIWqwiMyZDKFQr3CqRmVb6Jn1cgoBxn20G47eawHQwysQulh3nYfG9pToO0CdGfA%3D%3D" />*/}
        <TileLayer url="https://maprastertile-drcn.dbankcdn.cn/display-service/v1/online-render/getTile/24.04.26.17300/{z}/{x}/{y}/?language=zh&p=46&scale=2&mapType=ROADMAP&presetStyleId=standard&key=DAEDANitav6P7Q0lWzCzKkLErbrJG4kS1u%2FCpEe5ZyxW5u0nSkb40bJ%2BYAugRN03fhf0BszLS1rCrzAogRHDZkxaMrloaHPQGO6LNg==" />
        {/*<Marker position={[51.505, -0.09]}>*/}
        {/*  <Popup>*/}
        {/*    A pretty CSS3 popup. <br /> Easily customizable.*/}
        {/*  </Popup>*/}
        {/*</Marker>*/}
      </MapContainer>
    </div>
  );
};

export default MapTest;
