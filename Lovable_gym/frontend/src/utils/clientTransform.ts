import { Client } from "@/components/GymTable";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const buildDuration = (client: any) => {
  if (client?.months) {
    const months = Number(client.months);
    if (!Number.isNaN(months) && months > 0) {
      return `${months} month${months > 1 ? "s" : ""}`;
    }
  }
  if ((client as any)?.duration) {
    return (client as any).duration;
  }
  return client?.packageType || "N/A";
};

const extractId = (client: any, index: number) =>
  client?.id ||
  client?.employeeId ||
  client?.EmployeeId ||
  client?._id ||
  client?.esslUserId ||
  `client-${index}`;

const extractDeviceId = (client: any, fallbackId: string | number) =>
  client?.deviceId ||
  client?.DeviceId ||
  client?.esslUserId ||
  client?.EsslUserId ||
  client?.employeeCodeInDevice ||
  client?.EmployeeCodeInDevice ||
  client?.EmployeeCode ||
  fallbackId;

const parseTrainerRole = (client: any) => {
  if (typeof client?.isTrainer === "boolean") {
    return client.isTrainer;
  }
  if (typeof client?.IsTrainer === "boolean") {
    return client.IsTrainer;
  }
  if (typeof client?.role === "string") {
    return client.role.toLowerCase() === "trainer";
  }
  return false;
};

const toClient = (client: any, index: number): Client => {
  const id = extractId(client, index);
  const deviceId = extractDeviceId(client, id);
  const pendingAmount =
    client?.pendingAmount ??
    client?.balance ??
    (client?.PackageAmount && client?.AmountPaid
      ? Number(client.PackageAmount) - Number(client.AmountPaid)
      : 0);
  const amount =
    client?.packageAmount ?? client?.totalAmount ?? client?.PackageAmount ?? 0;
  const billingDate =
    client?.billingDate ||
    client?.BillingDate ||
    client?.packageStartDate ||
    client?.PackageStartDate ||
    client?.remainingDate ||
    client?.RemainingDate;
  const isTrainer = parseTrainerRole(client);

  return {
    id,
    deviceId,
    esslUserId: deviceId,
    name:
      client?.name ||
      `${client?.firstName || ""} ${client?.lastName || ""}`.trim() ||
      "Unknown",
    contact: client?.phone || client?.contact || client?.ContactNo || "",
    status: (client?.status || "inactive") as Client["status"],
    billingDate: formatDate(billingDate),
    duration: buildDuration(client),
    pendingAmount: pendingAmount ? Number(pendingAmount) : 0,
    amount: amount ? Number(amount) : undefined,
    role: isTrainer ? "trainer" : "client",
    isTrainer,
  };
};

const parseNumericId = (value: string | number | undefined) => {
  if (value === undefined || value === null) return Number.POSITIVE_INFINITY;
  const numeric = parseInt(String(value).replace(/[^\d]/g, ""), 10);
  return Number.isNaN(numeric) ? Number.POSITIVE_INFINITY : numeric;
};

export const sortClientsByUserId = (clients: Client[]) =>
  [...clients].sort((a, b) => {
    const aId = parseNumericId(a.deviceId ?? a.esslUserId ?? a.id);
    const bId = parseNumericId(b.deviceId ?? b.esslUserId ?? b.id);
    if (aId !== bId) return aId - bId;
    return (a.name || "").localeCompare(b.name || "");
  });

export const transformClientList = (rawClients: any[]): Client[] => {
  if (!Array.isArray(rawClients)) {
    return [];
  }

  const deduped = new Map<string | number, Client>();
  rawClients.forEach((client, index) => {
    const transformed = toClient(client, index);
    if (!deduped.has(transformed.id)) {
      deduped.set(transformed.id, transformed);
    }
  });

  return sortClientsByUserId(Array.from(deduped.values()));
};

