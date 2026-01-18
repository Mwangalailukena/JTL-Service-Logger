import { z } from "zod";

export const serviceLogSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  serviceDate: z.string().min(1, "Date is required"),
  durationMinutes: z.coerce.number().min(5, "Minimum 5 minutes").max(1440, "Maximum 24 hours"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["draft", "completed", "pending", "cancelled"]),
  jobType: z.enum(["ict", "solar"]),
  
  // ICT Specific
  ictData: z.object({
    networkType: z.enum(["fiber", "lte", "vsat", "lan"]).optional(),
    signalStrength: z.coerce.number().min(-120).max(0).optional(), // dBm
    hardwareReplaced: z.string().optional(),
    issueCategory: z.enum(["hardware", "software", "network", "power"]).optional(),
  }).optional(),

  // Solar Specific
  solarData: z.object({
    systemVoltage: z.coerce.number().min(12).max(400).optional(),
    batteryHealth: z.coerce.number().min(0).max(100).optional(),
    inverterStatus: z.enum(["normal", "warning", "fault", "off"]).optional(),
    panelsCleaned: z.boolean().optional(),
  }).optional(),

  // Photos (Array of Data URLs or File paths)
  photos: z.array(z.string()).optional(),
});

export type ServiceLogFormValues = z.infer<typeof serviceLogSchema>;
