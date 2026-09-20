import os

import discord
from discord import app_commands
from dotenv import load_dotenv

from database_postgres import (
    activate_event,
    add_challenge,
    create_event,
    end_event,
    get_challenges,
    get_event,
    get_event_challenges,
    get_leaderboard,
    get_rank,
    get_rank_emoji,
    get_user,
    get_xp_required,
    register_user,
    submit_challenge,
)

load_dotenv()


TOKEN = os.getenv("DISCORD_TOKEN")

if not TOKEN:
    raise RuntimeError("DISCORD_TOKEN is missing from .env")


GUILD_ID = 1531533031704100955

intents = discord.Intents.default()
intents.message_content = True

bot = discord.Client(intents=intents)
tree = app_commands.CommandTree(bot)


def create_progress_bar(points: int, level: int) -> str:
    if level >= 100:
        return "██████████"

    current_level_xp = get_xp_required(level)
    next_level_xp = get_xp_required(level + 1)

    level_range = max(1, next_level_xp - current_level_xp)
    progress = max(0, points - current_level_xp)

    percentage = min(1.0, progress / level_range)

    filled = int(percentage * 10)
    empty = 10 - filled

    return "█" * filled + "░" * empty


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")

    guild = discord.Object(id=GUILD_ID)

    try:
        synced = await tree.sync(guild=guild)
        print(f"Synced {len(synced)} slash command(s) to AMS Cyberverse")
    except discord.HTTPException as error:
        print(f"Failed to sync commands: {error}")


# ============================================================
# PING
# ============================================================

@tree.command(
    name="ping",
    description="Check whether the AMS Cyberverse bot is online",
    guild=discord.Object(id=GUILD_ID),
)
async def ping(interaction: discord.Interaction):
    await interaction.response.send_message(
        "🛡️ AMS Cyberverse Bot is online!"
    )


# ============================================================
# EVENT
# ============================================================

@tree.command(
    name="event",
    description="View an AMS Cyberverse event",
    guild=discord.Object(id=GUILD_ID),
)
async def event(
    interaction: discord.Interaction,
    event_id: int,
):
    event_data = get_event(event_id)

    if event_data is None:
        await interaction.response.send_message(
            "❌ Event not found.",
            ephemeral=True,
        )
        return

    embed = discord.Embed(
        title=f"🎯 {event_data['name']}",
        description=event_data["description"],
    )

    embed.add_field(
        name="STATUS",
        value=str(event_data["status"]),
        inline=True,
    )

    embed.add_field(
        name="EVENT ID",
        value=str(event_data["id"]),
        inline=True,
    )

    await interaction.response.send_message(embed=embed)


# ============================================================
# EVENTS
# ============================================================

@tree.command(
    name="events",
    description="View AMS Cyberverse events",
    guild=discord.Object(id=GUILD_ID),
)
async def events(interaction: discord.Interaction):
    await interaction.response.send_message(
        "📋 Event listing is available through the AMS Cyberverse dashboard."
    )


# ============================================================
# CREATE EVENT
# ============================================================

@tree.command(
    name="createevent",
    description="Create a new AMS Cyberverse event",
    guild=discord.Object(id=GUILD_ID),
)
@app_commands.checks.has_permissions(administrator=True)
async def createevent(
    interaction: discord.Interaction,
    name: str,
    description: str,
):
    event_id = create_event(
        name=name,
        description=description,
    )

    await interaction.response.send_message(
        f"✅ Event created successfully.\n\n"
        f"🎯 **{name}**\n"
        f"📝 {description}\n"
        f"🆔 Event ID: **{event_id}**\n"
        f"📌 Status: **DRAFT**"
    )


# ============================================================
# ACTIVATE EVENT
# ============================================================

@tree.command(
    name="activateevent",
    description="Activate an AMS Cyberverse event",
    guild=discord.Object(id=GUILD_ID),
)
@app_commands.checks.has_permissions(administrator=True)
async def activateevent(
    interaction: discord.Interaction,
    event_id: int,
):
    event_data = get_event(event_id)

    if event_data is None:
        await interaction.response.send_message(
            "❌ Event not found.",
            ephemeral=True,
        )
        return

    activate_event(event_id)

    await interaction.response.send_message(
        f"🟢 Event **{event_data['name']}** is now ACTIVE!"
    )


# ============================================================
# END EVENT
# ============================================================

@tree.command(
    name="endevent",
    description="End an AMS Cyberverse event",
    guild=discord.Object(id=GUILD_ID),
)
@app_commands.checks.has_permissions(administrator=True)
async def endevent(
    interaction: discord.Interaction,
    event_id: int,
):
    event_data = get_event(event_id)

    if event_data is None:
        await interaction.response.send_message(
            "❌ Event not found.",
            ephemeral=True,
        )
        return

    end_event(event_id)

    await interaction.response.send_message(
        f"🔴 Event **{event_data['name']}** has ended."
    )


# ============================================================
# EVENT CHALLENGES
# ============================================================

@tree.command(
    name="eventchallenges",
    description="View challenges belonging to an event",
    guild=discord.Object(id=GUILD_ID),
)
async def eventchallenges(
    interaction: discord.Interaction,
    event_id: int,
):
    challenges = get_event_challenges(event_id)

    if not challenges:
        await interaction.response.send_message(
            "📭 No challenges have been added to this event yet.",
            ephemeral=True,
        )
        return

    embed = discord.Embed(
        title=f"🎯 Event {event_id} Challenges",
        description="Available cybersecurity challenges",
    )

    for challenge in challenges:
        embed.add_field(
            name=challenge["name"],
            value=(
                f"{challenge['description']}\n"
                f"💰 **{challenge['points']} points**\n"
                f"🏷️ {challenge['category']}"
            ),
            inline=False,
        )

    await interaction.response.send_message(embed=embed)


