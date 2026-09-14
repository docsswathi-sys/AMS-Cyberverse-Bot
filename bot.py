import os

import discord
from discord.ext import commands
from dotenv import load_dotenv

from database import (
    add_challenge,
    create_event,
    get_active_event,
    get_challenge,
    get_challenges,
    get_event,
    get_event_challenges,
    get_events,
    get_leaderboard,
    get_level_from_xp,
    get_rank,
    get_rank_emoji,
    get_user,
    get_xp_required,
    register_user,
    submit_flag,
    update_event_status,
)

# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = os.getenv("GUILD_ID")

if not TOKEN:
    raise RuntimeError("DISCORD_TOKEN is missing from .env")

if not GUILD_ID:
    raise RuntimeError("GUILD_ID is missing from .env")


# ============================================================
# DISCORD BOT
# ============================================================

intents = discord.Intents.default()

bot = commands.Bot(
    command_prefix="!",
    intents=intents,
)


# ============================================================
# HELPERS
# ============================================================

def create_progress_bar(current_xp, current_level, size=12):
    current_level_xp = get_xp_required(current_level)

    if current_level >= 100:
        return "█" * size

    next_level_xp = get_xp_required(current_level + 1)
    level_range = next_level_xp - current_level_xp
    progress = current_xp - current_level_xp

    if level_range <= 0:
        percentage = 1
    else:
        percentage = progress / level_range

    percentage = max(0, min(percentage, 1))
    filled = int(percentage * size)
    empty = size - filled

    return "█" * filled + "░" * empty


def is_admin(interaction):
    return (
        isinstance(interaction.user, discord.Member)
        and interaction.user.guild_permissions.administrator
    )


def difficulty_emoji(difficulty):
    return {
        "easy": "🟢",
        "medium": "🟡",
        "hard": "🟠",
        "expert": "🔴",
    }.get(difficulty.lower(), "⚪")


def format_event_status(status):
    return {
        "draft": "📝 DRAFT",
        "active": "🟢 ACTIVE",
        "ended": "🔴 ENDED",
    }.get(status, status.upper())


# ============================================================
# BOT READY
# ============================================================

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")

    guild = discord.Object(id=int(GUILD_ID))

    bot.tree.copy_global_to(guild=guild)

    synced = await bot.tree.sync(guild=guild)

    print(
        f"Synced {len(synced)} slash command(s) "
        "to AMS Cyberverse"
    )


# ============================================================
# /ping
# ============================================================

@bot.tree.command(
    name="ping",
    description="Check whether AMS Cyberverse Bot is online",
)
async def ping(interaction: discord.Interaction):
    await interaction.response.send_message(
        "🏓 AMS Cyberverse Bot is online!"
    )


# ============================================================
# /event
# ============================================================

@bot.tree.command(
    name="event",
    description="View the active AMS Cyberverse CTF event",
)
async def event(interaction: discord.Interaction):
    active_event = get_active_event()

    if active_event is None:
        await interaction.response.send_message(
            "📭 There is no active CTF event right now."
        )
        return

    challenge_count = len(
        get_event_challenges(
            event_id=active_event["id"],
            active_only=True,
        )
    )

    embed = discord.Embed(
        title="⚡ ACTIVE CTF EVENT",
        description=(
            active_event["description"]
            or "AMS Cyberverse CTF"
        ),
    )

    embed.add_field(
        name="🆔 Event ID",
        value=f"**#{active_event['id']}**",
        inline=True,
    )

    embed.add_field(
        name="🏆 Event",
        value=f"**{active_event['name']}**",
        inline=True,
    )

    embed.add_field(
        name="🎯 Challenges",
        value=f"**{challenge_count}**",
        inline=True,
    )

    if active_event["start_at"]:
        embed.add_field(
            name="🕐 Starts",
            value=active_event["start_at"],
            inline=True,
        )

    if active_event["end_at"]:
        embed.add_field(
            name="🕐 Ends",
            value=active_event["end_at"],
            inline=True,
        )

    embed.set_footer(
        text="Use /challenges to enter the CTF Arena."
    )

    await interaction.response.send_message(embed=embed)


# ============================================================
# /events
# ============================================================

