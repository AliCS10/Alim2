
export interface Topic {
  id: string;
  title: string;
  summary: string;
  audioUrl?: string; // Base64 or Blob URL
  duration: string;
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  duration: string;
  topics: Topic[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string; // اسم الدكتور/المحاضر
  university: string;
  duration: string;
  level: string;
  description: string;
  image: string;
  chapters: Chapter[];
  category: 'enrolled' | 'personal'; // تصنيف المادة
  smartSummary?: string;
}

export interface AIProcessStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
}
