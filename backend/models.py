from flask_sqlalchemy import SQLAlchemy
from flask import json
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
db = SQLAlchemy()

# -----------------------
# User Table
# ---------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True,nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    qualification = db.Column(db.String(100))
    dob = db.Column(db.Date)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    blocked = db.Column(db.Boolean,nullable = False,default = False)
    
    scores = db.relationship('Score', backref='user', lazy=True,cascade='all, delete-orphan')

    @property
    def password(self):
        raise AttributeError("Password is not readable")
    
    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# -----------------------
# Subject Table
# -----------------------
class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

    chapters = db.relationship('Chapter', backref='subject', lazy=True,cascade='all, delete-orphan')

# -----------------------
# Chapter Table
# -----------------------
class Chapter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

    quizzes = db.relationship('Quiz', backref='chapter', lazy=True,cascade='all, delete-orphan')

# -----------------------
# Quiz Table
# -----------------------
class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'), nullable=False)
    name = db.Column(db.String(100),nullable=False)
    date_of_quiz = db.Column(db.Date) # schedule the quiz when it avaliable
    time_duration = db.Column(db.String(10))  # e.g., "00:30" for 30 mins
    remarks = db.Column(db.String(200))
    no_of_question = db.Column(db.Integer, nullable=False)
    questions = db.relationship('Question', backref='quiz', lazy=True,cascade='all, delete-orphan')
    scores = db.relationship('Score', backref='quiz', lazy=True,cascade='all, delete-orphan')

# -----------------------
# Question Table
# -----------------------
class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    question_statement = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False, default='mcq') # Question type: 'mcq', 'numerical', or 'text'
    option1 = db.Column(db.String(200))
    option2 = db.Column(db.String(200))
    option3 = db.Column(db.String(200))
    option4 = db.Column(db.String(200))
    correct_answer = db.Column(db.String(200), nullable=True)  # 1, 2, 3, or 4 and also handel numberical or string answer
    image_path = db.Column(db.String(300))  # Optional: image for question
    mark = db.Column(db.Integer, default=1)

# -----------------------
# Score Table
# -----------------------
class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    time_stamp_of_attempt = db.Column(db.DateTime, default=datetime.utcnow)
    total_scored = db.Column(db.Integer)
    user_answers = db.Column(db.JSON)  # Store answers in JSON format like 🦊
    
    # Example: {'1': '3', '2': '4', '3': 'A'}