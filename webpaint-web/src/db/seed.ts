/**
 * Webpaint Portal — Database seed
 * ---------------------------------------------------------------------------
 * Populates the database with realistic demo data for a web agency / freelancer
 * portal: users, clients, websites, projects, tasks, invoices, invoice items,
 * payments, subscriptions, notes and activity logs.
 *
 * Run it:
 *   npx tsx src/db/seed.ts          (requires DATABASE_URL in .env)
 *
 * Notes:
 * - The data is defined as plain typed objects (`*Seed` arrays) and kept
 *   separate from the insert logic, so it is easy to reuse with Prisma
 *   (`prisma.user.createMany({ data: userSeed })`) or any other ORM.
 * - Explicit integer ids are used everywhere so relationships stay consistent
 *   and the seed is fully deterministic / re-runnable.
 * - Money is stored as strings to match the `numeric` columns in the schema.
 * - All dates are ISO strings (date columns) or `Date` objects (timestamps).
 */

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";
import {
  users,
  clients,
  websites,
  projects,
  tasks,
  invoices,
  invoiceItems,
  payments,
  subscriptions,
  notes,
  activityLogs,
  type NewUser,
  type NewClient,
  type NewWebsite,
  type NewProject,
  type NewTask,
  type NewInvoice,
  type NewInvoiceItem,
  type NewPayment,
  type NewSubscription,
  type NewNote,
  type NewActivityLog,
} from "./schema";

/* -------------------------------------------------------------------------- */
/* Constants & helpers                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Placeholder bcrypt-format hash shared by every demo user.
 * Generate real hashes with `bcrypt.hash(password, 10)` — never ship this.
 */
const DEMO_PASSWORD_HASH =
  "$2b$10$Q9XvK8s2dF1nB7mWcE0oUu3jJ5hL6pR4tA8yZ1xC2vN3bM7kS9wG";

/** Standard Bulgarian / EU VAT rate. */
const VAT_RATE = 0.2;

/** Format a number as a 2-decimal money string (e.g. 1800 -> "1800.00"). */
const money = (value: number): string => value.toFixed(2);

/* -------------------------------------------------------------------------- */
/* Users — 3 portal accounts: admin, manager, client                          */
/* -------------------------------------------------------------------------- */

const userSeed: NewUser[] = [
  {
    id: 1,
    name: "Petar Dimitrov",
    email: "petar@webpaint.bg",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "admin",
  },
  {
    id: 2,
    name: "Maria Ivanova",
    email: "maria@webpaint.bg",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "manager",
  },
  {
    // Client-portal login — owner of clients-table row #2.
    id: 3,
    name: "Georgi Stoyanov",
    email: "georgi@stoyanovdesign.bg",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "client",
    clientId: 2,
  },
];

/* -------------------------------------------------------------------------- */
/* Clients — 5 realistic Bulgarian / European businesses                      */
/* -------------------------------------------------------------------------- */

const clientSeed: NewClient[] = [
  {
    id: 1,
    name: "Elena Koleva",
    companyName: "Sladko Sofia EOOD",
    email: "office@sladkosofia.bg",
    phone: "+359 2 987 1234",
    address: "ul. Graf Ignatiev 24, 1000 Sofia, Bulgaria",
    vatNumber: "BG203451789",
  },
  {
    id: 2,
    name: "Georgi Stoyanov",
    companyName: "Stoyanov Design Studio",
    email: "georgi@stoyanovdesign.bg",
    phone: "+359 32 451 220",
    address: "bul. Bulgaria 56, 4000 Plovdiv, Bulgaria",
    vatNumber: "BG201998442",
  },
  {
    id: 3,
    name: "Dimitar Petrov",
    companyName: "TechNova Solutions OOD",
    email: "contact@technova.bg",
    phone: "+359 2 415 7788",
    address: "ul. Tsarigradsko shose 115, 1784 Sofia, Bulgaria",
    vatNumber: "BG204512330",
  },
  {
    id: 4,
    name: "Yana Georgieva",
    companyName: "Alpina Travel Agency",
    email: "hello@alpinatravel.bg",
    phone: "+359 52 600 410",
    address: "bul. Slivnitsa 12, 9000 Varna, Bulgaria",
    vatNumber: "BG202776105",
  },
  {
    id: 5,
    name: "Lukas Becker",
    companyName: "Berlin Fitness GmbH",
    email: "info@berlinfitness.de",
    phone: "+49 30 5544 1200",
    address: "Friedrichstrasse 88, 10117 Berlin, Germany",
    vatNumber: "DE318240551",
  },
];

