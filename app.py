from flask import Flask
from backend.models import db
from backend import models
from datetime import date
# for configuration
from backend.config import DevelopmentConfig
# for api 
from backend.api import api
import backend.user_api # to include the user api 
from flask_jwt_extended import JWTManager
from backend.redis import cache
from backend.cel_worker import create_celery # importing the celery 
from celery.schedules import crontab



def create_app():
    # making the object of flask for app 
    app = Flask(__name__, template_folder='frontend',static_folder='frontend/static',static_url_path='/static' )
    
    app.config.from_object(DevelopmentConfig) # to add config
    db.init_app(app) # to initialize the database
    # to initialize with the api
    api.init_app(app)
    cache.init_app(app)

    # initialize JWT (JSON Web Token) support in your Flask app 
    jwt = JWTManager(app)
    celery = create_celery(app)

    with app.app_context():
        import backend.views
        db.create_all()
        admin = models.User.query.filter_by(username = 'admin').first()
        if not admin:
            admin = models.User(username='admin',password='admin',full_name='admin',email='admin@gamil.com',is_admin=True,dob= date(2000, 1, 1),qualification='admin')
            db.session.add(admin)
            db.session.commit()

    return app



app = create_app() # to call the create_app() method 
from backend.task import *  # Import tasks AFTER app and celery are fully initialized

# Register periodic tasks
@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Daily reminders at 3:57 PM
    sender.add_periodic_task(
        crontab(hour=15, minute=57), # so when time 3:57pm then this task schudele and come in terminal 
        # 10.0, #sec periodically 
        daily_reminders.s(),
        name='send-daily-reminders'
    )
    
    # Monthly reports on the 12th of every month at 3:57 PM
    sender.add_periodic_task(
        crontab(day_of_month=12, hour=15, minute=57),
        # 40.0, #for testing purpose 20sec 
        monthly_reports.s(),
        name='send-monthly-reports'
    )




# to run the app
if __name__ == "__main__":
    app.run(debug = True,port = 9000,host='127.0.0.1')


