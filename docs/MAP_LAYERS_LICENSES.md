# Map layers and licenses

Checked 7 November 2026 for the OE Flex SAMPLE demo. The default map does not call a paid endpoint and does not ship an API key. Optional upgrades stay off until an operator sets an environment variable in their own shell. Do not commit those values.

Example graphics on the map are fuchsia. Simulated or hypothetical graphics (strike history, the fires stub, the illumination stub, Observe pins) are orange. The bar on the map reads **UNCLASSIFIED // SAMPLE**.

## Free sources used by default

| Layer | What you see | Source | License | Attribution shown on the map |
| --- | --- | --- | --- | --- |
| Satellite and 3D Photoreal drape | Global photographic mosaic through zoom 13, then stretched | [EOxCloudless 2016](https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg) (`s2cloudless_3857`) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). EOX’s current FAQ says this 2016 vintage may be embedded in a commercial app. No uptime SLA. Do not resell the tiles as a standalone dataset. | EOxCloudless 2016 by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017) |
| Satellite underlay | Shaded-relief Blue Marble while the mosaic loads, and at the lowest zooms | NASA GIBS `BlueMarble_ShadedRelief_Bathymetry` | NASA-led imagery is public domain in the United States. NASA asks for an acknowledgment and must not be implied to endorse the demo. | We acknowledge imagery from NASA’s Global Imagery Browse Services (GIBS), part of NASA ESDIS. |
| Satellite, United States only | Higher-resolution aerial and satellite imagery, including NAIP where USGS serves it | [USGS Imagery Only](https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer) | Public domain. [USGS National Map terms](https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map). | Map services and data available from U.S. Geological Survey, National Geospatial Program. |
| Terrain, and the Military Map outside the US | Hillshade, contours, and place names | [OpenTopoMap](https://tile.opentopomap.org/) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The public tile server is a volunteer service. This demo only requests tiles in view. | Map data © OpenStreetMap contributors, SRTM. Map style © OpenTopoMap (CC BY-SA). |
| Terrain and Military Map inside the US | USGS topo (contours and relief) drawn over OpenTopoMap | [USGS Topo](https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer) | Public domain, same National Map terms as above. | Map services and data available from U.S. Geological Survey, National Geospatial Program. |
| Elevation mesh for tilt and 3D | Terrarium PNG height tiles, ocean clamped to sea level so imagery stays on the water | [AWS Open Data Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (`s3://elevation-tiles-prod/terrarium`) | Open data. Attribution is required. Sources include USGS 3DEP, SRTM, GMTED2010, ETOPO1, and the other datasets listed by Tilezen. | Mapzen / AWS Open Data Terrain Tiles. The bucket does not send browser CORS headers, so `/api/terrain` proxies that host only. |
| Unit symbols | MIL-STD-2525D frames, icons, and echelon | [milsymbol](https://github.com/spatialillusions/milsymbol) 3.x | MIT | milsymbol, Måns Beckman |
| MGRS grid labels | Grid zone, 100 km, 10 km, or 1 km cells from the view | [mgrs](https://github.com/proj4js/mgrs) (proj4js) | MIT | — |
| Globe runtime | Lazy-loaded viewer | CesiumJS 1.147 | Apache-2.0 | CesiumJS |

The Military Map is the same OpenTopoMap and USGS topo tiles with a client-side color reduction (saturation, brightness, hue) so the 2525 symbols read. The demo does not republish a modified tile set.

Esri World Imagery was checked and **not** used. Esri staff have said the public World Imagery MapServer is not a free service and is not cleared for commercial use without an ArcGIS license ([Esri Community](https://community.esri.com/t5/arcgis-online-questions/inquiry-about-world-imagery/td-p/1569266)). The same is true of Esri World Hillshade and Esri World Elevation, so those are not the terrain source.

EOxCloudless years 2018–2025 are CC BY-NC-SA 4.0. They are not the default mosaic. A commercial license for a later vintage is a paid upgrade (below).

## Optional paid upgrades (off unless you set a variable)

No key is in the repository. An empty variable leaves the free path in place.

| Product | Variable | What it unlocks | Cost checked 7 Nov 2026 |
| --- | --- | --- | --- |
| Cesium World Terrain | `VITE_CESIUM_ION_TOKEN` | Ion asset 1 replaces the terrarium mesh. | [Cesium ion](https://cesium.com/platform/cesium-ion/pricing/): Community is free for personal, non-commercial, and exploratory evaluation use (10 GB storage, 15 GB streaming / month). Commercial use, government work, or revenue above the published threshold needs a paid plan: **$149 / month** individual or **$524 / month** team. Premium is **$499 / month** individual or **$874 / month** team. |
| Google Photorealistic 3D Tiles | `VITE_GOOGLE_MAP_TILES_KEY` | On the 3D Photoreal base layer only, Cesium loads Google’s mesh. The free drape remains if the key is missing or the load fails. | Google Map Tiles API, photorealistic 3D tiles: **1,000 free** billable root events / month, then about **$6 per 1,000** up to 100,000, then lower tiers (about $5.10, $4.20, $3.30, $2.40 per 1,000). Display only. Cesium also meters these through ion: 1,000 root tiles / month on Community, 5,000 on Commercial. |
| Esri World Imagery and other ArcGIS basemaps | Not wired | Would replace the free satellite drape. | [ArcGIS Location Platform](https://developers.arcgis.com/rest/basemap-styles/): **2 million** free basemap tiles / month, then **$0.15 per 1,000** tiles, or **1,000** free basemap sessions / month, then **$4 per 1,000** sessions. Requires an ArcGIS account. |
| Mapbox Satellite | Not wired | Raster satellite tiles. | [Mapbox Raster Tiles](https://www.mapbox.com/pricing): **750,000** free tile requests / month, then **$0.25**, **$0.20**, and **$0.15 per 1,000** at the published tiers. |
| Maxar / Vantor imagery | Not wired | Tasked or archive imagery, not a slippy map. | Land Info’s January 2026 sheet: archive 50 cm pan-sharpened about **$28 / km²**, 30 cm about **$45 / km²**, with new-collect prices higher. Minimum order areas apply. |
| Newer EOxCloudless mosaic | Not wired | 2018–2025 global Sentinel-2 cloudless. | EOX lists a perpetual Viewing Ready license around **€6,000** (2025) or **€5,000** (2018–2024) excluding VAT, or a hosted endpoint around **€6,000 / year**. The public 2018–2025 endpoints are non-commercial only. |

Set the two wired variables in `source/.env.local` (Vite exposes only `VITE_*` values to the browser). Restart the dev server after changing them. Do not commit the file.

```
VITE_CESIUM_ION_TOKEN=
VITE_GOOGLE_MAP_TILES_KEY=
```

Google’s tiles are display-only and Cesium warns unless they are used with the Google geocoder. This demo does not enable that geocoder, so a key is an explicit opt-in for evaluation, not a silent default.

## Libraries

CesiumJS is loaded in a separate chunk when the map mounts (`React.lazy` on `CesiumMap`). Workers, assets, and the widget style sheet are copied from the Cesium build. The main role screen does not download them.
