import base64
import hashlib
import hmac
import json
import os
import secrets
import urllib.error
import urllib.parse
import urllib.request
from datetime import UTC, datetime, timedelta

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
        "https://ams-cyberverse-bot.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.discordsays\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DISCORD OAUTH2 CONFIGURATION
# ============================================================

DISCORD_API_BASE = "https://discord.com/api/v10"

DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI")
DISCORD_SESSION_SECRET = os.getenv("DISCORD_SESSION_SECRET")

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://ams-cyberverse-bot.vercel.app",
)

SESSION_COOKIE_NAME = "ams_cyberverse_session"
STATE_COOKIE_NAME = "ams_cyberverse_oauth_state"


def _require_oauth_config():
    missing = []

    if not DISCORD_CLIENT_ID:
        missing.append("DISCORD_CLIENT_ID")

    if not DISCORD_CLIENT_SECRET:
        missing.append("DISCORD_CLIENT_SECRET")

    if not DISCORD_REDIRECT_URI:
        missing.append("DISCORD_REDIRECT_URI")

    if not DISCORD_SESSION_SECRET:
        missing.append("DISCORD_SESSION_SECRET")

    if missing:
        raise RuntimeError(
            "Missing Discord OAuth configuration: "
            + ", ".join(missing)
        )


def _sign_session(payload: dict) -> str:
    """
    Create a signed session token.

    The payload is base64 encoded and signed with HMAC-SHA256.
    """

    raw_payload = json.dumps(
        payload,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")

    encoded = base64.urlsafe_b64encode(
        raw_payload
    ).decode("utf-8").rstrip("=")

    signature = hmac.new(
        DISCORD_SESSION_SECRET.encode("utf-8"),
        encoded.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return f"{encoded}.{signature}"


def _verify_session(token: str | None):
    """
    Verify and decode an AMS Cyberverse session token.
    """

    if not token:
        return None

    try:
        encoded, signature = token.split(".", 1)

        expected_signature = hmac.new(
            DISCORD_SESSION_SECRET.encode("utf-8"),
            encoded.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(
            signature,
            expected_signature,
        ):
            return None

        padding = "=" * (-len(encoded) % 4)

        payload = json.loads(
            base64.urlsafe_b64decode(
                encoded + padding
            ).decode("utf-8")
        )

        if payload["exp"] < int(
            datetime.now(UTC).timestamp()
        ):
            return None

        return payload

    except (
        ValueError,
        KeyError,
        json.JSONDecodeError,
    ):
        return None


def _discord_request(
    url: str,
    method: str = "GET",
    data: dict | None = None,
    headers: dict | None = None,
):
    """
    Make a request to the Discord API using Python's
    built-in urllib so no additional dependency is required.
    """

    request_headers = {
        "User-Agent": "AMS-Cyberverse/1.0 (https://github.com/docsswathi-sys/AMS-Cyberverse-Bot)",
        **(headers or {}),
    }
    

    encoded_data = None

    if data is not None:
        encoded_data = urllib.parse.urlencode(
            data
        ).encode("utf-8")

        request_headers.setdefault(
            "Content-Type",
            "application/x-www-form-urlencoded",
        )

    request = urllib.request.Request(
        url,
        data=encoded_data,
        headers=request_headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=10,
        ) as response:
            return json.loads(
                response.read().decode("utf-8")
            )

    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode(
            "utf-8",
            errors="replace",
        )

        raise RuntimeError(
            f"Discord API request failed: "
            f"HTTP {exc.code}: {error_body}"
        ) from exc

    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Discord API connection failed: {exc.reason}"
        ) from exc


# ============================================================
# DISCORD AUTHENTICATION
# ============================================================


@app.get("/auth/discord/login")
def discord_login():
    """
    Start the Discord OAuth2 login flow.
    """

    _require_oauth_config()

    state = secrets.token_urlsafe(32)

    params = {
        "client_id": DISCORD_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": DISCORD_REDIRECT_URI,
        "scope": "identify",
        "state": state,
    }

    authorization_url = (
        "https://discord.com/oauth2/authorize?"
        + urllib.parse.urlencode(params)
    )

    response = Response(
        status_code=307,
        headers={
            "Location": authorization_url,
        },
    )

    response.set_cookie(
        key=STATE_COOKIE_NAME,
        value=state,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=600,
    )

    return response


@app.get("/auth/discord/callback")
def discord_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    """
    Discord OAuth2 callback.

    Flow:

    Discord
        ↓
    authorization code
        ↓
    token exchange
        ↓
    /users/@me
        ↓
    register/find user
        ↓
    signed AMS Cyberverse session
        ↓
    frontend
    """

    _require_oauth_config()

    # --------------------------------------------------------
    # User denied authorization
    # --------------------------------------------------------

    if error:
        return Response(
            status_code=307,
            headers={
                "Location": (
                    f"{FRONTEND_URL}/"
                    "?auth_error=discord_denied"
                ),
            },
        )

    # --------------------------------------------------------
    # Validate callback parameters
    # --------------------------------------------------------

    if not code or not state:
        raise HTTPException(
            status_code=400,
            detail="Missing Discord OAuth code or state.",
        )

    # --------------------------------------------------------
    # Validate OAuth state
    # --------------------------------------------------------

    stored_state = request.cookies.get(
        STATE_COOKIE_NAME
    )

    if not stored_state:
        raise HTTPException(
            status_code=400,
            detail="OAuth state cookie missing.",
        )

    if not hmac.compare_digest(
        state,
        stored_state,
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth state.",
        )

    # --------------------------------------------------------
    # Exchange authorization code for Discord token
    # --------------------------------------------------------

    try:
        basic_auth = base64.b64encode(
            f"{DISCORD_CLIENT_ID}:{DISCORD_CLIENT_SECRET}".encode()
        ).decode("ascii")

        token_data = _discord_request(
            f"{DISCORD_API_BASE}/oauth2/token",
            method="POST",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": DISCORD_REDIRECT_URI,
            },
            headers={
                "Authorization": f"Basic {basic_auth}",
            },
        )

    except Exception as exc:
        print(
            "[DISCORD OAUTH TOKEN EXCHANGE ERROR]",
            repr(exc),
        )

        raise HTTPException(
            status_code=502,
            detail="Failed to exchange Discord OAuth code.",
        ) from exc

    access_token = token_data.get(
        "access_token"
    )

    if not access_token:
        raise HTTPException(
            status_code=502,
            detail="Discord did not return an access token.",
        )

    # --------------------------------------------------------
    # Get authenticated Discord user
    # --------------------------------------------------------

    try:
        discord_user = _discord_request(
            f"{DISCORD_API_BASE}/users/@me",
            headers={
                "Authorization": (
                    f"Bearer {access_token}"
                ),
            },
        )

    except Exception as exc:
        print(
            "[DISCORD OAUTH USER FETCH ERROR]",
            repr(exc),
        )

        raise HTTPException(
            status_code=502,
            detail="Failed to retrieve Discord user.",
        ) from exc

    # --------------------------------------------------------
    # Extract Discord identity
    # --------------------------------------------------------

    try:
        discord_id = int(
            discord_user["id"]
        )

    except (
        KeyError,
        ValueError,
        TypeError,
    ) as exc:
        raise HTTPException(
            status_code=502,
            detail="Invalid Discord user identity.",
        ) from exc

    username = discord_user.get(
        "username",
        f"discord_{discord_id}",
    )

    display_name = (
        discord_user.get("global_name")
        or discord_user.get("username")
        or f"discord_{discord_id}"
    )

    # --------------------------------------------------------
    # Create/update AMS Cyberverse user
    # --------------------------------------------------------

    register_user(
        discord_id=discord_id,
        username=username,
        display_name=display_name,
    )

    # --------------------------------------------------------
    # Create signed session
    # --------------------------------------------------------

    session_payload = {
        "discord_id": discord_id,
        "username": username,
        "display_name": display_name,
        "exp": int(
            (
                datetime.now(UTC)
                + timedelta(days=7)
            ).timestamp()
        ),
    }

    session_token = _sign_session(
        session_payload
    )

    # --------------------------------------------------------
    # Redirect back to frontend
    # --------------------------------------------------------

    redirect_response = Response(
        status_code=307,
        headers={
            "Location": FRONTEND_URL,
        },
    )

    redirect_response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    redirect_response.delete_cookie(
        key=STATE_COOKIE_NAME,
    )

    return redirect_response


@app.post("/api/token")
def exchange_activity_token(payload: dict):
    """Exchange a Discord Embedded App authorization code for a user token."""

    _require_oauth_config()

    code = str(payload.get("code") or "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="Missing Discord authorization code.")

    token_response = _discord_request(
        f"{DISCORD_API_BASE}/oauth2/token",
        method="POST",
        data={
            "client_id": DISCORD_CLIENT_ID,
            "client_secret": DISCORD_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            
        },
    )

    access_token = token_response.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="Discord did not return an access token.")

    discord_user = _discord_request(
        f"{DISCORD_API_BASE}/users/@me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    discord_id = int(discord_user["id"])
    username = discord_user.get(
        "username",
        f"discord_{discord_id}",
    )
    display_name = (
        discord_user.get("global_name")
        or discord_user.get("username")
        or f"discord_{discord_id}"
    )

    register_user(
        discord_id=discord_id,
        username=username,
        display_name=display_name,
    )

    user = {
        "discord_id": discord_id,
        "username": username,
        "display_name": display_name,
    }

    session_payload = {
        "discord_id": discord_id,
        "username": username,
        "display_name": display_name,
        "exp": int(
            (
                datetime.now(UTC)
                + timedelta(days=7)
            ).timestamp()
        ),
    }
    session_token = _sign_session(session_payload)

    response = JSONResponse(
        {
            "access_token": access_token,
            "user": user,
        }
    )
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return response


@app.get("/auth/me")
def get_current_user(
    request: Request,
):
    """
    Return the currently authenticated AMS Cyberverse user.
    """

    session = _verify_session(
        request.cookies.get(
            SESSION_COOKIE_NAME
        )
    )

    if session is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated.",
        )

    user = get_user_profile(
        session["discord_id"]
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return user


@app.post("/auth/logout")
def logout(
    response: Response,
):
    """
    Clear the AMS Cyberverse authentication session.
    """

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
    )

    response.delete_cookie(
        key=STATE_COOKIE_NAME,
    )

    return {
        "status": "logged_out",
    }


# ============================================================
# DEVELOPMENT USER REGISTRATION
# ============================================================


class DevUserRegistration(BaseModel):
    discord_id: int = Field(gt=0)
    username: str = Field(
        min_length=1,
        max_length=100,
    )
    display_name: str = Field(
        min_length=1,
        max_length=100,
    )


@app.post("/dev/register-user")
def dev_register_user(
    user: DevUserRegistration,
):
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
    event_list = list_events(
        status=status
    )

    return {
        "count": len(event_list),
        "events": event_list,
    }


@app.get("/events/active")
def active_event():
    event = get_active_event_data()

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="No active CTF event found.",
        )

    return event