/* -------------------------------------------------------------------------- */
/* Websites — each client owns 1–3 websites                                   */
/* -------------------------------------------------------------------------- */

const websiteSeed: NewWebsite[] = [
  // Client 1 — Sladko Sofia (2 sites)
  {
    id: 1,
    clientId: 1,
    name: "Sladko Sofia Online Shop",
    url: "https://shop.sladkosofia.bg",
    platform: "wordpress",
    status: "active",
    hostingProvider: "SiteGround",
    notes: "WooCommerce store selling cakes and pastries.",
  },
  {
    id: 2,
    clientId: 1,
    name: "Sladko Sofia Catering Microsite",
    url: "https://catering.sladkosofia.bg",
    platform: "wordpress",
    status: "active",
    hostingProvider: "SiteGround",
    notes: "Landing page for the corporate catering service.",
  },
  // Client 2 — Stoyanov Design Studio (2 sites)
  {
    id: 3,
    clientId: 2,
    name: "Stoyanov Design Portfolio",
    url: "https://stoyanovdesign.bg",
    platform: "custom",
    status: "maintenance",
    hostingProvider: "Vercel",
    notes: "Next.js portfolio, currently being rebuilt.",
  },
  {
    id: 4,
    clientId: 2,
    name: "Stoyanov Design Blog",
    url: "https://blog.stoyanovdesign.bg",
    platform: "wordpress",
    status: "active",
    hostingProvider: "Vercel",
    notes: "Headless WordPress used as a content source.",
  },
  // Client 3 — TechNova Solutions (3 sites)
  {
    id: 5,
    clientId: 3,
    name: "TechNova Corporate Site",
    url: "https://technova.bg",
    platform: "custom",
    status: "active",
    hostingProvider: "AWS",
    notes: "Main corporate website.",
  },
  {
    id: 6,
    clientId: 3,
    name: "TechNova Product Landing",
    url: "https://app.technova.bg",
    platform: "custom",
    status: "active",
    hostingProvider: "AWS",
    notes: "Marketing landing page for the SaaS product.",
  },
  {
    id: 7,
    clientId: 3,
    name: "TechNova Docs",
    url: "https://docs.technova.bg",
    platform: "other",
    status: "active",
    hostingProvider: "Netlify",
    notes: "Static documentation site (Docusaurus).",
  },
  // Client 4 — Alpina Travel Agency (2 sites)
  {
    id: 8,
    clientId: 4,
    name: "Alpina Travel Main",
    url: "https://alpinatravel.bg",
    platform: "wordpress",
    status: "active",
    hostingProvider: "SuperHosting.BG",
    notes: "Main agency website with tour catalog.",
  },
  {
    id: 9,
    clientId: 4,
    name: "Alpina Travel Booking",
    url: "https://book.alpinatravel.bg",
    platform: "custom",
    status: "maintenance",
    hostingProvider: "SuperHosting.BG",
    notes: "Booking portal — integration work in progress.",
  },
  // Client 5 — Berlin Fitness GmbH (1 site)
  {
    id: 10,
    clientId: 5,
    name: "Berlin Fitness Website",
    url: "https://berlinfitness.de",
    platform: "shopify",
    status: "active",
    hostingProvider: "Shopify",
    notes: "Shopify store for memberships and merchandise.",
  },
];

/* -------------------------------------------------------------------------- */
/* Projects — connected to clients and (optionally) websites                  */
/* -------------------------------------------------------------------------- */

