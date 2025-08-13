from flask import request, jsonify
from flask_restful import Resource, Api, reqparse,request,marshal
from backend.models import db, Chapter, User, Subject,Quiz,Question,Score  # Adjust the import path based on your structure
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, get_jwt
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from backend.redis import cache
from flask import url_for
import os

api = Api(prefix='/api')


# -------------------------
#   for checking the api
# -------------------------
class welcome(Resource): # in this :type of class we have to write the get,post,put and add the resources
    def get(self): # must be self
        return {"message":"working"},200

api.add_resource(welcome,'/welcome')


# -------------------------------------
# Login and return the JWT token
# --------------------------------------

class Login(Resource):
    def post(self):
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        
        user = User.query.filter_by(username=username).first()
        if not user:
            return {"msg":"user name not exist"},401
        elif not user.check_password(password):
            return {"msg":"Invalid password"},401
        
        access_token = create_access_token(identity=str(user.id),additional_claims={"is_admin": user.is_admin})
        
        return {
            "msg":"user sucessfully logged in",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin
            }
        }, 200
    
api.add_resource(Login,'/login')



# ------------------------------------------------
# Register user
# -----------------------------------------------

class Register(Resource):
    def post(self):
        data = request.get_json()
        if User.query.filter_by(username=data.get('username')).first():
            return {"msg": "User already exists"}, 400
        
        if User.query.filter_by(email=data.get('email')).first():
            return {"msg": "Email already in use"}, 400  # Add this check

        # Convert dob string to datetime.date object
        try:
            dob = datetime.strptime(data.get('dob'), "%Y-%m-%d").date()
        except Exception as e:
            return {"msg": "Invalid date format. Use YYYY-MM-DD"}, 400

        new_user = User(
            username=data.get('username'),
            email=data.get('email'),
            full_name=data.get('full_name'),
            qualification=data.get('qualification'),
            dob=dob,  #  passing the date object
            is_admin=data.get('is_admin', False),
            blocked=data.get('blocked', False)
        )

        new_user.password = data.get('password')  # uses your @password.setter

        db.session.add(new_user)
        db.session.commit()

        return {"msg": "User registered successfully"}, 201
    
api.add_resource(Register, '/register')


# ----------------------------------------------------------- admin opereration ----------------------------------------------------------

# ------------------------------------------------
# subject resources 
# admin can able to add subject,delete subject, update subject mean's CRUD operation on subject by the admin 
# -----------------------------------------------
class SubjectOperation(Resource):
    @jwt_required()
    def get(self,id=None): # this is for geting subject 
        current_user = get_jwt_identity() # this is string of user_id
        claims = get_jwt() # this all dictonary of jwt payload
        if not claims["is_admin"]:
            return {"error": "Admin access required"}, 403

        if id:
            subject = Subject.query.get(id)
            if not subject:
                return {"error": "Subject not found"}, 404
            return {
                "id": subject.id,
                "name": subject.name,
                "description": subject.description
            }, 200
        else:
            subjects = Subject.query.all()
            if not subjects:
                return {"msg":"please create subject"},404
            result = [
                {"id": s.id, "name": s.name, "description": s.description}
                for s in subjects
            ]
            return {"subjects": result}, 200

    @jwt_required() 
    def post(self, id=None): # this is for creating new subject 
        current_user = get_jwt_identity()
        claims = get_jwt()
        if not claims["is_admin"]:
            return {"error": "Admin access required"}, 403

        data = request.get_json()
        name = data.get('name')
        description = data.get('description')

        if not name:
            return {"error": "Subject name is required"}, 400

        if Subject.query.filter_by(name=name).first():
            return {"error": "Subject already exists"}, 409

        new_subject = Subject(name=name, description=description)
        db.session.add(new_subject)
        db.session.commit()

        return {"message": "Subject added successfully"}, 201

    @jwt_required()
    def put(self, id): # for updating the subject 
        current_user = get_jwt_identity()
        claims = get_jwt()
        if not claims["is_admin"]:
            return {"error": "Admin access required"}, 403

        subject = Subject.query.get(id)
        if not subject:
            return {"error": "Subject not found"}, 404

        data = request.get_json()
        subject.name = data.get("name", subject.name)
        subject.description = data.get("description", subject.description)

        db.session.commit()
        return {"message": "Subject updated successfully"}, 200

    @jwt_required()
    def delete(self, id): # for deleting the subject 
        current_user = get_jwt_identity()
        claims = get_jwt()
        if not claims["is_admin"]:
            return {"error": "Admin access required"}, 403

        subject = Subject.query.get(id)
        if not subject:
            return {"error": "Subject not found"}, 404

        db.session.delete(subject)
        db.session.commit()
        return {"message": "Subject deleted successfully"}, 200
    
