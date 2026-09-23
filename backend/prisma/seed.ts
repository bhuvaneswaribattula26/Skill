import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Use the IPv4-compatible Supabase session pooler for local development.
if (process.env.NODE_ENV === 'development' && process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();

const profiles = [
  {
    email: 'aarav.demo@skillswap.edu', name: 'Aarav Mehta', collegeName: 'IIT Bombay',
    bio: 'Full-stack developer who enjoys teaching Python and React.',
    teach: ['Python', 'React'], learn: ['UI/UX Design', 'Video Editing'],
  },
  {
    email: 'ishita.demo@skillswap.edu', name: 'Ishita Rao', collegeName: 'NIT Trichy',
    bio: 'Designer focused on thoughtful, accessible digital experiences.',
    teach: ['UI/UX Design', 'Figma'], learn: ['Python', 'Data Science'],
  },
  {
    email: 'sara.demo@skillswap.edu', name: 'Sara Iyer', collegeName: 'VIT Vellore',
    bio: 'Content creator and JavaScript learner, always ready to exchange skills.',
    teach: ['Video Editing', 'JavaScript'], learn: ['React', 'UI/UX Design'],
  },
] as const;

const categories: Record<string, string> = {
  Python: 'Programming', React: 'Programming', JavaScript: 'Programming',
  'UI/UX Design': 'Design', Figma: 'Design', 'Video Editing': 'Content',
  'Data Science': 'Data & AI',
};

async function main() {
  const passwordHash = await bcrypt.hash('DemoMemberOnly-2026', 12);
  for (const profile of profiles) {
    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: { name: profile.name, collegeName: profile.collegeName, bio: profile.bio, isVerified: true },
      create: {
        email: profile.email,
        name: profile.name,
        collegeName: profile.collegeName,
        bio: profile.bio,
        passwordHash,
        isVerified: true,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
      },
    });

    for (const name of profile.teach) {
      const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name, category: categories[name] || 'General' } });
      await prisma.userSkillTeach.upsert({
        where: { userId_skillId: { userId: user.id, skillId: skill.id } },
        update: {}, create: { userId: user.id, skillId: skill.id, proficiency: 'Advanced' },
      });
    }
    for (const name of profile.learn) {
      const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name, category: categories[name] || 'General' } });
      await prisma.userSkillLearn.upsert({
        where: { userId_skillId: { userId: user.id, skillId: skill.id } },
        update: {}, create: { userId: user.id, skillId: skill.id, proficiency: 'Beginner' },
      });
    }
  }
  console.log('Demo member profiles and skills are ready.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
