from flask_restful import Resource, Api, reqparse, fields,request
from backend.models import db, Chapter, User, Subject,Quiz,Question,Score  
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, get_jwt
from datetime import datetime 
from .decorator import admin_required,user_required # but before using this we have to use @jwt_required() and both we write before http methods 
from backend.api import api # so that api moudul are include in this file also
from datetime import date
from sqlalchemy import extract
from sqlalchemy import func, and_
from backend.redis import cache
from flask import url_for

class welcomeuser(Resource): # in this :type of class we have to write the get,post,put and add the resources
    def get(self): # must be self
        return {"message":"working from user api "},200

api.add_resource(welcomeuser,'/welcomeuser')

# to know when user visite 
class UserVisit(Resource):
    @jwt_required()
    @user_required
    def post(self,user_id):
        cache.set(f"user_last_visit:{user_id}", datetime.utcnow().isoformat()) # store the uservisit on redis database
        return {"message": "Visit time recorded"}, 200
api.add_resource(UserVisit, '/user/visit')

# --------------------------------------------------
# user can able to see the all subject
# -------------------------------------------------
class subjectUser(Resource):
    @jwt_required()
    @user_required
    def get(self,user_id):
        subjects = Subject.query.all()
        if not subjects:
            return {"msg":"on any subject"},404
        
        subject_list = []
        for s in subjects:
            subject_list.append({
                "id": s.id,
                "name": s.name,
                "description":s.description
            })
        return {"subjects": subject_list}, 200

    
api.add_resource(subjectUser,'/user/subject')


# ------------------------
# now user can able to see the chapter like mathematic and in this relation and function is chapter
# ------------------------------
class ChapterUser(Resource):
    @jwt_required()
    @user_required
    def get(self,user_id):
        subject_id = request.args.get('subject_id')
        if subject_id:
            chapters = Chapter.query.filter_by(subject_id=subject_id).all()
        else:
            chapters = Chapter.query.all()

        if not chapters:
            return {"msg": "No chapters found"}, 404

        chapter_list = []
        for c in chapters:
            chapter_list.append({
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "subject_id": c.subject_id
            })
        return {"chapters": chapter_list}, 200

api.add_resource(ChapterUser, '/user/chapter')



# --------------------------------
# now after openning the chapter user can able to attend the quiz on that chapter 🖐️
# --------------------------------
class viewquiz(Resource):
    @jwt_required()
    @user_required 
    def get(self, user_id, subject_id, chapter_id, quiz_id):
        today = date.today()

        quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
        if not quiz:
            return {"msg": "Quiz not found in the specified chapter"}, 404

        chapter = Chapter.query.get(chapter_id)
        if chapter.subject_id != subject_id:
            return {"msg": "The specified chapter does not belong to this subject"}, 400

        user_score = Score.query.filter_by(user_id=user_id, quiz_id=quiz_id).first()
        if not user_score:
            new_score = Score(user_id=user_id, quiz_id=quiz_id, total_scored=None)
            db.session.add(new_score)
            db.session.commit()
            # to know exact question
        question_counts = db.session.query(func.count()).select_from(Question).filter_by(quiz_id=quiz_id).scalar()
        
        result = {
            'id': quiz.id,
            'name': quiz.name,
            'date_of_quiz': quiz.date_of_quiz.isoformat(),
            'time_duration': quiz.time_duration,
            'num_of_ques': question_counts,
            'total_queston': quiz.no_of_question,
            'chapter': {
                'name': quiz.chapter.name,
                'subject': {
                    'name': quiz.chapter.subject.name
                }
            },
            'status': 'upcoming' if quiz.date_of_quiz > today else 'avaliable'
        }

        return {"msg": "Quiz started or already exists", "quiz_details": result}, 200
api.add_resource(viewquiz, '/user/subject/<int:subject_id>/chapter/<int:chapter_id>/quiz/<int:quiz_id>/view')

