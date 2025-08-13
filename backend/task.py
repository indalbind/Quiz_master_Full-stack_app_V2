from flask import current_app, render_template
from datetime import datetime, timedelta
import flask_excel as excel
from .cel_worker import celery
from .models import db, Quiz, User, Score,Question,Chapter,Subject
from .mail import send_email
import csv
import calendar
from backend.redis import cache
from sqlalchemy import and_, func

@celery.task(ignore_result=False)
def create_user_csv(user_id):
    try:
        # Join Quiz by sql join -> Chapter, Score, and Question
        quiz_data = db.session.query(
            Quiz.id.label('quiz_id'),
            Chapter.id.label('chapter_id'),
            Chapter.name.label('chapter_name'),
            Subject.name.label('subject_name'),
            Quiz.date_of_quiz.label('date_of_quiz'),
            Quiz.name.label('quiz_name'),
            Quiz.remarks.label('quiz_remarks'),
            Quiz.no_of_question.label('total_questions'),
            func.coalesce(func.sum(Question.mark), 0).label('total_marks'),
            Score.total_scored.label('quiz_score')
        ).join(Score, Quiz.id == Score.quiz_id)\
         .join(Chapter, Quiz.chapter_id == Chapter.id)\
         .join(Subject,Chapter.subject_id == Subject.id)\
         .outerjoin(Question, Question.quiz_id == Quiz.id)\
         .filter(and_(Score.user_id == user_id, Score.total_scored != None))\
         .group_by(Quiz.id, Chapter.id,Chapter.name,Subject.name, Quiz.date_of_quiz, Score.total_scored)\
         .order_by(Quiz.date_of_quiz.desc())\
         .all()

        if not quiz_data:
            current_app.logger.info(f"No quiz data found for user {user_id}")
            return None
        
        user = User.query.get(user_id)

        filename = f"user_{user.full_name}_quiz_data.csv"

        with open(filename, "w", newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([
                "Quiz ID",
                "Chapter ID",
                "Chapter Name",
                "Subject Name",
                "Date of Quiz",
                "Quiz Name",
                "Quiz Remarks",
                "Total Questions",
                "Total Marks",
                "Your Score"
            ])
            for q in quiz_data:
                writer.writerow([
                    q.quiz_id,
                    q.chapter_id,
                    q.chapter_name,
                    q.subject_name,
                    q.date_of_quiz.strftime("%Y-%m-%d") if q.date_of_quiz else "N/A",
                    q.quiz_name,
                    q.quiz_remarks or "N/A",
                    q.total_questions,
                    q.total_marks,
                    q.quiz_score
                ])

        return filename

    except Exception as e:
        current_app.logger.error(f"Error generating CSV for user {user_id}: {e}")
        raise



@celery.task(ignore_result=False)
def create_admin_csv():
    try:
        # users = User.query.filter(User.is_admin == False).all()
        users = db.session.query(
            User.id,
            User.full_name,
            func.count(Score.id).label('quizzes_given'),
            func.avg((Score.total_scored * 100.0) / Quiz.no_of_question).label('avg_percentage')
        ).filter(User.id > 1).outerjoin(Score, User.id == Score.user_id)\
         .outerjoin(Quiz, Score.quiz_id == Quiz.id)\
         .group_by(User.id)\
         .all()

        headers = ["User ID", "User Name", "Quizzes Given", "Average %"]
        data = [
            (u.id, u.full_name, u.quizzes_given, f"{u.avg_percentage:.2f}%" if u.avg_percentage else "N/A")
            for u in users
        ]



        filename = "admin_user_quiz_data.csv"
        with open(filename, "w", newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(data)

        return filename
    except Exception as e:
        current_app.logger.error(f"Error generating admin CSV: {e}")
        raise

@celery.task(ignore_result=True)
def daily_reminders():
    try:
        yesterday = datetime.utcnow() - timedelta(days=1)
        new_quizzes = Quiz.query.filter(Quiz.date_of_quiz >= yesterday).all()
        students = User.query.filter_by(is_admin=False, blocked=False).all()

        subject = "Reminder: Check for New Quizzes!"

        for student in students:
            # Get last visit from Redis
            last_visit_str = cache.get(f"user_last_visit:{student.id}")
            last_visit = datetime.fromisoformat(last_visit_str) if last_visit_str else None

            needs_reminder = (
                not last_visit or  # never visited
                last_visit < yesterday or  # inactive
                new_quizzes  # there are new quizzes today
            )

            if needs_reminder:
                quiz_list = ", ".join(q.name for q in new_quizzes) if new_quizzes else "some quizzes you may have missed"
                body = f"""
                Hello {student.full_name},<br><br>
                You haven't visited us recently or new quizzes have been added: <strong>{quiz_list}</strong><br>
                Log in and stay on track with your learning!<br><br>
                Regards,<br>
                Quiz Master
                """
                send_email.delay(student.email, subject, body)

        return "Reminders processed"
    except Exception as e:
        current_app.logger.error(f"Error in reminders: {e}")
        raise

# nead to working on monthly reports
@celery.task(ignore_result=True)
def monthly_reports():
    try:
        students = User.query.filter_by(is_admin=False, blocked=False).all()

        for student in students:
            monthly_report_email(student)

        return "Monthly reports sent"
    except Exception as e:
        current_app.logger.error(f"Error sending monthly reports: {e}")
        raise

def monthly_report_email(user):
    last_month = datetime.utcnow().replace(day=1) - timedelta(days=1)
    start_of_month = last_month.replace(day=1)
    # Using calendar to find the last day of the last month
    last_day_of_month = calendar.monthrange(last_month.year, last_month.month)[1]
    end_of_month = last_month.replace(day=last_day_of_month)

    scores = Score.query.filter(
        Score.user_id == user.id,
        Score.time_stamp_of_attempt >= start_of_month,
        Score.time_stamp_of_attempt <= end_of_month,
        Score.total_scored.isnot(None),
        Score.quiz.has(Quiz.no_of_question > 0)
    ).all()

    valid_scores = [score.total_scored for score in scores if score.total_scored is not None]
    total_quizzes = len(valid_scores)
    avg_score = (sum(valid_scores) / total_quizzes) if total_quizzes > 0 else 0


    html_body = render_template(
        'monthly_report.html',
        user=user,
        total_quizzes=total_quizzes,
        scores=scores,
        average_score=avg_score,
        last_month = last_month
    )

    subject = f"Monthly Quiz Report - {last_month.strftime('%B %Y')}"
    send_email(user.email, subject, html_body)