@bot.tree.command(
    name="events",
    description="View AMS Cyberverse CTF events",
)
async def events(interaction: discord.Interaction):
    event_list = get_events()

    if not event_list:
        await interaction.response.send_message(
            "📭 No CTF events have been created yet."
        )
        return

    embed = discord.Embed(
        title="📚 AMS CYBERVERSE • CTF EVENTS",
        description="All CTF events currently stored in the platform.",
    )

    for current_event in event_list[:20]:
        challenge_count = len(
            get_event_challenges(
                event_id=current_event["id"],
                active_only=False,
            )
        )

        embed.add_field(
            name=(
                f"#{current_event['id']} • "
                f"{current_event['name']}"
            ),
            value=(
                f"**Status:** "
                f"{format_event_status(current_event['status'])}\n"
                f"**Challenges:** {challenge_count}\n"
                f"{current_event['description'] or 'No description'}"
            ),
            inline=False,
        )

    if len(event_list) > 20:
        embed.set_footer(
            text="Showing the latest 20 events."
        )

    await interaction.response.send_message(embed=embed)


# ============================================================
# /createevent
# ============================================================

@bot.tree.command(
    name="createevent",
    description="Create a new AMS Cyberverse CTF event",
)
@discord.app_commands.default_permissions(administrator=True)
async def createevent(
    interaction: discord.Interaction,
    name: str,
    description: str = "",
):
    if not is_admin(interaction):
        await interaction.response.send_message(
            "⛔ You need Administrator permission to create events.",
            ephemeral=True,
        )
        return

    name = name.strip()
    description = description.strip()

    if not name:
        await interaction.response.send_message(
            "❌ Event name cannot be empty.",
            ephemeral=True,
        )
        return

    try:
        event_id = create_event(
            name=name,
            description=description,
            status="draft",
        )
    except ValueError as error:
        await interaction.response.send_message(
            f"❌ Could not create event: {error}",
            ephemeral=True,
        )
        return

    embed = discord.Embed(
        title="✅ CTF EVENT CREATED",
        description=(
            "The event has been created as a **DRAFT**.\n"
            "Activate it when you are ready."
        ),
    )

    embed.add_field(
        name="🆔 Event ID",
        value=f"**#{event_id}**",
        inline=True,
    )

    embed.add_field(
        name="🏆 Event",
        value=f"**{name}**",
        inline=True,
    )

    embed.add_field(
        name="📌 Status",
        value="📝 **DRAFT**",
        inline=True,
    )

    await interaction.response.send_message(
        embed=embed,
        ephemeral=True,
    )


# ============================================================
# /activateevent
# ============================================================

@bot.tree.command(
    name="activateevent",
    description="Activate a CTF event",
)
@discord.app_commands.default_permissions(administrator=True)
async def activateevent(
    interaction: discord.Interaction,
    event_id: int,
):
    if not is_admin(interaction):
        await interaction.response.send_message(
            "⛔ You need Administrator permission to activate events.",
            ephemeral=True,
        )
        return

    target_event = get_event(event_id)

    if target_event is None:
        await interaction.response.send_message(
            "❌ Event not found.",
            ephemeral=True,
        )
        return

    if target_event["status"] == "active":
        await interaction.response.send_message(
            f"ℹ️ **{target_event['name']}** is already active.",
            ephemeral=True,
        )
        return

    try:
        updated = update_event_status(
            event_id=event_id,
            status="active",
        )
    except ValueError as error:
        await interaction.response.send_message(
            f"❌ Could not activate event: {error}",
            ephemeral=True,
        )
        return

    if not updated:
        await interaction.response.send_message(
            "❌ Event could not be activated.",
            ephemeral=True,
        )
        return

    await interaction.response.send_message(
        f"🟢 **{target_event['name']}** is now the active CTF event.\n"
        "Any previously active event has been ended.",
        ephemeral=True,
    )


# ============================================================
# /endevent
# ============================================================

@bot.tree.command(
    name="endevent",
    description="End an active AMS Cyberverse CTF event",
)
@discord.app_commands.default_permissions(administrator=True)
async def endevent(
    interaction: discord.Interaction,
    event_id: int,
):
    if not is_admin(interaction):
        await interaction.response.send_message(
            "⛔ You need Administrator permission to end events.",
            ephemeral=True,
        )
        return

    target_event = get_event(event_id)

    if target_event is None:
        await interaction.response.send_message(
            "❌ Event not found.",
            ephemeral=True,
        )
        return

    if target_event["status"] == "ended":
        await interaction.response.send_message(
            f"ℹ️ **{target_event['name']}** is already ended.",
            ephemeral=True,
        )
        return

    try:
        updated = update_event_status(
            event_id=event_id,
            status="ended",
        )
    except ValueError as error:
        await interaction.response.send_message(
            f"❌ Could not end event: {error}",
            ephemeral=True,
        )
        return

    if not updated:
        await interaction.response.send_message(
            "❌ Event could not be ended.",
            ephemeral=True,
        )
        return

    await interaction.response.send_message(
        f"🔴 **{target_event['name']}** has been ended.",
        ephemeral=True,
    )


