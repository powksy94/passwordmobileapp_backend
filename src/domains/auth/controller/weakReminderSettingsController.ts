import { Request, Response } from "express";
import * as UsersRepo from "../../../shared/db/postgres/users.repo";

export const getWeakReminderSettings = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const settings = await UsersRepo.getWeakReminderSettings(req.user.id);
  if (!settings) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.status(200).json(settings);
};

const isValidDelaysHours = (delays: unknown): delays is number[] =>
  Array.isArray(delays) &&
  delays.length === 3 &&
  delays.every((d) => typeof d === "number" && Number.isInteger(d) && d > 0) &&
  delays[0] < delays[1] &&
  delays[1] < delays[2];

export const updateWeakReminderSettings = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { enabled, includeMedium, delaysHours } = req.body as {
    enabled?: boolean;
    includeMedium?: boolean;
    delaysHours?: unknown;
  };
  if (typeof enabled !== "boolean" || typeof includeMedium !== "boolean" || !isValidDelaysHours(delaysHours)) {
    res.status(400).json({ error: "Invalid weak reminder settings" });
    return;
  }
  await UsersRepo.updateWeakReminderSettings(req.user.id, { enabled, includeMedium, delaysHours });
  res.status(200).json({ message: "Weak reminder settings updated" });
};
