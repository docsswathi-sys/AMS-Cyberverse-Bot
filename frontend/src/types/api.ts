export interface HealthResponse {
  status: string;
  service: string;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  status: "draft" | "active" | "ended";
  start_at: string | null;
  end_at: string | null;
  created_at: string;
}

export interface Challenge {
  id: number;
  event_id: number;
  name: string;
  description: string;
  points: number;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  is_active: number;
  event_name?: string | null;
}

export interface UserProfile {
  user: UserProfile;
  discord_id: string;
  username: string;
  display_name: string;
  points: number;
  level: number;
  challenges_solved: number;
  joined_at: string;
  rank: string;
  rank_emoji: string;
}

export interface LeaderboardEntry {
  discord_id: string;
  username: string;
  display_name: string;
  points: number;
  level: number;
  challenges_solved: number;
  position: number;
  rank: string;
  rank_emoji: string;
}

export interface ChallengesResponse {
  count: number;
  challenges: Challenge[];
}

export interface EventsResponse {
  count: number;
  events: Event[];
}

export interface LeaderboardResponse {
  count: number;
  event_id: number | null;
  leaderboard: LeaderboardEntry[];
}
export interface Quiz {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  is_active: number;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  points: number;
  is_active: number;
  created_at: string;
}

export interface QuizzesResponse {
  count: number;
  quizzes: Quiz[];
}

export interface QuizQuestionsResponse {
  quiz_id: number;
  count: number;
  questions: QuizQuestion[];
}

export interface QuizAnswerResponse {
  status: string;
  question_id?: number;
  discord_id?: string;
  quiz_id?: number;
  selected_answer?: string;
  is_correct?: boolean;
  points_awarded?: number;
  total_points?: number;
  questions_solved?: number;
  message?: string;
}