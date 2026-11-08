# Map layers and licenses

Checked 7 November 2026 for the OE Flex SAMPLE demo. The default map does not call a paid endpoint and does not ship an API key. Optional upgrades stay off until an operator sets an environment variable in their own shell. Do not commit those values.

Example graphics on the map are fuchsia. Simulated or hypothetical graphics (strike history, the fires stub, the illumination stub, Observe pins) are orange. The bar on the map reads **UNCLASSIFIED // SAMPLE**.

## Free sources used by default

| Layer | What you see | Source | License | Attribution shown on the map |
| --- | --- | --- | --- | --- |
| Satellite and 3D Photoreal drape | Global photographic mosaic through zoom 13. The camera stops there outside the United States so the mosaic is not enlarged past the imagery | [EOxCloudless 2016](https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg) (`s2cloudless_3857`) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). EOX’s current FAQ says this 2016 vintage may be embedded in a commercial app. No uptime SLA. Do not resell the tiles as a standalone dataset. | EOxCloudless 2016 by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017) |
| Satellite underlay | Shaded-relief Blue Marble while the mosaic loads, and at the lowest zooms | NASA GIBS `BlueMarble_ShadedRelief_Bathymetry` | NASA-led imagery is public domain in the United States. NASA asks for an acknowledgment and must not be implied to endorse the demo. | We acknowledge imagery from NASA’s Global Imagery Browse Services (GIBS), part of NASA ESDIS. |
| Satellite, United States only | Higher-resolution aerial and satellite imagery, including NAIP where USGS serves it | [USGS Imagery Only](https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer) | Public domain. [USGS National Map terms](https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map). | Map services and data available from U.S. Geological Survey, National Geospatial Program. |
| Terrain, and the Military Map outside the US | Hillshade, contours, and place names | [OpenTopoMap](https://tile.opentopomap.org/) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The public tile server is a volunteer service. This demo only requests tiles in view. | Map data © OpenStreetMap contributors, SRTM. Map style © OpenTopoMap (CC BY-SA). |
| Terrain and Military Map inside the US | USGS topo (contours and relief) drawn over OpenTopoMap | [USGS Topo](https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer) | Public domain, same National Map terms as above. | Map services and data available from U.S. Geological Survey, National Geospatial Program. |
| Elevation mesh for tilt and 3D | Terrarium PNG height tiles, ocean clamped to sea level so imagery stays on the water | [AWS Open Data Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (`s3://elevation-tiles-prod/terrarium`) | Open data. Attribution is required. Sources include USGS 3DEP, SRTM, GMTED2010, ETOPO1, and the other datasets listed by Tilezen. | Mapzen / AWS Open Data Terrain Tiles. The bucket does not send browser CORS headers, so `/api/terrain` proxies that host only. |
| Unit symbols | MIL-STD-2525D frames, icons, and echelon | [milsymbol](https://github.com/spatialillusions/milsymbol) 3.x | MIT | milsymbol, Måns Beckman |
| MGRS grid labels | Grid zone, 100 km, 10 km, or 1 km lines. A map-scale preset uses the matching paper interval: 1:25,000 and 1:50,000 are 1 km; 1:100,000 is 10 km with faint 1 km lines; 1:250,000 is 10 km; 1:500,000 and 1:1,000,000 are 100 km squares | [mgrs](https://github.com/proj4js/mgrs) (proj4js) | MIT | — |
| Globe runtime | Lazy-loaded viewer | CesiumJS 1.147 | Apache-2.0 | CesiumJS |

The Military Map is the same OpenTopoMap and USGS topo tiles with a client-side color reduction (saturation, brightness, hue) so the 2525 symbols read. The demo does not republish a modified tile set.

Esri World Imagery was checked and **not** used. Esri staff have said the public World Imagery MapServer is not a free service and is not cleared for commercial use without an ArcGIS license ([Esri Community](https://community.esri.com/t5/arcgis-online-questions/inquiry-about-world-imagery/td-p/1569266)). The same is true of Esri World Hillshade and Esri World Elevation, so those are not the terrain source.

EOxCloudless years 2018–2025 are CC BY-NC-SA 4.0. They are not the default mosaic. A commercial license for a later vintage is a paid upgrade (below).

## Optional paid upgrades (off unless you set a variable)

No key is in the repository. An empty variable leaves the free path in place.

| Product | Variable | What it unlocks | Cost checked 7 Nov 2026 |
| --- | --- | --- | --- |
| Cesium World Terrain | `VITE_CESIUM_ION_TOKEN` | Ion asset 1 replaces the terrarium mesh. | [Cesium ion](https://cesium.com/platform/cesium-ion/pricing/): Community is free for personal, non-commercial, and exploratory evaluation use (10 GB storage, 15 GB streaming / month). Commercial use, government work, or revenue above the published threshold needs a paid plan: **$149 / month** individual or **$524 / month** team. Premium is **$499 / month** individual or **$874 / month** team. |
| Google Photorealistic 3D Tiles | `VITE_GOOGLE_MAP_TILES_KEY` | Only after the user picks **3D Photoreal**. One root tileset request is cached for the browser session. The free drape stays up if the key is missing, the load fails, or a spend guard trips. | Google Map Tiles API: **1,000 free** root-tileset requests / month, then about **$6 per 1,000**. See Budget guard. |
| Esri World Imagery and other ArcGIS basemaps | Not wired | Would replace the free satellite drape. | [ArcGIS Location Platform](https://developers.arcgis.com/rest/basemap-styles/): **2 million** free basemap tiles / month, then **$0.15 per 1,000** tiles, or **1,000** free basemap sessions / month, then **$4 per 1,000** sessions. Requires an ArcGIS account. |
| Mapbox Satellite | Not wired | Raster satellite tiles. | [Mapbox Raster Tiles](https://www.mapbox.com/pricing): **750,000** free tile requests / month, then **$0.25**, **$0.20**, and **$0.15 per 1,000** at the published tiers. |
| Maxar / Vantor imagery | Not wired | Tasked or archive imagery, not a slippy map. | Land Info’s January 2026 sheet: archive 50 cm pan-sharpened about **$28 / km²**, 30 cm about **$45 / km²**, with new-collect prices higher. Minimum order areas apply. |
| Newer EOxCloudless mosaic | Not wired | 2018–2025 global Sentinel-2 cloudless. | EOX lists a perpetual Viewing Ready license around **€6,000** (2025) or **€5,000** (2018–2024) excluding VAT, or a hosted endpoint around **€6,000 / year**. The public 2018–2025 endpoints are non-commercial only. |

Set the two wired variables in `source/.env.local` (Vite exposes only `VITE_*` values to the browser). Restart the dev server after changing them. Do not commit the file.

```
VITE_CESIUM_ION_TOKEN=
VITE_GOOGLE_MAP_TILES_KEY=
```

Google’s tiles are display-only and Cesium warns unless they are used with the Google geocoder. This demo does not enable that geocoder. The key stays out of the repository.

## Budget guard

Jim approved Google Photorealistic 3D Tiles with a hard ceiling under **$100 / month**. Billing used here: 1,000 root-tileset requests free each month, then about $6 per 1,000. Child tiles that stream after the root are not counted as root requests.

The default map never calls Google. The root tileset is requested only when someone picks **3D Photoreal**, and that object is kept for the rest of the page. Switching layers or scenarios does not request the root again.

| Guard | Limit | What the user sees |
| --- | --- | --- |
| Client, `localStorage` | 3 root sessions per browser per UTC day | Free satellite draped on open elevation, and the note **Photoreal 3D paused (daily limit)** |
| Server, `/api/tiles-session` | 500 root sessions per UTC day, only if a KV store is linked | Same pause note. Without a store the route does not count. |
| Google Cloud quota | 500 root tileset requests per day | Google rejects further root requests. 500 × 30 = 15,000 / month. After the 1,000 free requests, about 14,000 × $6 / 1,000 = **$84** worst case. |
| Billing alert | $90 / month | Email before that worst case. |

No free persistent store is linked on this Vercel project (no Vercel KV, Upstash, or Edge Config this environment can use). The hard cap is therefore the Google Cloud quota below, not an app counter. `/api/tiles-session` still exists: if `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) are set in the host, it counts 500 sessions per UTC day and refuses the next one. Those variables are not committed. Until they exist, the route answers `{ "enforced": "google-cloud-quota" }` and the client relies on the quota plus the 3-per-browser cap.

### Recommended Google Cloud settings

Do this in the Cloud project that owns the Map Tiles API key. Do not paste the key into the repo. Set it only as `VITE_GOOGLE_MAP_TILES_KEY` in the local shell or in Vercel’s environment settings.

1. **API restriction.** The key may call only **Map Tiles API**.
2. **Application restriction: HTTP referrers.**
   - `http://localhost:5173/*`
   - `http://127.0.0.1:5173/*`
   - `https://oe-flex-sample-demo.vercel.app/*`
   - `https://*-oe-flex.vercel.app/*` for previews such as `https://oe-flex-sample-demo-git-…-oe-flex.vercel.app/*`
3. **Quota.** Map Tiles API, photorealistic 3D tiles, **root tileset requests per day = 500**.
4. **Budget.** On the billing account, a **$90 / month** budget alert for this project (or for the Map Tiles API). That is under the $100 ceiling and above the about-$84 worst case at 500 roots per day.

## Screen scale

The scale bar and the Map scale control use a representative fraction at **96 CSS pixels per inch** (`1 in = 96 px = 0.0254 m`). That is the usual browser reference pixel, not a measured panel DPI. Ground meters per pixel are measured at the center of the unobstructed map (the view with the top bar and open cards taken out). Picking 1:25,000, 1:50,000, 1:100,000, 1:250,000, 1:500,000, or 1:1,000,000 switches to a north-up top-down view and sets the camera so the scale bar matches that fraction, then snaps the MGRS grid to the interval in the table above. Zooming away shows Custom with the live fraction.

Free imagery is not drawn closer than its native zoom: EOX Sentinel-2 cloudless stops at zoom 13, OpenTopoMap at 15, and USGS Imagery Only / USGS Topo at 16 inside the United States boxes already listed above. Esri World Imagery is not used. Google Photorealistic 3D Tiles, when the Map Tiles key is configured and the user picks **3D Photoreal**, are the high-detail view.

## Libraries

CesiumJS is loaded in a separate chunk when the map mounts (`React.lazy` on `CesiumMap`). Workers, assets, and the widget style sheet are copied from the Cesium build. The main role screen does not download them.