@app.get("/events/{event_id}")
def event_details(
    event_id: int,
):
    event = get_event_data(
        event_id
    )

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found.",
        )

    return event


@app.get("/events/{event_id}/challenges")
def event_challenges(
    event_id: int,
    active_only: bool = Query(
        default=True
    ),
):
    event = get_event_data(
        event_id
    )

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found.",
        )

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
    event_id: int | None = Query(
        default=None
    ),
    active_only: bool = Query(
        default=True
    ),
):
    challenge_list = list_challenges(
        event_id=event_id,
        active_only=active_only,
    )

    return {
        "count": len(challenge_list),
        "challenges": challenge_list,
    }


@app.get("/challenges/{challenge_id}")
def challenge_details(
    challenge_id: int,
):
    challenge = get_challenge_data(
        challenge_id
    )

    if challenge is None:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found.",
        )

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
        raise HTTPException(
            status_code=404,
            detail="Challenge not found.",
        )

    if status == "inactive":
        raise HTTPException(
            status_code=400,
            detail="This challenge is inactive.",
        )

    return result


# ============================================================
# QUIZZES
# ============================================================


@app.get("/quizzes")
def quizzes(
    active_only: bool = Query(
        default=True
    ),
):
    quiz_list = list_quizzes(
        active_only=active_only
    )

    return {
        "count": len(quiz_list),
        "quizzes": quiz_list,
    }


@app.get("/quizzes/{quiz_id}")
def quiz_details(
    quiz_id: int,
):
    quiz = get_quiz_data(
        quiz_id
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

    return quiz


@app.get("/quizzes/{quiz_id}/questions")
def quiz_questions(
    quiz_id: int,
    active_only: bool = Query(
        default=True
    ),
):
    quiz = get_quiz_data(
        quiz_id
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

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
        raise HTTPException(
            status_code=404,
            detail="Quiz question not found.",
        )

    if status == "inactive":
        raise HTTPException(
            status_code=400,
            detail="This quiz question is inactive.",
        )

    if status == "user_not_found":
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return result


@app.get("/quizzes/{quiz_id}/score/{discord_id}")
def quiz_score(
    quiz_id: int,
    discord_id: int,
):
    quiz = get_quiz_data(
        quiz_id
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

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
def user_profile(
    discord_id: int,
):
    user = get_user_profile(
        discord_id
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return user


# ============================================================
# LEADERBOARD
# ============================================================


@app.get("/leaderboard")
def leaderboard(
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    event_id: int | None = Query(
        default=None
    ),
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