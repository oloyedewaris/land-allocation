"use client";

import { amenities } from "@/data/amenities";
import type {
  AmenityParcel,
  EstateUnit,
  Point,
  RoadSegment,
  UnitStatus,
  ViewMode,
} from "@/types/estate";
import { Edges, Html, MapControls, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useEstate } from "./EstateProvider";
import { UnitDetailsPanel } from "./UnitDetailsPanel";

const WORLD_SCALE = 0.1;
// The source survey uses 0.252982 drawing points per metre.
const POINTS_PER_METRE = 0.252982;
const ROAD_WIDTHS = [13.5, 11.5, 10, 8.5];
const LEGACY_CAMERA_POSITION: [number, number, number] = [-22.65, 29.05, 36.97];

function toScene([x, z]: Point, cx: number, cz: number): [number, number] {
  return [(x - cx) * WORLD_SCALE, (z - cz) * WORLD_SCALE];
}

function makeShape(ring: Point[], cx: number, cz: number) {
  const shape = new THREE.Shape();
  ring.forEach((point, index) => {
    const [x, z] = toScene(point, cx, cz);
    if (index === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  return shape;
}

function UnitMesh({
  unit,
  status,
  selected,
  realistic,
  center,
  onSelect,
}: {
  unit: EstateUnit;
  status: UnitStatus;
  selected: boolean;
  realistic: boolean;
  center: Point;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);
  const { gl } = useThree();
  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(makeShape(unit.r, center[0], center[1]), {
        depth: selected ? 0.08 : status === "allocated" ? 0.05 : 0.035,
        bevelEnabled: true,
        bevelSize: 0.025,
        bevelThickness: 0.025,
        bevelSegments: 1,
      }),
    [unit, selected, status, center],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    return () => {
      if (hovered) gl.domElement.style.cursor = "default";
    };
  }, [gl, hovered]);
  const color = realistic
    ? status === "allocated"
      ? "#bd7257"
      : status === "reserved"
        ? "#8e9291"
        : "#88a666"
    : status === "available"
      ? "#1ea45c"
      : status === "allocated"
        ? "#c43a2c"
        : "#8d959b";
  return (
    <>
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, hovered ? 0.14 : 0.025, 0]}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(true);
          setHoverPosition([event.point.x, event.point.y + 0.12, event.point.z]);
          gl.domElement.style.cursor = "pointer";
        }}
        onPointerMove={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHoverPosition([event.point.x, event.point.y + 0.12, event.point.z]);
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoverPosition(null);
          gl.domElement.style.cursor = "default";
        }}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onSelect(unit.id);
        }}
      >
        <meshStandardMaterial
          color={selected ? "#f4d35e" : hovered ? "#f7d774" : color}
          emissive={hovered || selected ? "#d6a928" : "#000000"}
          emissiveIntensity={hovered ? 0.42 : selected ? 0.24 : 0}
          roughness={hovered ? 0.62 : 0.82}
          metalness={0.02}
        />
        <Edges
          color={hovered ? "#fff7cf" : selected ? "#ffe36e" : "#544f46"}
          lineWidth={hovered || selected ? 2 : 0.35}
          threshold={12}
        />
      </mesh>
      {hovered && hoverPosition && (
        <Html position={hoverPosition} zIndexRange={[40, 0]}>
          <div className="plot-tooltip" role="tooltip">
            <div>
              <strong>{unit.id}</strong>
              <span>{unit.a.toLocaleString()} m²</span>
            </div>
            <p>{status[0].toUpperCase() + status.slice(1)}</p>
          </div>
        </Html>
      )}
    </>
  );
}

function Ground({ rings, center }: { rings: Point[][]; center: Point }) {
  const geometries = useMemo(
    () =>
      rings.map(
        (ring) =>
          new THREE.ShapeGeometry(makeShape(ring, center[0], center[1])),
      ),
    [rings, center],
  );
  useEffect(
    () => () => geometries.forEach((geometry) => geometry.dispose()),
    [geometries],
  );
  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh
          key={index}
          geometry={geometry}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#aaa293" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function AmenityMesh({
  parcel,
  color,
  name,
  center,
}: {
  parcel: AmenityParcel;
  color: string;
  name: string;
  center: Point;
}) {
  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(makeShape(parcel.r, center[0], center[1]), {
        depth: 0.035,
        bevelEnabled: true,
        bevelSize: 0.04,
        bevelThickness: 0.04,
      }),
    [parcel, center],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  const centroid = useMemo(() => {
    const point = parcel.r.reduce((sum, current) => [sum[0] + current[0] / parcel.r.length, sum[1] + current[1] / parcel.r.length] as Point, [0, 0]);
    return toScene(point, center[0], center[1]);
  }, [parcel, center]);
  return <>
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <meshStandardMaterial color={color} roughness={0.78} />
    </mesh>
    <AmenityLandmark name={name} color={color} position={centroid} />
  </>;
}

