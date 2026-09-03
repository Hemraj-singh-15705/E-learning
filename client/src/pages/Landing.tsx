import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { clearCredentials } from '../store/authSlice';
import api from '../utils/api';
import {
  Sparkles,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Award,
  Video,
  Clock,
  Users,
  Shield,
  PlayCircle,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Flame,
  BadgeCheck,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  Send
} from 'lucide-react';
import Button from '../components/ui/Button';

const YouTubeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      minWidth: `${size}px`,
      minHeight: `${size}px`,
      maxWidth: `${size}px`,
      maxHeight: `${size}px`,
      flexShrink: 0,
      display: 'inline-block',
      verticalAlign: 'middle'
    }}
  >
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

// Comprehensive Teaching Exam Batches dataset customized for Vishakha Mam Official (Indian EdTech Poster Card Style)
const vishakhaBatches = [
  {
    id: 'batch_teaching_mahapack',
    code: 'TEACHING-MAHAPACK-2026',
    name: 'Teaching Mahapack (All-in-One)',
    categoryTag: 'Teaching',
    category: 'All Teaching Exams',
    language: 'HINGLISH',
    bannerBg: 'linear-gradient(135deg, #fef08a 0%, #fde047 50%, #fbbf24 100%)',
    bannerTextColor: '#78350f',
    bannerPillText: '📦 Mahapack: Cover multiple exams with one pack',
    bannerTitle: 'TEACHING MAHAPACK',
    bannerSubtitle: '2026-27 ALL EXAMS',
    targetText: 'For All Teaching exam (DSSSB, CTET, KVS, BPSC)',
    dateText: 'Starts on 15 Oct, 2026 Ends on 1 Jan, 2027',
    price: 1999,
    originalPrice: 12999,
    discount: '85% OFF',
    btnText: 'Select Plan',
    seatsLeft: 12,
    rating: 4.98,
    faculty: [
      {
        name: 'Vishakha Ma\'am',
        role: 'Founder & Math Head',
        experience: 'Gold Medalist in Mathematics',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Prof. Arvind Joshi',
        role: 'General Section Lead',
        experience: '14+ Yrs Experience',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dr. Priya Sharma',
        role: 'CDP Specialist',
        experience: '10+ Yrs Experience',
        avatar: 'https://images.unsplash.com/photo-1594824813589-4b684534f9a0?w=150&auto=format&fit=crop&q=80'
      }
    ],
    features: [
      'Access to ALL Teaching Batches (DSSSB, CTET, KVS, BPSC TRE, UP TGT)',
      '1,000+ Live & Recorded Classes with Master Educators',
      '500+ Daily DPPs with Step-by-Step Video Explanations',
      '100+ All-India CBT Test Series with Negative Marking',
      'Complete Set of Downloadable Handwritten PDF Notes & Formula Books'
    ],
    modules: [
      { name: 'Higher Mathematics & Pedagogy (Part-B Complete)', lectures: '80 Lectures', duration: '160 Hours' },
      { name: 'Child Development, Pedagogy & NEP 2020 Complete', lectures: '60 Lectures', duration: '120 Hours' },
      { name: 'General Section 1: Hindi, English, Math, Reasoning & GK', lectures: '75 Lectures', duration: '150 Hours' }
    ],
    demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 'batch_bpsc_tre_mahapack',
    code: 'BPSC-TRE-MAHAPACK',
    name: 'BPSC TRE Mahapack (TRE 4.0 & 5.0)',
    categoryTag: 'Bihar Exams',
    category: 'BPSC TRE (Bihar)',
    language: 'HINGLISH',
    bannerBg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #d8b4fe 100%)',
    bannerTextColor: '#581c87',
    bannerPillText: '📦 Mahapack: Cover multiple exams with one pack',
    bannerTitle: 'BPSC TRE MAHAPACK',
    bannerSubtitle: 'TRE 4.0 & 5.0 SPECIAL',
    targetText: 'For students preparing for BPSC TRE 4.0 & 5.0 (6-8, 9-10, 11-12)',
    dateText: 'Starts on 1 Nov, 2026 Ends on 1 Jan, 2027',
    price: 1299,
    originalPrice: 8999,
    discount: '86% OFF',
    btnText: 'Select Plan',
    seatsLeft: 18,
    rating: 4.95,
    faculty: [
      {
        name: 'Vishakha Ma\'am',
        role: 'Mathematics Specialist',
        experience: 'Gold Medalist | BPSC Fastrack Lead',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Prof. Rajesh Verma',
        role: 'Science & Bihar GK',
        experience: '15+ Yrs Experience',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      }
    ],
    features: [
      'SCERT & NCERT Based Chapter Summaries for Bihar School Syllabus',
      'Daily 50 MCQ Speed Practice with Cutoff Targeting',
      'Special Bihar GK, History & Current Affairs Module',
      '20 Full CBT Test Series based on recent BPSC Question Trend',
      'Weekly Doubt Clearing Webinars directly with Vishakha Ma\'am'
    ],
    modules: [
      { name: 'Subject Domain (Mathematics / Science) 80 Marks Mastery', lectures: '50 Lectures', duration: '100 Hours' },
      { name: 'General Studies: History, Geography, Polity & Bihar Special', lectures: '35 Lectures', duration: '70 Hours' },
      { name: 'Qualifying Language (Hindi / English)', lectures: '15 Lectures', duration: '30 Hours' }
    ],
    demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'batch_super_tet_2',
    code: 'SUPER-TET-2.0',
    name: 'SUPER TET 2.0 2026-27 Target Batch',
    categoryTag: 'UP_Exams',
    category: 'UP TGT/PGT & SuperTET',
    language: 'HINGLISH',
    bannerBg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)',
    bannerTextColor: '#4c1d95',
    bannerPillText: '⚡ Selection Batch: Full UP SuperTET Syllabus',
    bannerTitle: 'SUPER TET 2.0',
    bannerSubtitle: '2026-27',
    targetText: 'For UP Primary & Junior Teacher Recruitment',
    dateText: 'Starts on 21 Oct, 2026 Ends on 1 Apr, 2027',
    price: 1169,
    originalPrice: 3999,
    discount: '71% OFF',
    btnText: 'Buy Now',
    seatsLeft: 25,
    rating: 4.93,
    faculty: [
      {
        name: 'Vishakha Ma\'am',
        role: 'Math & Pedagogy',
        experience: 'Gold Medalist in Mathematics',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Prof. Arvind Joshi',
        role: 'Hindi & Sanskrit Head',
        experience: '14+ Yrs Teaching Experience',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      }
    ],
    features: [
      'Complete 14 Subjects Coverage for UP SuperTET Exam',
      'Daily Practice Problem Sheets (DPP) with Video Solutions',
      'Previous 10 Years UP Papers with Shortcut Techniques',
      '20 Full Mock Tests on Official Exam Pattern',
      'Color-Coded Revision Handouts & Key Definitions Summary'
    ],
    modules: [
      { name: 'Mathematics & Reasoning Speed Shortcut Modules', lectures: '40 Lectures', duration: '80 Hours' },
      { name: 'Teaching Skills, Child Psychology & Life Management', lectures: '35 Lectures', duration: '70 Hours' },
      { name: 'Language & General Knowledge Capsule', lectures: '30 Lectures', duration: '60 Hours' }
    ],
    demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  },
  {
    id: 'batch_dsssb_tgt_math',
    code: 'DSSSB-TGT-MATH-2026',
    name: 'DSSSB TGT Mathematics & General Paper Batch',
    categoryTag: 'DSSSB Exams',
    category: 'DSSSB (TGT/PGT/PRT)',
    language: 'HINGLISH',
    bannerBg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
    bannerTextColor: '#0369a1',
    bannerPillText: '⚡ Core Subject Batch: Part-A + Part-B',
    bannerTitle: 'DSSSB TGT MATH',
    bannerSubtitle: '2026-27 TARGET',
    targetText: 'For Part-A (General 100M) & Part-B (Higher Math 100M)',
    dateText: 'Starts on 10 Oct, 2026 Ends on 1 May, 2027',
    price: 2499,
    originalPrice: 8999,
    discount: '72% OFF',
    btnText: 'Select Plan',
    seatsLeft: 14,
    rating: 4.96,
    faculty: [
      {
        name: 'Vishakha Ma\'am',
        role: 'Mathematics & Pedagogy Head',
        experience: 'Gold Medalist in Mathematics',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Prof. Arvind Joshi',
        role: 'General Section (GK & Hindi)',
        experience: '14+ Yrs Experience',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      }
    ],
    features: [
      '300+ Live Hours covering 100% DSSSB Syllabus',
      'Daily Practice Problem Sheets (DPP) with Video Solutions',
      '15 Yrs DSSSB PYQs with Shortcut Tricks',
      '25 Full Length Computer-Based Mock Tests (CBT Pattern)',
      'High-Yield Handwritten PDF Notes & Formula Sheets'
    ],
    modules: [
      { name: 'Part-B: Calculus, Algebra, Matrices & Coordinate Geometry', lectures: '55 Lectures', duration: '110 Hours' },
      { name: 'Part-B: Teaching Methodology & Math Pedagogy', lectures: '25 Lectures', duration: '50 Hours' },
      { name: 'Part-A: Reasoning, Math, Hindi & General Awareness', lectures: '45 Lectures', duration: '90 Hours' }
    ],
    demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 'batch_ctet_paper1_2',
    code: 'CTET-DEC-2026',
    name: 'CTET 2026 Target Selection Batch (Paper 1 & 2)',
    categoryTag: 'CTET Exams',
    category: 'CTET & State TETs',
    language: 'HINGLISH',
    bannerBg: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 50%, #6ee7b7 100%)',
    bannerTextColor: '#065f46',
    bannerPillText: '⚡ 100% Qualifying: Guaranteed 120+ Marks',
    bannerTitle: 'CTET 2026',
    bannerSubtitle: 'PAPER 1 & 2 TARGET',
    targetText: 'For CTET Paper-1 (PRT) & Paper-2 (Math/Science/SST)',
    dateText: 'Starts on 15 Oct, 2026 Ends on 28 Feb, 2027',
    price: 1169,
    originalPrice: 3999,
    discount: '71% OFF',
    btnText: 'Buy Now',
    seatsLeft: 22,
    rating: 4.98,
    faculty: [
      {
        name: 'Vishakha Ma\'am',
        role: 'Math & CDP Specialist',
        experience: 'Gold Medalist | CTET Qualified',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dr. Priya Sharma',
        role: 'CDP Specialist',
        experience: '10+ Yrs Experience',
        avatar: 'https://images.unsplash.com/photo-1594824813589-4b684534f9a0?w=150&auto=format&fit=crop&q=80'
      }
    ],
    features: [
      'Comprehensive Coverage of NCERT Class 1st to 8th',
      'CDP Pedagogy Masterclasses with Real Case Studies',
      'Daily 30-Question Tagged DPPs on Official Pattern',
      '20 All-India Online CBT Mock Tests',
      'Color-Coded Revision Handouts & Mindmaps'
    ],
    modules: [
      { name: 'Mathematics Content & Pedagogy Master Modules', lectures: '40 Lectures', duration: '80 Hours' },
      { name: 'Child Development & Learning Theories (Piaget, Vygotsky)', lectures: '35 Lectures', duration: '70 Hours' },
      { name: 'Language 1 & 2 Pedagogy (Hindi & English)', lectures: '30 Lectures', duration: '60 Hours' }
    ],
    demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'batch_kvs_nvs_prt_tgt',
    code: 'KVS-NVS-2026',
    name: 'KVS / NVS PRT & TGT Complete Selection Cohort',
    categoryTag: 'Central Exams',
    category: 'KVS / NVS Teaching',
    language: 'HINGLISH',
    bannerBg: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 50%, #fda4af 100%)',
    bannerTextColor: '#881337',
    bannerPillText: '🏆 Selection Cohort: PEL 60M + Subject Paper',
    bannerTitle: 'KVS / NVS 2026',
    bannerSubtitle: 'PRT & TGT COMPLETE',
    targetText: 'For KVS & NVS Teacher Recruitment',
    dateText: 'Starts on 25 Oct, 2026 Ends on 15 May, 2027',
    price: 2199,
    originalPrice: 7999,
    discount: '73% OFF',
    btnText: 'Select Plan',
    seatsLeft: 9,
    rating: 4.93,
    faculty: [
      {
        name: 'Vishakha Ma\'am',
        role: 'Subject Head & Interview Mentor',
        experience: 'Gold Medalist | 120+ KVS Selected',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      }
    ],
    features: [
      'NEP 2020, NCF-FS, ECCE & School Leadership Deep Dive',
      'Chapter-wise Practice Sets with Detailed Solutions',
      'Live Mock Interview & Demo Teaching Sessions',
      '20 Full Mock Tests on Latest KVS/NVS Pattern',
      'Downloadable PDF Class Notes & Teacher Diary'
    ],
    modules: [
      { name: 'Perspectives on Education & Leadership (PEL 60M)', lectures: '45 Lectures', duration: '90 Hours' },
      { name: 'Subject Specific Paper (Maths & General Sciences)', lectures: '50 Lectures', duration: '100 Hours' },
      { name: 'General Awareness, Reasoning & Computer Literacy', lectures: '30 Lectures', duration: '60 Hours' }
    ],
    demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  }
];