# ============================================================
# CHALLENGES
# ============================================================

@tree.command(
    name="challenges",
    description="View available cybersecurity challenges",
    guild=discord.Object(id=GUILD_ID),
)
async def challenges(interaction: discord.Interaction):
    challenge_list = get_challenges()

    if not challenge_list:
        await interaction.response.send_message(
            "📭 No challenges are available yet.",
            ephemeral=True,
        )
        return

    embed = discord.Embed(
        title="⚔️ AMS CYBERVERSE CHALLENGES",
        description="Available cybersecurity challenges",
    )

    for challenge in challenge_list:
        embed.add_field(
            name=f"#{challenge['id']} — {challenge['name']}",
            value=(
                f"{challenge['description']}\n"
                f"💰 **{challenge['points']} points**\n"
                f"🏷️ {challenge['category']}"
            ),
            inline=False,
        )

    await interaction.response.send_message(embed=embed)


# ============================================================
# ADD CHALLENGE
# ============================================================

@tree.command(
    name="addchallenge",
    description="Add a cybersecurity challenge",
    guild=discord.Object(id=GUILD_ID),
)
@app_commands.checks.has_permissions(administrator=True)
async def addchallenge(
    interaction: discord.Interaction,
    name: str,
    description: str,
    flag: str,
    points: int,
    category: str,
):
    challenge_id = add_challenge(
        name=name,
        description=description,
        flag=flag,
        points=points,
        category=category,
    )

    await interaction.response.send_message(
        f"✅ Challenge created!\n\n"
        f"🆔 Challenge ID: **{challenge_id}**\n"
        f"⚔️ **{name}**\n"
        f"💰 **{points} points**\n"
        f"🏷️ **{category}**"
    )


# ============================================================
# SUBMIT CHALLENGE
# ============================================================

@tree.command(
    name="submit",
    description="Submit a flag for a cybersecurity challenge",
    guild=discord.Object(id=GUILD_ID),
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

    result = submit_challenge(
        interaction.user.id,
        challenge_id,
        flag,
    )

    if result is None:
        await interaction.response.send_message(
            "❌ Challenge not found.",
            ephemeral=True,
        )
        return

    if result["status"] == "already_solved":
        await interaction.response.send_message(
            "⚠️ You have already solved this challenge.",
            ephemeral=True,
        )
        return

    if result["status"] == "incorrect":
        await interaction.response.send_message(
            "❌ Incorrect flag. Keep hunting.",
            ephemeral=True,
        )
        return

    user = get_user(interaction.user.id)

    if user is None:
        await interaction.response.send_message(
            "⚠️ Challenge solved, but profile could not be loaded.",
            ephemeral=True,
        )
        return

    await interaction.response.send_message(
        f"🏆 **Challenge Solved!**\n\n"
        f"⚔️ Challenge: **{result['challenge_name']}**\n"
        f"💰 Points earned: **+{result['points']}**\n"
        f"📈 Total XP: **{user['points']}**\n"
        f"🔥 Level: **{user['level']}**"
    )


# ============================================================
# PROFILE
# ============================================================

@tree.command(
    name="profile",
    description="View your AMS Cyberverse profile",
    guild=discord.Object(id=GUILD_ID),
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

    username = user["username"]
    display_name = user["display_name"]
    points = user["points"]
    level = user["level"]
    challenges_solved = user["challenges_solved"]

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
# LEADERBOARD
# ============================================================

@tree.command(
    name="leaderboard",
    description="View the AMS Cyberverse leaderboard",
    guild=discord.Object(id=GUILD_ID),
)
async def leaderboard(interaction: discord.Interaction):
    users = get_leaderboard()

    if not users:
        await interaction.response.send_message(
            "📭 No players are registered yet.",
            ephemeral=True,
        )
        return

    embed = discord.Embed(
        title="🏆 AMS CYBERVERSE LEADERBOARD",
        description="Top cybersecurity warriors",
    )

    lines = []
    medals = ["🥇", "🥈", "🥉"]

    for index, user in enumerate(users, start=1):
        display_name = user["display_name"]
        points = user["points"]
        level = user["level"]
        challenges_solved = user["challenges_solved"]

        rank_number = (
            medals[index - 1]
            if index <= 3
            else f"`#{index}`"
        )

        rank = get_rank(level)
        rank_emoji = get_rank_emoji(level)

        lines.append(
            f"{rank_number}  **{display_name}**\n"
            f"   🏆 **{points:,} XP**  •  "
            f"⚔️ Level **{level}**\n"
            f"   {rank_emoji} **{rank}**  •  "
            f"🎯 {challenges_solved} challenges"
        )

    embed.description = "\n\n".join(lines)

    embed.set_footer(
        text="AMS Cyberverse • Keep hacking. Keep climbing."
    )

    await interaction.response.send_message(embed=embed)


# ============================================================
# ERROR HANDLER
# ============================================================

@tree.error
async def on_app_command_error(
    interaction: discord.Interaction,
    error: app_commands.AppCommandError,
):
    if isinstance(error, app_commands.errors.MissingPermissions):
        message = "⛔ You do not have permission to use this command."
    else:
        print(f"Command error: {error}")
        message = "❌ Something went wrong while processing the command."

    if interaction.response.is_done():
        await interaction.followup.send(
            message,
            ephemeral=True,
        )
    else:
        await interaction.response.send_message(
            message,
            ephemeral=True,
        )


# ============================================================
# START BOT
# ============================================================

bot.run(TOKEN)