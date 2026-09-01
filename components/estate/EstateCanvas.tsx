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
import { MapControls, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useEstate } from "./EstateProvider";
import { UnitDetailsPanel } from "./UnitDetailsPanel";

const WORLD_SCALE = 0.1;
const ROAD_WIDTHS = [13.5, 11.5, 10, 8.5];

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
  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(makeShape(unit.r, center[0], center[1]), {
        depth: selected ? 0.55 : status === "allocated" ? 0.34 : 0.22,
        bevelEnabled: true,
        bevelSize: 0.025,
        bevelThickness: 0.025,
        bevelSegments: 1,
      }),
    [unit, selected, status, center],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
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
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.22, 0]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect(unit.id);
      }}
    >
      <meshStandardMaterial
        color={selected ? "#f4d35e" : color}
        roughness={0.82}
        metalness={0.02}
      />
    </mesh>
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
  center,
}: {
  parcel: AmenityParcel;
  color: string;
  center: Point;
}) {
  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(makeShape(parcel.r, center[0], center[1]), {
        depth: 0.42,
        bevelEnabled: true,
        bevelSize: 0.04,
        bevelThickness: 0.04,
      }),
    [parcel, center],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.15, 0]}
    >
      <meshStandardMaterial color={color} roughness={0.78} />
    </mesh>
  );
}

function RoadMesh({ road, center }: { road: RoadSegment; center: Point }) {
  const [ax, az] = toScene([road[0], road[1]], center[0], center[1]);
  const [bx, bz] = toScene([road[2], road[3]], center[0], center[1]);
  const length = Math.hypot(bx - ax, bz - az);
  const angle = Math.atan2(bz - az, bx - ax);
  const width = ROAD_WIDTHS[road[4]] * WORLD_SCALE * 2;
  return (
    <group
      position={[(ax + bx) / 2, 0.28, (az + bz) / 2]}
      rotation={[0, -angle, 0]}
    >
      <mesh>
        <boxGeometry args={[length + width, 0.16, width + 0.36]} />
        <meshStandardMaterial color="#bdb6a8" roughness={1} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[length + width * 0.75, 0.08, width]} />
        <meshStandardMaterial color="#393d41" roughness={0.96} />
      </mesh>
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
        <group key={index} position={[x, 0.5, z]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.07, 0.6, 5]} />
            <meshStandardMaterial color="#594634" />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.28, 0.65, 7]} />
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
    if (view === "aerial") camera.position.set(66, 78, 92);
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
      <color
        attach="background"
        args={[view === "map" ? "#dad7ce" : "#1c1f22"]}
      />
      <fog attach="fog" args={["#1c1f22", 110, 220]} />
      <ambientLight intensity={1.45} />
      <directionalLight position={[-45, 85, -30]} intensity={2.3} castShadow />
      <hemisphereLight args={["#dce8ff", "#43513a", 0.9]} />
      <Ground rings={model.site} center={center} />
      {model.parcels.map((parcel, index) => (
        <AmenityMesh
          key={index}
          parcel={parcel}
          center={center}
          color={
            amenities.find((item) => item.parcel === index)?.color ?? "#668653"
          }
        />
      ))}
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

export function EstateCanvas() {
  const {
    view,
    setView,
    selectUnit,
  } = useEstate();
  const [canvasKey, setCanvasKey] = useState(0);
  return (
    <main className="estate-stage">
      <Canvas
        key={canvasKey}
        camera={{ position: [66, 78, 92], fov: 38, near: 0.1, far: 500 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
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
      <UnitDetailsPanel />
    </main>
  );
}
