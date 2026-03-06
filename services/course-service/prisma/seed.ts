import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultGrades = [
  { name: 'first_preparatory' },
  { name: 'second_preparatory' },
  { name: 'third_preparatory' },
  { name: 'first_secondary' },
  { name: 'second_secondary' },
  { name: 'third_secondary' },
  { name: 'university' },
  { name: 'graduate' },
];

async function main() {
  console.log('🌱 Starting grade seeding...');

  for (const grade of defaultGrades) {
    try {
      const existingGrade = await prisma.grade.findUnique({
        where: { name: grade.name },
      });

      if (!existingGrade) {
        await prisma.grade.create({
          data: grade,
        });
        console.log(`✅ Created grade: ${grade.name}`);
      } else {
        console.log(`⏭️  Grade already exists: ${grade.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating grade ${grade.name}:`, error);
    }
  }

  console.log('🎉 Grade seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