const facultiesList = [
  {
    name: 'Vishakha Ma\'am',
    title: 'Founder & Chief Educator',
    role: 'Mathematics & Pedagogy Head',
    qualification: 'Gold Medalist in Mathematics | CTET & State TET Qualified',
    highlights: 'Guiding 1,00,000+ Teaching Aspirants on YouTube & Portal',
    studentsTaught: '50,000+ Selected Teachers',
    rating: '4.98 ⭐',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    specialty: ['DSSSB TGT/PGT Math', 'CTET Pedagogy', 'Shortcut Formulas'],
    tag: 'Gold Medalist in Math',
    bannerBg: 'linear-gradient(135deg, #fef08a 0%, #fde047 50%, #fbbf24 100%)',
    bannerTextColor: '#78350f',
    badge: '🏆 CHIEF EDUCATOR'
  },
  {
    name: 'Prof. Arvind Joshi',
    title: 'Senior Faculty Mentor',
    role: 'General Paper & Hindi Vyakaran Lead',
    qualification: 'MA Hindi & Political Science (14+ Yrs Teaching Exp)',
    highlights: 'General Paper Section-1 Specialist (DSSSB & KVS)',
    studentsTaught: '35,000+ Candidates',
    rating: '4.94 ⭐',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    specialty: ['Hindi Sahitya', 'Vyakaran', 'Current Affairs & Polity'],
    tag: '14+ Yrs Experience',
    bannerBg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
    bannerTextColor: '#3730a3',
    badge: '📚 GENERAL PAPER HEAD'
  },
  {
    name: 'Dr. Priya Sharma',
    title: 'Senior Faculty Mentor',
    role: 'Child Development & Pedagogy (CDP) Head',
    qualification: 'PhD in Education & Psychology (10+ Yrs Exp)',
    highlights: 'Author of 3 Teacher Training Reference Books',
    studentsTaught: '28,000+ Students',
    rating: '4.95 ⭐',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    specialty: ['Child Psychology', 'NEP 2020 & NCF', 'Inclusive Education'],
    tag: 'PhD in Education',
    bannerBg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)',
    bannerTextColor: '#065f46',
    badge: '🧠 CDP & PEDAGOGY LEAD'
  }
];

