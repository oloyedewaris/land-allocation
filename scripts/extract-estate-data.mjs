import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("public/legacy-estate.html", "utf8");
const startTag = '<script type="application/json" id="DATA">';
const start = source.indexOf(startTag) + startTag.length;
const end = source.indexOf("</script>", start);

if (start < startTag.length || end < 0) throw new Error("Estate DATA script not found");

const data = JSON.parse(source.slice(start, end));
writeFileSync("data/units.json", JSON.stringify(data.plots));
writeFileSync("data/site-model.json", JSON.stringify({
  meta: data.meta,
  parcels: data.parcels,
  roads: data.roads,
  site: data.site,
}));

console.log(JSON.stringify({
  meta: data.meta,
  plots: data.plots.length,
  parcels: data.parcels.length,
  roads: data.roads.length,
  siteRings: data.site.length,
  plotSample: data.plots[0],
  parcelSample: data.parcels[0],
  roadSample: data.roads[0],
}, null, 2));
