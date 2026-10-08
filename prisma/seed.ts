import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bags = await prisma.category.upsert({ where: { slug: "bags" }, update: { name: "Bags" }, create: { name: "Bags", slug: "bags" } });
  const sandals = await prisma.category.upsert({ where: { slug: "sandals" }, update: { name: "Sandals" }, create: { name: "Sandals", slug: "sandals" } });
  const samples = [
    {
      name: "Sample Everyday Tote",
      slug: "sample-everyday-tote",
      description: "SAMPLE PRODUCT — A roomy everyday tote for days that call for a little more. Replace this text and image with your real product details before opening your store.",
      priceKobo: 1850000, stock: 12, categoryId: bags.id,
      imageUrls: ["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80"],
    },
    {
      name: "Sample Evening Clutch",
      slug: "sample-evening-clutch",
      description: "SAMPLE PRODUCT — A compact clutch for celebrations and special evenings. Replace this sample copy, photo, stock, and price with your real product details.",
      priceKobo: 1250000, stock: 8, categoryId: bags.id,
      imageUrls: ["https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1000&q=80"],
    },
    {
      name: "Sample Leather Slides",
      slug: "sample-leather-slides",
      description: "SAMPLE PRODUCT — Easy slides for relaxed days. Replace this sample description and photograph with accurate details about your real stock before accepting orders.",
      priceKobo: 950000, stock: 16, categoryId: sandals.id,
      imageUrls: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80"],
    },
    {
      name: "Sample Weekend Sandals",
      slug: "sample-weekend-sandals",
      description: "SAMPLE PRODUCT — A versatile warm-weather sandal. This is illustrative seed content only; replace the images, price, description, and quantity before launch.",
      priceKobo: 1150000, stock: 10, categoryId: sandals.id,
      imageUrls: ["https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=1000&q=80"],
    },
  ];
  for (const sample of samples) {
    const { categoryId, ...data } = sample;
    await prisma.product.upsert({
      where: { slug: sample.slug },
      update: { ...data, categoryId, sample: true },
      create: { ...data, categoryId, sample: true, active: true },
    });
  }
  console.info("Seeded Bags and Sandals categories with four clearly labelled sample products.");
}

main().catch((error: unknown) => {
  console.error("Database seed failed", error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
