import { hashPassword } from "../src/utils/hash";
import { Role } from "../src/generated/prisma/client";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  /**
   * USERS (5)
   */
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Admin User",
        role: Role.ADMIN,
        password: await hashPassword("Admin123!"),
        isVerified: true,
        country: "Nigeria",
      },
    }),
    prisma.user.create({
      data: {
        email: "superadmin@example.com",
        name: "Super Admin",
        role: Role.SUPERADMIN,
        password: await hashPassword("SuperAdmin123!"),
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "contributor1@example.com",
        name: "Contributor One",
        role: Role.CONTRIBUTOR,
        password: await hashPassword("Contributor123!"),
        careerPath: "Frontend Engineering",
        levelOfExperience: "Mid-level",
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "contributor2@example.com",
        name: "Contributor Two",
        role: Role.CONTRIBUTOR,
        password: await hashPassword("Contributor123!"),
        careerPath: "Backend Engineering",
        levelOfExperience: "Senior",
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "user@example.com",
        name: "Regular User",
        role: Role.USER,
        password: await hashPassword("User123!"),
        isVerified: false,
      },
    }),
  ]);

  const admin = users.find((u) => u.role === Role.ADMIN)!;
  const contributors = users.filter((u) => u.role === Role.CONTRIBUTOR);

  /**
   * EVENTS (5)
   */
  const eventsData = Array.from({ length: 5 }).map((_, index) => ({
    title: `Tech Event ${index + 1}`,
    slug: `tech-event-${index + 1}`,
    image: `https://example.com/events/event-${index + 1}.jpg`,
    description: "A tech-focused community event",
    details: "Networking, talks, and workshops",
    isPublished: true,
    publishedAt: new Date(),
    startDate: new Date(`2026-02-${index + 10}`),
    endDate: new Date(`2026-02-${index + 10}`),
    location: "Lagos, Nigeria",
    creatorId: admin.id,
    eventImages: {
      create: [
        {
          imageUrl: `https://example.com/events/event-${index + 1}-1.jpg`,
        },
        {
          imageUrl: `https://example.com/events/event-${index + 1}-2.jpg`,
        },
      ],
    },
  }));

  await prisma.event.createMany({
    data: eventsData.map(({ eventImages: _eventImages, ...event }) => event),
  });

  /**
   * BLOG POSTS (5)
   */
  for (let i = 1; i <= 5; i++) {
    await prisma.blogPost.create({
      data: {
        title: `Blog Post ${i}`,
        slug: `blog-post-${i}`,
        description: `Description for blog post ${i}`,
        thumbnailImage: `https://example.com/blogs/blog-${i}.jpg`,
        content: `
          <p>This is the content of blog post ${i}.</p>
          <p>It covers practical backend and frontend topics.</p>
        `,
        isPublished: true,
        publishedAt: new Date(),
        authorId: contributors[i % contributors.length].id,
      },
    });
  }

  console.log("✅ Seeding completed successfully");
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