api.add_resource(SubjectOperation,'/subject', '/subject/<int:id>')



# # ---------------------------
# # Adding chapter or any operation on chapter only done by the admin 
#  here also admin can able to delete the chapther , add chapter, update chapter 
# # ---------------------------

class ChapterOperation(Resource):
    @jwt_required()
    def get(self,id=None): # this is for geting the  chapter
        claim = get_jwt()

        if not claim['is_admin']:
             return {"msg":"admin required "},404
         
        if id:
            chapter = Chapter.query.get(id)
            if not chapter:
                return {"error": "chapter not found"}, 404
            return {
                "id": chapter.id,
                "name": chapter.name,
                "description": chapter.description,
                "subject_id": chapter.subject_id 
            }, 200
        else:
            chapters = Chapter.query.all()
            if not chapters:
                return {"msg":"please create chapter"},404
            result = [
                {"id": s.id, "name": s.name, "description": s.description,"subject_id": s.subject_id}
                for s in chapters
            ]
            return {"chapters": result}, 200
        
    @jwt_required()
    def post(self): # for adding the chapter 
        claim = get_jwt()
        if not claim['is_admin']:
            return {"msg":"admin required"},404
        
        data = request.get_json()
        name = data.get('name')
        description = data.get('description')
        subject_id = data.get('subject_id')
        if not name:
            return {"error":"Chapter name is required"},400
        if Chapter.query.filter_by(name=name).first():
            return {"error":"Chapter already exist"},409
        new_chapter = Chapter(name=name,description=description,subject_id=subject_id)
        db.session.add(new_chapter)
        db.session.commit()
        return {"message":"Chapter added sucesfully"},200
    
    @jwt_required()
    def put(self, id): # for updating the chapter 
        current_user = get_jwt_identity()
        claims = get_jwt()
        if not claims["is_admin"]:
            return {"error": "Admin access required"}, 403

        chapter = Chapter.query.get(id)
        if not chapter:
            return {"error": "Chapter not found"}, 404

        data = request.get_json()
        chapter.name = data.get("name", chapter.name)
        chapter.description = data.get("description", chapter.description)

        db.session.commit()
        return {"message": "Chapter updated successfully"}, 200

    @jwt_required()
    def delete(self, id): # for deleting the chapter
        current_user = get_jwt_identity()
        claims = get_jwt()
        if not claims["is_admin"]:
            return {"error": "Admin access required"}, 403

        chapter = Chapter.query.get(id)
        if not chapter:
            return {"error": "Chapter not found"}, 404

        db.session.delete(chapter)
        db.session.commit()
        return {"message": "Chapter deleted successfully"}, 200

    
api.add_resource(ChapterOperation,'/chapter','/chapter/<int:id>')

# -----------------------------------------------------------------------
# now for know no. of question or subject info we have to make the api  subjectdeatails
# ------------------------------------------------------------------------
class SubjectDetail(Resource):
    @jwt_required()
    def get(self, subject_id):
        claims = get_jwt()
        if not claims.get("is_admin"):
            return {"error": "Admin access required"}, 403

        subject = Subject.query.get(subject_id)
        if not subject:
            return {"error": "Subject not found"}, 404

        # Join Chapter → Quiz → Question
        chapters_data = db.session.query(
            Chapter.id,
            Chapter.name,
            func.count(Question.id).label("total_questions")
        ).outerjoin(Quiz, Quiz.chapter_id == Chapter.id) \
         .outerjoin(Question, Question.quiz_id == Quiz.id) \
         .filter(Chapter.subject_id == subject_id) \
         .group_by(Chapter.id).all()

        chapters_list = [
            {
                "id": chapter.id,
                "name": chapter.name,
                "total_questions": chapter.total_questions
            }
            for chapter in chapters_data
        ]

        total_questions = sum(ch["total_questions"] for ch in chapters_list)

        return {
            "subject": {
                "id": subject.id,
                "name": subject.name,
                "description": subject.description,
                "total_questions": total_questions,
                "chapters": chapters_list
            }
        }, 200

