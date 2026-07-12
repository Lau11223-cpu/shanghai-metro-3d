-- ETL: raw -> clean tables
-- Idempotent: TRUNCATE clean tables before INSERT

TRUNCATE metro.lines, metro.stations RESTART IDENTITY;

-- Lines: 过滤正线(排除车库/联络线), 正则提取线路号, 统一"地铁/轨道交通"两种命名
INSERT INTO metro.lines (osm_id, name, ref, operator, colour, geom)
SELECT
  CAST(REPLACE(id, 'way/', '') AS BIGINT) AS osm_id,
  name,
  substring(name from '([0-9]+(/[0-9]+)?号线)') AS ref,
  '上海地铁' AS operator,
  NULL,  -- colour 源数据缺失, 下方手工回填
  CASE
    WHEN ST_GeometryType(geom) = 'ST_LineString' THEN geom
    ELSE ST_GeometryN(ST_LineMerge(geom), 1)
  END AS geom
FROM metro.lines_raw
WHERE name ~ '^上海(地铁|轨道交通)[0-9]+(/[0-9]+)?号线$';

-- Lines: 官方标志色 (源数据 colour 覆盖率仅 14/2300, 手工维护)
UPDATE metro.lines SET colour = CASE ref
  WHEN '1号线'  THEN '#EA1B39'
  WHEN '2号线'  THEN '#8BC43F'
  WHEN '3号线'  THEN '#FBD208'
  WHEN '4号线'  THEN '#512D8D'
  WHEN '5号线'  THEN '#9056A3'
  WHEN '6号线'  THEN '#D61870'
  WHEN '7号线'  THEN '#F47121'
  WHEN '8号线'  THEN '#009EDB'
  WHEN '9号线'  THEN '#79C9EE'
  WHEN '10号线' THEN '#BDA8D3'
  WHEN '11号线' THEN '#7F2131'
  WHEN '12号线' THEN '#017C67'
  WHEN '13号线' THEN '#E895C1'
  WHEN '14号线' THEN '#5E5C29'
  WHEN '15号线' THEN '#BBA786'
  WHEN '16号线' THEN '#8ED1C0'
  WHEN '17号线' THEN '#B87974'
  WHEN '18号线' THEN '#BAA051'
  WHEN '3/4号线' THEN '#FBD208'
END;

-- Stations: 只保留运营中的车站本体
INSERT INTO metro.stations (osm_id, name, name_en, geom)
SELECT
  CAST(REPLACE(id, 'node/', '') AS BIGINT) AS osm_id,
  name,
  "name:en",
  geom
FROM metro.stations_raw
WHERE railway = 'station'
  AND construction IS NULL
  AND name IS NOT NULL;

-- Stations: 空间关联回填所属线路 (100m 内的线路, 换乘站逗号拼接, 按线号排序)
UPDATE metro.stations s
SET line_ref = (
  SELECT string_agg(ref, ',' ORDER BY CAST(substring(ref from '^[0-9]+') AS INT))
  FROM (SELECT DISTINCT l.ref
        FROM metro.lines l
        WHERE ST_DWithin(s.geom::geography, l.geom::geography, 100)) t(ref)
);

-- Stations: 删除关联不到线路的站 (机场联络线等, 轨道不在本数据集内)
DELETE FROM metro.stations WHERE line_ref IS NULL;