export type AxisOption =
  | "binary length"
  | "zeroes"
  | "ones"
  | "consecutive zeroes"
  | "consecutive ones"
  | "switches";

export const AXIS_OPTIONS: AxisOption[] = [
  "binary length",
  "zeroes",
  "ones",
  "consecutive zeroes",
  "consecutive ones",
  "switches",
];

export type NumberMetrics = {
  n: number;
  mod3: 0 | 1 | 2;
  binaryLength: number;
  zeroes: number;
  ones: number;
  maxConsecutiveZeroes: number;
  maxConsecutiveOnes: number;
  switches: number;
};

export type Journey = {
  oddNumbers: number[];
  metrics: NumberMetrics[];
};

