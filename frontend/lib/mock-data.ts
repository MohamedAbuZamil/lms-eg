import type { User, Course, Section, Lesson, Assessment, Enrollment } from './types';

// ─── Mock User ────────────────────────────────────────────────────────────────
export const MOCK_USER: User = {
  id: 'u1',
  name: 'حسن النجار',
  email: 'hassan@lms-eg.com',
  mobile: '01012345678',
  role: 'TEACHER',
  createdAt: '2024-01-01T00:00:00Z',
};

export const MOCK_STUDENT: User = {
  id: 'u2',
  name: 'أحمد محمد',
  email: 'ahmed@lms-eg.com',
  mobile: '01098765432',
  role: 'STUDENT',
  createdAt: '2024-01-15T00:00:00Z',
};

// ─── Mock Courses ─────────────────────────────────────────────────────────────
export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Course 1: Unit 7, Unit 8, King Lear and Unit 9',
    description: 'كورس شامل لوحدات اللغة الإنجليزية',
    teacherId: 'u1',
    price: 350,
    createdAt: '2025-02-05T00:00:00Z',
    updatedAt: '2025-02-05T00:00:00Z',
  },
  {
    id: 'c2',
    title: 'Course 1: Unit 7, Unit 8 (Part 1), Unit 8 (Part 2) and Treasure Island',
    description: 'تغطية كاملة لوحدات الترم الأول',
    teacherId: 'u1',
    price: 300,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'c3',
    title: "Course 7: Characters' Study, Be Perfect (9-10-11), Unit 10 Part 1 and Second Experimental Exam (3rd)",
    description: 'استعداد شامل للامتحانات التجريبية',
    teacherId: 'u1',
    price: 400,
    createdAt: '2025-01-07T00:00:00Z',
    updatedAt: '2025-01-07T00:00:00Z',
  },
  {
    id: 'c4',
    title: 'Course 6: Unit 8 (Part 1), Unit 8 (Part 2), Unit 9',
    description: 'مراجعة شاملة لوحدات الفصل الدراسي',
    teacherId: 'u1',
    price: 280,
    createdAt: '2024-12-15T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z',
  },
  {
    id: 'c5',
    title: 'Course 5: Unit 6, Unit 7 and Mid-Term Revision',
    description: 'مراجعة نصف الترم وتغطية الوحدات',
    teacherId: 'u1',
    price: 250,
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
];

// ─── Mock Lessons / Sections ──────────────────────────────────────────────────
export const MOCK_SECTIONS: Section[] = [
  {
    id: 's1',
    courseId: 'c1',
    title: 'Unit 8 Part 1 (10/12/2024)',
    order: 1,
    lessons: [
      {
        id: 'l1',
        sectionId: 's1',
        title: 'Homework of Unit 7',
        type: 'VIDEO',
        order: 1,
        isPreview: false,
        viewLimitEnabled: true,
        maxViews: 2,
      },
      {
        id: 'l2',
        sectionId: 's1',
        title: 'Active and Passive Voice',
        type: 'VIDEO',
        order: 2,
        isPreview: false,
        viewLimitEnabled: true,
        maxViews: 2,
      },
      {
        id: 'l3',
        sectionId: 's1',
        title: 'Reading and Language Notes of Unit 8 Part 1',
        type: 'VIDEO',
        order: 3,
        isPreview: true,
        viewLimitEnabled: true,
        maxViews: 2,
      },
      {
        id: 'l4',
        sectionId: 's1',
        title: 'Great Expectations (Chapter 11)',
        type: 'VIDEO',
        order: 4,
        isPreview: false,
        viewLimitEnabled: true,
        maxViews: 2,
      },
    ],
  },
  {
    id: 's2',
    courseId: 'c1',
    title: 'Unit 8 Part 2 (15/12/2024)',
    order: 2,
    lessons: [
      {
        id: 'l5',
        sectionId: 's2',
        title: 'Reported Speech - Full Explanation',
        type: 'VIDEO',
        order: 1,
        isPreview: true,
        viewLimitEnabled: true,
        maxViews: 2,
      },
      {
        id: 'l6',
        sectionId: 's2',
        title: 'Writing: Formal Letter',
        type: 'VIDEO',
        order: 2,
        isPreview: false,
        viewLimitEnabled: true,
        maxViews: 2,
      },
    ],
  },
  {
    id: 's3',
    courseId: 'c1',
    title: 'King Lear (22/12/2024)',
    order: 3,
    lessons: [
      {
        id: 'l7',
        sectionId: 's3',
        title: 'King Lear - Act 1 Analysis',
        type: 'VIDEO',
        order: 1,
        isPreview: false,
        viewLimitEnabled: true,
        maxViews: 2,
      },
      {
        id: 'l8',
        sectionId: 's3',
        title: 'King Lear - Important Quotes',
        type: 'VIDEO',
        order: 2,
        isPreview: false,
        viewLimitEnabled: true,
        maxViews: 2,
      },
    ],
  },
];

