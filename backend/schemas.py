from pydantic import BaseModel, Field

# ============================================================
# CTF
# ============================================================

class FlagSubmission(BaseModel):
    discord_id: int = Field(gt=0)
    flag: str = Field(min_length=1)


# ============================================================
# QUIZ
# ============================================================

class QuizAnswerSubmission(BaseModel):
    discord_id: str 
    selected_answer: str = Field(
        min_length=1,
        max_length=1,
    )


# ============================================================
# EVENTS
# ============================================================

class EventResponse(BaseModel):
    id: int
    name: str
    description: str
    status: str
    start_at: str | None = None
    end_at: str | None = None
    created_at: str


# ============================================================
# CHALLENGES
# ============================================================

class ChallengeResponse(BaseModel):
    id: int
    event_id: int
    name: str
    description: str
    points: int
    category: str
    difficulty: str
    is_active: int
    event_name: str | None = None


# ============================================================
# QUIZ RESPONSES
# ============================================================

class QuizResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    is_active: int
    created_at: str


class QuizQuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    points: int
    is_active: int
    created_at: str