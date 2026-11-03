import { z } from 'zod';

/**
 * Every external input crosses one of these schemas before it reaches a service
 * or a route handler. Forms, WhatsApp webhooks and API bodies all validate here.
 */

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const clockSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:mm');

export const bookingSourceSchema = z.enum(['app', 'whatsapp', 'call', 'walkin', 'staff']);
export type BookingSource = z.infer<typeof bookingSourceSchema>;

export const memberRoleSchema = z.enum(['owner', 'reception', 'staff']);
export type MemberRole = z.infer<typeof memberRoleSchema>;

/** A customer booking themselves, or reception booking on their behalf. */
export const bookingDraftSchema = z.object({
  salonId: z.string().uuid(),
  branchId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().trim().min(2).max(80),
  customerPhone: phoneSchema,
  staffId: z.string().uuid(),
  businessDate: isoDateSchema,
  startTime: clockSchema,
  serviceIds: z.array(z.string().uuid()).min(1).max(8),
  source: bookingSourceSchema.default('app'),
  notes: z.string().trim().max(500).optional(),
});
export type BookingDraft = z.infer<typeof bookingDraftSchema>;

export const walkInSchema = z.object({
  salonId: z.string().uuid(),
  branchId: z.string().uuid(),
  customerName: z.string().trim().min(2).max(80),
  customerPhone: phoneSchema,
  staffId: z.string().uuid().nullable(),
  serviceIds: z.array(z.string().uuid()).min(1).max(8),
  source: z.enum(['walkin', 'call', 'staff']).default('walkin'),
});
export type WalkInInput = z.infer<typeof walkInSchema>;

/** A WhatsApp/call request that reception confirms in one tap. */
export const bookingRequestSchema = z.object({
  salonId: z.string().uuid(),
  customerName: z.string().trim().min(2).max(80),
  customerPhone: phoneSchema,
  staffId: z.string().uuid().nullable(),
  serviceIds: z.array(z.string().uuid()).min(1).max(8),
  preferredDate: isoDateSchema,
  preferredTime: clockSchema,
  source: z.enum(['whatsapp', 'call']),
  rawPayload: z.unknown().optional(),
});
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export const invoiceLineSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20).default(1),
  unitPricePaise: z.number().int().min(0),
});
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;

export const invoiceDraftSchema = z.object({
  salonId: z.string().uuid(),
  branchId: z.string().uuid(),
  bookingId: z.string().uuid().nullable(),
  customerId: z.string().uuid(),
  staffId: z.string().uuid(),
  businessDate: isoDateSchema,
  lines: z.array(invoiceLineSchema).min(1).max(20),
  discountPaise: z.number().int().min(0).default(0),
  gstEnabled: z.boolean().default(false),
  gstBps: z.number().int().min(0).max(2800).default(0),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'razorpay', 'other']).default('cash'),
});
export type InvoiceDraft = z.infer<typeof invoiceDraftSchema>;

export const serviceInputSchema = z.object({
  salonId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  name: z.string().trim().min(2).max(60),
  pricePaise: z.number().int().min(0),
  durationMinutes: z.number().int().min(5).max(480),
  active: z.boolean().default(true),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const staffInputSchema = z.object({
  salonId: z.string().uuid(),
  name: z.string().trim().min(2).max(60),
  phone: phoneSchema,
  roleLabel: z.string().trim().max(40).default('Stylist'),
  commissionBps: z.number().int().min(0).max(10_000).default(0),
  active: z.boolean().default(true),
});
export type StaffInput = z.infer<typeof staffInputSchema>;

/** Onboarding wizard: one salon, its chairs, its services, its people. */
export const provisioningSchema = z.object({
  salonName: z.string().trim().min(2).max(80),
  ownerName: z.string().trim().min(2).max(80),
  ownerPhone: phoneSchema,
  addressLine: z.string().trim().max(200).optional(),
  city: z.string().trim().max(60).optional(),
  gstin: z.string().trim().length(15).optional(),
  openTime: clockSchema.default('10:00'),
  closeTime: clockSchema.default('21:00'),
  slotMinutes: z.number().int().min(5).max(60).default(30),
  services: z.array(serviceInputSchema.omit({ salonId: true, categoryId: true })).min(1),
  staff: z.array(staffInputSchema.omit({ salonId: true })).min(1),
});
export type ProvisioningInput = z.infer<typeof provisioningSchema>;