# we got the result like bellow 
# {
#   "msg": "Quiz started or already exists",
#   "quiz_details": {
#     "id": 7,
#     "name": "Newton’s Laws",
#     "date_of_quiz": "2025-04-30",
#     "time_duration": 20,
#     "num_of_ques": 10,
#     "chapter": {
#       "name": "Laws of Motion",
#       "subject": {
#         "name": "Physics"
#       }
#     },
#     "status": "upcoming"
#   }
# }
# this is usefull  🥰 
class QuizList(Resource):
    @jwt_required()
    @user_required
    def get(self, user_id):
        user = User.query.get(user_id)
        if user.blocked:
            return {"msg": "User is blocked"}, 403
        
        today = date.today()
        # quizzes = Quiz.query.filter(Quiz.date_of_quiz > today).all()
        quizzes = Quiz.query.all()
        quiz_list = []
        for q in quizzes:
            quiz_list.append({
                "id": q.id,
                "num_of_ques": q.no_of_question,
                "date_of_quiz": q.date_of_quiz.isoformat(),
                "time_duration": q.time_duration,
                "chapter": {
                    "id": q.chapter.id,
                    "name": q.chapter.name,
                    "subject": {
                        "id": q.chapter.subject.id,
                        "name": q.chapter.subject.name
                    }
                }
            })
        return {"quizzes": quiz_list}, 200

api.add_resource(QuizList, '/user/quizzes')

# ------------------------------------------------
# now after opening the chapter user must see the all qesestion 
#  allowing the user to fetch all the questions associated with a specific quiz and then start answering the question 
# ---------------------------------------------
class startquiz(Resource):
    @jwt_required()
    @user_required
    def get(self, user_id, quiz_id):

        # Fetch the quiz by ID
        quiz = Quiz.query.get_or_404(quiz_id)

        chapter = quiz.chapter
        subject = chapter.subject

        today = date.today()

       
        if quiz.date_of_quiz > today:
            return {"msg": "The quiz is not available yet.",
                    "date_of_quiz": quiz.date_of_quiz.isoformat()
                    }, 403


        questions = Question.query.filter_by(quiz_id=quiz_id).all()

        questions_list = []
        for q in questions:
            question_data = {
                "id": q.id,
                "question": q.question_statement,  
                "question_type": q.question_type,  
                "correct_answer": q.correct_answer
            }

            
            if q.question_type == 'mcq':
                question_data.update({
                    "option1": q.option1,
                    "option2": q.option2,
                    "option3": q.option3,
                    "option4": q.option4
                })
            elif q.question_type in ['numerical', 'text']:
                question_data["correct_answer"] = q.correct_answer  

            if q.image_path:
                from os.path import basename
                filename = basename(q.image_path)  # gets just 'image.png'
                question_data["image_path"] = url_for('static', filename=f'images/questionImg/{filename}', _external=False)

            questions_list.append(question_data)

        return {
            "quiz": {
                "id": quiz.id,
                "name": quiz.name,
                "date_of_quiz": quiz.date_of_quiz.isoformat(),
                "time_duration": quiz.time_duration,
                "num_of_questions": len(questions_list),
                "chapter": {
                    "name": quiz.chapter.name,
                    "subject": {
                        "name": quiz.chapter.subject.name
                    }
                }
            },
            "questions": questions_list
        }, 200

# Register the API resource
api.add_resource(startquiz, '/user/quiz/<int:quiz_id>/questions')


# so we get the response of userQuestion is like
# {
#   "quiz": {
#     "id": 1,
#     "name": "level1",
#     "date_of_quiz": "2023-03-02",
#     "time_duration": "30",
#     "num_of_questions": 1,
#     "chapter": {
#       "name": "relation and function",
#       "subject": {
#         "name": "mathematics"
#       }
#     }
#   },
#   "questions": [
#     {
#       "id": 1,
#       "question": "what is relation",
#       "question_type": "mcq",
#       "correct_answer": "3",
#       "option1": "axb is realation",
#       "option2": "subset of a and b is realation",
#       "option3": "subset of axb is realation",
#       "option4": "none of the above"
#     }
#   ]
# }



# -----------------------------------------------
# now user can able submit quiz after giving the answer of question and get the total answer  
# ----------------------------------------------

