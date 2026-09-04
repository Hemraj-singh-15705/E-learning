import User from '../models/User';
import Course from '../models/Course';
import Batch from '../models/Batch';

export const autoSeedIfEmpty = async (): Promise<void> => {
  try {
    const studentExists = await User.findOne({ email: 'student@elearning.com' });
    const adminExists = await User.findOne({ email: 'admin@elearning.com' });

    if (studentExists && adminExists) {
      return; // Already seeded
    }

    console.log('🌱 Auto-seeding default platform users & curriculum into MongoDB...');

    // 1. Seed Platform Users
    const usersToSeed = [
      {
        email: 'admin@elearning.com',
        name: 'Vishakha Ma\'am (Super Admin)',
        role: 'SUPER_ADMIN',
        password: 'Admin@123456',
        status: 'ACTIVE',
        isEmailVerified: true,
        bio: 'Founder & Chief Educator | Gold Medalist in Mathematics'
      },
      {
        email: 'manager@elearning.com',
        name: 'Academic Head (Admin)',
        role: 'ADMIN',
        password: 'Admin@123456',
        status: 'ACTIVE',
        isEmailVerified: true,
        bio: 'Academics Operations & Teaching Curriculum Lead'
      },
      {
        email: 'mentor@elearning.com',
        name: 'Prof. Arvind Joshi (Faculty)',
        role: 'MENTOR',
        password: 'Mentor@123456',
        status: 'ACTIVE',
        isEmailVerified: true,
        bio: 'Senior Faculty - General Section (GK, CA & Hindi) with 14+ Years Experience'
      },
      {
        email: 'priya@elearning.com',
        name: 'Dr. Priya Sharma (Faculty)',
        role: 'MENTOR',
        password: 'Mentor@123456',
        status: 'ACTIVE',
        isEmailVerified: true,
        bio: 'Senior Faculty - Child Development & Pedagogy (CDP) | PhD in Education'
      },
      {
        email: 'student@elearning.com',
        name: 'Rahul Sharma (Aspirant)',
        role: 'STUDENT',
        password: 'Student@123456',
        status: 'ACTIVE',
        isEmailVerified: true,
        bio: 'DSSSB TGT & CTET 2026 Teaching Aspirant'
      }
    ];

    const seededUsers: Record<string, any> = {};

    for (const u of usersToSeed) {
      let userDoc = await User.findOne({ email: u.email });
      if (!userDoc) {
        userDoc = await User.create(u);
      }
      seededUsers[u.email] = userDoc;
    }

    const adminUser = seededUsers['admin@elearning.com'];
    const mentorUser = seededUsers['mentor@elearning.com'];
    const studentUser = seededUsers['student@elearning.com'];

    // 2. Seed Batches if empty
    const batchCount = await Batch.countDocuments();
    if (batchCount === 0 && adminUser && mentorUser && studentUser) {
      const batchesToCreate = [
        {
          name: 'DSSSB TGT Mathematics & General Section Complete Batch',
          slug: 'dsssb-tgt-math-2026',
          code: 'DSSSB-TGT-MATH-2026',
          description: 'Comprehensive Part-A (General 100M) + Part-B (Higher Math & Pedagogy 100M) with 300+ Live Hours and daily DPPs.',
          capacity: 150,
          startDate: new Date('2026-10-10'),
          endDate: new Date('2027-05-01'),
          status: 'ACTIVE',
          mentors: [adminUser._id, mentorUser._id],
          students: [studentUser._id],
          createdBy: adminUser._id
        },
        {
          name: 'CTET 2026 (Paper 1 & 2) Target 130+ Selection Batch',
          slug: 'ctet-2026-target-130',
          code: 'CTET-2026-T130',
          description: 'Targeted Pedagogy, CDP by Dr. Priya Sharma, Math & Science with 50+ Real Exam CBT Mock Tests.',
          capacity: 250,
          startDate: new Date('2026-11-01'),
          endDate: new Date('2027-03-31'),
          status: 'ACTIVE',
          mentors: [mentorUser._id],
          students: [studentUser._id],
          createdBy: adminUser._id
        }
      ];

      await Batch.insertMany(batchesToCreate);

      // 3. Seed Courses if empty
      const courseCount = await Course.countDocuments();
      if (courseCount === 0) {
        await Course.insertMany([
          {
            title: 'Masterclass: Abstract Algebra & Real Analysis for DSSSB/UP TGT',
            slug: 'masterclass-abstract-algebra-tgt',
            description: 'In-depth conceptual mastery of Group Theory, Rings, Vector Spaces, Sequences & Series with Vishakha Ma\'am shortcut techniques.',
            shortDescription: '100% Exam-Oriented Higher Math for DSSSB TGT/PGT and KVS.',
            thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60',
            category: 'Teaching Exams - Mathematics',
            level: 'ADVANCED',
            language: 'Hindi + English',
            duration: '85 Hours',
            status: 'PUBLISHED',
            visibility: 'PUBLIC',
            createdBy: adminUser._id
          },
          {
            title: 'Child Development & Pedagogy (CDP) 30/30 Guarantee for CTET & TETs',
            slug: 'cdp-30-30-guarantee-ctet',
            description: 'Complete coverage of Piaget, Vygotsky, Kohlberg theories, Inclusive Education, NEP 2020 and NCF 2023 with 500+ PYQs.',
            shortDescription: 'Scoring 30/30 in CDP made simple with conceptual flowcharts.',
            thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60',
            category: 'Teaching Exams - Pedagogy & CDP',
            level: 'INTERMEDIATE',
            language: 'Hindi + English',
            duration: '45 Hours',
            status: 'PUBLISHED',
            visibility: 'PUBLIC',
            createdBy: mentorUser._id
          }
        ]);
      }
    }

    console.log('✅ Auto-seed completed: Default accounts (student@elearning.com, admin@elearning.com) are ready.');
  } catch (error) {
    console.error('⚠️ Auto-seed notice:', error);
  }
};
