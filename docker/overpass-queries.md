# Overpass Turbo Queries for Shanghai Metro

Data source: OpenStreetMap via https://overpass-turbo.eu/
Downloaded on: 2026-07-07

## Query 1: Metro Lines

\`\`\`
[out:json][timeout:60];
area["name"="上海市"]["admin_level"="4"]->.searchArea;
(
  way["railway"="subway"](area.searchArea);
);
out geom;
\`\`\`

Output: `data/metro-lines-raw.geojson`

## Query 2: Metro Stations

\`\`\`
[out:json][timeout:60];
area["name"="上海市"]["admin_level"="4"]->.searchArea;
(
  node["station"="subway"](area.searchArea);
  node["railway"="station"]["subway"="yes"](area.searchArea);
);
out geom;
\`\`\`

Output: `data/metro-stations-raw.geojson`