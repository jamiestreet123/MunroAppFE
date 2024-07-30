import { FC, useMemo } from "react";
import { useState, useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";

import { fromLonLat, transform } from "ol/proj";
import { Feature, Overlay } from "ol";
import { MunroCoord } from "../MapComponent/MapComponent";
import { Point } from "ol/geom";
import { FeatureLike } from "ol/Feature";
import { Style, RegularShape, Fill, Stroke } from "ol/style";
import { defaults } from "ol/control/defaults";
import './mapComponent.css';

type MapComponentProps = {
    coords : MunroCoord[];
}

const topoLayer = new TileLayer({
    visible: true,
    source: new XYZ({
        url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
    })
});

const completed = [0, 23, 45, 107];


const styles = {
    'triangle': new Style({
        image: new RegularShape({
          fill: new Fill({color: 'red'}),
          stroke: new Stroke({color: 'white', width: 1}),
          points: 3,
          radius: 12,
          angle: 0,
        }),
  }),
  'selectedTriangle': new Style({
    image: new RegularShape({
      fill: new Fill({color: 'blue'}),
      stroke: new Stroke({color: 'white', width: 1}),
      points: 3,
      radius: 12,
      angle: 0,
    }),
}),
'completedTriangle': new Style({
  image: new RegularShape({
    fill: new Fill({color: 'green'}),
    stroke: new Stroke({color: 'white', width: 1}),
    points: 3,
    radius: 12,
    angle: 0,
  }),
}),
};

const defaultStyle = (feature : FeatureLike | Feature) => {
    if(completed.includes(feature.getProperties().id)){
     return styles['completedTriangle'];
   } else {return styles['triangle'];}
};

const view = new View({
    center: transform([-4.291472, 56.986051], 'EPSG:4326', 'EPSG:3857'),
    zoom: 7.3,
    minZoom: 7.3,
  })

const initialMap = new Map({
    target: "map",
    layers: [topoLayer],
    view: view,
    controls: defaults(),
});

const MapComponent2: FC<MapComponentProps> = ({coords}: MapComponentProps) => {

    const features: Feature[] = useMemo(() => coords.map((coord, index) => new Feature({
    'geometry': new Point(
        transform([coord.longitude, coord.latitude], 'EPSG:4326', 'EPSG:3857')
    ),
    'id': index,
    'size': 50,
  })),[coords]);

  const vectorSource = useMemo(() => new VectorSource({
    features: features,
    wrapX: false,
  }), [features]);

  const vector = useMemo(() => new VectorLayer({
    source: vectorSource,
    style: function (feature) {
         return defaultStyle(feature);
    },
    }), [vectorSource]); 

  const [map, setMap] = useState<Map>(initialMap);

  // pull refs
  function useMap() {
    const mapRef = useRef<Map>();
    if (!mapRef.current) {
      mapRef.current = initialMap;
    }
    return mapRef.current;
  }

  const mapRef = useRef<HTMLDivElement>(null);

  // create state ref that can be accessed in OpenLayers onclick callback function
  //  https://stackoverflow.com/a/60643670
  
  // initialize map on first render - logic formerly put into componentDidMount
  useEffect(() => {
    // create map
    // save map and vector layer references to state
    setMap(initialMap);
  }, []);

  const container = document.getElementById('popup') ?? document.createElement('div');
  container.id = 'popup';
  const closer = document.getElementById('popup-closer') ?? document.createElement('a');
  closer.id = 'popup-closer';
  closer.setAttribute('href', '#');
  closer.innerHTML = '✖';
  container.appendChild(closer);
  const content = document.getElementById('popup-content') ?? document.createElement('p');
  content.id = 'popup-content';
  container.appendChild(content);

  const overlayComponent = new Overlay({
    element: container,
    autoPan: {
      animation: {
        duration: 0,
      },
    },
  });

  // update map if features prop changes - logic formerly put into componentDidUpdate
  map.on('singleclick', function (evt) {
    const clickedFeature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });

    if (clickedFeature && !overlayComponent.getPosition()) {
      const munro = coords[clickedFeature.getProperties().id];
      content.innerHTML = `${munro.hillname} : ${munro.metres}`;
      const zoomButton = document.createElement('button')
      zoomButton.type = 'button';
      zoomButton.addEventListener('click', onZoomClickFunction(munro));
      zoomButton.innerHTML = 'Zoom on Munro';
      content.appendChild(zoomButton);
      overlayComponent.setPosition(view.getCenter());
      topoLayer.setOpacity(0.5);
      vector.setOpacity(0.5);
      map.getInteractions().forEach(x => x.setActive(false));
      
      features[clickedFeature.getProperties().id].setStyle(styles['selectedTriangle']);
    } else {
      overlayComponent.setPosition(undefined);
      topoLayer.setOpacity(1);
      vector.setOpacity(1);
      map.getInteractions().forEach(x => x.setActive(true));
      features.forEach(feature => feature.setStyle(defaultStyle(feature)));
    }
  });

  closer.onclick = function () {
    overlayComponent.setPosition(undefined);
    topoLayer.setOpacity(1);
    vector.setOpacity(1);
    map.getInteractions().forEach(x => x.setActive(true));
    features.forEach(feature => feature.setStyle(defaultStyle(feature)));
    closer.blur();
    return false;
  };

  useEffect(() => {
    if (mapRef.current) {
      map.setTarget(mapRef.current);
      map.updateSize();
      map.removeLayer(vector);
      map.addLayer(vector);
      map.removeOverlay(overlayComponent);
      map.addOverlay(overlayComponent);
    }
  }, [map, features, vector, vectorSource]);

  const resetView = () => {
    view.setCenter(transform([-4.291472, 56.986051], 'EPSG:4326', 'EPSG:3857'));
    view.setZoom(7.3);
  }

  const onZoomClickFunction = (munroCoord: MunroCoord) => {
    const centerCoord = transform([munroCoord.longitude, munroCoord.latitude], 'EPSG:4326', 'EPSG:3857');
    return (ev: MouseEvent) => { 
      view.setCenter(centerCoord);
      view.setZoom(13);
      overlayComponent.setPosition(undefined);
      topoLayer.setOpacity(1);
      vector.setOpacity(1);
      map.getInteractions().forEach(x => x.setActive(true));
      features.forEach(feature => feature.setStyle(defaultStyle(feature)));
      closer.blur();}
    }

  return (
    <div>
      <div ref={mapRef} className="map-container"></div>

    </div>
  );
};

export default MapComponent2;