const projectSeed: NewProject[] = [
  {
    id: 1,
    clientId: 1,
    websiteId: 1,
    name: "Online Shop Redesign 2026",
    description: "Full visual redesign and checkout overhaul for the shop.",
    status: "completed",
    startDate: "2025-11-01",
    endDate: "2026-02-05",
  },
  {
    id: 2,
    clientId: 1,
    websiteId: 2,
    name: "Catering Microsite Launch",
    description: "Build and launch a dedicated catering landing page.",
    status: "completed",
    startDate: "2026-01-15",
    endDate: "2026-03-10",
  },
  {
    id: 3,
    clientId: 2,
    websiteId: 3,
    name: "Portfolio Site Rebuild",
    description: "Rebuild the portfolio on Next.js with a CMS-driven gallery.",
    status: "active",
    startDate: "2026-04-10",
    endDate: null,
  },
  {
    id: 4,
    clientId: 3,
    websiteId: 6,
    name: "Product Landing Page Launch",
    description: "Design and ship a high-converting SaaS landing page.",
    status: "active",
    startDate: "2026-03-01",
    endDate: null,
  },
  {
    id: 5,
    clientId: 4,
    websiteId: 9,
    name: "Booking System Integration",
    description: "Integrate a third-party booking API into the travel portal.",
    status: "planning",
    startDate: null,
    endDate: null,
  },
  {
    id: 6,
    clientId: 5,
    websiteId: 10,
    name: "Shopify Store Setup",
    description: "Set up the Shopify store, theme and payment providers.",
    status: "active",
    startDate: "2026-04-20",
    endDate: null,
  },
];

/* -------------------------------------------------------------------------- */
/* Tasks — cover every status: todo / in_progress / review / completed        */
/* -------------------------------------------------------------------------- */

const taskSeed: NewTask[] = [
  // Project 1 — Online Shop Redesign (completed)
  {
    id: 1,
    projectId: 1,
    clientId: 1,
    websiteId: 1,
    assignedToUserId: 2,
    title: "Migrate product catalog",
    description: "Move all products and categories into the new theme.",
    status: "completed",
    priority: "high",
    dueDate: "2026-01-10",
  },
  {
    id: 2,
    projectId: 1,
    clientId: 1,
    websiteId: 1,
    assignedToUserId: 1,
    title: "Configure payment gateway",
    description: "Set up and test the Stripe + card payment flow.",
    status: "completed",
    priority: "urgent",
    dueDate: "2026-01-25",
  },
  // Project 2 — Catering Microsite (completed)
  {
    id: 3,
    projectId: 2,
    clientId: 1,
    websiteId: 2,
    assignedToUserId: 2,
    title: "Launch catering microsite",
    description: "Final QA and go-live for the catering landing page.",
    status: "completed",
    priority: "medium",
    dueDate: "2026-03-08",
  },
  // Project 3 — Portfolio Site Rebuild (active)
  {
    id: 4,
    projectId: 3,
    clientId: 2,
    websiteId: 3,
    assignedToUserId: 2,
    title: "Design new homepage layout",
    description: "Produce the homepage design based on the approved moodboard.",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-05-30",
  },
  {
    id: 5,
    projectId: 3,
    clientId: 2,
    websiteId: 3,
    assignedToUserId: 2,
    title: "Build project gallery component",
    description: "CMS-driven gallery with filtering by category.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-06-12",
  },
  {
    id: 6,
    projectId: 3,
    clientId: 2,
    websiteId: 3,
    assignedToUserId: 1,
    title: "Set up contact form",
    description: "Contact form with spam protection and email notifications.",
    status: "review",
    priority: "low",
    dueDate: "2026-05-24",
  },
  // Project 4 — Product Landing Page Launch (active)
  {
    id: 7,
    projectId: 4,
    clientId: 3,
    websiteId: 6,
    assignedToUserId: 2,
    title: "Write landing page copy",
    description: "Draft hero, features and pricing copy for review.",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-05-27",
  },
  {
    id: 8,
    projectId: 4,
    clientId: 3,
    websiteId: 6,
    assignedToUserId: 1,
    title: "Implement A/B test variants",
    description: "Two hero variants wired up to the analytics tool.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-06-05",
  },
  // Project 5 — Booking System Integration (planning)
  {
    id: 9,
    projectId: 5,
    clientId: 4,
    websiteId: 9,
    assignedToUserId: 1,
    title: "Research booking API providers",
    description: "Compare booking APIs on price, coverage and reliability.",
    status: "todo",
    priority: "high",
    dueDate: "2026-06-02",
  },
  {
    id: 10,
    projectId: 5,
    clientId: 4,
    websiteId: 9,
    assignedToUserId: 2,
    title: "Draft integration spec",
    description: "Technical spec for the booking API integration.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-06-09",
  },
  // Project 6 — Shopify Store Setup (active)
  {
    id: 11,
    projectId: 6,
    clientId: 5,
    websiteId: 10,
    assignedToUserId: 2,
    title: "Import product inventory",
    description: "Import memberships and merchandise into Shopify.",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-05-28",
  },
  {
    id: 12,
    projectId: 6,
    clientId: 5,
    websiteId: 10,
    assignedToUserId: 1,
    title: "Configure shipping zones",
    description: "Set up EU and UK shipping zones with rates.",
    status: "review",
    priority: "medium",
    dueDate: "2026-05-26",
  },
  // Standalone maintenance tasks — not tied to a project
  {
    id: 13,
    projectId: null,
    clientId: 3,
    websiteId: 5,
    assignedToUserId: 1,
    title: "Fix expiring SSL certificate",
    description: "Renew and re-deploy the SSL certificate before expiry.",
    status: "completed",
    priority: "urgent",
    dueDate: "2026-05-05",
  },
  {
    id: 14,
    projectId: null,
    clientId: 4,
    websiteId: 8,
    assignedToUserId: 2,
    title: "Update WordPress plugins",
    description: "Monthly plugin and core update with a backup beforehand.",
    status: "in_progress",
    priority: "low",
    dueDate: "2026-05-25",
  },
];

