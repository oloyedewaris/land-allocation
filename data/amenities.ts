export interface Amenity {
  name: string;
  parcel: number;
  color: string;
  x: number;
  z: number;
  labelDx: number;
  labelDz: number;
}

export const amenities: Amenity[] = [
  { parcel: 9, name: "Commercial Centre", color: "#b8955a", x: 280.817, z: 685.144, labelDx: 0, labelDz: -8 },
  { parcel: 0, name: "Mini Market", color: "#cca56c", x: 304.275, z: 693.53, labelDx: 0, labelDz: 8 },
  { parcel: 11, name: "Healthcare Centre", color: "#66988e", x: 266.669, z: 837.5, labelDx: -6, labelDz: 0 },
  { parcel: 10, name: "Fire & Emergency Point", color: "#bc5646", x: 289.743, z: 837.827, labelDx: 0, labelDz: 0 },
  { parcel: 1, name: "Church", color: "#8983b8", x: 343.919, z: 873.413, labelDx: 0, labelDz: -8 },
  { parcel: 2, name: "Mosque", color: "#669274", x: 371.575, z: 863.133, labelDx: 0, labelDz: 8 },
  { parcel: 14, name: "Utility Zone", color: "#747a80", x: 258.871, z: 883.643, labelDx: -4, labelDz: 0 },
  { parcel: 7, name: "Community Centre", color: "#96805e", x: 330.602, z: 885.341, labelDx: 0, labelDz: -8 },
  { parcel: 5, name: "Children's Playground", color: "#e3ba60", x: 334.384, z: 890.804, labelDx: 10, labelDz: 0 },
  { parcel: 4, name: "Central Neighborhood Park", color: "#688f54", x: 300.049, z: 900.897, labelDx: -4, labelDz: 0 },
  { parcel: 8, name: "Swimming Pool & Fitness Centre", color: "#569ab0", x: 282.762, z: 915.975, labelDx: 0, labelDz: 8 },
  { parcel: 6, name: "School / Educational Facility", color: "#7088b8", x: 310.857, z: 916.19, labelDx: 0, labelDz: 10 },
  { parcel: 3, name: "Restaurant / Café Area", color: "#a06e52", x: 324.798, z: 936.015, labelDx: 0, labelDz: 10 },
];

export const landUseNames: Record<string, string> = {
  LD: "Low density", MD: "Medium density", MF: "Multifunctional",
  CM: "Commercial", FP: "Flood plain", PK: "Park / green",
  SC: "School", RI: "Religious institution", PI: "Public institution",
  PF: "Petrol station", FS: "Fire station", UT: "Utility", OT: "Other",
};
