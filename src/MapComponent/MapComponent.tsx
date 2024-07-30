import { Map } from "ol";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import Feature, { FeatureLike } from 'ol/Feature';
import { Point } from 'ol/geom.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import {Fill, Stroke, Style, RegularShape} from 'ol/style.js';
import Overlay from 'ol/Overlay';

import { transform } from "ol/proj";
import { defaults } from "ol/control/defaults";
import { defaults as interactionDefaults } from "ol/interaction/defaults";
import { XYZ } from "ol/source";
import munro_coords from '../munro_coords.json';
import { FC, useEffect, useMemo, useRef, useState } from "react";
import './mapComponent.css';
import SearchBar from "./SearchBar/SearchBar";
import axios from "axios";

const topoLayer = new TileLayer({
    visible: true,
    source: new XYZ({
        url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
    })
});

export type  MunroCoord = {
    hillname: string;
    latitude: number;
    longitude: number;
    metres: Number;
}

//const coords = munro_coords as MunroCoord[];

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

type MapComponentProps = {
  coords: MunroCoord[];
}

const MapComponent: FC<MapComponentProps> = ({coords}: MapComponentProps) =>{

  function getMunros() {axios
    .get('http://localhost:8000/api/munros')
    .then((res) => {
      console.log(res);
      //setCoords2(res.data);
    })};
  
    useEffect(() => { getMunros();
    })

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

  const mappingComponent = new Map({
    target: "map",
    layers: [topoLayer],
    view: view,
    controls: defaults(),
    interactions: interactionDefaults({})
  });
  
  const [map, setMap] = useState<Map>(mappingComponent);

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
    console.log(container);

    const overlayComponent = new Overlay({
      element: container,
      autoPan: {
        animation: {
          duration: 0,
        },
      },
    });

    function useMap() {
        const mapRef = useRef<Map>();
        if (!mapRef.current) {
          mapRef.current = mappingComponent;
        }
        return mapRef.current;
      }

      const mapRef = useRef<HTMLDivElement>(null);

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
        setMap(mappingComponent)
      }, []);

      useEffect(() => {
        if (mapRef.current) {
          map.setTarget(mapRef.current);
          map.updateSize();
          map.removeLayer(vector);
          map.addLayer(vector);
          map.removeOverlay(overlayComponent);
          map.addOverlay(overlayComponent);
        }
      }, [map]);

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
        <div className="map-container">
        <div id="map" ref={mapRef}></div>
        <div id="searchBar"><SearchBar munroCoords={munro_coords} view={view} /></div>
        <div id="resetButton"><button type="button" onClick={resetView}>Reset view</button></div>
      </div>
    )
    
}

export default MapComponent;