class SubmitQuiz(Resource):
    @jwt_required()
    @user_required
    def post(self, user_id, quiz_id):
        data = request.get_json()
        user_answers = data.get("answers")  

        if not user_answers:
            return {"msg": "No answers provided"}, 400

        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"msg": "Quiz not found"}, 404

        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        total_score = 0

        # {
        #   "answers": {
        #     "1": "3"
        #   }
        # }  this is the way to give the answer of question 

        for q in questions:
            user_answer = user_answers.get(str(q.id)) or user_answers.get(q.id)
            if not user_answer or user_answer.strip() == "":
                continue # so if not answer then that skip and get nothing
                
            if q.question_type == 'mcq':
                # Normalize the correct answer format
                correct_answer = q.correct_answer.strip().upper()
                
                # Convert letter (A-D) to number (1-4) if needed
                if correct_answer in {'A', 'B', 'C', 'D'}:
                        option_number = ord(correct_answer) - ord('A') + 1 # ord() gives the ASCII (or Unicode) numeric value of a character.
                #    so option_number give the 1 or 2 or 3 or 4 
                else:
                        # Try to parse as number
                    try:
                        option_number = int(correct_answer)
                    except ValueError:
                        option_number = 0  # Invalid format

                    # Get the corresponding option text
                correct_option_text = getattr(q, f'option{option_number}', '').strip().lower()
                user_answer_clean = user_answer.strip().lower()

                if user_answer_clean == correct_option_text:
                    total_score += q.mark

            # Handle numerical/text questions
            else:
                correct_answer_clean = q.correct_answer.strip().lower()
                user_answer_clean = user_answer.strip().lower()
                if user_answer_clean == correct_answer_clean:
                    total_score += q.mark

        score = Score.query.filter_by(user_id=user_id, quiz_id=quiz_id).first()
        if not score:
            score = Score(user_id=user_id, quiz_id=quiz_id, total_scored=0, user_answers={})
            db.session.add(score)
            db.session.commit()

        score.total_scored = total_score
        score.user_answers = user_answers
        db.session.commit() 

        return {"msg": f"Quiz submitted! You scored {total_score} marks."}, 200

api.add_resource(SubmitQuiz,'/user/quiz/<int:quiz_id>/submitquiz')


# ---------------------------------------
# user can retake the quiz 
# --------------------------------------

class RetakeQuiz(Resource):
    @jwt_required()
    @user_required
    def post(self, user_id, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"msg": "Quiz not found"}, 404
        
        score = Score.query.filter_by(user_id=user_id, quiz_id=quiz_id).first()
        if score:
            # Reset previous attempt
            score.total_scored = None
            score.user_answers = None
            score.time_stamp_of_attempt = datetime.utcnow()
        else:
            score = Score(user_id=user_id, quiz_id=quiz_id, total_scored=None)
            db.session.add(score)

        db.session.commit()

        return {"msg": "Quiz restarted. Good luck!"}, 200

api.add_resource(RetakeQuiz,'/user/quiz/<int:quiz_id>/retake')





# ----------------------------------------------------------------------------
# after submiting where students can view the results of their quiz after submission. It shows them the questions, their answers, the correct answers, and their score.
# so for that we have to make another api 
# ---------------------------------------------------------------------------------------------

class userResult(Resource):
    @jwt_required()
    @user_required
    def get(self, user_id, quiz_id):
        score = Score.query.filter_by(user_id=user_id, quiz_id=quiz_id).first()
        if not score:
            return {"msg": "No quiz result found for this user and quiz."}, 404

        questions = Question.query.filter_by(quiz_id=quiz_id).all()


        result_data = []
        for q in questions:
            user_answer = score.user_answers.get(str(q.id))
            correct_answer = q.correct_answer

            question_data = {
                "question": q.question_statement,
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "is_correct": user_answer == correct_answer  # Check if the answer is correct
            }

            result_data.append(question_data)


        return {
            "quiz_id": quiz_id,
            "total_score": score.total_scored,
            "questions": result_data
        }, 200


api.add_resource(userResult, '/user/quiz/<int:quiz_id>/result')


# student score api 
# student summary api 
# nead to make as for not if neaded in frontend then we make more api 

# ----------------------------------------------
# user score api so that user can able to see the how much he score after submiting the quiz question
# --------------------------------------------------------------

class UserQuizDetailedScore(Resource):
    @jwt_required()
    @user_required
    def get(self, user_id ,quiz_id):
        score = Score.query.filter_by(user_id=user_id, quiz_id=quiz_id).first()
        if not score:
            return {"msg": "No quiz attempt found for this user and quiz."}, 404

        questions = Question.query.filter_by(quiz_id=quiz_id).all()

        result_data = []
        for question in questions:
            user_answer = score.user_answers.get(str(question.id))
            correct_answer = question.correct_answer

            question_data = {
                "question_id": question.id,
                "question": question.question_statement,
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "is_correct": user_answer == correct_answer
            }
            result_data.append(question_data)

        return {
            "id": score.id,
            "timestamp": score.time_stamp_of_attempt.isoformat(),  
            "total_scored": score.total_scored,
            "quiz": {
                "id": score.quiz.id,
                "name": score.quiz.name,
                "no_of_question": score.quiz.no_of_question  
            },
            "questions": result_data
        }, 200


api.add_resource(UserQuizDetailedScore, '/user/quiz/<int:quiz_id>/detailedscore')