// ─── Mock Assessments ─────────────────────────────────────────────────────────
export const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 'a1',
    courseId: 'c1',
    title: 'Exam: Unit 7 Full Revision',
    type: 'EXAM',
    availableFrom: '2025-01-10T09:00:00Z',
    availableTo: '2025-01-10T11:00:00Z',
    durationMinutes: 90,
    answerReviewMode: 'AFTER_ASSESSMENT_END',
    passPercentage: 70,
    isPublished: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    randomizeQuestions: false,
  },
  {
    id: 'a2',
    courseId: 'c1',
    title: 'Quiz: Active & Passive Voice',
    type: 'QUIZ',
    availableFrom: '2025-01-15T09:00:00Z',
    availableTo: '2025-02-15T23:59:00Z',
    durationMinutes: 20,
    answerReviewMode: 'IMMEDIATELY_AFTER_SUBMISSION',
    passPercentage: 60,
    isPublished: true,
    shuffleQuestions: false,
    shuffleOptions: true,
    randomizeQuestions: false,
  },
  {
    id: 'a3',
    courseId: 'c1',
    title: 'Quiz: King Lear Key Scenes',
    type: 'QUIZ',
    availableFrom: '2025-01-20T09:00:00Z',
    availableTo: '2025-02-20T23:59:00Z',
    durationMinutes: 30,
    answerReviewMode: 'AFTER_ASSESSMENT_END',
    passPercentage: 65,
    isPublished: false,
    shuffleQuestions: true,
    shuffleOptions: false,
    randomizeQuestions: false,
  },
];

export const MOCK_ASSIGNMENTS: Assessment[] = [
  {
    id: 'w1',
    courseId: 'c1',
    title: 'واجب: مراجعة Unit 7',
    type: 'ASSIGNMENT',
    availableFrom: '2025-01-08T00:00:00Z',
    availableTo: '2025-01-12T23:59:00Z',
    answerReviewMode: 'NEVER',
    passPercentage: 50,
    isPublished: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    randomizeQuestions: false,
  },
  {
    id: 'w2',
    courseId: 'c1',
    title: 'واجب: Formal Letter Writing',
    type: 'ASSIGNMENT',
    availableFrom: '2025-01-18T00:00:00Z',
    availableTo: '2025-01-22T23:59:00Z',
    answerReviewMode: 'NEVER',
    passPercentage: 50,
    isPublished: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    randomizeQuestions: false,
  },
];

// ─── Mock Lesson View Progress ─────────────────────────────────────────────────
export const MOCK_LESSON_VIEWS: Record<string, { watched: number; max: number }> = {
  l1: { watched: 2, max: 2 },
  l2: { watched: 0, max: 2 },
  l3: { watched: 0, max: 2 },
  l4: { watched: 0, max: 2 },
  l5: { watched: 1, max: 2 },
  l6: { watched: 0, max: 2 },
  l7: { watched: 0, max: 2 },
  l8: { watched: 0, max: 2 },
};

// ─── Mock Questions ────────────────────────────────────────────────────────────
export interface MockQuestion {
  id: string;
  assessmentId: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation?: string;
}

