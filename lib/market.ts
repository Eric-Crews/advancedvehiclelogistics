import { z } from 'zod';

export const city = z.string().trim().regex(/^[A-Za-z .'-]+, [A-Z]{2}$/, 'Use City, ST (for example, Asheville, NC).').max(100);
const contact = /(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|https?:\/\/|www\.|\b\d{1,6}\s+[\w.'-]+(?:\s+[\w.'-]+){0,3}\s+(?:st|street|rd|road|ave|avenue|blvd|drive|dr|lane|ln|way|ct|court)\b)/i;
const publicText = (min: number, max: number) => z.string().trim().min(min).max(max).refine(value => !contact.test(value), 'Keep contacts, links, and street addresses out of public details.');
export const listingSchema = z.object({
  title: publicText(5,100), description: publicText(20,1500),
  origin: city, destination: city, pickupDate: z.string().trim().min(4).max(40),
  equipment: publicText(3,100), handling: publicText(5,500),
  weightLbs: z.number().int().positive().max(200000).nullable(), lengthFt: z.number().positive().max(100).nullable(),
  offeredDollars: z.number().min(25).max(100000),
  shipperName: z.string().trim().min(2).max(100), shipperEmail: z.string().trim().email().max(200), shipperPhone: z.string().trim().max(35),
});
export const feeCents = () => {
  const cents = Number(process.env.AVL_LISTING_FEE_CENTS || '1900');
  return Number.isSafeInteger(cents) && cents >= 50 && cents <= 100000 ? cents : 1900;
};
export const publicListing = (row: Record<string, unknown>) => ({
  id: row.id, title: row.title, description: row.description, origin: row.origin, destination: row.destination,
  pickupDate: row.pickupDate, equipment: row.equipment, handling: row.handling, weightLbs: row.weightLbs,
  lengthFt: row.lengthFt, offeredCents: row.offeredCents, createdAt: row.createdAt, status: row.status,
});
