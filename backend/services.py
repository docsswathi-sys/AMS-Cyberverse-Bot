from database import (
    get_active_event,
    get_challenge,
    get_challenges,
    get_event,
    get_event_challenges,
    get_events,
    get_leaderboard,
    get_quiz,
    get_quiz_questions,
    get_quiz_score,
    get_quizzes,
    get_rank,
    get_rank_emoji,
    get_user,
    submit_flag,
    submit_quiz_answer,
)

# ============================================================
# COMMON
# ============================================================

def row_to_dict(row):
    """
    Convert a sqlite3.Row into a normal Python dictionary.
    """
    if row is None:
        return None

    return dict(row)


# ============================================================
# EVENTS
# ============================================================

def list_events(status=None):
    """
    Return all events, optionally filtered by status.
    """
    return [
        row_to_dict(event)
        for event in get_events(status=status)
    ]


def get_active_event_data():
    """
    Return the currently active event.
    """
    return row_to_dict(get_active_event())


def get_event_data(event_id):
    """
    Return a single event by ID.
    """
    return row_to_dict(get_event(event_id))


# ============================================================
# CHALLENGES
# ============================================================

def list_challenges(event_id=None, active_only=True):
    """
    Return challenges, optionally filtered by event.
    """
    return [
        row_to_dict(challenge)
        for challenge in get_challenges(
            event_id=event_id,
            active_only=active_only,
        )
    ]


def get_challenge_data(challenge_id):
    """
    Return a single challenge by ID.

    The database layer intentionally does not expose
    the stored flag hash here.
    """
    return row_to_dict(get_challenge(challenge_id))


def get_event_challenge_data(event_id, active_only=True):
    """
    Return challenges belonging to a specific event.
    """
    return [
        row_to_dict(challenge)
        for challenge in get_event_challenges(
            event_id=event_id,
            active_only=active_only,
        )
    ]


# ============================================================
# CTF SUBMISSION
# ============================================================

def submit_challenge_flag(discord_id, challenge_id, flag):
    """
    Submit a CTF flag through the database service.
    """
    return submit_flag(
        discord_id=discord_id,
        challenge_id=challenge_id,
        submitted_flag=flag,
    )


# ============================================================
# USERS
# ============================================================

def get_user_profile(discord_id):
    """
    Return a user profile with calculated rank information.
    """
    user = get_user(discord_id)

    if user is None:
        return None

    data = row_to_dict(user)

    data["rank"] = get_rank(data["level"])
    data["rank_emoji"] = get_rank_emoji(data["level"])

    return data


# ============================================================
# LEADERBOARD
# ============================================================

def get_leaderboard_data(limit=10, event_id=None):
    """
    Return leaderboard entries with position and rank data.
    """
    rows = get_leaderboard(
        limit=limit,
        event_id=event_id,
    )

    leaderboard = []

    for position, row in enumerate(rows, start=1):
        data = row_to_dict(row)

        data["position"] = position
        data["rank"] = get_rank(data["level"])
        data["rank_emoji"] = get_rank_emoji(data["level"])

        leaderboard.append(data)

    return leaderboard


# ============================================================
# QUIZZES
# ============================================================

def list_quizzes(active_only=True):
    """
    Return available quizzes.
    """
    return [
        row_to_dict(quiz)
        for quiz in get_quizzes(
            active_only=active_only,
        )
    ]


def get_quiz_data(quiz_id):
    """
    Return a single quiz by ID.
    """
    return row_to_dict(
        get_quiz(quiz_id)
    )


def list_quiz_questions(quiz_id, active_only=True):
    """
    Return questions for a quiz.

    The database layer intentionally excludes
    the correct answer from the returned data.
    """
    return [
        row_to_dict(question)
        for question in get_quiz_questions(
            quiz_id=quiz_id,
            active_only=active_only,
        )
    ]


# ============================================================
# QUIZ SUBMISSION
# ============================================================

def submit_quiz_question(
    discord_id,
    question_id,
    selected_answer,
):
    """
    Submit an answer to a quiz question.

    The database layer handles:
    - answer validation
    - attempt recording
    - duplicate solve protection
    - points awarding
    - user XP/level recalculation
    """

    # --------------------------------------------------------
    # Normalize incoming values from the web frontend.
    # --------------------------------------------------------

    try:
        discord_id = int(str(discord_id).strip())
    except (TypeError, ValueError):
        return {
            "status": "invalid_user",
            "message": "Invalid Discord user ID.",
        }

    try:
        question_id = int(question_id)
    except (TypeError, ValueError):
        return {
            "status": "invalid_question",
            "message": "Invalid quiz question ID.",
        }

    selected_answer = str(selected_answer).strip().upper()

    # --------------------------------------------------------
    # Validate answer format before touching the database.
    # --------------------------------------------------------

    if selected_answer not in {"A", "B", "C", "D"}:
        return {
            "status": "invalid_answer",
            "message": "Answer must be A, B, C, or D.",
        }

    # --------------------------------------------------------
    # Make sure the Discord user exists.
    #
    # This prevents the previous SQLite FOREIGN KEY error
    # from happening silently.
    # --------------------------------------------------------

    user = get_user(discord_id)

    if user is None:
        print(
            f"[QUIZ ERROR] User not registered: "
            f"discord_id={discord_id}"
        )

        return {
            "status": "user_not_registered",
            "message": (
                "Discord user is not registered in "
                "AMS Cyberverse."
            ),
        }

    # --------------------------------------------------------
    # Log the exact values entering the database layer.
    # This is temporary diagnostic protection and can be
    # removed after the web flow is confirmed.
    # --------------------------------------------------------

    print(
        f"[QUIZ SUBMIT] "
        f"discord_id={discord_id} | "
        f"question_id={question_id} | "
        f"answer={selected_answer}"
    )

    # --------------------------------------------------------
    # Submit to the database.
    # --------------------------------------------------------

    return submit_quiz_answer(
        discord_id=discord_id,
        question_id=question_id,
        selected_answer=selected_answer,
    )


# ============================================================
# QUIZ SCORE
# ============================================================

def get_quiz_score_data(discord_id, quiz_id):
    """
    Return a user's score for a specific quiz.
    """
    score = get_quiz_score(
        discord_id=discord_id,
        quiz_id=quiz_id,
    )

    if score is None:
        return {
            "points": 0,
            "questions_solved": 0,
        }

    return row_to_dict(score)