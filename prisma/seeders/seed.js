import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const whatsapp = await prisma.platform.upsert({
    where: { id: 1 },
    update: {
      name: "WhatsApp",
      slug: "whatsapp",
    },
    create: {
      name: "WhatsApp",
      slug: "whatsapp",
    },
  });
  console.log("Creating Whatsapp Platform Seed ...");
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