function AmenityLandmark({ name, color, position }: { name: string; color: string; position: Point }) {
  if (name.includes("Park") || name.includes("Playground")) {
    return <group position={[position[0], 0.3, position[1]]}>{[-0.22, 0, 0.22].map((x, index) => <group key={x} position={[x, 0, index === 1 ? -0.14 : 0.09]}><mesh><cylinderGeometry args={[0.018, 0.025, 0.2, 5]} /><meshStandardMaterial color="#70543f" /></mesh><mesh position={[0, 0.17, 0]}><sphereGeometry args={[0.1, 7, 5]} /><meshStandardMaterial color="#527b43" /></mesh></group>)}</group>;
  }
  if (name.includes("Pool")) {
    return <group position={[position[0], 0.34, position[1]]}><mesh><boxGeometry args={[0.7, 0.06, 0.38]} /><meshStandardMaterial color="#52a0bd" roughness={0.3} /></mesh><mesh position={[0.48, 0.2, 0]}><boxGeometry args={[0.28, 0.4, 0.32]} /><meshStandardMaterial color="#e9e4d9" /></mesh></group>;
  }
  return <group position={[position[0], 0.39, position[1]]}><mesh><boxGeometry args={[0.58, 0.38, 0.43]} /><meshStandardMaterial color="#e9e4d9" roughness={0.88} /></mesh><mesh position={[0, 0.26, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.39, 0.17, 4]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh></group>;
}

function RoadMesh({ road, center }: { road: RoadSegment; center: Point }) {
  const [ax, az] = toScene([road[0], road[1]], center[0], center[1]);
  const [bx, bz] = toScene([road[2], road[3]], center[0], center[1]);
  const length = Math.hypot(bx - ax, bz - az);
  const angle = Math.atan2(bz - az, bx - ax);
  const halfWidth = ROAD_WIDTHS[road[4]] * POINTS_PER_METRE * WORLD_SCALE;
  const shoulder = 2 * POINTS_PER_METRE * WORLD_SCALE;
  const roadWidth = halfWidth * 2;
  const shoulderWidth = (halfWidth + shoulder) * 2;
  return (
    <group
      position={[(ax + bx) / 2, 0.02, (az + bz) / 2]}
      rotation={[0, -angle, 0]}
    >
      <mesh>
        <boxGeometry args={[length + shoulderWidth, 0.012, shoulderWidth]} />
        <meshStandardMaterial color="#c4bdae" roughness={1} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[length + roadWidth, 0.008, roadWidth]} />
        <meshStandardMaterial color="#3b3d43" roughness={0.96} />
      </mesh>
      {road[4] <= 1 && (
        <mesh position={[0, 0.021, 0]}>
          <boxGeometry args={[length, 0.004, 0.045]} />
          <meshBasicMaterial color="#e9e5d5" transparent opacity={0.72} />
        </mesh>
      )}
    </group>
  );
}

