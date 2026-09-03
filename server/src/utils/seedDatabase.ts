import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Course from '../models/Course';
import Batch from '../models/Batch';
import Test from '../models/Test';
import Question from '../models/Question';
import MentorshipSession from '../models/MentorshipSession';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elearning_platform';

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

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
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        existing.name = u.name;
        existing.role = u.role as any;
        existing.password = u.password;
        existing.status = 'ACTIVE';
        existing.isEmailVerified = true;
        await existing.save();
        seededUsers[u.email] = existing;
      } else {
        const created = await User.create(u);
        seededUsers[u.email] = created;
      }
    }

    console.log('✓ Users verified & updated with Vishakha Ma\'am team credentials.');

    const adminUser = seededUsers['admin@elearning.com'];
    const mentorUser = seededUsers['mentor@elearning.com'];
    const studentUser = seededUsers['student@elearning.com'];

    // 2. Clear and Seed Teaching Exam Batches
    await Batch.deleteMany({});

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
        name: 'CTET 2026 Target Selection Batch (Paper 1 & Paper 2)',
        slug: 'ctet-dec-2026',
        code: 'CTET-DEC-2026',
        description: 'Guaranteed 120+ Score Strategy covering NCERT Class 1-8 Mathematics, CDP, EVS, Hindi & Sanskrit Pedagogy.',
        capacity: 250,
        startDate: new Date('2026-10-15'),
        endDate: new Date('2027-02-28'),
        status: 'ACTIVE',
        mentors: [adminUser._id],
        students: [studentUser._id],
        createdBy: adminUser._id
      },
      {
        name: 'BPSC TRE 4.0 / 5.0 Bihar Teacher Recruitment Super Batch',
        slug: 'bpsc-tre-4-0',
        code: 'BPSC-TRE-4.0',
        description: 'Complete GS (40M) + Subject Domain (80M) for Classes 6-8, 9-10 & 11-12 with Bihar Special GK & SCERT summaries.',
        capacity: 200,
        startDate: new Date('2026-11-01'),
        endDate: new Date('2027-01-01'),
        status: 'ACTIVE',
        mentors: [adminUser._id, mentorUser._id],
        students: [studentUser._id],
        createdBy: adminUser._id
      },
      {
        name: 'KVS / NVS PRT & TGT Complete Selection Cohort',
        slug: 'kvs-nvs-2026',
        code: 'KVS-NVS-2026',
        description: 'Perspectives on Education & Leadership (PEL 60M) + Subject Specific Paper with live mock interview sessions.',
        capacity: 120,
        startDate: new Date('2026-10-25'),
        endDate: new Date('2027-05-15'),
        status: 'UPCOMING',
        mentors: [adminUser._id],
        students: [],
        createdBy: adminUser._id
      },
      {
        name: 'SUPER TET 2.0 & UP TGT Mathematics Foundation Batch',
        slug: 'super-tet-2-0',
        code: 'SUPER-TET-2.0',
        description: 'Complete UP Primary & Junior Teacher curriculum covering all 14 subjects with shortcut math formula handouts.',
        capacity: 180,
        startDate: new Date('2026-10-21'),
        endDate: new Date('2027-04-01'),
        status: 'ACTIVE',
        mentors: [adminUser._id, mentorUser._id],
        students: [studentUser._id],
        createdBy: adminUser._id
      },
      {
        name: 'Teaching Mahapack (All-in-One Selection Pack)',
        slug: 'teaching-mahapack-2026',
        code: 'TEACHING-MAHAPACK-2026',
        description: 'All-inclusive pass covering DSSSB, CTET, KVS, BPSC TRE, and UP TGT/PGT with 1000+ live classes and test series.',
        capacity: 500,
        startDate: new Date('2026-10-15'),
        endDate: new Date('2027-12-31'),
        status: 'ACTIVE',
        mentors: [adminUser._id, mentorUser._id],
        students: [studentUser._id],
        createdBy: adminUser._id
      }
    ];

    const seededBatches = await Batch.insertMany(batchesToCreate);
    console.log(`✓ Seeded ${seededBatches.length} Teaching Exam Batches.`);

    // 3. Clear and Seed Courses
    await Course.deleteMany({});
    const coursesToCreate = [
      {
        title: 'DSSSB TGT Higher Mathematics & Pedagogy',
        slug: 'dsssb-tgt-higher-mathematics',
        description: 'Differential Calculus, Coordinate Geometry, Matrices, Vector Algebra & Mathematics Teaching Methodology.',
        category: 'Mathematics',
        level: 'ADVANCED',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdBy: adminUser._id,
        mentors: [adminUser._id],
        modules: [
          {
            title: 'Module 1: Calculus, Limits, Continuity & Differentiability',
            description: 'Core concepts and high-yield shortcut formulas for DSSSB Part-B.',
            order: 1,
            lessons: [
              {
                title: 'Lesson 1.1: Limits & L\'Hopital Shortcut Tricks',
                description: 'Solving limits in 15 seconds without standard expansions.',
                type: 'VIDEO',
                duration: 50,
                order: 1,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                isPreview: true,
                status: 'PUBLISHED'
              },
              {
                title: 'Lesson 1.2: Maxima & Minima Applications in Pedagogy',
                description: 'Real exam question patterns from DSSSB 2018-2024.',
                type: 'VIDEO',
                duration: 60,
                order: 2,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                isPreview: false,
                status: 'PUBLISHED'
              }
            ]
          }
        ]
      },
      {
        title: 'Child Development & Pedagogy (CDP) Master Course',
        slug: 'cdp-master-course',
        description: 'Piaget, Vygotsky, Kohlberg, NEP 2020, NCF-FS & Inclusive Education Framework.',
        category: 'Pedagogy',
        level: 'INTERMEDIATE',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdBy: adminUser._id,
        mentors: [adminUser._id],
        modules: [
          {
            title: 'Module 1: Constructivism & Learning Theories',
            description: 'Deep dive into Socio-Cultural Theory and Zone of Proximal Development.',
            order: 1,
            lessons: [
              {
                title: 'Lesson 1.1: Lev Vygotsky - ZPD, Scaffolding & Private Speech',
                description: 'Classroom case studies and most repeated CTET questions.',
                type: 'VIDEO',
                duration: 45,
                order: 1,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                isPreview: true,
                status: 'PUBLISHED'
              }
            ]
          }
        ]
      }
    ];

    const seededCourses = await Course.insertMany(coursesToCreate);
    console.log(`✓ Seeded ${seededCourses.length} Courses with full lesson modules.`);

    // 4. Clear and Seed CBT Mock Tests
    await Test.deleteMany({});
    await Question.deleteMany({});

    const questionsToCreate = [
      {
        questionText: 'If f(x) = (sin 5x) / x, find the value of lim(x->0) f(x)',
        type: 'MCQ' as const,
        section: 'Calculus & Limits',
        marks: 1,
        negativeMarks: 0.25,
        options: [
          { id: 'opt_1', text: '5' },
          { id: 'opt_2', text: '1' },
          { id: 'opt_3', text: '0' },
          { id: 'opt_4', text: 'Undefined' }
        ],
        correctAnswer: 'opt_1',
        explanation: 'lim(x->0) (sin 5x)/x = 5 * lim(x->0) (sin 5x)/(5x) = 5 * 1 = 5.',
        isBankQuestion: true,
        createdBy: adminUser._id
      },
      {
        questionText: 'According to Lev Vygotsky, the zone of proximal development (ZPD) is:',
        type: 'MCQ' as const,
        section: 'Child Development & Pedagogy',
        marks: 1,
        negativeMarks: 0,
        options: [
          { id: 'opt_1', text: 'The gap between what a child can do independently and with guidance' },
          { id: 'opt_2', text: 'The biological age limit of cognitive development' },
          { id: 'opt_3', text: 'The speed of motor skill acquisition' },
          { id: 'opt_4', text: 'Rote memorization capacity' }
        ],
        correctAnswer: 'opt_1',
        explanation: 'ZPD is the difference between what a learner can do without help and what they can do with adult or peer guidance.',
        isBankQuestion: true,
        createdBy: adminUser._id
      }
    ];

    const seededQuestions = await Question.insertMany(questionsToCreate);

    await Test.create({
      title: 'DSSSB TGT Mathematics & Pedagogy CBT Mock Test 1',
      slug: 'dsssb-tgt-math-cbt-mock-1',
      description: 'Official CBT Computer-Based Mock Test covering 200 Questions with real exam timer & negative marking.',
      duration: 120,
      totalMarks: 200,
      passingMarks: 80,
      status: 'PUBLISHED',
      isPublic: true,
      questions: seededQuestions.map((q) => q._id),
      createdBy: adminUser._id
    });
    console.log('✓ Seeded CBT Mock Test and Question Bank.');

    // 5. Clear and Seed Live Mentorship & Classroom Sessions
    await MentorshipSession.deleteMany({});
    const sessionsToCreate = [
      {
        title: 'Differential Calculus: Limits, Continuity & Maximum/Minimum Tricks',
        description: 'Live interactive masterclass with Vishakha Ma\'am. 2-way audio doubts and high-yield shortcuts.',
        type: 'BATCH',
        status: 'LIVE',
        startTime: new Date(Date.now() - 30 * 60 * 1000), // started 30 mins ago
        endTime: new Date(Date.now() + 60 * 60 * 1000),   // ends in 1 hour
        meetingLink: 'https://meet.google.com/new',
        mentor: adminUser._id,
        students: [studentUser._id],
        batch: seededBatches[0]._id,
        capacity: 250,
        createdBy: adminUser._id
      },
      {
        title: 'Lev Vygotsky\'s Socio-Cultural Theory & Classroom Scaffolding',
        description: 'CDP deep dive with Dr. Priya Sharma. 30 most expected CTET questions analysis.',
        type: 'BATCH',
        status: 'SCHEDULED',
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // in 3 hours
        endTime: new Date(Date.now() + 4.5 * 60 * 60 * 1000),
        meetingLink: 'https://meet.google.com/new',
        mentor: mentorUser._id,
        students: [studentUser._id],
        batch: seededBatches[1]._id,
        capacity: 250,
        createdBy: adminUser._id
      },
      {
        title: 'General Hindi: Sandhi, Samas & Karak PYQs Discussion',
        description: 'General Paper Section-1 mastery with Prof. Arvind Joshi.',
        type: 'BATCH',
        status: 'SCHEDULED',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        endTime: new Date(Date.now() + 25.5 * 60 * 60 * 1000),
        meetingLink: 'https://meet.google.com/new',
        mentor: mentorUser._id,
        students: [studentUser._id],
        batch: seededBatches[0]._id,
        capacity: 250,
        createdBy: adminUser._id
      }
    ];

    await MentorshipSession.insertMany(sessionsToCreate);
    console.log('✓ Seeded Live Teaching Sessions.');

    console.log('\n==========================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('Demo Credentials:');
    console.log('🎓 Student Login: student@elearning.com / Student@123456');
    console.log('👑 Admin Portal:  admin@elearning.com / Admin@123456');
    console.log('👨‍🏫 Faculty Portal: mentor@elearning.com / Mentor@123456');
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database Seeding Error:', error);
    process.exit(1);
  }
}

seed();