# ============================================================
# /eventchallenges
# ============================================================

@bot.tree.command(
    name="eventchallenges",
    description="View challenges belonging to a specific CTF event",
)
async def eventchallenges(
    interaction: discord.Interaction,
    event_id: int,
):
    target_event = get_event(event_id)

    if target_event is None:
        await interaction.response.send_message(
            "❌ Event not found.",
            ephemeral=True,
        )
        return

    challenge_list = get_event_challenges(
        event_id=event_id,
        active_only=False,
    )

    if not challenge_list:
        await interaction.response.send_message(
            f"📭 **{target_event['name']}** has no challenges.",
            ephemeral=True,
        )
        return

    embed = discord.Embed(
        title="🎯 EVENT CHALLENGES",
        description=(
            f"**Event:** {target_event['name']}\n"
            f"**Status:** {format_event_status(target_event['status'])}"
        ),
    )

    for challenge in challenge_list[:25]:
        status = "🟢 Active" if challenge["is_active"] else "🔒 Inactive"

        embed.add_field(
            name=(
                f"#{challenge['id']} • "
                f"{challenge['name']}"
            ),
            value=(
                f"{difficulty_emoji(challenge['difficulty'])} "
                f"**{challenge['difficulty'].upper()}**\n"
                f"📂 {challenge['category']} • "
                f"🏆 {challenge['points']} XP\n"
                f"{status}\n"
                f"{challenge['description']}"
            ),
            inline=False,
        )

    if len(challenge_list) > 25:
        embed.set_footer(
            text="Showing the first 25 challenges."
        )

    await interaction.response.send_message(
        embed=embed,
        ephemeral=True,
    )


# ============================================================
# /challenges
# ============================================================

@bot.tree.command(
    name="challenges",
    description="View available AMS Cyberverse CTF challenges",
)
async def challenges(interaction: discord.Interaction):
    active_event = get_active_event()

    if active_event is None:
        await interaction.response.send_message(
            "📭 No active CTF event is running right now."
        )
        return

    challenge_list = get_challenges(
        event_id=active_event["id"],
        active_only=True,
    )

    if not challenge_list:
        await interaction.response.send_message(
            f"📭 **{active_event['name']}** has no active challenges yet."
        )
        return

    embed = discord.Embed(
        title="🏆 AMS CYBERVERSE • CTF ARENA",
        description=(
            f"**Event:** {active_event['name']}\n"
            "Choose a challenge and start hacking."
        ),
    )

    for challenge in challenge_list[:25]:
        embed.add_field(
            name=(
                f"#{challenge['id']} • "
                f"{challenge['name']}"
            ),
            value=(
                f"{difficulty_emoji(challenge['difficulty'])} "
                f"**{challenge['difficulty'].upper()}**\n"
                f"**Category:** {challenge['category']}\n"
                f"**Points:** {challenge['points']}\n"
                f"{challenge['description']}"
            ),
            inline=False,
        )

    if len(challenge_list) > 25:
        embed.set_footer(
            text="Showing the first 25 active challenges."
        )

    await interaction.response.send_message(embed=embed)


# ============================================================
# /addchallenge
# ============================================================