const todaySchedule = [
  {
    time: '05:00 PM - 06:30 PM',
    subject: 'DSSSB TGT Math',
    topic: 'Differential Calculus: Limits, Continuity & Maximum/Minimum High-Yield Tricks',
    teacher: 'Vishakha Ma\'am',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    batch: 'DSSSB TGT Math Target 2026',
    status: 'LIVE NOW',
    isLive: true,
    isDemoFree: true
  },
  {
    time: '06:45 PM - 08:00 PM',
    subject: 'Child Development (CDP)',
    topic: 'Lev Vygotsky\'s Socio-Cultural Theory, ZPD & Scaffolding in Classroom',
    teacher: 'Dr. Priya Sharma',
    teacherAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    batch: 'CTET 2026 Selection Batch',
    status: 'STARTING AT 6:45 PM',
    isLive: false,
    isDemoFree: true
  },
  {
    time: '08:15 PM - 09:30 PM',
    subject: 'General Hindi',
    topic: 'Sandhi, Samas & Karak: 50 Most Repeated DSSSB/KVS Questions',
    teacher: 'Prof. Arvind Joshi',
    teacherAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    batch: 'General Paper 1 Mastery',
    status: 'UPCOMING TODAY',
    isLive: false,
    isDemoFree: true
  }
];

