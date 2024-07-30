import { Map, View } from 'ol';
import { transform } from 'ol/proj';
import {ChangeEvent, useState, FC, ReactElement, useEffect} from 'react'
import { MunroCoord } from '../MapComponent';
import './searchBar.css';

type SearchBarProps = {
    munroCoords: MunroCoord[];
    view: View;
}

const SearchBar: FC<SearchBarProps> = ({ munroCoords, view }) => {

 const [searchInput, setSearchInput] = useState("");

 const munroNames = munroCoords.map(item => item.hillname);

 const dropdown = document.getElementById('dropdown') ?? document.createElement('div');
 dropdown.id = 'dropdown';
 document.getElementById('searchBar')?.appendChild(dropdown);

 const onRowClickFunction = (ev: MouseEvent) => {
    const hillname = (ev.currentTarget as HTMLDivElement).innerHTML;
    const index = munroNames.indexOf(hillname);
    const coord = munroCoords[index];
    const centerCoord = transform([coord.longitude, coord.latitude], 'EPSG:4326', 'EPSG:3857');
    view.setCenter(centerCoord);
    view.setZoom(13);
    setSearchInput('');
 }

 const addRows = (rows: string[]) => {
     dropdown.innerHTML = '';
     rows.forEach((row) => {
         const thisRow = document.createElement('div');
         thisRow.className='dropdownRow';
         thisRow.innerHTML=`${row}`;
         thisRow.addEventListener('click', onRowClickFunction);
         dropdown.appendChild(thisRow);
     });
 }


const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  e.preventDefault();
  setSearchInput(e.target.value);
};

useEffect(() => {
    if (searchInput.length > 2) {
        const rows = munroCoords.filter((item) => checkIfSuggestion(item.hillname)).slice(0, 5).map(item => item.hillname);
        addRows(rows);
    } else {
        dropdown.innerHTML = '';
    }
})

const checkIfSuggestion = (name: string) => {
    return searchInput.toLowerCase() === name.substring(0, searchInput.length).toLowerCase();
}

return (<>
    <div id="searchInput">
        <input
            type="search"
            placeholder="Search here"
            onChange={handleChange}
            value={searchInput} 
    />
   </div>
   <div id="dropdown">
   </div>
    </>
)

};

export default SearchBar;