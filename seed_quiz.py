from dotenv import load_dotenv

load_dotenv()

from database_postgres import add_quiz_question, create_quiz


def main():
    # Create the quiz
    quiz_id = create_quiz(
        title="Cyber Defence: College Under Attack",
        description="Test your cybersecurity knowledge through real-world college attack scenarios.",
        category="Cybersecurity",
        difficulty="easy",
        is_active=True,
    )

    print(f"Created quiz with ID: {quiz_id}")

    # Question 1 — CIA Triad: Confidentiality
    add_quiz_question(
        quiz_id=quiz_id,
        question="A student's private marks are leaked online without permission. Which CIA Triad principle is violated?",
        option_a="Confidentiality",
        option_b="Integrity",
        option_c="Availability",
        option_d="Authentication",
        correct_answer="A",
        points=10,
    )

    # Question 2 — CIA Triad: Integrity
    add_quiz_question(
        quiz_id=quiz_id,
        question="A student's marks are secretly changed from 72 to 92. Which CIA Triad principle is violated?",
        option_a="Availability",
        option_b="Confidentiality",
        option_c="Integrity",
        option_d="Authorization",
        correct_answer="C",
        points=10,
    )

    # Question 3 — CIA Triad: Availability
    add_quiz_question(
        quiz_id=quiz_id,
        question="On result day, the college website goes down and students cannot access their results. Which CIA Triad principle is affected?",
        option_a="Integrity",
        option_b="Availability",
        option_c="Confidentiality",
        option_d="Authentication",
        correct_answer="B",
        points=10,
    )

    # Question 4 — Social Engineering + Malware
    add_quiz_question(
        quiz_id=quiz_id,
        question="You receive a message claiming to be from HR asking you to open an unexpected salary-increment file. What should you do?",
        option_a="Open the file immediately",
        option_b="Forward it to everyone",
        option_c="Verify with HR through another trusted channel",
        option_d="Disable your antivirus and open it",
        correct_answer="C",
        points=10,
    )

    # Question 5 — Red Team
    add_quiz_question(
        quiz_id=quiz_id,
        question="Which cybersecurity team simulates attacks to identify vulnerabilities in an organization's systems?",
        option_a="Blue Team",
        option_b="Red Team",
        option_c="SOC Team",
        option_d="Incident Response Team",
        correct_answer="B",
        points=10,
    )

    # Question 6 — Blue Team
    add_quiz_question(
        quiz_id=quiz_id,
        question="Which team is primarily responsible for defending systems, detecting attacks, and responding to threats?",
        option_a="Red Team",
        option_b="Blue Team",
        option_c="Development Team",
        option_d="Audit Team",
        correct_answer="B",
        points=10,
    )

    # Question 7 — SOC
    add_quiz_question(
        quiz_id=quiz_id,
        question="A college security control room receives hundreds of suspicious alerts. What is the primary role of the SOC?",
        option_a="Design new college websites",
        option_b="Investigate suspicious events and determine which are real threats",
        option_c="Replace all computers",
        option_d="Create student examination papers",
        correct_answer="B",
        points=10,
    )

    # Question 8 — Web Security
    add_quiz_question(
        quiz_id=quiz_id,
        question="A student can access another student's marks by changing an ID in the URL. Which security area should be investigated?",
        option_a="Website access control",
        option_b="Disk encryption",
        option_c="Physical security",
        option_d="Wireless signal strength",
        correct_answer="A",
        points=10,
    )

    # Question 9 — Digital Forensics
    add_quiz_question(
        quiz_id=quiz_id,
        question="After a cyberattack, investigators need to determine what happened by examining digital evidence. Which field handles this?",
        option_a="Digital Forensics",
        option_b="Graphic Design",
        option_c="Database Administration",
        option_d="Software Testing",
        correct_answer="A",
        points=10,
    )

    # Question 10 — Malware Analysis
    add_quiz_question(
        quiz_id=quiz_id,
        question="A suspicious file is discovered on a college computer. What is the primary goal of malware analysis?",
        option_a="Find out what the file does and how it behaves",
        option_b="Increase the computer's storage",
        option_c="Improve the monitor resolution",
        option_d="Change the user's password",
        correct_answer="A",
        points=10,
    )

    # Question 11 — Cloud Security
    add_quiz_question(
        quiz_id=quiz_id,
        question="A college document is stored in a public cloud drive and unauthorized people may access it. Which area should be investigated?",
        option_a="Cloud Security",
        option_b="Digital Forensics",
        option_c="Red Teaming",
        option_d="Malware Analysis",
        correct_answer="A",
        points=10,
    )

    # Question 12 — Incident Response
    add_quiz_question(
        quiz_id=quiz_id,
        question="A major cyberattack hits the college. The response requires monitoring, defense, web investigation, forensic analysis, and malware analysis. What overall process coordinates the response?",
        option_a="Incident Response",
        option_b="Graphic Design",
        option_c="Software Development",
        option_d="Network Installation",
        correct_answer="A",
        points=10,
    )

    print("Added 12 quiz questions.")
    print("Total possible points: 120")
    print("Quiz seeding complete.")


if __name__ == "__main__":
    main()