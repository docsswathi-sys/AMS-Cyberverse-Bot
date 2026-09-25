import type {
  Challenge,
  ChallengesResponse,
  Event,
  EventsResponse,
  HealthResponse,
  LeaderboardResponse,
  UserProfile,
  Quiz,
  QuizzesResponse,
  QuizQuestionsResponse,
  QuizAnswerResponse,
} from "../types/api";

const API_BASE_URL =
  window.location.hostname.includes("discord")
    ? "/api"
    : import.meta.env.VITE_API_BASE_URL ||
      "http://127.0.0.1:8000";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,

      // IMPORTANT:
      // Send the Discord authentication session cookie
      // to the backend.
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    },
  );

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json();
}

export interface FlagSubmissionResponse {
  status:
    | "correct"
    | "incorrect"
    | "already_solved"
    | "not_found"
    | "inactive";

  challenge_id?: number;
  discord_id?: string;

  // Scoring
  points?: number;
  points_awarded?: number;
  total_points?: number;

  // Progression
  level?: number;
  challenges_solved?: number;

  message?: string;
}

export const api = {
  // =========================
  // SYSTEM
  // =========================

  health(): Promise<HealthResponse> {
    return request<HealthResponse>("/health");
  },

  // =========================
  // AUTHENTICATION
  // =========================

  authMe(): Promise<UserProfile> {
    return request<UserProfile>("/auth/me");
  },

  logout(): Promise<void> {
    return request<void>("/auth/logout", {
      method: "POST",
    });
  },

  // =========================
  // EVENTS
  // =========================

  events(): Promise<EventsResponse> {
    return request<EventsResponse>("/events");
  },

  activeEvent(): Promise<Event> {
    return request<Event>("/events/active");
  },

  event(eventId: number): Promise<Event> {
    return request<Event>(`/events/${eventId}`);
  },

  // =========================
  // CHALLENGES
  // =========================

  challenges(eventId?: number): Promise<ChallengesResponse> {
    const query =
      eventId !== undefined
        ? `?event_id=${eventId}`
        : "";

    return request<ChallengesResponse>(
      `/challenges${query}`,
    );
  },

  challenge(challengeId: number): Promise<Challenge> {
    return request<Challenge>(
      `/challenges/${challengeId}`,
    );
  },

  eventChallenges(
    eventId: number,
  ): Promise<ChallengesResponse> {
    return request<ChallengesResponse>(
      `/events/${eventId}/challenges`,
    );
  },

  // =========================
  // CTF FLAG SUBMISSION
  // =========================

  submitFlag(
    challengeId: number,
    discordId: string,
    flag: string,
  ): Promise<FlagSubmissionResponse> {
    return request<FlagSubmissionResponse>(
      `/challenges/${challengeId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({
          discord_id: discordId,
          flag,
        }),
      },
    );
  },

  // =========================
  // USERS
  // =========================

  profile(discordId: string): Promise<UserProfile> {
    return request<UserProfile>(
      `/users/${discordId}`,
    );
  },

  // =========================
  // LEADERBOARD
  // =========================

  leaderboard(
    limit = 10,
    eventId?: number,
  ): Promise<LeaderboardResponse> {
    const params = new URLSearchParams();

    params.set("limit", String(limit));

    if (eventId !== undefined) {
      params.set("event_id", String(eventId));
    }

    return request<LeaderboardResponse>(
      `/leaderboard?${params.toString()}`,
    );
  },

  // =========================
  // QUIZZES
  // =========================

  quizzes(): Promise<QuizzesResponse> {
    return request<QuizzesResponse>("/quizzes");
  },

  quiz(quizId: number): Promise<Quiz> {
    return request<Quiz>(
      `/quizzes/${quizId}`,
    );
  },

  quizQuestions(
    quizId: number,
  ): Promise<QuizQuestionsResponse> {
    return request<QuizQuestionsResponse>(
      `/quizzes/${quizId}/questions`,
    );
  },

  // =========================
  // QUIZ ANSWER SUBMISSION
  // =========================

  submitQuizAnswer(
    questionId: number,
    discordId: string,
    selectedAnswer: string,
  ): Promise<QuizAnswerResponse> {
    return request<QuizAnswerResponse>(
      `/quizzes/questions/${questionId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({
          discord_id: discordId,
          selected_answer: selectedAnswer,
        }),
      },
    );
  },

  // =========================
  // QUIZ SCORE
  // =========================

  quizScore(
    quizId: number,
    discordId: string,
  ): Promise<{
    quiz_id: number;
    discord_id: string;
    points: number;
    questions_solved: number;
  }> {
    return request(
      `/quizzes/${quizId}/score/${discordId}`,
    );
  },
};