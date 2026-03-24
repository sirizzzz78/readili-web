import { useMemo } from 'react';
import { geoNaturalEarth1, geoPath, geoCentroid, type GeoPermissibleObjects } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import topology from 'world-atlas/countries-110m.json';
import { isoToContinentMap } from '../../lib/isoToContinentMap';

interface WorldMapProps {
  visitedContinents: string[];
  countriesCount: number;
}

const WIDTH = 420;
const HEIGHT = 260;

interface CountryFeature extends Feature<Geometry> {
  id?: string;
}

export function WorldMap({ visitedContinents, countriesCount }: WorldMapProps) {
  const visitedSet = new Set(visitedContinents);

  const { projection, pathGen, countries, continentCentroids } = useMemo(() => {
    const topo = topology as unknown as Topology<{ countries: GeometryCollection }>;
    const geo = feature(topo, topo.objects.countries) as FeatureCollection<Geometry>;
    const feats = geo.features as CountryFeature[];

    const sphere: GeoPermissibleObjects = { type: 'Sphere' };
    const proj = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], sphere);
    const gen = geoPath(proj);

    // Group features by continent for centroid computation
    const continentFeatures: Record<string, CountryFeature[]> = {};
    for (const f of feats) {
      const continent = f.id ? isoToContinentMap[f.id] : undefined;
      if (continent) {
        if (!continentFeatures[continent]) continentFeatures[continent] = [];
        continentFeatures[continent].push(f);
      }
    }

    // Compute centroid for each continent by averaging country centroids
    const centroids: Record<string, [number, number] | null> = {};
    for (const [continent, cFeats] of Object.entries(continentFeatures)) {
      let sumX = 0, sumY = 0, count = 0;
      for (const f of cFeats) {
        const c = geoCentroid(f as GeoPermissibleObjects);
        const pt = proj(c);
        if (pt) {
          sumX += pt[0];
          sumY += pt[1];
          count++;
        }
      }
      centroids[continent] = count > 0 ? [sumX / count, sumY / count] : null;
    }

    return {
      projection: proj,
      pathGen: gen,
      countries: feats,
      continentCentroids: centroids,
    };
  }, []);

  return (
    <div
      className="w-full rounded-[20px] overflow-hidden relative"
      style={{ backgroundColor: 'var(--blue-tint)', aspectRatio: '16 / 10' }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-full relative"
        role="img"
        aria-label={`World map showing ${countriesCount} countries visited`}
      >
        {/* Country paths */}
        {countries.map((f, i) => {
          const continent = f.id ? isoToContinentMap[f.id] : undefined;
          const isVisited = continent ? visitedSet.has(continent) : false;
          const d = pathGen(f as GeoPermissibleObjects);
          if (!d) return null;
          return (
            <path
              key={f.id ?? i}
              d={d}
              fill="var(--blue-pale)"
              opacity={isVisited ? 0.35 : 0.28}
              stroke={isVisited ? 'var(--lavender)' : 'var(--blue-faint)'}
              strokeWidth={isVisited ? 0.75 : 0.5}
              strokeOpacity={isVisited ? 1 : 0.7}
            />
          );
        })}

        {/* Visited continent dots */}
        {Object.entries(continentCentroids).map(([continent, pt]) => {
          if (!visitedSet.has(continent) || !pt) return null;
          return (
            <circle
              key={continent}
              cx={pt[0]}
              cy={pt[1]}
              r={5}
              fill="var(--salmon)"
              opacity={0.9}
            />
          );
        })}
      </svg>

      {/* Coverage text — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 20,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color: 'var(--lavender)',
            fontFamily: 'var(--font-family)',
            marginBottom: 2,
          }}
        >
          Countries Visited
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontSize: 'var(--text-hero)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-family)',
              lineHeight: 1,
            }}
          >
            {countriesCount}
          </span>
          <span
            style={{
              fontSize: 'var(--text-body-sm)',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-family)',
            }}
          >
            {countriesCount === 1 ? 'country' : 'countries'}
          </span>
        </div>
      </div>
    </div>
  );
}