function Trees({ units, center }: { units: EstateUnit[]; center: Point }) {
  const points = useMemo(
    () =>
      units
        .filter((_, index) => index % 3 === 0)
        .map((unit, index) => {
          const [x, z] = toScene(unit.c, center[0], center[1]);
          return [x + (index % 5) * 0.08, z + (index % 7) * 0.06] as const;
        }),
    [units, center],
  );
  return (
    <group>
      {points.map(([x, z], index) => (
        <group key={index} position={[x, 0.3, z]}>
          <mesh>
            <cylinderGeometry args={[0.018, 0.025, 0.2, 5]} />
            <meshStandardMaterial color="#594634" />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.1, 7, 5]} />
            <meshStandardMaterial color="#357244" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CameraRig({ view, focus }: { view: ViewMode; focus: Point | null }) {
  const { camera } = useThree();
  useEffect(() => {
    if (view === "aerial") camera.position.set(...LEGACY_CAMERA_POSITION);
    else camera.position.set(0, 145, view === "map" ? 0.01 : 0.1);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, view]);
  useEffect(() => {
    if (!focus) return;
    camera.position.set(focus[0] + 16, 28, focus[1] + 22);
    camera.lookAt(focus[0], 0, focus[1]);
  }, [camera, focus]);
  return null;
}

function EstateScene() {
  const {
    model,
    statuses,
    visibleUnits,
    shading,
    selectedId,
    selectUnit,
    view,
    focusedAmenity,
  } = useEstate();
  const center = useMemo<Point>(
    () => [model.meta.cx, model.meta.cz],
    [model.meta.cx, model.meta.cz],
  );
  const focus = useMemo<Point | null>(() => {
    if (focusedAmenity === null) return null;
    const item = amenities[focusedAmenity];
    const parcel = model.parcels[item.parcel];
    if (!parcel) return null;
    const average = parcel.r.reduce(
      (sum, point) =>
        [
          sum[0] + point[0] / parcel.r.length,
          sum[1] + point[1] / parcel.r.length,
        ] as Point,
      [0, 0],
    );
    return toScene(average, center[0], center[1]);
  }, [focusedAmenity, model.parcels, center]);
  return (
    <>
      {view === "map" && <color attach="background" args={["#dad7ce"]} />}
      <fog attach="fog" args={["#1c1f22", 110, 220]} />
      <ambientLight intensity={1.18} />
      <directionalLight position={[-46, 72, -52]} intensity={1.7} />
      <hemisphereLight args={["#d9ddd4", "#30392b", 0.65]} />
      <Ground rings={model.site} center={center} />
      {model.parcels.map((parcel, index) => {
        const amenity = amenities.find((item) => item.parcel === index);
        return <AmenityMesh key={index} parcel={parcel} center={center} color={amenity?.color ?? "#668653"} name={amenity?.name ?? "Community facility"} />;
      })}
      {visibleUnits.map((unit) => (
        <UnitMesh
          key={unit.id}
          unit={unit}
          status={statuses[unit.id]}
          selected={selectedId === unit.id}
          realistic={shading === "realistic"}
          center={center}
          onSelect={selectUnit}
        />
      ))}
      {model.roads.map((road, index) => (
        <RoadMesh key={index} road={road} center={center} />
      ))}
      <Trees units={visibleUnits} center={center} />
      <CameraRig view={view} focus={focus} />
      {view === "map" ? (
        <MapControls
          makeDefault
          enableRotate={false}
          maxDistance={220}
          minDistance={12}
        />
      ) : (
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.08}
          minPolarAngle={0.08}
          maxDistance={220}
          minDistance={12}
          target={[0, 0, 0]}
        />
      )}
    </>
  );
}

export function EstateCanvas({ esubDetails }: { esubDetails: any }) {
  const { view, setView, selectUnit } = useEstate();
  const [canvasKey, setCanvasKey] = useState(0);
  return (
    <main className="estate-stage">
      <Canvas
        key={canvasKey}
        camera={{ position: LEGACY_CAMERA_POSITION, fov: 45, near: 0.1, far: 500 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onPointerMissed={() => selectUnit(null)}
      >
        <EstateScene />
      </Canvas>
      <div className="nav-pad">
        <button onClick={() => setCanvasKey((value) => value + 1)}>↻</button>
        <button onClick={() => setView("plan")}>⌃</button>
        <div>
          <button onClick={() => setView("map")}>‹</button>
          <button
            className="home"
            onClick={() => setCanvasKey((value) => value + 1)}
          >
            ⌂
          </button>
          <button onClick={() => setView("aerial")}>›</button>
        </div>
      </div>
      <div className="canvas-hud">
        Drag orbit · Right drag pan · Scroll zoom · Home recenters
      </div>
      <div className="view-switch">
        {(["map", "plan", "aerial"] as const).map((mode) => (
          <button
            key={mode}
            aria-pressed={view === mode}
            onClick={() => setView(mode)}
          >
            {mode[0].toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      <UnitDetailsPanel esubDetails={esubDetails} />
    </main>
  );
}
