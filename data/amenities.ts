export interface Amenity {
  name: string;
  parcel: number;
  color: string;
}

export const amenities: Amenity[] = [
  { parcel: 9, name: "Commercial Centre", color: "#b8955a" },
  { parcel: 0, name: "Mini Market", color: "#cca56c" },
  { parcel: 11, name: "Healthcare Centre", color: "#66988e" },
  { parcel: 10, name: "Fire & Emergency Point", color: "#bc5646" },
  { parcel: 1, name: "Church", color: "#8983b8" },
  { parcel: 2, name: "Mosque", color: "#669274" },
  { parcel: 14, name: "Utility Zone", color: "#747a80" },
  { parcel: 7, name: "Community Centre", color: "#96805e" },
  { parcel: 5, name: "Children's Playground", color: "#e3ba60" },
  { parcel: 4, name: "Central Neighborhood Park", color: "#688f54" },
  { parcel: 8, name: "Swimming Pool & Fitness Centre", color: "#569ab0" },
  { parcel: 6, name: "School / Educational Facility", color: "#7088b8" },
  { parcel: 3, name: "Restaurant / Café Area", color: "#a06e52" },
];

export const landUseNames: Record<string, string> = {
  LD: "Low density", MD: "Medium density", MF: "Multifunctional",
  CM: "Commercial", FP: "Flood plain", PK: "Park / green",
  SC: "School", RI: "Religious institution", PI: "Public institution",
  PF: "Petrol station", FS: "Fire station", UT: "Utility", OT: "Other",
};