@bot.tree.command(
    name="addchallenge",
    description="Add a new AMS Cyberverse CTF challenge",
)
@discord.app_commands.default_permissions(administrator=True)
async def addchallenge(
    interaction: discord.Interaction,
    name: str,
    description: str,
    category: str,
    points: int,
    flag: str,
    difficulty: str = "medium",
):
    if not is_admin(interaction):
        await interaction.response.send_message(
            "⛔ You need Administrator permission to add challenges.",
            ephemeral=True,
        )
        return

    active_event = get_active_event()

    if active_event is None:
        await interaction.response.send_message(
            "❌ There is no active CTF event.\n"
            "Create an event with /createevent and activate it "
            "with /activateevent first.",
            ephemeral=True,
        )
        return

    name = name.strip()
    description = description.strip()
    category = category.strip()
    flag = flag.strip()
    difficulty = difficulty.strip().lower()

    if not name:
        await interaction.response.send_message(
            "❌ Challenge name cannot be empty.",
            ephemeral=True,
        )
        return

    if not description:
        await interaction.response.send_message(
            "❌ Challenge description cannot be empty.",
            ephemeral=True,
        )
        return

    if not category:
        await interaction.response.send_message(
            "❌ Challenge category cannot be empty.",
            ephemeral=True,
        )
        return

    if not flag:
        await interaction.response.send_message(
            "❌ Flag cannot be empty.",
            ephemeral=True,
        )
        return

    if points <= 0:
        await interaction.response.send_message(
            "❌ Points must be greater than 0.",
            ephemeral=True,
        )
        return

    if difficulty not in {"easy", "medium", "hard", "expert"}:
        await interaction.response.send_message(
            "❌ Difficulty must be: easy, medium, hard, or expert.",
            ephemeral=True,
        )
        return

    try:
        challenge_id = add_challenge(
            name=name,
            description=description,
            flag=flag,
            points=points,
            category=category,
            event_id=active_event["id"],
            difficulty=difficulty,
        )
    except ValueError as error:
        print(f"[ERROR] Could not create challenge: {error}")

        await interaction.response.send_message(
            f"❌ Could not create the challenge: {error}",
            ephemeral=True,
        )
        return

    embed = discord.Embed(
        title="✅ CHALLENGE CREATED",
        description=(
            f"A new challenge has been added to "
            f"**{active_event['name']}**."
        ),
    )

    embed.add_field(
        name="🆔 Challenge ID",
        value=f"**#{challenge_id}**",
        inline=True,
    )

    embed.add_field(
        name="🏆 XP",
        value=f"**{points} XP**",
        inline=True,
    )

    embed.add_field(
        name="📂 Category",
        value=f"**{category}**",
        inline=True,
    )

    embed.add_field(
        name="⚔️ Difficulty",
        value=f"**{difficulty.upper()}**",
        inline=True,
    )

    embed.add_field(
        name="🎯 Challenge",
        value=f"**{name}**\n{description}",
        inline=False,
    )

    embed.set_footer(
        text="Members can find this challenge using /challenges."
    )

    await interaction.response.send_message(
        embed=embed,
        ephemeral=True,
    )


# ============================================================
# /submit
# ============================================================

@bot.tree.command(
    name="submit",
    description="Submit a flag for an AMS Cyberverse challenge",
)
async def submit(
    interaction: discord.Interaction,
    challenge_id: int,
    flag: str,
):
    register_user(
        interaction.user.id,
        interaction.user.name,
        interaction.user.display_name,
    )

    challenge = get_challenge(challenge_id)

    if challenge is None:
        await interaction.response.send_message(
            "❌ Challenge not found.",
            ephemeral=True,
        )
        return

    if not challenge["is_active"]:
        await interaction.response.send_message(
            "🔒 This challenge is currently inactive.",
            ephemeral=True,
        )
        return

    active_event = get_active_event()

    if active_event is None:
        await interaction.response.send_message(
            "📭 There is no active CTF event right now.",
            ephemeral=True,
        )
        return

    if challenge["event_id"] != active_event["id"]:
        await interaction.response.send_message(
            "🔒 This challenge does not belong to the active CTF event.",
            ephemeral=True,
        )
        return

    old_user = get_user(interaction.user.id)

    old_points = (
        old_user["points"]
        if old_user is not None
        else 0
    )

    old_level = get_level_from_xp(old_points)

    result = submit_flag(
        interaction.user.id,
        challenge_id,
        flag,
    )

    status = result["status"]

    if status == "incorrect":
        await interaction.response.send_message(
            "❌ **Incorrect flag.** Keep investigating!",
            ephemeral=True,
        )
        return

    if status == "already_solved":
        await interaction.response.send_message(
            "⚠️ You have already solved this challenge!",
            ephemeral=True,
        )
        return

    if status != "correct":
        await interaction.response.send_message(
            "❌ Submission could not be processed.",
            ephemeral=True,
        )
        return

    user = get_user(interaction.user.id)

    if user is None:
        await interaction.response.send_message(
            "❌ Could not load your updated profile.",
            ephemeral=True,
        )
        return

    total_points = user["points"]
    new_level = user["level"]
    solved_count = user["challenges_solved"]

    rank = get_rank(new_level)
    rank_emoji = get_rank_emoji(new_level)

    level_up_message = ""

    if new_level > old_level:
        level_up_message = (
            "\n\n🎉 **LEVEL UP!**\n"
            f"⚔️ Level **{new_level}**\n"
            f"{rank_emoji} **{rank}**"
        )

    await interaction.response.send_message(
        f"✅ **Correct Flag!**\n"
        f"🏆 Challenge: **{result['name']}**\n"
        f"🎯 **+{result['points']} XP**\n"
        f"💎 Total XP: **{total_points}**\n"
        f"⚔️ Level: **{new_level}**\n"
        f"{rank_emoji} Rank: **{rank}**\n"
        f"🔓 Challenges Solved: **{solved_count}**"
        f"{level_up_message}",
        ephemeral=True,
    )