/* -------------------------------------------------------------------------- */
/* Invoices & invoice items                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Invoice line items defined first — invoice subtotals/taxes/totals are
 * derived from these below so the numbers always stay consistent.
 */
const invoiceItemSeed: NewInvoiceItem[] = [
  // Invoice 1 — Sladko Sofia, paid
  {
    id: 1,
    invoiceId: 1,
    description: "Online shop redesign — design phase",
    quantity: "1",
    unitPrice: money(1800),
    total: money(1800),
  },
  {
    id: 2,
    invoiceId: 1,
    description: "Online shop redesign — development phase",
    quantity: "1",
    unitPrice: money(2400),
    total: money(2400),
  },
  // Invoice 2 — TechNova Solutions, paid
  {
    id: 3,
    invoiceId: 2,
    description: "Product landing page — design",
    quantity: "1",
    unitPrice: money(1200),
    total: money(1200),
  },
  {
    id: 4,
    invoiceId: 2,
    description: "Product landing page — development",
    quantity: "1",
    unitPrice: money(1600),
    total: money(1600),
  },
  // Invoice 3 — Stoyanov Design Studio, sent
  {
    id: 5,
    invoiceId: 3,
    description: "Portfolio site rebuild — milestone 1",
    quantity: "1",
    unitPrice: money(2000),
    total: money(2000),
  },
  // Invoice 4 — Alpina Travel Agency, overdue
  {
    id: 6,
    invoiceId: 4,
    description: "Booking system discovery & technical spec",
    quantity: "1",
    unitPrice: money(900),
    total: money(900),
  },
  {
    id: 7,
    invoiceId: 4,
    description: "UX consultation (hours)",
    quantity: "4",
    unitPrice: money(80),
    total: money(320),
  },
  // Invoice 5 — Berlin Fitness GmbH, draft
  {
    id: 8,
    invoiceId: 5,
    description: "Shopify store setup",
    quantity: "1",
    unitPrice: money(1500),
    total: money(1500),
  },
  {
    id: 9,
    invoiceId: 5,
    description: "Theme customization",
    quantity: "1",
    unitPrice: money(700),
    total: money(700),
  },
  // Invoice 6 — Berlin Fitness GmbH, paid
  {
    id: 10,
    invoiceId: 6,
    description: "Website maintenance — April 2026",
    quantity: "1",
    unitPrice: money(120),
    total: money(120),
  },
];

