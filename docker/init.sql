CREATE EXTENSION IF NOT EXISTS postgis;

CREATE SCHEMA IF NOT EXISTS metro;

CREATE TABLE IF NOT EXISTS metro.lines (
  id SERIAL PRIMARY KEY,
  osm_id BIGINT,
  name TEXT,
  ref TEXT,
  operator TEXT,
  colour TEXT,
  geom GEOMETRY(LineString, 4326)
);

CREATE TABLE IF NOT EXISTS metro.stations (
  id SERIAL PRIMARY KEY,
  osm_id BIGINT,
  name TEXT,
  name_en TEXT,
  line_ref TEXT,
  geom GEOMETRY(Point, 4326)
);

CREATE INDEX IF NOT EXISTS idx_lines_geom ON metro.lines USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_stations_geom ON metro.stations USING GIST (geom);