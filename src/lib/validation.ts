import { z } from "zod";

export const emailSchema = z.string().trim().email().max(254).transform((email) => email.toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  phone: z.string().trim().min(7).max(24),
  password: z.string().min(12).max(128),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const verificationSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code sent to your email."),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(24),
});

export const complaintSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  phone: z.string().trim().min(7).max(24),
  message: z.string().trim().min(10).max(5000),
});

export const complaintStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(30),
  fullName: z.string().trim().min(2).max(100),
  email: emailSchema,
  phone: z.string().trim().min(7).max(24),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  deliveryInformation: z.string().trim().max(500).optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(5000),
  priceNaira: z.number().finite().positive().max(20000000),
  stock: z.number().int().min(0).max(100000),
  active: z.boolean(),
  categorySlug: z.enum(["bags", "sandals"]),
  imageUrls: z.array(z.string().url().max(2048).refine((value) => new URL(value).protocol === "https:", "Product images must use HTTPS.")).max(8).default([]),
});