const toppersTestimonials = [
  {
    name: 'Pooja Rawat',
    rank: 'Selected as DSSSB TGT Mathematics Teacher',
    college: 'Directorate of Education, Delhi (DoE)',
    quote: 'Vishakha Mam\'s 40-Day strategy and Part-B mathematics short tricks were a lifesaver. Her DPPs matched the exact difficulty level of DSSSB exam!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sunil Kumar',
    rank: 'CTET Paper 1 & 2 Score: 132/150',
    college: 'Qualified in 1st Attempt',
    quote: 'I had immense fear of Mathematics pedagogy, but Vishakha Mam explained every NCERT concept from basic roots. Thank you Mam for your guidance!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Anjali Verma',
    rank: 'Selected in BPSC TRE 3.0 (Class 9-10 Math)',
    college: 'Government High School, Patna',
    quote: 'The test series with real-time negative marking gave me the exact exam mindset. The handwritten notes saved weeks of revision time.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  }
];

export const Landing: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBatchModal, setSelectedBatchModal] = useState<any | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoVideoPlaying, setDemoVideoPlaying] = useState<string | null>(null);

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const categories = [
    'All',
    'All Teaching Exams',
    'DSSSB (TGT/PGT/PRT)',
    'CTET & State TETs',
    'KVS / NVS Teaching',
    'BPSC TRE (Bihar)',
    'UP TGT/PGT & SuperTET'
  ];

  const filteredBatches = vishakhaBatches.filter((b) => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory || b.categoryTag === selectedCategory;
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.targetText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.categoryTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bannerTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    dispatch(clearCredentials());
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-vh-100 w-100 d-flex flex-column position-relative overflow-hidden text-start" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
      {/* 1. Top Admissions & YouTube/Telegram Strip */}
      <div className="w-100 py-1.5 px-3 border-bottom d-flex flex-wrap justify-content-center align-items-center gap-2 text-center text-dark" style={{ background: 'linear-gradient(90deg, #fefce8 0%, #fef3c7 50%, #fde68a 100%)', borderColor: '#fde68a', fontSize: '0.78rem', zIndex: 101 }}>
        <span className="badge bg-warning text-dark fw-bold px-2 py-0.5" style={{ fontSize: '0.7rem' }}>🔥 DSSSB & CTET 2026-27 ADMISSIONS OPEN</span>
        <span className="fw-semibold" style={{ color: '#78350f' }}>Join Official Batches by Vishakha Ma'am | Coupon: <span className="badge bg-white text-dark border border-warning px-1.5 py-0.5">WELCOME20</span></span>
        <span className="d-none d-md-inline opacity-75 text-secondary">|</span>
        <a href="https://youtube.com/@vishakhamam_official?si=W5qeCXK7eIMw1orG" target="_blank" rel="noreferrer" className="d-inline-flex align-items-center gap-1 text-white text-decoration-none bg-danger px-2.5 py-0.5 rounded-pill shadow-sm" style={{ fontSize: '0.72rem' }}>
          <YouTubeIcon size={13} /> YouTube Channel
        </a>
        <a href="https://t.me/vishakhamaam16" target="_blank" rel="noreferrer" className="d-none d-md-inline-flex align-items-center gap-1 text-white text-decoration-none bg-primary px-2.5 py-0.5 rounded-pill shadow-sm" style={{ fontSize: '0.72rem' }}>
          <Send className="h-3 w-3" /> Telegram @vishakhamaam16
        </a>
      </div>

      {/* 2. Main Header / Navigation Bar */}
      <nav className="navbar navbar-expand-lg border-bottom sticky-top px-3 px-md-4 py-2.5 shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', zIndex: 100 }}>
        <div className="container-fluid max-w-7xl">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none me-3">
            <div className="p-1.5 rounded-3 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <GraduationCap className="h-5 w-5 text-dark" />
            </div>
            <div className="d-flex flex-column text-start">
              <span className="fw-black fs-5 tracking-tight font-display lh-1" style={{ color: '#0f172a' }}>
                Vishakha Ma'am<span style={{ color: '#d97706' }}> Official</span>
              </span>
              <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.58rem', letterSpacing: '0.06em' }}>
                India's #1 Teaching Exam Platform
              </span>
            </div>
          </Link>

          <div className="d-none d-xl-flex align-items-center gap-2 text-sm fw-semibold me-auto">
            <a href="#batches" className="text-dark text-decoration-none d-flex align-items-center gap-1 py-1 px-2.5 rounded-2 hover-bg-light" style={{ fontSize: '0.84rem' }}>
              <BookOpen className="h-3.5 w-3.5 text-warning" /> All Batches
            </a>
            <a href="#faculty" className="text-dark text-decoration-none d-flex align-items-center gap-1 py-1 px-2.5 rounded-2 hover-bg-light" style={{ fontSize: '0.84rem' }}>
              <Users className="h-3.5 w-3.5 text-primary" /> Faculty
            </a>
            <a href="#schedule" className="text-dark text-decoration-none d-flex align-items-center gap-1 py-1 px-2.5 rounded-2 hover-bg-light" style={{ fontSize: '0.84rem' }}>
              <Clock className="h-3.5 w-3.5 text-danger" /> Live Classes
            </a>
            <a href="#demo" className="text-dark text-decoration-none d-flex align-items-center gap-1 py-1 px-2.5 rounded-2 hover-bg-light" style={{ fontSize: '0.84rem' }}>
              <PlayCircle className="h-3.5 w-3.5 text-success" /> Free Notes
            </a>
            <a href="#results" className="text-dark text-decoration-none d-flex align-items-center gap-1 py-1 px-2.5 rounded-2 hover-bg-light" style={{ fontSize: '0.84rem' }}>
              <Award className="h-3.5 w-3.5 text-info" /> Results
            </a>
            <Link to="/pricing" className="text-dark text-decoration-none py-1 px-2.5 rounded-2 hover-bg-light" style={{ fontSize: '0.84rem' }}>
              Fees
            </Link>
          </div>

          {/* Dynamic Authentication State Buttons */}
          <div className="d-flex align-items-center gap-2">
            {isAuthenticated && user ? (
              <div className="d-flex align-items-center gap-2">
                <div className="d-none d-sm-flex align-items-center gap-2 px-2.5 py-1 rounded-pill border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <div className="bg-warning text-dark fw-bold rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.72rem' }}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="d-flex flex-column text-start">
                    <span className="fw-bold text-dark small lh-1">{user.name}</span>
                    <span className="text-secondary" style={{ fontSize: '0.62rem' }}>
                      {user.role === 'STUDENT' ? '🎓 Student' : user.role === 'MENTOR' ? '👨‍🏫 Faculty' : '👑 Admin'}
                    </span>
                  </div>
                </div>

                <Link to={user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? '/admin/analytics' : user.role === 'MENTOR' ? '/mentor/sessions' : '/dashboard'}>
                  <Button size="sm" className="d-inline-flex align-items-center gap-1 btn-warning text-dark fw-bold py-1 px-2.5" style={{ fontSize: '0.8rem' }}>
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Enter Classroom
                  </Button>
                </Link>

                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="text-decoration-none">
                  <Button variant="ghost" size="sm" className="fw-semibold text-dark py-1 px-2.5 border" style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }}>
                    <GraduationCap className="h-4 w-4 me-1 text-warning" />
                    Student Login
                  </Button>
                </Link>
                <Link to="/register" className="text-decoration-none">
                  <Button size="sm" className="fw-bold btn-warning text-dark py-1 px-3" style={{ fontSize: '0.82rem' }}>
                    Enroll Free Trial
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 3. Logged-in Student Quick Banner */}
      {isAuthenticated && user && (
        <div className="w-100 py-2 px-3 border-bottom" style={{ backgroundColor: '#fefce8', borderColor: '#fef08a' }}>
          <div className="container max-w-7xl d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2 text-start">
              <Sparkles className="h-4 w-4 text-warning shrink-0" />
              <span className="small" style={{ fontSize: '0.82rem', color: '#78350f' }}>
                Welcome back, <strong style={{ color: '#0f172a' }}>{user.name}</strong>! Your teaching exam portal is active. Attend today's live classes & attempt DPPs.
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link to="/dashboard/sessions" className="btn btn-sm btn-warning text-dark fw-bold py-1 px-2.5" style={{ fontSize: '0.75rem' }}>
                🔴 Join Live Classes
              </Link>
              <Link to="/student/tests" className="btn btn-sm btn-outline-secondary py-1 px-2.5" style={{ fontSize: '0.75rem' }}>
                📝 Solve DPP / Mock Tests
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Compact Hero Section */}
      <section className="container py-4 text-center position-relative my-1" style={{ zIndex: 10, maxWidth: '980px' }}>
        <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill border border-warning bg-white text-dark mb-3 shadow-sm" style={{ fontSize: '0.78rem' }}>
          <Flame className="h-3.5 w-3.5 text-warning" />
          <span className="fw-bold" style={{ color: '#0f172a' }}>Your Journey to Becoming a Government Teacher Starts Here</span>
        </div>

        <h1 className="fw-black display-5 mb-2 font-display" style={{ lineHeight: 1.2, color: '#0f172a' }}>
          Master Teaching Recruitment Exams with{' '}
          <span style={{ color: '#d97706' }}>
            Vishakha Ma'am
          </span>
        </h1>

        <p className="lead mx-auto mb-3" style={{ maxWidth: '780px', fontSize: '1rem', color: '#475569' }}>
          Specialized preparation for <strong>DSSSB (TGT/PGT/PRT), CTET, KVS, BPSC TRE & State TETs</strong>. Experience 2-way live classes, Mathematics shortcut tricks, NCERT pedagogy, daily DPPs & full-length CBT test series.
        </p>

        {/* Live Search Bar for Batches / Exams */}
        <div className="card p-1.5 mx-auto mb-3 shadow-sm" style={{ maxWidth: '580px', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
          <div className="input-group">
            <span className="input-group-text bg-transparent border-0 text-secondary ps-2.5 py-1">
              <Search className="h-4 w-4 text-warning" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam or subject (e.g. DSSSB, CTET, Math, KVS, BPSC)..."
              className="form-control bg-transparent border-0 py-1"
              style={{ boxShadow: 'none', fontSize: '0.85rem', color: '#0f172a' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-link text-secondary text-decoration-none small py-1"
                style={{ fontSize: '0.75rem' }}
              >
                Clear
              </button>
            )}
            <a href="#batches" className="btn btn-warning text-dark px-3 py-1 d-flex align-items-center gap-1 fw-bold" style={{ fontSize: '0.82rem' }}>
              Explore
            </a>
          </div>
        </div>

        {/* Quick CTA Actions */}
        <div className="d-flex flex-wrap justify-content-center gap-2.5 mb-4">
          <a href="#batches" className="btn btn-warning text-dark btn-md px-3.5 py-2 d-inline-flex align-items-center gap-1.5 shadow-sm fw-bold" style={{ fontSize: '0.85rem' }}>
            <BookOpen className="h-4 w-4" /> Browse Batches <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <a href="#demo" className="btn btn-outline-secondary btn-md px-3.5 py-2 d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.85rem' }}>
            <PlayCircle className="h-4 w-4 text-success" /> Free Demo Classes
          </a>
          <a href="https://youtube.com/@vishakhamam_official?si=W5qeCXK7eIMw1orG" target="_blank" rel="noreferrer" className="btn btn-outline-danger btn-md px-3.5 py-2 d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.85rem' }}>
            <YouTubeIcon size={16} /> YouTube Channel
          </a>
        </div>

        {/* Highlight Stats Strip */}
        <div className="row g-2 pt-3 border-top text-center" style={{ borderColor: '#e2e8f0' }}>
          <div className="col-6 col-md-3">
            <div className="fs-4 fw-black text-warning font-display">1,00,000+</div>
            <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Teaching Community</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="fs-4 fw-black text-success font-display">5,000+</div>
            <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Selected Teachers</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="fs-4 fw-black text-primary font-display">100% NCERT</div>
            <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Exam Oriented Syllabus</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="fs-4 fw-black font-display" style={{ color: '#0f172a' }}>4.96 / 5.0</div>
            <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Student Rating</div>
          </div>
        </div>
      </section>



      {/* 5. Authentic Indian EdTech Batch Cards Section */}
      <section id="batches" className="container py-4 border-top position-relative" style={{ borderColor: '#e2e8f0', zIndex: 10 }}>
        <div className="text-center mb-3">
          <div className="d-inline-flex align-items-center gap-1 px-2.5 py-0.5 rounded-pill bg-warning bg-opacity-20 text-dark border border-warning text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem' }}>
            <BookOpen className="h-3 w-3 text-warning" /> Target Batches 2026-27
          </div>
          <h2 className="fs-2 fw-black font-display mb-1" style={{ color: '#0f172a' }}>Target Batches by Vishakha Ma'am</h2>
          <p className="text-secondary small max-w-xl mx-auto mb-3" style={{ fontSize: '0.82rem' }}>
            Choose your target recruitment exam. Every batch includes full live syllabus video classes, chapter-wise DPPs, test series, and doubt clearing.
          </p>

          {/* Category Filter Pills */}
          <div className="d-flex flex-wrap justify-content-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm rounded-pill px-2.5 py-1 transition-all ${
                  selectedCategory === cat
                    ? 'btn-warning text-dark shadow fw-bold'
                    : 'btn-outline-secondary text-secondary'
                }`}
                style={{ fontSize: '0.75rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Batch Cards Grid */}
        <div className="row g-3 mt-1">
          {filteredBatches.length > 0 ? (
            filteredBatches.map((batch) => (
              <div key={batch.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border rounded-4 overflow-hidden shadow-sm d-flex flex-column card-hover" style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#e2e8f0' }}>
                  {/* Top Colored Poster Header */}
                  <div className="p-3 position-relative d-flex flex-column justify-content-between" style={{ background: batch.bannerBg, minHeight: '135px' }}>
                    {/* Top Banner Row */}
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge text-dark bg-white bg-opacity-85 border border-dark border-opacity-10 py-1 px-2 text-truncate fw-semibold" style={{ fontSize: '0.64rem', maxWidth: '82%' }}>
                        {batch.bannerPillText}
                      </span>
                      <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '22px', height: '22px' }}>
                        <Send className="h-3 w-3 text-success" />
                      </div>
                    </div>

                    {/* Middle Banner Row with Title & Faculty Group Visual */}
                    <div className="d-flex justify-content-between align-items-end mt-auto">
                      <div className="pe-2 text-start">
                        <div className="fw-black font-display text-uppercase" style={{ color: batch.bannerTextColor, fontSize: '1.2rem', lineHeight: '1.05', letterSpacing: '-0.02em' }}>
                          {batch.bannerTitle}
                        </div>
                        {batch.bannerSubtitle && (
                          <span className="badge mt-1 text-white bg-dark bg-opacity-75 fw-bold" style={{ fontSize: '0.62rem' }}>
                            {batch.bannerSubtitle}
                          </span>
                        )}
                      </div>

                      {/* Faculty Avatars Group Collage */}
                      <div className="d-flex align-items-center shrink-0">
                        {batch.faculty.map((f, i) => (
                          <img
                            key={i}
                            src={f.avatar}
                            alt={f.name}
                            className="rounded-circle object-fit-cover border border-2 border-white shadow-sm"
                            style={{ width: '38px', height: '38px', marginLeft: i > 0 ? '-12px' : '0' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 d-flex flex-column flex-grow-1 text-start" style={{ backgroundColor: '#ffffff' }}>
                    {/* Category Tag & Language Badge */}
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <span className="fw-bold" style={{ color: '#ea580c', fontSize: '0.82rem' }}>
                        {batch.categoryTag}
                      </span>
                      <span className="badge text-dark border border-secondary-subtle px-2 py-0.5 text-uppercase fw-semibold" style={{ fontSize: '0.65rem', backgroundColor: '#f8fafc' }}>
                        {batch.language}
                      </span>
                    </div>

                    {/* Main Batch Name */}
                    <h4 className="fw-bold mb-1.5 text-dark" style={{ fontSize: '0.95rem', lineHeight: '1.25', minHeight: '38px' }}>
                      {batch.name}
                    </h4>

                    {/* Target/Subtitle with Book Icon */}
                    <div className="d-flex align-items-center gap-1.5 text-secondary mb-1" style={{ fontSize: '0.76rem' }}>
                      <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: '#64748b' }} />
                      <span className="text-truncate">{batch.targetText}</span>
                    </div>

                    {/* Dates line with Calendar/Clock Icon */}
                    <div className="d-flex align-items-center gap-1.5 text-secondary mb-3" style={{ fontSize: '0.74rem' }}>
                      <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: '#64748b' }} />
                      <span className="text-truncate">{batch.dateText}</span>
                    </div>

                    {/* Bottom Pricing & Action Row */}
                    <div className="mt-auto pt-2.5 border-top border-light-subtle d-flex justify-content-between align-items-center">
                      <div>
                        <div className="d-flex align-items-baseline gap-1.5">
                          <span className="fw-black text-dark font-display" style={{ fontSize: '1.15rem' }}>₹{batch.price.toLocaleString()}</span>
                          <span className="text-secondary text-decoration-line-through" style={{ fontSize: '0.72rem' }}>₹{batch.originalPrice.toLocaleString()}</span>
                        </div>
                        <div className="fw-bold" style={{ color: '#16a34a', fontSize: '0.72rem' }}>
                          {batch.discount}
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-1">
                        <button
                          onClick={() => setSelectedBatchModal(batch)}
                          className="btn btn-dark text-white fw-bold py-1.5 px-3 rounded-2 shadow-sm"
                          style={{ fontSize: '0.78rem', backgroundColor: '#0f172a' }}
                        >
                          {batch.btnText || 'Select Plan'}
                        </button>
                        <button
                          onClick={() => setSelectedBatchModal(batch)}
                          className="btn btn-outline-dark py-1.5 px-2 rounded-2 d-inline-flex align-items-center justify-content-center"
                          style={{ fontSize: '0.78rem', width: '32px' }}
                          title="View Syllabus & Modules"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-4">
              <p className="text-secondary small">No batches match your filter "{searchQuery}".</p>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="btn btn-sm btn-outline-warning py-1 px-3" style={{ fontSize: '0.75rem' }}>
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 6. Professional Faculty Section */}
      <section id="faculty" className="container py-4 border-top position-relative" style={{ borderColor: '#e2e8f0', zIndex: 10 }}>
        <div className="text-center mb-3">
          <div className="d-inline-flex align-items-center gap-1 px-2.5 py-0.5 rounded-pill bg-warning bg-opacity-20 text-dark border border-warning text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem' }}>
            <Award className="h-3 w-3 text-warning" /> Master Educators & Mentors
          </div>
          <h2 className="fs-2 fw-black font-display mb-1" style={{ color: '#0f172a' }}>Meet Vishakha Ma'am & Star Faculty</h2>
          <p className="text-secondary small max-w-xl mx-auto mb-3" style={{ fontSize: '0.82rem' }}>
            Learn from India's trusted teaching mentors with decades of proven selections across DSSSB, CTET, KVS, BPSC & State TETs.
          </p>
        </div>

        <div className="row g-3">
          {facultiesList.map((faculty, idx) => (
            <div key={idx} className="col-12 col-md-4">
              <div className="card h-100 border rounded-4 overflow-hidden shadow-sm d-flex flex-column card-hover" style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#e2e8f0' }}>
                {/* Top Poster Header */}
                <div className="p-3 position-relative d-flex flex-column justify-content-between" style={{ background: faculty.bannerBg, minHeight: '125px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge text-dark bg-white bg-opacity-85 border border-dark border-opacity-10 py-1 px-2 fw-bold" style={{ fontSize: '0.64rem' }}>
                      {faculty.badge}
                    </span>
                    <span className="badge bg-dark text-warning fw-bold px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                      {faculty.tag}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2.5 mt-auto">
                    <img
                      src={faculty.avatar}
                      alt={faculty.name}
                      className="rounded-circle object-fit-cover border border-2 border-white shadow-sm"
                      style={{ width: '48px', height: '48px' }}
                    />
                    <div className="overflow-hidden text-start">
                      <div className="d-flex align-items-center gap-1">
                        <h4 className="fw-black text-dark mb-0 font-display fs-6 text-truncate">{faculty.name}</h4>
                        <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                      </div>
                      <div className="fw-semibold text-truncate" style={{ color: faculty.bannerTextColor, fontSize: '0.72rem' }}>
                        {faculty.role}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 d-flex flex-column flex-grow-1 text-start" style={{ backgroundColor: '#ffffff' }}>
                  {/* Qualification */}
                  <div className="text-secondary small mb-2 text-truncate-2" style={{ fontSize: '0.74rem', lineHeight: '1.35', minHeight: '34px' }}>
                    🎓 <strong>Credentials:</strong> <span className="text-dark">{faculty.qualification}</span>
                  </div>

                  {/* Specialization Chips */}
                  <div className="d-flex flex-wrap gap-1 mb-2.5">
                    {faculty.specialty.map((spec, i) => (
                      <span key={i} className="badge text-dark border border-secondary-subtle px-2 py-0.5 fw-semibold" style={{ fontSize: '0.65rem', backgroundColor: '#f8fafc' }}>
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Stats Row */}
                  <div className="p-2 rounded-2 border border-secondary-subtle d-flex justify-content-between align-items-center mb-3" style={{ backgroundColor: '#f8fafc' }}>
                    <div>
                      <div className="text-secondary" style={{ fontSize: '0.62rem' }}>Selected Aspirants</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.78rem' }}>{faculty.studentsTaught}</div>
                    </div>
                    <div className="text-end">
                      <div className="text-secondary" style={{ fontSize: '0.62rem' }}>Student Rating</div>
                      <div className="fw-bold text-warning" style={{ fontSize: '0.78rem' }}>{faculty.rating}</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto pt-2 border-top border-light-subtle">
                    <a
                      href="#demo"
                      className="btn btn-dark w-100 fw-bold py-1.5 px-3 rounded-2 shadow-sm d-inline-flex align-items-center justify-content-center gap-1.5"
                      style={{ fontSize: '0.78rem', backgroundColor: '#0f172a' }}
                    >
                      <PlayCircle className="h-3.5 w-3.5 text-warning" /> Watch Free Demo Masterclass
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Live Classes Timetable Section */}
      <section id="schedule" className="container py-4 border-top position-relative" style={{ borderColor: '#e2e8f0', zIndex: 10 }}>
        <div className="text-center mb-3">
          <div className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 text-uppercase fw-bold mb-1 shadow-sm" style={{ fontSize: '0.72rem' }}>
            <Clock className="h-3 w-3 text-danger" /> 🔴 Live Class Timetable Today
          </div>
          <h2 className="fs-2 fw-black font-display mb-1" style={{ color: '#0f172a' }}>Today's Live Classes & Schedule</h2>
          <p className="text-secondary small max-w-xl mx-auto mb-3" style={{ fontSize: '0.82rem' }}>
            Join live 2-way audio & video sessions with Vishakha Ma'am. Free trial preview open for all aspirants.
          </p>
        </div>

        <div className="row g-3">
          {todaySchedule.map((cls, idx) => (
            <div key={idx} className="col-12 col-md-4">
              <div className="card h-100 border rounded-4 overflow-hidden shadow-sm d-flex flex-column card-hover" style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#e2e8f0' }}>
                {/* Top Status Header */}
                <div className="p-2.5 px-3 d-flex justify-content-between align-items-center border-bottom border-light-subtle" style={{ backgroundColor: '#f8fafc' }}>
                  {cls.isLive ? (
                    <span className="badge bg-danger text-white fw-bold px-2 py-1 animate-pulse" style={{ fontSize: '0.68rem' }}>
                      🔴 {cls.status}
                    </span>
                  ) : (
                    <span className="badge bg-secondary text-white fw-bold px-2 py-1" style={{ fontSize: '0.68rem' }}>
                      🕒 {cls.status}
                    </span>
                  )}
                  <span className="badge text-dark border border-secondary-subtle px-2 py-0.5 fw-bold" style={{ fontSize: '0.68rem', backgroundColor: '#e2e8f0' }}>
                    {cls.subject}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-3 d-flex flex-column flex-grow-1 text-start" style={{ backgroundColor: '#ffffff' }}>
                  <h4 className="fw-bold text-dark mb-2" style={{ fontSize: '0.92rem', lineHeight: '1.3', minHeight: '44px' }}>
                    {cls.topic}
                  </h4>

                  {/* Teacher Row */}
                  <div className="d-flex align-items-center gap-2 p-2 rounded-2 border border-secondary-subtle mb-3" style={{ backgroundColor: '#f8fafc' }}>
                    <img
                      src={cls.teacherAvatar}
                      alt={cls.teacher}
                      className="rounded-circle object-fit-cover border border-1 border-warning"
                      style={{ width: '32px', height: '32px' }}
                    />
                    <div className="overflow-hidden">
                      <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.78rem' }}>{cls.teacher}</div>
                      <div className="text-secondary text-truncate" style={{ fontSize: '0.68rem' }}>
                        🕒 <strong className="text-danger">{cls.time}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto pt-2 border-top border-light-subtle">
                    {cls.isDemoFree ? (
                      <Link
                        to="/register"
                        className="btn btn-warning text-dark w-100 fw-bold py-1.5 px-3 rounded-2 shadow-sm d-inline-flex align-items-center justify-content-center gap-1.5"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <PlayCircle className="h-4 w-4" /> Join Live Free Preview
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        className="btn btn-dark text-white w-100 py-1.5 px-3 rounded-2 shadow-sm"
                        style={{ fontSize: '0.78rem', backgroundColor: '#0f172a' }}
                      >
                        Enrolled Students Portal
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Free Study Material & Demo Lecture Studio */}
      <section id="demo" className="container py-4 border-top position-relative" style={{ borderColor: '#e2e8f0', zIndex: 10 }}>
        <div className="row g-4 align-items-center">
          <div className="col-12 col-lg-6 text-start">
            <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success px-2.5 py-0.5 text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.72rem' }}>
              Free Learning Resources
            </span>
            <h2 className="fs-3 fw-black font-display mb-2" style={{ color: '#0f172a' }}>
              Watch Demo Classes & Download Notes
            </h2>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.82rem' }}>
              Test Vishakha Ma'am's teaching methodology and shortcut techniques before enrolling. Access free video masterclasses and handwritten formula notes.
            </p>

            <div className="d-flex flex-column gap-2 mb-3">
              <div className="card p-2.5 border d-flex flex-row align-items-center justify-content-between gap-2 shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-2 overflow-hidden">
                  <div className="p-1.5 bg-warning bg-opacity-20 rounded-2 text-warning shrink-0">
                    <Video className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.78rem' }}>DSSSB TGT Mathematics: Calculus Tricks</div>
                    <div className="text-secondary text-truncate" style={{ fontSize: '0.68rem' }}>Vishakha Ma'am (50 Mins Complete Concept)</div>
                  </div>
                </div>
                <button
                  onClick={() => setDemoVideoPlaying('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')}
                  className="btn btn-sm btn-outline-warning py-0.5 px-2 shrink-0 fw-bold"
                  style={{ fontSize: '0.72rem' }}
                >
                  ▶ Watch
                </button>
              </div>

              <div className="card p-2.5 border d-flex flex-row align-items-center justify-content-between gap-2 shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-2 overflow-hidden">
                  <div className="p-1.5 bg-success bg-opacity-20 rounded-2 text-success shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.78rem' }}>CTET 2026 Math Pedagogy Handout</div>
                    <div className="text-secondary text-truncate" style={{ fontSize: '0.68rem' }}>Vishakha Ma'am (Handwritten PDF Notes)</div>
                  </div>
                </div>
                <Link to="/register" className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 py-0.5 px-2 shrink-0 fw-bold" style={{ fontSize: '0.72rem' }}>
                  <Download className="h-3 w-3" /> PDF
                </Link>
              </div>

              <div className="card p-2.5 border d-flex flex-row align-items-center justify-content-between gap-2 shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-2 overflow-hidden">
                  <div className="p-1.5 bg-primary bg-opacity-20 rounded-2 text-primary shrink-0">
                    <Video className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.78rem' }}>DSSSB & KVS 40-Day Strategy</div>
                    <div className="text-secondary text-truncate" style={{ fontSize: '0.68rem' }}>Vishakha Ma'am (Cutoff & Strategy)</div>
                  </div>
                </div>
                <button
                  onClick={() => setDemoVideoPlaying('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4')}
                  className="btn btn-sm btn-outline-primary py-0.5 px-2 shrink-0 fw-bold"
                  style={{ fontSize: '0.72rem' }}
                >
                  ▶ Watch
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Video Player */}
          <div className="col-12 col-lg-6">
            <div className="card p-2.5 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-1.5 px-1">
                <div className="fw-bold text-dark d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
                  <PlayCircle className="h-3.5 w-3.5 text-warning" /> Vishakha Ma'am Demo Player
                </div>
                <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.62rem' }}>HD 1080p Preview</span>
              </div>
              <div className="ratio ratio-16x9 rounded-2 overflow-hidden border bg-black" style={{ borderColor: '#e2e8f0' }}>
                <video
                  controls
                  src={demoVideoPlaying || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                  poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
              <div className="mt-1.5 text-secondary text-center" style={{ fontSize: '0.7rem' }}>
                💡 Click any demo class on the left to preview.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Results & Success Stories */}
      <section id="results" className="container py-4 border-top position-relative" style={{ borderColor: '#e2e8f0', zIndex: 10 }}>
        <div className="text-center mb-3">
          <span className="badge rounded-pill bg-info bg-opacity-10 text-info border border-info px-2.5 py-0.5 text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem' }}>
            Success Stories
          </span>
          <h2 className="fs-2 fw-black font-display mb-1" style={{ color: '#0f172a' }}>Our Selected Government Teachers</h2>
          <p className="text-secondary small max-w-xl mx-auto mb-3" style={{ fontSize: '0.82rem' }}>
            Meet students of Vishakha Ma'am who cracked DSSSB, CTET, KVS and BPSC TRE.
          </p>
        </div>

        <div className="row g-2.5">
          {toppersTestimonials.map((topper, idx) => (
            <div key={idx} className="col-12 col-md-4">
              <div className="card h-100 p-3 border card-hover text-start shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-2.5 mb-2">
                  <img
                    src={topper.avatar}
                    alt={topper.name}
                    className="rounded-circle border border-2 border-warning object-fit-cover"
                    style={{ width: '42px', height: '42px' }}
                  />
                  <div className="overflow-hidden">
                    <h5 className="fw-bold mb-0 text-truncate" style={{ fontSize: '0.82rem', color: '#0f172a' }}>{topper.name}</h5>
                    <div className="fw-bold text-truncate" style={{ fontSize: '0.72rem', color: '#d97706' }}>{topper.rank}</div>
                    <div className="text-secondary text-truncate" style={{ fontSize: '0.65rem' }}>{topper.college}</div>
                  </div>
                </div>
                <p className="text-secondary mb-0 fst-italic" style={{ fontSize: '0.76rem', lineHeight: '1.4' }}>
                  "{topper.quote}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. FAQ Section */}
      <section className="container py-4 border-top position-relative" style={{ borderColor: '#e2e8f0', zIndex: 10, maxWidth: '760px' }}>
        <div className="text-center mb-3">
          <h2 className="fs-3 fw-black font-display mb-1" style={{ color: '#0f172a' }}>Frequently Asked Questions</h2>
          <p className="text-secondary small mb-3" style={{ fontSize: '0.82rem' }}>Common questions regarding batches, notes, and timetable.</p>
        </div>

        <div className="d-flex flex-column gap-2 text-start">
          {[
            {
              q: 'Can I view batches and teacher information without signing in?',
              a: 'Yes! All batch curricula, syllabi, demo lectures, and faculty profiles by Vishakha Ma\'am are publicly open to everyone. You only need to log in to participate in live classes, submit DPPs, and take online mock tests.'
            },
            {
              q: 'What if I miss a live lecture by Vishakha Ma\'am?',
              a: 'Every live session is recorded in Full HD and uploaded to your student portal along with handwritten PDF annotations and class notes within 2 hours of the class.'
            },
            {
              q: 'How does doubt solving work for Mathematics & Pedagogy?',
              a: 'During live classes, students can ask questions directly via 2-way audio or live chat. You also get access to the dedicated Telegram Doubt Forum (@vishakhamaam16) with 24x7 mentor support.'
            },
            {
              q: 'Where do administrators and faculty manage the classes and batches?',
              a: 'Educators and administrators have a dedicated, secure Admin & Faculty Portal accessible via the link at the bottom of the website or at /admin/login.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => toggleFaq(idx)}
              className="card p-2.5 border cursor-pointer shadow-sm"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <span className="fw-bold" style={{ fontSize: '0.82rem', color: '#0f172a' }}>{item.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="h-3.5 w-3.5 text-warning shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-secondary shrink-0" />
                )}
              </div>
              {openFaq === idx && (
                <p className="text-secondary small mt-1.5 mb-0 pt-1.5 border-top" style={{ fontSize: '0.75rem', lineHeight: '1.4', borderColor: '#f1f5f9' }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 11. Dedicated Bottom Admin & Faculty Management Portal Banner */}
      <section className="w-100 py-3 border-top position-relative" style={{ backgroundColor: '#fefce8', borderColor: '#fde68a', zIndex: 10 }}>
        <div className="container max-w-7xl d-flex flex-column flex-md-row justify-content-between align-items-center gap-2.5 text-center text-md-start">
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 rounded-3 text-dark bg-warning shadow-sm shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0 font-display fs-6" style={{ color: '#78350f' }}>Institute Faculty & Admin Management Portal</h4>
                <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.62rem' }}>Admin Console</span>
              </div>
              <p className="small mb-0" style={{ fontSize: '0.76rem', color: '#92400e' }}>
                Authorized access for Vishakha Ma'am and administration team to manage batches, schedule live sessions & analyze tests.
              </p>
            </div>
          </div>

          <Link to="/admin/login" className="btn btn-warning text-dark fw-bold px-3 py-1.5 shadow-sm d-inline-flex align-items-center gap-1.5 shrink-0" style={{ fontSize: '0.8rem' }}>
            <Shield className="h-3.5 w-3.5" />
            Access Admin Portal <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* 12. Clean Professional Footer */}
      <footer className="mt-auto border-top py-4 text-secondary small position-relative" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', zIndex: 10 }}>
        <div className="container max-w-7xl">
          <div className="row g-3 mb-3 text-start">
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-2 mb-1.5">
                <div className="p-1 rounded-2 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  <GraduationCap className="h-3.5 w-3.5 text-dark" />
                </div>
                <span className="fw-black fs-6 tracking-tight font-display" style={{ color: '#0f172a' }}>
                  Vishakha Ma'am<span style={{ color: '#d97706' }}> Official</span>
                </span>
              </div>
              <p className="text-secondary mb-2" style={{ fontSize: '0.74rem', lineHeight: '1.4' }}>
                India's leading online platform for Teaching Exams: DSSSB TGT/PGT, CTET, KVS, BPSC TRE, and UP TGT/PGT.
              </p>
              <div className="d-flex flex-column gap-1.5" style={{ fontSize: '0.74rem' }}>
                <a href="https://youtube.com/@vishakhamam_official?si=W5qeCXK7eIMw1orG" target="_blank" rel="noreferrer" className="text-danger text-decoration-none d-inline-flex align-items-center gap-1.5 fw-semibold">
                  <YouTubeIcon size={16} /> <span className="text-truncate">YouTube: @vishakhamam_official</span>
                </a>
                <a href="https://t.me/vishakhamaam16" target="_blank" rel="noreferrer" className="text-primary text-decoration-none d-inline-flex align-items-center gap-1.5 fw-semibold">
                  <Send className="h-3.5 w-3.5" /> <span className="text-truncate">Telegram: @vishakhamaam16</span>
                </a>
              </div>
            </div>

            <div className="col-6 col-md-2">
              <h6 className="fw-bold text-uppercase mb-2" style={{ fontSize: '0.72rem', color: '#0f172a' }}>Teaching Exams</h6>
              <div className="d-flex flex-column gap-1" style={{ fontSize: '0.74rem' }}>
                <a href="#batches" className="text-secondary text-decoration-none hover-primary">Teaching Mahapack</a>
                <a href="#batches" className="text-secondary text-decoration-none hover-primary">BPSC TRE Mahapack</a>
                <a href="#batches" className="text-secondary text-decoration-none hover-primary">SUPER TET 2.0</a>
                <a href="#batches" className="text-secondary text-decoration-none hover-primary">DSSSB TGT/PGT Math</a>
                <a href="#batches" className="text-secondary text-decoration-none hover-primary">CTET Paper 1 & 2</a>
              </div>
            </div>

            <div className="col-6 col-md-2">
              <h6 className="fw-bold text-uppercase mb-2" style={{ fontSize: '0.72rem', color: '#0f172a' }}>Student Portal</h6>
              <div className="d-flex flex-column gap-1" style={{ fontSize: '0.74rem' }}>
                <Link to="/login" className="text-secondary text-decoration-none hover-primary">Student Sign In</Link>
                <Link to="/register" className="text-secondary text-decoration-none hover-primary">Enroll Free Trial</Link>
                <Link to="/pricing" className="text-secondary text-decoration-none hover-primary">Fee Structure</Link>
                <a href="#schedule" className="text-secondary text-decoration-none hover-primary">Daily Timetable</a>
                <a href="#demo" className="text-secondary text-decoration-none hover-primary">Free PDF Notes</a>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <h6 className="fw-bold text-uppercase mb-2" style={{ fontSize: '0.72rem', color: '#0f172a' }}>Staff & Faculty Portal</h6>
              <p className="text-secondary mb-2" style={{ fontSize: '0.74rem', lineHeight: '1.4' }}>
                Administrators and educators can log in here to schedule live sessions, manage students, update batches & review test scorecards.
              </p>
              <Link to="/admin/login" className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1 py-1 px-2.5 fw-bold" style={{ fontSize: '0.74rem' }}>
                <Shield className="h-3 w-3" />
                Staff & Admin Portal Login →
              </Link>
            </div>
          </div>

          <div className="pt-3 border-top d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 text-center text-sm-start" style={{ fontSize: '0.74rem', borderColor: '#e2e8f0' }}>
            <span>© {new Date().getFullYear()} Vishakha Ma'am Official Academy. All rights reserved.</span>
            <div className="d-flex gap-3">
              <Link to="/pricing" className="text-secondary text-decoration-none">Pricing</Link>
              <Link to="/login" className="text-secondary text-decoration-none">Student Login</Link>
              <Link to="/admin/login" className="text-warning text-decoration-none fw-semibold">Admin Login</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 13. Batch Details & Full Syllabus Modal */}
      {selectedBatchModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border text-dark p-3 shadow-lg" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <div className="modal-header pb-2.5" style={{ borderColor: '#f1f5f9' }}>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.7rem' }}>
                      {selectedBatchModal.bannerTitle}
                    </span>
                    <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>{selectedBatchModal.categoryTag}</span>
                  </div>
                  <h4 className="modal-title fw-bold font-display fs-5" style={{ color: '#0f172a' }}>{selectedBatchModal.name}</h4>
                  <div className="text-secondary small" style={{ fontSize: '0.78rem' }}>{selectedBatchModal.targetText}</div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedBatchModal(null)}
                />
              </div>

              <div className="modal-body py-2.5">
                {/* Faculty Team */}
                <h6 className="fw-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', color: '#0f172a' }}>Assigned Master Faculty Team:</h6>
                <div className="row g-2 mb-3">
                  {selectedBatchModal.faculty.map((f: any, idx: number) => (
                    <div key={idx} className="col-12 col-sm-6">
                      <div className="d-flex align-items-center gap-2 p-2 rounded-2 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                        <img src={f.avatar} alt={f.name} className="rounded-circle object-fit-cover" style={{ width: '36px', height: '36px' }} />
                        <div className="overflow-hidden">
                          <div className="fw-bold small text-truncate" style={{ color: '#0f172a' }}>{f.name}</div>
                          <div className="text-warning text-truncate fw-semibold" style={{ fontSize: '0.7rem', color: '#d97706' }}>{f.role}</div>
                          <div className="text-secondary text-truncate" style={{ fontSize: '0.65rem' }}>{f.experience}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modules Syllabus */}
                <h6 className="fw-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', color: '#0f172a' }}>Curriculum & Syllabus Modules:</h6>
                <div className="d-flex flex-column gap-1.5 mb-3">
                  {selectedBatchModal.modules.map((m: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-2 border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.65rem' }}>{idx + 1}</span>
                        <span className="small fw-bold text-truncate" style={{ fontSize: '0.78rem', color: '#0f172a' }}>{m.name}</span>
                      </div>
                      <div className="small text-secondary shrink-0" style={{ fontSize: '0.7rem' }}>
                        <span className="fw-bold text-warning" style={{ color: '#d97706' }}>{m.lectures}</span> ({m.duration})
                      </div>
                    </div>
                  ))}
                </div>

                {/* Features & Inclusions */}
                <h6 className="fw-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', color: '#0f172a' }}>Batch Inclusions:</h6>
                <div className="row g-1.5">
                  {selectedBatchModal.features.map((feat: string, idx: number) => (
                    <div key={idx} className="col-12 col-sm-6">
                      <div className="d-flex align-items-start gap-1.5 text-secondary" style={{ fontSize: '0.75rem' }}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                        <span style={{ color: '#334155' }}>{feat}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer pt-2.5 d-flex justify-content-between" style={{ borderColor: '#f1f5f9' }}>
                <div>
                  <span className="fs-5 fw-black text-warning font-display" style={{ color: '#d97706' }}>₹{selectedBatchModal.price.toLocaleString()}</span>
                  <span className="text-secondary text-decoration-line-through ms-1.5 small" style={{ fontSize: '0.72rem' }}>₹{selectedBatchModal.originalPrice.toLocaleString()}</span>
                  <span className="badge bg-success bg-opacity-10 text-success border border-success ms-1.5" style={{ fontSize: '0.65rem' }}>{selectedBatchModal.discount}</span>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm py-1 px-3" onClick={() => setSelectedBatchModal(null)} style={{ fontSize: '0.75rem' }}>
                    Close
                  </button>
                  <Link
                    to="/register"
                    className="btn btn-warning text-dark btn-sm fw-bold px-3 py-1 d-inline-flex align-items-center gap-1"
                    onClick={() => setSelectedBatchModal(null)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Enroll in this Batch <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Landing;