export const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: 'q1', assessmentId: 'a1',
    text: 'Choose the correct passive form: "They built this bridge in 1990."',
    options: [
      { id: 'o1a', text: 'This bridge was built in 1990.' },
      { id: 'o1b', text: 'This bridge is built in 1990.' },
      { id: 'o1c', text: 'This bridge has been built in 1990.' },
      { id: 'o1d', text: 'This bridge built in 1990.' },
    ],
    correctOptionId: 'o1a',
    explanation: 'Past simple passive = was/were + past participle.',
  },
  {
    id: 'q2', assessmentId: 'a1',
    text: 'What is the meaning of "pessimistic"?',
    options: [
      { id: 'o2a', text: 'تفاؤلي' },
      { id: 'o2b', text: 'تشاؤمي' },
      { id: 'o2c', text: 'واقعي' },
      { id: 'o2d', text: 'عاطفي' },
    ],
    correctOptionId: 'o2b',
    explanation: 'Pessimistic = expecting the worst / تشاؤمي.',
  },
  {
    id: 'q3', assessmentId: 'a1',
    text: 'He said, "I am tired." → Reported speech:',
    options: [
      { id: 'o3a', text: 'He said that he was tired.' },
      { id: 'o3b', text: 'He said that he is tired.' },
      { id: 'o3c', text: 'He said that I was tired.' },
      { id: 'o3d', text: 'He told that he was tired.' },
    ],
    correctOptionId: 'o3a',
    explanation: 'Reported speech: am → was, I → he.',
  },
  {
    id: 'q4', assessmentId: 'a1',
    text: 'The opposite of "generous" is:',
    options: [
      { id: 'o4a', text: 'kind' },
      { id: 'o4b', text: 'stingy' },
      { id: 'o4c', text: 'brave' },
      { id: 'o4d', text: 'honest' },
    ],
    correctOptionId: 'o4b',
    explanation: 'Generous ↔ stingy (بخيل).',
  },
  {
    id: 'q5', assessmentId: 'a1',
    text: '"Despite the rain, they continued playing." — What does "despite" mean?',
    options: [
      { id: 'o5a', text: 'because of' },
      { id: 'o5b', text: 'in spite of' },
      { id: 'o5c', text: 'as a result of' },
      { id: 'o5d', text: 'due to' },
    ],
    correctOptionId: 'o5b',
    explanation: 'Despite = in spite of = على الرغم من.',
  },
  // Quiz a2
  {
    id: 'q6', assessmentId: 'a2',
    text: '"The cake was eaten by the children." — Active voice:',
    options: [
      { id: 'o6a', text: 'The children ate the cake.' },
      { id: 'o6b', text: 'The children eat the cake.' },
      { id: 'o6c', text: 'The children has eaten the cake.' },
      { id: 'o6d', text: 'The children were eating the cake.' },
    ],
    correctOptionId: 'o6a',
    explanation: 'was eaten → simple past active = ate.',
  },
  {
    id: 'q7', assessmentId: 'a2',
    text: 'Choose the correct form: "The report ___ by the manager tomorrow."',
    options: [
      { id: 'o7a', text: 'will write' },
      { id: 'o7b', text: 'will be written' },
      { id: 'o7c', text: 'is written' },
      { id: 'o7d', text: 'was written' },
    ],
    correctOptionId: 'o7b',
    explanation: 'Future passive = will be + past participle.',
  },
  // Assignment w1
  {
    id: 'q8', assessmentId: 'w1',
    text: 'اكتب جملة باستخدام صيغة المبني للمجهول في المضارع التام.',
    options: [],
    correctOptionId: '',
  },
  {
    id: 'q9', assessmentId: 'w1',
    text: 'اشرح الفرق بين "despite" و "although" مع مثال لكل منهما.',
    options: [],
    correctOptionId: '',
  },
];

// ─── Mock Stats ────────────────────────────────────────────────────────────────
export const MOCK_TEACHER_STATS = {
  totalStudents: 4520,
  rating: 4.9,
  totalCourses: MOCK_COURSES.length,
  subject: 'لغة انجليزية',
};
