// scripts/create-admin.ts
import { authService } from '../src/services/auth.service.js';
import prisma from '../src/db/prisma.js';

async function createAdmin() {
  try {
    const email = 'admin@practice.com';
    const password = 'admin123456';

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Admin already exists');
      return;
    }

    const admin = await authService.createAdmin(email, password);
    console.log('Admin created successfully:', admin);
  } catch (error) {
    console.error('Failed to create admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();