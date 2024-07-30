import React, { useEffect, useRef, useState } from "react";
import "./styles.css";
import "ol/ol.css";
import { Map, View } from "ol";
import { map, vector } from "./map";
import MapComponent, { MunroCoord } from "./MapComponent/MapComponent";
import MapComponent2 from "./MapComponent2/MapComponent2";
import munro_coords from './munro_coords.json';
import axios from "axios";

type MunrosResponse = {
  data: MunroCoord[];
}

export default function App() {
  const coords = munro_coords as MunroCoord[];
  const [coords2, setCoords2] = useState<MunroCoord[]>();
  function getMunros() {axios
  .get('http://localhost:8000/api/munros')
  .then((res) => {
    setCoords2(res.data);
  })};

  useEffect(() => { getMunros()
  })

  return (
    <div className="App">
      {coords2 && coords2.map((coord) => <p>{coord.hillname}</p>)}
    </div>
  );
}
