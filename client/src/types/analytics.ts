export interface IAdminAnalyticsData {
  users: {
    total: number;
    students: number;
    mentors: number;
  };
  academic: {
    batches: number;
    courses: number;
    activeEnrollments: number;
    certificatesIssued: number;
  };
  examinations: {
    totalAttempts: number;
    averageScore: number;
    averagePercentage: number;
  };
  attendance: {
    totalRecords: number;
    rate: number;
    breakdown: {
      PRESENT: number;
      ABSENT: number;
      LATE: number;
      EXCUSED: number;
    };
  };
  assignments: {
    totalAssignments: number;
    totalSubmissions: number;
  };
  finance: {
    grossRevenue: number;
    successfulPayments: number;
  };
}

export interface IStudentAnalyticsData {
  enrolledCount: number;
  courses: Array<{
    batchName: string;
    courseTitle: string;
    progress?: number;
  }>;
  tests: {
    attempted: number;
    passed: number;
    passRate: number;
    avgScorePercentage: number;
  };
  assignments: {
    submitted: number;
    graded: number;
    avgMarks: number;
  };
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    percentage: number;
  };
  certificatesCount: number;
}

export interface IMentorAnalyticsData {
  batches: {
    count: number;
    list: Array<{
      _id: string;
      name: string;
      code: string;
    }>;
  };
  students: {
    totalMentored: number;
  };
  sessions: {
    total: number;
    completed: number;
    scheduled: number;
  };
  evaluations: {
    testsCreated: number;
    pendingAssignmentReviews: number;
  };
}

export interface IBatchAnalyticsData {
  batch: {
    _id: string;
    name: string;
    code: string;
    course: string;
    mentor: string;
  };
  students: {
    total: number;
    active: number;
  };
  attendance: {
    rate: number;
    breakdown: {
      PRESENT: number;
      ABSENT: number;
      LATE: number;
      EXCUSED: number;
    };
    totalRecords: number;
  };
  performance: {
    totalTestAttempts: number;
    avgTestPercentage: number;
    testPassRate: number;
  };
}