# Register the new endpoint
api.add_resource(SubjectDetail, '/subject/<int:subject_id>/detail')

# now i have to make the api for quiz and question 

# --------------------------------------------------------
# quiz resources by admin CRUD
# --------------------------------------------------------

class quizOperation(Resource):
    @jwt_required()
    def get(self,id=None): # for geting the quiz
        user_type = get_jwt()
        if not user_type['is_admin']:
            return {"msg":"admin required"},404  
        chapter_id = request.args.get('chapter_id')  
        if chapter_id:
            quizzes = Quiz.query.options(
                joinedload(Quiz.chapter).joinedload(Chapter.subject)
            ).filter_by(chapter_id=chapter_id).all()
            if not quizzes:
                return {"msg": "No quizzes found for this chapter"}, 404
            return {
                "quizzes": [
                    {
                        "id": q.id,
                        "name": q.name,
                        "date_of_quiz": q.date_of_quiz.strftime('%Y-%m-%d'),
                        "time_duration": q.time_duration,
                        "remarks": q.remarks,
                        "no_of_question": q.no_of_question,
                        "chapter_name": q.chapter.name,                
                        "subject_name": q.chapter.subject.name          
                    }
                    for q in quizzes
                ]
            }, 200
        else:
            quizs = Quiz.query.all()
            if not quizs:
                return {"msg":"please create quiz"},404
            result = [
                {"id": s.id, "name": s.name, "description": s.name}
                for s in quizs
            ]
            return {"quizes": result}, 200
        
    @jwt_required()
    def post(self): # for adding the quiz
        claim = get_jwt()
        if not claim['is_admin']:
            return {"msg":"admin required"},404
        
        data = request.get_json()
        name = data.get('name')
        chapter_id = data.get('chapter_id')
        # date_of_quiz = data.get('date_of_quiz')
        try:
            date_of_quiz = datetime.strptime(data.get('date_of_quiz'), "%Y-%m-%d").date()
        except Exception as e:
            return {"msg": "Invalid date format. Use YYYY-MM-DD"}, 400
        
        time_duration = data.get('time_duration')
        remarks = data.get('remarks')
        no_of_question = data.get('no_of_question')
        if not name:
            return {"error":"Quiz name is required"},400
        if Quiz.query.filter_by(name=name,chapter_id=chapter_id).first():
            return {"error":"Quiz already exist"},409
        new_quiz = Quiz(name=name,chapter_id=chapter_id,date_of_quiz=date_of_quiz,time_duration=time_duration,remarks=remarks,no_of_question=no_of_question)
        db.session.add(new_quiz)
        db.session.commit()
        return {"message":"quiz added sucesfully"},200 
      
    @jwt_required()
    def put(self, id): # for updating the quiz
        current_user = get_jwt_identity()
        claims = get_jwt() 
        if not claims["is_admin"]:
            return {"error": "Admin access required"}, 403

        quiz = Quiz.query.get(id)
        if not quiz:
            return {"error": "quiz not found"}, 404

        data = request.get_json()

        quiz.name = data.get("name", quiz.name)
        quiz.time_duration = data.get("time_duration", quiz.time_duration)
        quiz.remarks = data.get("remarks", quiz.remarks)
        # quiz.date_of_quiz = data.get("date_of_quiz", quiz.date_of_quiz) #
        try:
        # Convert date string to date object
            date_of_quiz = datetime.strptime(data.get('date_of_quiz'), "%Y-%m-%d").date()
            quiz.date_of_quiz = date_of_quiz  # Update the quiz date
        except Exception as e:
            return {"msg": "Invalid date format. Use YYYY-MM-DD"}, 400
        
        quiz.no_of_question = data.get("no_of_question", quiz.no_of_question)
        db.session.commit()
        return {"message": "quiz updated successfully"}, 200

    @jwt_required()
    def delete(self, id): # for deleting the chapter
        current_user = get_jwt_identity()
        claims = get_jwt()
        if not claims["is_admin"]:
            return {"error": "Admin access required"}, 403

        quiz = Quiz.query.get(id)
        if not quiz:
            return {"error": "quiz not found"}, 404

        db.session.delete(quiz)
        db.session.commit()
        return {"message": "quiz deleted successfully"}, 200

