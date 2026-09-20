from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.schemas import (
    FlagSubmission,
    QuizAnswerSubmission,
)
from backend.services import (
    get_active_event_data,
    get_challenge_data,
    get_event_challenge_data,
    get_event_data,
    get_leaderboard_data,
    get_quiz_data,
    get_quiz_score_data,
    get_user_profile,
    list_challenges,
    list_events,
    list_quiz_questions,
    list_quizzes,
    submit_challenge_flag,
    submit_quiz_question,
)
from database_postgres import register_user

app = FastAPI(
    title="AMS Cyberverse API",
    description="Backend API for the AMS Cyberverse CTF platform",
    version="1.0.0",
)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://preview-diploma-notified-specs.trycloudflare.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# DEVELOPMENT USER REGISTRATION
# ============================================================

class DevUserRegistration(BaseModel):
    discord_id: int = Field(gt=0)
    username: str = Field(min_length=1, max_length=100)
    display_name: str = Field(min_length=1, max_length=100)


@app.post("/dev/register-user")
def dev_register_user(user: DevUserRegistration):
    register_user(
        discord_id=user.discord_id,
        username=user.username,
        display_name=user.display_name,
    )
    return {
        "status": "registered",
        "discord_id": user.discord_id,
        "username": user.username,
        "display_name": user.display_name,
    }

# ============================================================
# SYSTEM
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "AMS Cyberverse API",
    }

# ============================================================
# EVENTS
# ============================================================

@app.get("/events")
def events(
    status: str | None = Query(
        default=None,
        description="Filter by draft, active, or ended",
    ),
):
    event_list = list_events(status=status)
    return {"count": len(event_list), "events": event_list}


@app.get("/events/active")
def active_event():
    event = get_active_event_data()
    if event is None:
        raise HTTPException(status_code=404, detail="No active CTF event found.")
    return event


@app.get("/events/{event_id}")
def event_details(event_id: int):
    event = get_event_data(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")
    return event


@app.get("/events/{event_id}/challenges")
def event_challenges(
    event_id: int,
    active_only: bool = Query(default=True),
):
    event = get_event_data(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    challenges = get_event_challenge_data(
        event_id=event_id,
        active_only=active_only,
    )
    return {
        "event_id": event_id,
        "count": len(challenges),
        "challenges": challenges,
    }

# ============================================================
# CHALLENGES
# ============================================================

@app.get("/challenges")
def challenges(
    event_id: int | None = Query(default=None),
    active_only: bool = Query(default=True),
):
    challenge_list = list_challenges(
        event_id=event_id,
        active_only=active_only,
    )
    return {"count": len(challenge_list), "challenges": challenge_list}


@app.get("/challenges/{challenge_id}")
def challenge_details(challenge_id: int):
    challenge = get_challenge_data(challenge_id)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    return challenge


@app.post("/challenges/{challenge_id}/submit")
def submit_challenge(
    challenge_id: int,
    submission: FlagSubmission,
):
    result = submit_challenge_flag(
        discord_id=submission.discord_id,
        challenge_id=challenge_id,
        flag=submission.flag,
    )
    status = result.get("status")

    if status == "not_found":
        raise HTTPException(status_code=404, detail="Challenge not found.")
    if status == "inactive":
        raise HTTPException(status_code=400, detail="This challenge is inactive.")

    return result

# ============================================================
# QUIZZES
# ============================================================

@app.get("/quizzes")
def quizzes(active_only: bool = Query(default=True)):
    quiz_list = list_quizzes(active_only=active_only)
    return {"count": len(quiz_list), "quizzes": quiz_list}


@app.get("/quizzes/{quiz_id}")
def quiz_details(quiz_id: int):
    quiz = get_quiz_data(quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    return quiz


@app.get("/quizzes/{quiz_id}/questions")
def quiz_questions(
    quiz_id: int,
    active_only: bool = Query(default=True),
):
    quiz = get_quiz_data(quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    questions = list_quiz_questions(
        quiz_id=quiz_id,
        active_only=active_only,
    )
    return {
        "quiz_id": quiz_id,
        "count": len(questions),
        "questions": questions,
    }


@app.post("/quizzes/questions/{question_id}/submit")
def submit_quiz_answer(
    question_id: int,
    submission: QuizAnswerSubmission,
):
    result = submit_quiz_question(
        discord_id=submission.discord_id,
        question_id=question_id,
        selected_answer=submission.selected_answer,
    )
    status = result.get("status")

    if status == "not_found":
        raise HTTPException(status_code=404, detail="Quiz question not found.")
    if status == "inactive":
        raise HTTPException(status_code=400, detail="This quiz question is inactive.")
    if status == "user_not_found":
        raise HTTPException(status_code=404, detail="User not found.")

    return result


@app.get("/quizzes/{quiz_id}/score/{discord_id}")
def quiz_score(quiz_id: int, discord_id: int):
    quiz = get_quiz_data(quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    score = get_quiz_score_data(
        discord_id=discord_id,
        quiz_id=quiz_id,
    )
    return {
        "quiz_id": quiz_id,
        "discord_id": discord_id,
        **score,
    }

# ============================================================
# USERS
# ============================================================

@app.get("/users/{discord_id}")
def user_profile(discord_id: int):
    user = get_user_profile(discord_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

# ============================================================
# LEADERBOARD
# ============================================================

@app.get("/leaderboard")
def leaderboard(
    limit: int = Query(default=10, ge=1, le=100),
    event_id: int | None = Query(default=None),
):
    data = get_leaderboard_data(
        limit=limit,
        event_id=event_id,
    )
    return {
        "count": len(data),
        "event_id": event_id,
        "leaderboard": data,
    }
