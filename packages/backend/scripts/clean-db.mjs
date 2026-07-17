import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  await prisma.taskCard.deleteMany();
  await prisma.studentDocumentData.deleteMany();
  await prisma.surveyFieldValue.deleteMany();
  await prisma.application.deleteMany();
  await prisma.surveyField.deleteMany();
  await prisma.testTask.deleteMany();
  await prisma.cohortRole.deleteMany();
  await prisma.cohort.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleaned');
  await prisma.$disconnect();
}

main();