api.add_resource(quizOperation,'/quiz','/quiz/<int:id>')


# ----------------------------
# question api now i have to make so admin can able to create question,delete question and CRUD operation
# ---------------------------------------
class questionOperation(Resource):
    @jwt_required()
    def get(self, id=None):  # Get one question or list of all questions
        claims = get_jwt()
        if not claims['is_admin']:
            return {"msg": "Admin access required"}, 403
        quiz_id = request.args.get('quiz_id')
        
        if id:  # Single question by ID
            question = Question.query.get(id)
            if not question:
                return {"error": "Question not found"}, 404
            return {
                "id": question.id,
                "quiz_id": question.quiz_id,
                "question_statement": question.question_statement,
                "question_type": question.question_type,
                "option1": question.option1,
                "option2": question.option2,
                "option3": question.option3,
                "option4": question.option4,
                "correct_answer": question.correct_answer,
                "image_path": None if not question.image_path else url_for('static', filename='images/questionImg/' + os.path.basename(question.image_path), _external=False),
                "mark": question.mark
            }, 200
        else:  # Multiple questions
            base_query = Question.query
            
            # Filter by quiz_id if provided
            if quiz_id:
                base_query = base_query.filter_by(quiz_id=quiz_id)
            
            questions = base_query.all()
            
            result = [
                {
                    "id": q.id,
                    "quiz_id": q.quiz_id,
                    "question_statement": q.question_statement,
                    "question_type": q.question_type,
                    "mark": q.mark
                }
                for q in questions
            ]
            return {"questions": result}, 200

    @jwt_required()
    def post(self):  # Add new question
        claims = get_jwt()
        if not claims['is_admin']:
            return {"msg": "Admin access required"}, 403

        data = request.get_json()
        question_statement = data.get("question_statement")
        quiz_id = data.get("quiz_id")
        question_type = data.get("question_type", "mcq")  # default is 'mcq'
        option1 = data.get("option1")
        option2 = data.get("option2")
        option3 = data.get("option3")
        option4 = data.get("option4")
        correct_answer = data.get("correct_answer")
        image_path = data.get("image_path")
        mark = data.get("mark")

        if not question_statement or not quiz_id or not correct_answer:
            return {"error": "Missing required fields"}, 400
        
        if Question.query.filter_by(quiz_id=quiz_id, question_statement=question_statement).first():
            return {"error": "Question already exists in this quiz"}, 409

        question = Question(
            quiz_id=quiz_id,
            question_statement=question_statement,
            question_type=question_type,
            option1=option1,
            option2=option2,
            option3=option3,
            option4=option4,
            correct_answer=correct_answer,
            image_path=image_path,
            mark = mark
        )
        db.session.add(question)
        db.session.commit()
        return {"message": "Question added successfully"}, 200

    @jwt_required()
    def put(self, id):  # Update question
        claims = get_jwt()
        if not claims['is_admin']:
            return {"msg": "Admin access required"}, 403

        question = Question.query.get(id)
        if not question:
            return {"error": "Question not found"}, 404

        data = request.get_json()
        question.question_statement = data.get("question_statement", question.question_statement)
        question.question_type = data.get("question_type", question.question_type)
        question.option1 = data.get("option1", question.option1)
        question.option2 = data.get("option2", question.option2)
        question.option3 = data.get("option3", question.option3)
        question.option4 = data.get("option4", question.option4)
        question.correct_answer = data.get("correct_answer", question.correct_answer)
        question.image_path = data.get("image_path", question.image_path)
        question.mark = data.get("mark", question.mark)

        db.session.commit()
        return {"message": "Question updated successfully"}, 200

    @jwt_required()
    def delete(self, id):  # Delete question
        claims = get_jwt()
        if not claims['is_admin']:
            return {"msg": "Admin access required"}, 403

        question = Question.query.get(id)
        if not question:
            return {"error": "Question not found"}, 404

        db.session.delete(question)
        db.session.commit()
        return {"message": "Question deleted successfully"}, 200
    
