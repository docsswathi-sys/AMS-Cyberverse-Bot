from database import add_quiz_question, create_quiz


def main():
    # Create the quiz
    quiz_id = create_quiz(
        title="Cybersecurity Fundamentals",
        description="Test your knowledge of core cybersecurity concepts.",
        category="Cybersecurity",
        difficulty="easy",
        is_active=True,
    )

    print(f"Created quiz with ID: {quiz_id}")

    # Question 1
    add_quiz_question(
        quiz_id=quiz_id,
        question="What does CIA stand for in cybersecurity?",
        option_a="Confidentiality, Integrity, Availability",
        option_b="Control, Inspection, Authentication",
        option_c="Cybersecurity, Intelligence, Access",
        option_d="Confidentiality, Inspection, Authorization",
        correct_answer="A",
        points=10,
    )

    # Question 2
    add_quiz_question(
        quiz_id=quiz_id,
        question="Which protocol is commonly used to securely access a remote Linux server?",
        option_a="FTP",
        option_b="HTTP",
        option_c="SSH",
        option_d="Telnet",
        correct_answer="C",
        points=10,
    )

    # Question 3
    add_quiz_question(
        quiz_id=quiz_id,
        question="What is phishing?",
        option_a="A method of encrypting files",
        option_b="A social engineering attack used to trick victims",
        option_c="A network routing protocol",
        option_d="A type of firewall",
        correct_answer="B",
        points=10,
    )

    # Question 4
    add_quiz_question(
        quiz_id=quiz_id,
        question="Which of these is a strong password practice?",
        option_a="Using your birthday",
        option_b="Using the same password everywhere",
        option_c="Using a long, unique password",
        option_d="Using only lowercase letters",
        correct_answer="C",
        points=10,
    )

    # Question 5
    add_quiz_question(
        quiz_id=quiz_id,
        question="What is the primary purpose of a firewall?",
        option_a="To physically repair computers",
        option_b="To filter and control network traffic",
        option_c="To increase monitor resolution",
        option_d="To compress files",
        correct_answer="B",
        points=10,
    )

    print("Added 5 quiz questions.")
    print("Quiz seeding complete.")


if __name__ == "__main__":
    main()