/** Base invoice details — financial totals are computed from the line items. */
const invoiceBase = [
  {
    id: 1,
    clientId: 1,
    invoiceNumber: "INV-2026-001",
    status: "paid" as const,
    currency: "BGN" as const,
    issuedAt: "2026-02-10",
    dueAt: "2026-02-24",
  },
  {
    id: 2,
    clientId: 3,
    invoiceNumber: "INV-2026-002",
    status: "paid" as const,
    currency: "BGN" as const,
    issuedAt: "2026-03-15",
    dueAt: "2026-03-29",
  },
  {
    id: 3,
    clientId: 2,
    invoiceNumber: "INV-2026-003",
    status: "sent" as const,
    currency: "BGN" as const,
    issuedAt: "2026-05-05",
    dueAt: "2026-05-19",
  },
  {
    id: 4,
    clientId: 4,
    invoiceNumber: "INV-2026-004",
    status: "overdue" as const,
    currency: "BGN" as const,
    issuedAt: "2026-04-01",
    dueAt: "2026-04-15",
  },
  {
    id: 5,
    clientId: 5,
    invoiceNumber: "INV-2026-005",
    status: "draft" as const,
    currency: "EUR" as const,
    issuedAt: null,
    dueAt: null,
  },
  {
    id: 6,
    clientId: 5,
    invoiceNumber: "INV-2026-006",
    status: "paid" as const,
    currency: "EUR" as const,
    issuedAt: "2026-05-01",
    dueAt: "2026-05-15",
  },
];

/** Derive subtotal / VAT / total for each invoice from its line items. */
const invoiceSeed: NewInvoice[] = invoiceBase.map((invoice) => {
  const subtotal = invoiceItemSeed
    .filter((item) => item.invoiceId === invoice.id)
    .reduce((sum, item) => sum + Number(item.total), 0);
  const taxTotal = subtotal * VAT_RATE;

  return {
    ...invoice,
    subtotal: money(subtotal),
    taxTotal: money(taxTotal),
    total: money(subtotal + taxTotal),
  };
});

/* -------------------------------------------------------------------------- */
/* Payments — one per paid invoice (invoices 1, 2 and 6)                       */
/* -------------------------------------------------------------------------- */

const paymentSeed: NewPayment[] = [
  {
    id: 1,
    invoiceId: 1,
    clientId: 1,
    amount: money(5040), // 4200 + 20% VAT
    currency: "BGN",
    status: "paid",
    paymentMethod: "bank_transfer",
    paidAt: new Date("2026-02-20T11:30:00Z"),
  },
  {
    id: 2,
    invoiceId: 2,
    clientId: 3,
    amount: money(3360), // 2800 + 20% VAT
    currency: "BGN",
    status: "paid",
    paymentMethod: "card",
    paidAt: new Date("2026-03-22T09:15:00Z"),
  },
  {
    id: 3,
    invoiceId: 6,
    clientId: 5,
    amount: money(144), // 120 + 20% VAT
    currency: "EUR",
    status: "paid",
    paymentMethod: "stripe",
    paidAt: new Date("2026-05-12T14:45:00Z"),
  },
];

/* -------------------------------------------------------------------------- */
/* Subscriptions — recurring website maintenance plans                        */
/* -------------------------------------------------------------------------- */

