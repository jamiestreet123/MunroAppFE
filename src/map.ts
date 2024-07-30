import { Map } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import View from "ol/View";
import Feature from 'ol/Feature';
import { Point } from 'ol/geom.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import {Fill, Stroke, Style, RegularShape} from 'ol/style.js';
import Overlay from 'ol/Overlay';

import { transform } from "ol/proj";
import { defaults } from "ol/control/defaults";
import { defaults as interactionDefaults } from "ol/interaction/defaults";
import { XYZ } from "ol/source";
import munro_coords from './munro_coords.json';
import { Coordinate } from "ol/coordinate";
const osmBaseLayer = new TileLayer({
  visible: true,
  source: new OSM()
});

const topoLayer = new TileLayer({
    visible: true,
    source: new XYZ({
        url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
    })
});

type  MunroCoord = {
    hillname: string;
    latitude: number;
    longitude: number;
    metres: Number;
}

const coords = munro_coords as MunroCoord[];

const features: Feature[] = coords.map((coord, index) => new Feature({
    'geometry': new Point(
        transform([coord.longitude, coord.latitude], 'EPSG:4326', 'EPSG:3857')
    ),
    'i': index,
    'size': 50,
  }));

  const styles = {
    'triangle': new Style({
        image: new RegularShape({
          fill: new Fill({color: 'red'}),
          stroke: new Stroke({color: 'white', width: 1}),
          points: 3,
          radius: 12,
          angle: 0,
        }),
  }),};
  
  const vectorSource = new VectorSource({
    features: features,
    wrapX: false,
  });
export const vector = new VectorLayer({
source: vectorSource,
style: function () {
    return styles['triangle'];
},
});

export const overlay = (coord: Coordinate) => new Overlay({
  position: coord,
  element: document.getElementById('popup') ?? undefined,
  positioning: 'center-center',
  stopEvent: false
});  

export const map = new Map({
  target: "map",
  layers: [topoLayer],
  view: new View({
    center: transform([-4.291472, 56.986051], 'EPSG:4326', 'EPSG:3857'),
    zoom: 7.3
  }),
  controls: defaults(),
  interactions: interactionDefaults({})
});
