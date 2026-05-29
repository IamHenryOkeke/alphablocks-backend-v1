import { PaymentStatus } from "../generated/prisma/enums";
import prisma from "../lib/prisma";
import { redis } from "../lib/redis";

type Range = "7d" | "30d" | "90d" | "all";

const CACHE_TTL = {
  "7d": 60,
  "30d": 5 * 60,
  "90d": 10 * 60,
  all: 15 * 60,
};

const cacheKey = (range: Range) => `overview:${range}`;

function rangeToDate(range: Range): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const koboToNaira = (kobo: number) => kobo / 100;

export type OverviewResult = Awaited<ReturnType<typeof computeOverview>>;

export const getOverview = async (range: Range) => {
  const cached = await redis.get(cacheKey(range));
  if (cached) return JSON.parse(cached);

  const data = await computeOverview(range);

  await redis.set(cacheKey(range), JSON.stringify(data), {
    EX: CACHE_TTL[range],
  });

  return data;
};

async function computeOverview(range: Range) {
  const since = rangeToDate(range);
  const sinceFilter = since ? { gte: since } : undefined;
  const notDeleted = { deletedAt: null };

  const [
    totalUsers,
    newUsersInRange,
    verifiedUsers,
    activeCohorts,
    activeCohortParticipants,
    eventsCount,
    blogPostsCount,
    cohortsCount,
    draftEvents,
    draftBlogPosts,
    draftCohorts,
    ticketsByStatus,
    revenueAggregate,
    topCohorts,
    growthSeries,
    recentActivity,
    referralRaw,
  ] = await Promise.all([
    // --- Users ---
    prisma.user.count({ where: notDeleted }),

    prisma.user.count({
      where: {
        ...notDeleted,
        ...(sinceFilter && { createdAt: sinceFilter }),
      },
    }),

    prisma.user.count({
      where: { ...notDeleted, isVerified: true },
    }),

    prisma.cohort.count({
      where: {
        ...notDeleted,
        isPublished: true,
        endDate: { gte: new Date() },
      },
    }),

    prisma.participant.count({
      where: {
        deletedAt: null,
        cohort: {
          ...notDeleted,
          isPublished: true,
          endDate: { gte: new Date() },
        },
      },
    }),

    // --- Content totals (within range when applicable) ---
    prisma.event.count({
      where: {
        ...notDeleted,
        isPublished: true,
        ...(sinceFilter && { publishedAt: sinceFilter }),
      },
    }),

    prisma.blogPost.count({
      where: {
        ...notDeleted,
        isPublished: true,
        ...(sinceFilter && { publishedAt: sinceFilter }),
      },
    }),

    prisma.cohort.count({
      where: {
        ...notDeleted,
        isPublished: true,
        ...(sinceFilter && { publishedAt: sinceFilter }),
      },
    }),

    // --- Drafts ---
    prisma.event.count({
      where: { ...notDeleted, isPublished: false },
    }),

    prisma.blogPost.count({
      where: { ...notDeleted, isPublished: false },
    }),

    prisma.cohort.count({
      where: { ...notDeleted, isPublished: false },
    }),

    // --- Tickets grouped by payment status ---
    prisma.cohortTicket.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: sinceFilter ? { createdAt: sinceFilter } : undefined,
    }),

    // --- Revenue (only completed payments). Amounts are kobo. ---
    prisma.cohortTicket.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        ...(sinceFilter && { createdAt: sinceFilter }),
      },
      select: { amount: true, cohortId: true },
    }),

    // --- Top cohorts ---
    prisma.cohort.findMany({
      where: { ...notDeleted },
      select: {
        id: true,
        title: true,
        cohortTickets: {
          where: {
            status: PaymentStatus.COMPLETED,
            ...(sinceFilter && { createdAt: sinceFilter }),
          },
          select: { amount: true },
        },
      },
    }),

    // --- 6-month user growth series (always 6 months, ignores range) ---
    getMonthlyUserGrowth(),

    // --- Recent activity ---
    getRecentActivity(),

    // --- Referral mode breakdown (all-time, not deleted) ---
    prisma.user.groupBy({
      by: ["referralMode"],
      where: notDeleted,
      _count: { _all: true },
    }),
  ]);

  // Sum kobo, convert to naira at the boundary
  const totalRevenueKobo = revenueAggregate.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0,
  );
  const totalRevenue = koboToNaira(totalRevenueKobo);

  const topCohortsByRevenue = topCohorts
    .map((c) => {
      const revenueKobo = c.cohortTickets.reduce(
        (s, t) => s + Number(t.amount || 0),
        0,
      );
      return {
        id: c.id,
        title: c.title,
        revenue: koboToNaira(revenueKobo),
        ticketCount: c.cohortTickets.length,
      };
    })
    .filter((c) => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  const ticketStatusMap = ticketsByStatus.reduce(
    (acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    },
    {} as Record<PaymentStatus, number>,
  );

  const tickets = {
    total:
      (ticketStatusMap.COMPLETED || 0) +
      (ticketStatusMap.PENDING || 0) +
      (ticketStatusMap.FAILED || 0),
    completed: ticketStatusMap.COMPLETED || 0,
    pending: ticketStatusMap.PENDING || 0,
    failed: ticketStatusMap.FAILED || 0,
  };

  // --- Referral breakdown ---
  // Normalize: trim, title-case for display, merge null/empty into "Unknown".
  // Different casing of the same source (e.g. "twitter", "Twitter") gets merged.
  const referralCounts = new Map<string, number>();
  for (const row of referralRaw) {
    const raw = row.referralMode?.trim();
    const key = raw && raw.length > 0 ? toTitleCase(raw) : "Unknown";
    referralCounts.set(key, (referralCounts.get(key) || 0) + row._count._all);
  }

  const referralBreakdown = Array.from(referralCounts.entries())
    .map(([mode, count]) => ({
      mode,
      count,
      percentage: totalUsers === 0 ? 0 : count / totalUsers,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    users: {
      total: totalUsers,
      newInRange: newUsersInRange,
      verified: verifiedUsers,
      verifiedRatio: totalUsers === 0 ? 0 : verifiedUsers / totalUsers,
    },
    cohorts: {
      active: activeCohorts,
      activeParticipants: activeCohortParticipants,
    },
    content: {
      events: eventsCount,
      blogPosts: blogPostsCount,
      cohorts: cohortsCount,
      draftsPending: draftEvents + draftBlogPosts + draftCohorts,
    },
    revenue: {
      total: totalRevenue,
      currency: "NGN",
    },
    tickets,
    topCohortsByRevenue,
    growthSeries,
    recentActivity,
    referralBreakdown,
  };
}

// --- Helpers ---

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function getMonthlyUserGrowth() {
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({
      label: start.toLocaleString("en-US", { month: "short" }),
      start,
      end,
    });
  }

  const series = await Promise.all(
    months.map(async (m) => {
      const [total, verified] = await Promise.all([
        prisma.user.count({
          where: { deletedAt: null, createdAt: { lt: m.end } },
        }),
        prisma.user.count({
          where: {
            deletedAt: null,
            isVerified: true,
            createdAt: { lt: m.end },
          },
        }),
      ]);
      return { month: m.label, total, verified };
    }),
  );

  return series;
}

async function getRecentActivity() {
  const [newUsers, publishedPosts, completedTickets] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true, role: true },
    }),
    prisma.blogPost.findMany({
      where: { deletedAt: null, isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        author: { select: { name: true } },
      },
    }),
    prisma.cohortTicket.findMany({
      where: { status: PaymentStatus.COMPLETED },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        amount: true,
        updatedAt: true,
        cohort: { select: { title: true } },
        owner: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);

  type Activity = {
    type: "user_joined" | "blog_published" | "ticket_completed";
    id: string;
    timestamp: Date;
    text: string;
    meta?: Record<string, unknown>;
  };

  const activities: Activity[] = [
    ...newUsers.map<Activity>((u) => ({
      type: "user_joined",
      id: `user-${u.id}`,
      timestamp: u.createdAt,
      text: `${u.name} joined as ${u.role.toLowerCase()}`,
      meta: { role: u.role },
    })),
    ...publishedPosts
      .filter((p) => p.publishedAt)
      .map<Activity>((p) => ({
        type: "blog_published",
        id: `post-${p.id}`,
        timestamp: p.publishedAt!,
        text: `${p.author.name} published "${p.title}"`,
      })),
    ...completedTickets.map<Activity>((t) => ({
      type: "ticket_completed",
      id: `ticket-${t.id}`,
      timestamp: t.updatedAt,
      text: `${t.owner.user.name} registered for ${t.cohort.title}`,
      meta: { amount: koboToNaira(Number(t.amount)) },
    })),
  ];

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
}