const subscriptionSeed: NewSubscription[] = [
  {
    id: 1,
    clientId: 1,
    websiteId: 1,
    name: "Standard Maintenance Plan",
    amount: money(79),
    currency: "BGN",
    billingCycle: "monthly",
    status: "active",
    nextBillingDate: "2026-06-01",
  },
  {
    id: 2,
    clientId: 2,
    websiteId: 3,
    name: "Care Plan — Portfolio",
    amount: money(49),
    currency: "BGN",
    billingCycle: "monthly",
    status: "active",
    nextBillingDate: "2026-06-05",
  },
  {
    id: 3,
    clientId: 3,
    websiteId: 5,
    name: "Premium Maintenance Plan",
    amount: money(149),
    currency: "BGN",
    billingCycle: "monthly",
    status: "active",
    nextBillingDate: "2026-06-10",
  },
  {
    id: 4,
    clientId: 4,
    websiteId: 8,
    name: "Basic Maintenance Plan",
    amount: money(39),
    currency: "BGN",
    billingCycle: "monthly",
    status: "paused",
    nextBillingDate: null,
  },
  {
    id: 5,
    clientId: 5,
    websiteId: 10,
    name: "Maintenance & SEO Retainer",
    amount: money(1200),
    currency: "EUR",
    billingCycle: "yearly",
    status: "active",
    nextBillingDate: "2027-04-20",
  },
];

/* -------------------------------------------------------------------------- */
/* Notes — attached to clients, projects, websites and tasks                  */
/* -------------------------------------------------------------------------- */

const noteSeed: NewNote[] = [
  {
    id: 1,
    clientId: 1,
    userId: 2,
    content: "Client prefers communication by email and replies within a day.",
  },
  {
    id: 2,
    clientId: 3,
    userId: 1,
    content: "Dimitar is the main technical contact for all TechNova sites.",
  },
  {
    id: 3,
    clientId: 5,
    userId: 2,
    content: "All invoices for Berlin Fitness must be issued in EUR.",
  },
  {
    id: 4,
    projectId: 3,
    userId: 2,
    content: "Client approved the homepage moodboard on 2026-04-18.",
  },
  {
    id: 5,
    projectId: 5,
    userId: 2,
    content: "Budget not yet confirmed — hold development work until sign-off.",
  },
  {
    id: 6,
    projectId: 1,
    userId: 2,
    content: "Project delivered and signed off by the client on 2026-02-05.",
  },
  {
    id: 7,
    websiteId: 5,
    userId: 1,
    content: "SSL certificate renewed — next expiry on 2027-05-04.",
  },
  {
    id: 8,
    websiteId: 10,
    userId: 1,
    content: "Shopify plan upgraded to 'Basic' to enable abandoned-cart emails.",
  },
  {
    id: 9,
    taskId: 4,
    userId: 2,
    content: "Waiting on the final logo assets from the client.",
  },
  {
    id: 10,
    taskId: 12,
    userId: 1,
    content: "Shipping zones must cover the EU and the UK.",
  },
];

/* -------------------------------------------------------------------------- */
/* Activity logs — common audit-trail actions                                 */
/* -------------------------------------------------------------------------- */

const activityLogSeed: NewActivityLog[] = [
  {
    userId: 1,
    clientId: 1,
    action: "created_client",
    entityType: "client",
    entityId: 1,
    createdAt: new Date("2025-10-28T08:05:00Z"),
  },
  {
    userId: 2,
    clientId: 1,
    action: "created_website",
    entityType: "website",
    entityId: 1,
    createdAt: new Date("2025-10-29T10:20:00Z"),
  },
  {
    userId: 1,
    clientId: 3,
    action: "created_project",
    entityType: "project",
    entityId: 4,
    createdAt: new Date("2026-03-01T09:00:00Z"),
  },
  {
    userId: 2,
    clientId: 1,
    action: "completed_task",
    entityType: "task",
    entityId: 1,
    createdAt: new Date("2026-01-09T16:40:00Z"),
  },
  {
    userId: 1,
    clientId: 1,
    action: "sent_invoice",
    entityType: "invoice",
    entityId: 1,
    createdAt: new Date("2026-02-10T12:00:00Z"),
  },
  {
    userId: 1,
    clientId: 1,
    action: "recorded_payment",
    entityType: "payment",
    entityId: 1,
    createdAt: new Date("2026-02-20T11:32:00Z"),
  },
  {
    userId: 2,
    clientId: 2,
    action: "updated_task",
    entityType: "task",
    entityId: 4,
    createdAt: new Date("2026-05-18T13:10:00Z"),
  },
  {
    userId: 1,
    clientId: 4,
    action: "created_invoice",
    entityType: "invoice",
    entityId: 4,
    createdAt: new Date("2026-04-01T09:45:00Z"),
  },
  {
    userId: 1,
    clientId: 4,
    action: "marked_invoice_overdue",
    entityType: "invoice",
    entityId: 4,
    createdAt: new Date("2026-04-16T07:00:00Z"),
  },
  {
    userId: 2,
    clientId: 5,
    action: "created_subscription",
    entityType: "subscription",
    entityId: 5,
    createdAt: new Date("2026-04-20T15:25:00Z"),
  },
  {
    userId: 3,
    clientId: 2,
    action: "logged_in",
    entityType: "user",
    entityId: 3,
    createdAt: new Date("2026-05-21T18:02:00Z"),
  },
  {
    userId: 2,
    clientId: 3,
    action: "added_note",
    entityType: "note",
    entityId: 2,
    createdAt: new Date("2026-05-22T08:30:00Z"),
  },
];

