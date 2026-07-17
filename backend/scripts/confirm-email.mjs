import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'testuser@example.com' },
    data: { isEmailVerified: true, verifiedAt: new Date() }
  });
  console.log('Email confirmed for:', user.email, 'verified:', user.isEmailVerified);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});