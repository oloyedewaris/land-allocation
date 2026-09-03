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
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useEstate } from "./EstateProvider";
import { UnitDetailsPanel } from "./UnitDetailsPanel";

const WORLD_SCALE = 0.1;
// The source survey uses 0.252982 drawing points per metre.
const POINTS_PER_METRE = 0.252982;
const ROAD_WIDTHS = [13.5, 11.5, 10, 8.5];
const LEGACY_CAMERA_POSITION: [number, number, number] = [-22.65, 29.05, 36.97];
const NO_RAYCAST = () => null;
const PLOT_HOVER_EVENT = "estate-plot-hover";
type NavigationAction = "up" | "right" | "down" | "left" | "zoom-in" | "zoom-out" | "home";
type NavigationCommand = { action: NavigationAction; id: number };

function CaretIcon({ direction }: { direction: "up" | "right" | "down" | "left" }) {
  const rotation = { up: 0, right: 90, down: 180, left: -90 }[direction];
  return (
    <svg className="nav-caret" viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${rotation}deg)` }}>
      <path d="M6.75 14.25 12 9l5.25 5.25" />
    </svg>
  );
}

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
  const hoverExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { gl } = useThree();
  const geometry = useMemo(
    () => new THREE.ShapeGeometry(makeShape(unit.r, center[0], center[1])),
    [unit, center],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
      return () => {
        if (hoverExitTimer.current) clearTimeout(hoverExitTimer.current);
        if (hovered && gl.domElement.dataset.hoveredPlot === unit.id) {
          delete gl.domElement.dataset.hoveredPlot;
          gl.domElement.classList.remove("plot-hovered");
          gl.domElement.style.cursor = "pointer";
        }
      };
  }, [gl, hovered, unit.id]);
  useEffect(() => {
    if (!hovered) return;
    const clearIfDifferent = (event: Event) => {
      const nextId = (event as CustomEvent<string | null>).detail;
      if (nextId === unit.id) return;
      if (hoverExitTimer.current) clearTimeout(hoverExitTimer.current);
      setHovered(false);
      setHoverPosition(null);
    };
    gl.domElement.addEventListener(PLOT_HOVER_EVENT, clearIfDifferent);
    return () => gl.domElement.removeEventListener(PLOT_HOVER_EVENT, clearIfDifferent);
  }, [gl, hovered, unit.id]);
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
        position={[0, 0.055, 0]}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          if (hoverExitTimer.current) clearTimeout(hoverExitTimer.current);
          if (gl.domElement.dataset.hoveredPlot !== unit.id) {
            gl.domElement.dispatchEvent(new CustomEvent(PLOT_HOVER_EVENT, { detail: unit.id }));
          }
          setHovered(true);
          setHoverPosition([event.point.x, event.point.y + 0.12, event.point.z]);
          gl.domElement.dataset.hoveredPlot = unit.id;
          gl.domElement.classList.add("plot-hovered");
          gl.domElement.style.cursor = "pointer";
        }}
        onPointerMove={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          if (hoverExitTimer.current) clearTimeout(hoverExitTimer.current);
          if (gl.domElement.dataset.hoveredPlot !== unit.id) {
            gl.domElement.dispatchEvent(new CustomEvent(PLOT_HOVER_EVENT, { detail: unit.id }));
          }
          gl.domElement.dataset.hoveredPlot = unit.id;
          gl.domElement.classList.add("plot-hovered");
          gl.domElement.style.cursor = "pointer";
          setHoverPosition([event.point.x, event.point.y + 0.12, event.point.z]);
        }}
        onPointerOut={() => {
          if (hoverExitTimer.current) clearTimeout(hoverExitTimer.current);
          hoverExitTimer.current = setTimeout(() => {
            setHovered(false);
            setHoverPosition(null);
            if (gl.domElement.dataset.hoveredPlot === unit.id) {
              delete gl.domElement.dataset.hoveredPlot;
              gl.domElement.classList.remove("plot-hovered");
              gl.domElement.style.cursor = "pointer";
            }
          }, 60);
        }}
        onPointerDown={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          gl.domElement.classList.add("plot-hovered");
          gl.domElement.style.cursor = "pointer";
        }}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onSelect(unit.id);
        }}
      >
        <meshStandardMaterial
          color={selected ? "#f4d35e" : color}
          emissive={selected ? "#d6a928" : "#000000"}
          emissiveIntensity={selected ? 0.24 : 0}
          roughness={0.82}
          metalness={0.02}
        />
        <Edges
          color={hovered ? "#ffffff" : selected ? "#ffe36e" : "#343730"}
          lineWidth={hovered ? 2.25 : 1}
          threshold={12}
          position={[0, 0, hovered ? 0.035 : selected ? 0.025 : 0.002]}
          renderOrder={hovered ? 20 : selected ? 15 : 0}
          depthTest={!hovered && !selected}
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
          raycast={NO_RAYCAST}
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
  landmarkPosition,
  selected,
  center,
}: {
  parcel: AmenityParcel;
  color: string;
  name?: string;
  landmarkPosition?: Point;
  selected: boolean;
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
  const scenePosition = useMemo(
    () => landmarkPosition && toScene(landmarkPosition, center[0], center[1]),
    [landmarkPosition, center],
  );
  return <>
    <mesh raycast={NO_RAYCAST} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <meshStandardMaterial
        color={color}
        emissive={selected ? color : "#000000"}
        emissiveIntensity={selected ? 0.38 : 0}
        roughness={0.78}
      />
      {selected && <Edges color="#ffffff" lineWidth={3} threshold={8} />}
    </mesh>
    {name && scenePosition && <AmenityLandmark name={name} color={color} position={scenePosition} />}
  </>;
}

function AmenityLandmark({ name, color, position }: { name: string; color: string; position: Point }) {
  if (name.includes("Park") || name.includes("Playground")) {
    return <group position={[position[0], 0.3, position[1]]}>{[-0.22, 0, 0.22].map((x, index) => <group key={x} position={[x, 0, index === 1 ? -0.14 : 0.09]}><mesh raycast={NO_RAYCAST}><cylinderGeometry args={[0.018, 0.025, 0.2, 5]} /><meshStandardMaterial color="#70543f" /></mesh><mesh raycast={NO_RAYCAST} position={[0, 0.17, 0]}><sphereGeometry args={[0.1, 7, 5]} /><meshStandardMaterial color="#527b43" /></mesh></group>)}</group>;
  }
  if (name.includes("Pool")) {
    return <group position={[position[0], 0.34, position[1]]}><mesh raycast={NO_RAYCAST}><boxGeometry args={[0.7, 0.06, 0.38]} /><meshStandardMaterial color="#52a0bd" roughness={0.3} /></mesh><mesh raycast={NO_RAYCAST} position={[0.48, 0.2, 0]}><boxGeometry args={[0.28, 0.4, 0.32]} /><meshStandardMaterial color="#e9e4d9" /></mesh></group>;
  }
  return <group position={[position[0], 0.39, position[1]]}><mesh raycast={NO_RAYCAST}><boxGeometry args={[0.58, 0.38, 0.43]} /><meshStandardMaterial color="#e9e4d9" roughness={0.88} /></mesh><mesh raycast={NO_RAYCAST} position={[0, 0.26, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.39, 0.17, 4]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh></group>;
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
      <mesh raycast={NO_RAYCAST}>
        <boxGeometry args={[length + shoulderWidth, 0.012, shoulderWidth]} />
        <meshStandardMaterial color="#c4bdae" roughness={1} />
      </mesh>
      <mesh raycast={NO_RAYCAST} position={[0, 0.012, 0]}>
        <boxGeometry args={[length + roadWidth, 0.008, roadWidth]} />
        <meshStandardMaterial color="#3b3d43" roughness={0.96} />
      </mesh>
      {road[4] <= 1 && (
        <mesh raycast={NO_RAYCAST} position={[0, 0.021, 0]}>
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
          <mesh raycast={NO_RAYCAST}>
            <cylinderGeometry args={[0.018, 0.025, 0.2, 5]} />
            <meshStandardMaterial color="#594634" />
          </mesh>
          <mesh raycast={NO_RAYCAST} position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.1, 7, 5]} />
            <meshStandardMaterial color="#357244" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CanvasLabels({ units, center }: { units: EstateUnit[]; center: Point }) {
  const { camera, gl } = useThree();
  const controls = useThree((state) => state.controls) as unknown as
    | { target: THREE.Vector3 }
    | null
    | undefined;
  const layer = useRef<HTMLCanvasElement | null>(null);
  const projected = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    const canvas = document.createElement("canvas");
    canvas.className = "estate-label-layer";
    parent.appendChild(canvas);
    layer.current = canvas;
    return () => {
      canvas.remove();
      layer.current = null;
    };
  }, [gl]);

  useFrame(() => {
    const canvas = layer.current;
    if (!canvas) return;
    const width = gl.domElement.clientWidth;
    const height = gl.domElement.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.textAlign = "center";
    context.textBaseline = "middle";

    const drawLabel = (text: string, x: number, z: number, amenity = false) => {
      projected.set(x, amenity ? 0.58 : 0.16, z).project(camera);
      if (projected.z < -1 || projected.z > 1) return;
      const screenX = (projected.x * 0.5 + 0.5) * width;
      const screenY = (-projected.y * 0.5 + 0.5) * height;
      if (screenX < 0 || screenX > width || screenY < 0 || screenY > height) return;
      context.font = amenity
        ? "600 10px ui-monospace, SFMono-Regular, Consolas, monospace"
        : "8px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.lineWidth = amenity ? 3 : 2;
      context.strokeStyle = amenity ? "rgba(238, 235, 220, .9)" : "rgba(235, 232, 218, .72)";
      context.fillStyle = "#20251f";
      context.strokeText(text, screenX, screenY);
      context.fillText(text, screenX, screenY);
    };

    const cameraDistance = controls?.target
      ? camera.position.distanceTo(controls.target)
      : camera.position.length();
    if (cameraDistance <= 20) {
      for (const unit of units) {
        const [x, z] = toScene(unit.c, center[0], center[1]);
        drawLabel(unit.id, x, z);
      }
    }

    for (const amenity of amenities) {
      const [x, z] = toScene(
        [
          amenity.x + amenity.labelDx * POINTS_PER_METRE,
          amenity.z + amenity.labelDz * POINTS_PER_METRE,
        ],
        center[0],
        center[1],
      );
      drawLabel(amenity.name, x, z, true);
    }
  });

  return null;
}

function CameraRig({ view, focus, command }: { view: ViewMode; focus: Point | null; command: NavigationCommand | null }) {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as unknown as
    | { target: THREE.Vector3; update: () => void }
    | null
    | undefined;
  const cameraGoal = useRef(new THREE.Vector3());
  const targetGoal = useRef(new THREE.Vector3());
  const animating = useRef(false);
  useEffect(() => {
    if (view === "aerial") camera.position.set(...LEGACY_CAMERA_POSITION);
    else camera.position.set(0, 145, view === "map" ? 0.01 : 0.1);
    controls?.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
    controls?.update();
    camera.updateProjectionMatrix();
  }, [camera, controls, view]);
  useEffect(() => {
    if (!focus || !controls) return;
    const direction = camera.position.clone().sub(controls.target).normalize();
    targetGoal.current.set(focus[0], 0, focus[1]);
    cameraGoal.current.copy(targetGoal.current).add(direction.multiplyScalar(22));
    animating.current = true;
  }, [camera, controls, focus]);
  useEffect(() => {
    if (!command || !controls) return;
    animating.current = false;
    if (command.action === "home") {
      if (view === "aerial") camera.position.set(...LEGACY_CAMERA_POSITION);
      else camera.position.set(0, 145, view === "map" ? 0.01 : 0.1);
      controls.target.set(0, 0, 0);
    } else if (command.action === "zoom-in" || command.action === "zoom-out") {
      const offset = camera.position.clone().sub(controls.target);
      const currentDistance = offset.length();
      const nextDistance = THREE.MathUtils.clamp(
        currentDistance * (command.action === "zoom-in" ? 0.8 : 1.25),
        12,
        220,
      );
      camera.position.copy(controls.target).add(offset.setLength(nextDistance));
    } else {
      const forward = controls.target.clone().sub(camera.position);
      forward.y = 0;
      if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      const step = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) * 0.12, 1.5, 8);
      const movement = command.action === "up"
        ? forward
        : command.action === "down"
          ? forward.multiplyScalar(-1)
          : command.action === "right"
            ? right
            : right.multiplyScalar(-1);
      movement.multiplyScalar(step);
      camera.position.add(movement);
      controls.target.add(movement);
    }
    camera.lookAt(controls.target);
    controls.update();
  }, [camera, command, controls, view]);
  useFrame(() => {
    if (!animating.current || !controls) return;
    camera.position.lerp(cameraGoal.current, 0.09);
    controls.target.lerp(targetGoal.current, 0.11);
    controls.update();
    if (
      camera.position.distanceToSquared(cameraGoal.current) < 0.0025 &&
      controls.target.distanceToSquared(targetGoal.current) < 0.0025
    ) {
      camera.position.copy(cameraGoal.current);
      controls.target.copy(targetGoal.current);
      controls.update();
      animating.current = false;
    }
  });
  return null;
}

function EstateScene({ navigationCommand }: { navigationCommand: NavigationCommand | null }) {
  const { gl } = useThree();
  const {
    model,
    statuses,
    visibleUnits,
    shading,
    selectedId,
    selectUnit,
    view,
    focusedAmenity,
    setFocusedAmenity,
  } = useEstate();
  const center = useMemo<Point>(
    () => [model.meta.cx, model.meta.cz],
    [model.meta.cx, model.meta.cz],
  );
  const focus = useMemo<Point | null>(() => {
    if (focusedAmenity === null) return null;
    const item = amenities[focusedAmenity];
    if (!item || !model.parcels[item.parcel]) return null;
    return toScene([item.x, item.z], center[0], center[1]);
  }, [focusedAmenity, model.parcels, center]);
  const clearPlotHover = () => {
    delete gl.domElement.dataset.hoveredPlot;
    gl.domElement.classList.remove("plot-hovered");
    gl.domElement.dispatchEvent(new CustomEvent(PLOT_HOVER_EVENT, { detail: null }));
  };
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
        return <AmenityMesh key={index} parcel={parcel} center={center} color={amenity?.color ?? "#668653"} name={amenity?.name} landmarkPosition={amenity ? [amenity.x, amenity.z] : undefined} selected={amenity ? amenities.indexOf(amenity) === focusedAmenity : false} />;
      })}
      {visibleUnits.map((unit) => (
        <UnitMesh
          key={unit.id}
          unit={unit}
          status={statuses[unit.id]}
          selected={selectedId === unit.id}
          realistic={shading === "realistic"}
          center={center}
          onSelect={(id) => {
            setFocusedAmenity(null);
            selectUnit(id);
          }}
        />
      ))}
      {model.roads.map((road, index) => (
        <RoadMesh key={index} road={road} center={center} />
      ))}
      <Trees units={visibleUnits} center={center} />
      <CanvasLabels units={visibleUnits} center={center} />
      <CameraRig view={view} focus={focus} command={navigationCommand} />
      {view === "map" ? (
        <MapControls
          makeDefault
          onStart={clearPlotHover}
          enableRotate={false}
          maxDistance={220}
          minDistance={12}
        />
      ) : (
        <OrbitControls
          makeDefault
          onStart={clearPlotHover}
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

function ModelReady({ onReady }: { onReady: () => void }) {
  const reported = useRef(false);
  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    requestAnimationFrame(onReady);
  });
  return null;
}

export function EstateCanvas({ esubDetails }: { esubDetails: any }) {
  const { view, setView, selectUnit } = useEstate();
  const [modelReady, setModelReady] = useState(false);
  const [navigationCommand, setNavigationCommand] = useState<NavigationCommand | null>(null);
  const navigate = (action: NavigationAction) => setNavigationCommand({ action, id: Date.now() });
  return (
    <main className="estate-stage">
      {!modelReady && (
        <div className="estate-model-loader" role="status" aria-label="Loading estate model">
          <div className="estate-loader-card">
            <div className="loader" />
          </div>
        </div>
      )}
      <Canvas
        camera={{ position: LEGACY_CAMERA_POSITION, fov: 45, near: 0.1, far: 500 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onPointerMissed={() => selectUnit(null)}
      >
        <EstateScene navigationCommand={navigationCommand} />
        <ModelReady onReady={() => setModelReady(true)} />
      </Canvas>
      <div className="nav-pad">
        <button aria-label="Zoom in" title="Zoom in" onClick={() => navigate("zoom-in")}>+</button>
        <button aria-label="Pan up" title="Pan up" onClick={() => navigate("up")}><CaretIcon direction="up" /></button>
        <div>
          <button aria-label="Pan left" title="Pan left" onClick={() => navigate("left")}><CaretIcon direction="left" /></button>
          <button
            className="home"
            aria-label="Recenter model"
            title="Recenter model"
            onClick={() => navigate("home")}
          >
            ⌂
          </button>
          <button aria-label="Pan right" title="Pan right" onClick={() => navigate("right")}><CaretIcon direction="right" /></button>
        </div>
        <button aria-label="Pan down" title="Pan down" onClick={() => navigate("down")}><CaretIcon direction="down" /></button>
        <button aria-label="Zoom out" title="Zoom out" onClick={() => navigate("zoom-out")}>−</button>
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