/* -------------------------------------------------------------------------- */
/* Seed runner                                                                */
/* -------------------------------------------------------------------------- */

/** Tables in dependency order — children last (used for truncate & resync). */
const SEED_TABLES = [
  "users",
  "clients",
  "websites",
  "projects",
  "tasks",
  "invoices",
  "invoice_items",
  "payments",
  "subscriptions",
  "notes",
  "activity_logs",
] as const;

async function seed(): Promise<void> {
  console.log("🌱 Seeding Webpaint Portal database...");

  // 1. Wipe existing data and reset identity sequences.
  console.log("   • Clearing existing data");
  await db.execute(
    sql.raw(
      `TRUNCATE TABLE ${SEED_TABLES.join(", ")} RESTART IDENTITY CASCADE;`,
    ),
  );

  // 2. Insert rows in dependency order so foreign keys resolve.
  //    Clients must come before users because users.client_id now
  //    references clients.id for client-role portal accounts.
  console.log("   • Inserting clients");
  await db.insert(clients).values(clientSeed);

  console.log("   • Inserting users");
  await db.insert(users).values(userSeed);

  console.log("   • Inserting websites");
  await db.insert(websites).values(websiteSeed);

  console.log("   • Inserting projects");
  await db.insert(projects).values(projectSeed);

  console.log("   • Inserting tasks");
  await db.insert(tasks).values(taskSeed);

  console.log("   • Inserting invoices");
  await db.insert(invoices).values(invoiceSeed);

  console.log("   • Inserting invoice items");
  await db.insert(invoiceItems).values(invoiceItemSeed);

  console.log("   • Inserting payments");
  await db.insert(payments).values(paymentSeed);

  console.log("   • Inserting subscriptions");
  await db.insert(subscriptions).values(subscriptionSeed);

  console.log("   • Inserting notes");
  await db.insert(notes).values(noteSeed);

  console.log("   • Inserting activity logs");
  await db.insert(activityLogs).values(activityLogSeed);

  // 3. Re-sync serial sequences past the explicit ids we inserted, so future
  //    application inserts do not collide with seeded ids.
  console.log("   • Re-syncing id sequences");
  for (const table of SEED_TABLES) {
    await db.execute(
      sql.raw(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'),
           GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1));`,
      ),
    );
  }

  console.log("✅ Seed complete:");
  console.log(
    `   ${userSeed.length} users · ${clientSeed.length} clients · ` +
      `${websiteSeed.length} websites · ${projectSeed.length} projects · ` +
      `${taskSeed.length} tasks`,
  );
  console.log(
    `   ${invoiceSeed.length} invoices · ${invoiceItemSeed.length} invoice items · ` +
      `${paymentSeed.length} payments · ${subscriptionSeed.length} subscriptions · ` +
      `${noteSeed.length} notes · ${activityLogSeed.length} activity logs`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