# this is usefull user = User.query.get(user_id)
class UserScores(Resource):
    @jwt_required()
    @user_required
    def get(self,user_id): 
        user = User.query.get(user_id)
        if user.blocked:
            return {"msg": "User is blocked"}, 403
        
        current_user_id = get_jwt_identity()
        
        # Get only submitted scores
        scores = Score.query.filter_by(user_id=current_user_id).filter(Score.total_scored.isnot(None)).all()

        if not scores:
            return {"msg": "No quiz attempts found"}, 404

        # Calculate total marks per quiz
        quiz_ids = [s.quiz_id for s in scores]
        total_marks_per_quiz = db.session.query(Question.quiz_id, func.sum(Question.mark).label('total_marks')
        ).filter(Question.quiz_id.in_(quiz_ids)).group_by(Question.quiz_id).all()
        
        total_marks_dict = {quiz_id: total_marks for quiz_id, total_marks in total_marks_per_quiz}
        
        score_list = []
        for score in scores:
            quiz = Quiz.query.get(score.quiz_id)
            if not quiz:
                continue
                
            # question_countsa = db.session.query(func.count()).select_from(Question).filter_by(quiz_id = quiz.id).scalar()
            chapter = Chapter.query.get(quiz.chapter_id)
            subject = Subject.query.get(chapter.subject_id)
            
            total_marks = total_marks_dict.get(score.quiz_id, 0)
            percentage = (score.total_scored / total_marks * 100) if total_marks > 0 else 0
            score_list.append({
                "quiz_id": score.quiz_id,
                "quiz_name": quiz.name,
                "chapter_name": chapter.name,
                "subject_name": subject.name,
                "total_scored": score.total_scored,
                "max_marks": total_marks,
                "total_questions": quiz.no_of_question,
                "percentage": round(percentage, 2),
                "attempt_date": score.time_stamp_of_attempt.isoformat()
            })
        
        score_list.sort(key=lambda x: x["attempt_date"], reverse=True)
        
        return {"scores": score_list}, 200


# Add this to your API routes
api.add_resource(UserScores, '/user/scores')  # Note: Added /api prefix



# ---------------------------------------------------
# user summary 
# --------------------------------------------------
class userSummary(Resource):
    @jwt_required()
    @user_required
    def get(self, user_id):
        user = User.query.get(user_id)
        if user.blocked:
            return {"msg": "User is blocked"}, 403
        # Subject wise report - now includes total quizzes per subject
        subject_report = db.session.query(
            Subject.id,
            Subject.name,
            db.func.count(Score.id).label('quizzes_attempted'),
            db.func.sum(Score.total_scored).label('total_score'),
            db.func.count(Quiz.id.distinct()).label('total_quizzes')  # Total quizzes in subject
        ).join(Chapter, Chapter.subject_id == Subject.id
        ).join(Quiz, Quiz.chapter_id == Chapter.id
        ).outerjoin(Score, (Score.quiz_id == Quiz.id) & (Score.user_id == user_id ) & (Score.total_scored != None)).group_by(Subject.id, Subject.name).all()

        subject_data = []
        for row in subject_report:
            subject_id, name, attempted, total_score, total_quizzes = row
            subject_data.append({
                'subject_id': subject_id,
                'subject_name': name,
                'quizzes_attempted': attempted or 0,
                'total_quizzes': total_quizzes,  # Total quizzes available in subject
                'total_score': total_score or 0
            })

        # Month wise report - now includes month name
        month_report = db.session.query(
            extract('year', Score.time_stamp_of_attempt).label('year'),
            extract('month', Score.time_stamp_of_attempt).label('month'),
            db.func.count(Score.id).label('quiz_count')
        ).filter(and_(Score.user_id == user_id, Score.total_scored != None)).group_by(
            'year', 'month'
        ).order_by(
            'year', 'month'
        ).all()

        month_data = []
        month_names = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"]
        for row in month_report:
            year, month, quiz_count = row
            month_data.append({
                'year': int(year),
                'month': int(month),
                'month_name': month_names[int(month)-1],  # Add month name
                'quizzes_attempted': quiz_count
            })

        return {
            'subject_wise_report': subject_data,
            'month_wise_report': month_data
        }, 200


api.add_resource(userSummary, '/user/summary')



class aboutuser(Resource):
    @jwt_required()
    @user_required
    def get(self,user_id):
        user = User.query.get(user_id)

        if not user:
            return {"message": "User not found"}, 404

        return {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "qualification": user.qualification,
            "dob": user.dob.strftime("%Y-%m-%d") if user.dob else None,
            "is_admin": user.is_admin
        }, 200
    
api.add_resource(aboutuser,'/user/profile')