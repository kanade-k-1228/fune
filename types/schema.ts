import { z } from "zod";
import type { SchedulePattern } from "./yaml.js";

const Lon = z.number().min(-180).max(180);
const Lat = z.number().min(-90).max(90);
const Coord = z.tuple([Lon, Lat]);

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
  message: "色は #RRGGBB 形式の 6 桁 16 進数で指定してください",
});

// HH:MM、または翌日以降の発着を表す D:HH:MM (例: 1:04:30 = 翌日 04:30)
const Time = z.string().regex(/^(\d+:)?\d{1,2}:\d{2}$/, {
  message: "時刻は HH:MM もしくは D:HH:MM 形式で指定してください",
});

const PortLevelSchema = z.enum(["major", "minor", "local"]);

export const PortSchema = z
  .object({
    name: z.tuple([z.string(), z.string().min(1)]),
    pos: Coord,
    level: PortLevelSchema.optional(),
  })
  .strict();

const FlagSchema = z.enum([
  "cargo",
  "container",
  "roro",
  "passenger",
  "ferry",
  "rapid",
  "jetfoil",
  "national",
  "regional",
  "local",
  "seasonal",
  "suspend",
]);

const StopSchema = z.union([z.null(), Time, z.tuple([Time, Time])]);

const VoyageSchema = z
  .object({
    name: z.string().optional(),
    note: z.string().optional(),
    stops: z.array(StopSchema),
    schedule: z.record(z.string(), z.boolean()).optional(),
  })
  .strict();

const TimetableSchema = z
  .object({
    name: z.string(),
    voyages: z.array(VoyageSchema),
  })
  .strict();

export const SchedulePatternSchema: z.ZodType<SchedulePattern> = z.lazy(() =>
  z.union([z.string(), z.record(z.string(), SchedulePatternSchema)]),
);

export const LineSchema = z
  .object({
    name: z.string().min(1),
    route: z.string().min(1),
    color: HexColor.optional(),
    mark: z.string().optional(),
    source: z.array(z.string().url()).nonempty(),
    fare: z.array(z.string()).optional(),
    notes: z.array(z.string()).optional(),
    ships: z.array(z.string()).optional(),
    ports: z.record(z.string(), Coord),
    coords: z.array(z.array(Coord)).optional(),
    stops: z.array(z.string()).nonempty(),
    timetables: z.record(z.string(), TimetableSchema).optional(),
    schedule: z.record(z.string(), SchedulePatternSchema).optional(),
    flags: z.array(FlagSchema).optional(),
  })
  .strict();