api.add_resource(questionOperation,'/question','/question/<int:id>')

# -----------------------------------------------------------------------------------
# admin summary i nead to write the api of admin summary
# 😇 😇😇😇 😇😇😇😇😇😇😇 😇😇😇😇
# nead to revisite when user attempt any quiz
# ----------------------------------------------------------------------------------
class SummaryReport(Resource):
    @jwt_required()
    @cache.cached(timeout=300, key_prefix='admin_summary')
    def get(self):
        # Ensure the user is an admin
        claims = get_jwt()
        if not claims['is_admin']:
            return {"msg": "Admin required"}, 403

        total_users = User.query.count()  # to know total user
        total_subjects = Subject.query.count()  # for total subject
        total_quizzes = Quiz.query.count()  # for total quiz

        # Subject-wise top scores
        subject_toper_scores = []
        subjects = Subject.query.all()
        for subject in subjects:
            top_score = db.session.query(Score.quiz_id, db.func.max(Score.total_scored).label('top_score'))\
                .join(Quiz).join(Chapter).filter(Chapter.subject_id == subject.id)\
                .group_by(Score.quiz_id).all()

            subject_toper_scores.append({
                "subject_name": subject.name,
                "top_scores": [
                    {"quiz_id": score.quiz_id, "top_score": score.top_score}
                    for score in top_score
                ]
            })

        # Subject-wise user attempts
        subject_user_attempts = []
        for subject in subjects:
            user_attempts = db.session.query(
                Score.user_id, db.func.count(Score.id).label('attempts')
            ).join(Quiz).join(Chapter).filter(Chapter.subject_id == subject.id)\
            .group_by(Score.user_id).all()

            subject_user_attempts.append({
                "subject_name": subject.name,
                "user_attempts": [
                    {"user_id": attempt.user_id, "attempts": attempt.attempts}
                    for attempt in user_attempts
                ]
            })

        return {
            "total_users": total_users,
            "total_subjects": total_subjects,
            "total_quizzes": total_quizzes,
            "subject_top_scores": subject_toper_scores,
            "subject_user_attempts": subject_user_attempts,
        }, 200


# Add this resource to the API
api.add_resource(SummaryReport, '/admin/summary')


# -----------------------------------------------------------------------------------
# admin can able to block and delete the user 
# 😇 😇😇😇 😇😇😇😇😇😇😇 😇😇😇😇
# nead to revisite when user attempt any quiz
#----------------------------------------------------------------------------------
class DeleteUser(Resource):
    @jwt_required()
    def delete(self,id):
        claims = get_jwt()
        if not claims['is_admin']:
            return {"msg": "Admin access required"}, 403

        user = User.query.get(id)
        if not user:
            return {"error": "user not found"}, 404

        db.session.delete(user)
        db.session.commit()
        return {"message": "user deleted successfully"}, 200    
api.add_resource(DeleteUser,'/deleteuser/<int:id>')


class BlockUnblockUser(Resource):
    @jwt_required()  
    def put(self, id):
        claims = get_jwt()
        if not claims.get('is_admin', False):
            return {"msg": "Admin access required"}, 403

        user = User.query.get(id)
        if not user:
            return {"error": "User not found"}, 404

       
        user.blocked = not user.blocked # Toggle the blocked flag
        db.session.commit()

        status = "blocked" if user.blocked else "unblocked"
        return {
            "msg": f"User {status} successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "blocked": user.blocked
            }
        }, 200


api.add_resource(BlockUnblockUser, '/blockUnblockUser/<int:id>')

# --------------------------------------------
# but we have to make the backend to get the all user 
# ---------------------------------------------
class AllUsers(Resource):
    @jwt_required()
    def get(self):
        claims = get_jwt()
        if not claims.get('is_admin', False):
            return {"msg": "Admin access required"}, 403

        users = User.query.filter(User.is_admin == False).all() # so that admin not apper 
        return {"users": [
            {
                "id": user.id,
                "username": user.username,
                "blocked": user.blocked
            } for user in users
        ]}

api.add_resource(AllUsers, '/allusers')

# ----------------------------------------------------------------------------------------------------------------------------------------