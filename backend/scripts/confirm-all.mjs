import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  // Confirm intern
  let user = await prisma.user.findUnique({ where: { email: 'testuser@example.com' } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, verifiedAt: user.verifiedAt || new Date() }
    });
    console.log('✅ Intern confirmed:', user.email);
  } else {
    console.log('❌ Intern not found');
  }

  // Confirm admin
  user = await prisma.user.findUnique({ where: { email: 'admin@practice.com' } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, verifiedAt: user.verifiedAt || new Date() }
    });
    console.log('✅ Admin confirmed:', user.email);
  } else {
    console.log('❌ Admin not found');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});