# ============================================================
# /profile
# ============================================================

@bot.tree.command(
    name="profile",
    description="View your AMS Cyberverse profile",
)
async def profile(interaction: discord.Interaction):
    
    register_user(
        interaction.user.id,
        interaction.user.name,
        interaction.user.display_name,
    )

    user = get_user(interaction.user.id)

    if user is None:
        await interaction.response.send_message(
            "❌ Could not load your profile.",
            ephemeral=True,
        )
        return

    (
        _discord_id,
        username,
        display_name,
        points,
        level,
        challenges_solved,
        _joined_at,
    ) = user

    rank = get_rank(level)
    rank_emoji = get_rank_emoji(level)

    current_level_xp = get_xp_required(level)

    if level >= 100:
        next_level_xp = current_level_xp
        xp_remaining = 0
    else:
        next_level_xp = get_xp_required(level + 1)
        xp_remaining = max(0, next_level_xp - points)

    progress_bar = create_progress_bar(points, level)

    embed = discord.Embed(
        title="🛡️ AMS CYBERVERSE",
        description=(
            f"### 👤 {display_name}\n"
            f"`@{username}`\n\n"
            f"{rank_emoji} **{rank}**"
        ),
    )

    embed.add_field(
        name="⚔️ LEVEL",
        value=f"**{level} / 100**",
        inline=True,
    )

    embed.add_field(
        name="🏆 TOTAL XP",
        value=f"**{points:,}**",
        inline=True,
    )

    embed.add_field(
        name="🎯 CHALLENGES",
        value=f"**{challenges_solved}**",
        inline=True,
    )

    embed.add_field(
        name="📈 XP PROGRESS",
        value=(
            f"`{progress_bar}`\n"
            f"**{points:,} / {next_level_xp:,} XP**\n"
            f"⚡ **{xp_remaining:,} XP** to next level"
        ),
        inline=False,
    )

    if level >= 100:
        embed.add_field(
            name="👑 STATUS",
            value=(
                "**GODMODE ACHIEVED**\n"
                "You have reached the highest level."
            ),
            inline=False,
        )

    embed.set_footer(
        text="AMS Cyberverse • Cybersecurity Training Network"
    )

    await interaction.response.send_message(
        embed=embed,
        ephemeral=True,
    )


# ============================================================
# /leaderboard
# ============================================================

@bot.tree.command(
    name="leaderboard",
    description="View the top AMS Cyberverse hackers",
)
async def leaderboard(interaction: discord.Interaction):
    leaderboard_data = get_leaderboard(limit=10)

    if not leaderboard_data:
        await interaction.response.send_message(
            "📭 The leaderboard is empty. "
            "Be the first hacker to solve a challenge!"
        )
        return

    embed = discord.Embed(
        title="🏆 AMS CYBERVERSE LEADERBOARD",
        description="Top 10 hackers ranked by all-time XP",
    )

    medals = ["🥇", "🥈", "🥉"]

    for index, user in enumerate(leaderboard_data, start=1):
        (
            _discord_id,
            _username,
            display_name,
            points,
            level,
            challenges_solved,
        ) = user

        rank_number = (
            medals[index - 1]
            if index <= 3
            else f"`#{index}`"
        )

        rank = get_rank(level)
        rank_emoji = get_rank_emoji(level)

        embed.add_field(
            name=f"{rank_number}  {display_name}",
            value=(
                f"🏆 **{points:,} XP**  •  "
                f"⚔️ Level **{level}**\n"
                f"{rank_emoji} **{rank}**  •  "
                f"🎯 {challenges_solved} challenges"
            ),
            inline=False,
        )

    embed.set_footer(
        text="AMS Cyberverse • Keep hacking. Keep climbing."
    )

    await interaction.response.send_message(embed=embed)


# ============================================================
# START BOT
# ============================================================

bot.run(TOKEN)
