from .models import db,User,Subject,Question,Quiz,Score
from flask_security import auth_required,roles_accepted,verify_password,hash_password,current_user,get_url
from io import BytesIO # for sending CSV/PDF
from flask import current_app as app ,jsonify,send_file,abort,render_template
from .redis import cache  # because cache is created inside redis.py file 
from flask import jsonify
from datetime import datetime,timedelta
from flask import request, jsonify, send_file
import io
import os
from flask import make_response
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, get_jwt
from .task import create_user_csv, create_admin_csv, daily_reminders, monthly_reports

@app.route('/')
def home():
    return render_template('index.html')


# ALLOWED_EXTENSIONS = {'png'}

# def allowed_file(filename):
#     return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# for saving the question image
@app.route('/api/upload_image', methods=['POST'])
@jwt_required()
def upload_image():

    claims = get_jwt()
    if not claims.get('is_admin', False):  # enforce admin role
        return jsonify({"msg": "Admins only"}), 403
    
    image = request.files.get('image')
    if not image:
        return {'error': 'No image uploaded'}, 400
    
    # if not allowed_file(image.filename):
    #     return {'error': 'Only PNG files are allowed'}, 400

    filename = secure_filename(image.filename)
    save_path = os.path.join('/home/indalbind/Desktop/Mad2_final/frontend/static/images/questionImg', filename)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    image.save(save_path)

    return {'image_path': save_path}, 200




@app.route('/download/admin-csv')
@jwt_required()
def download_admin_csv():
    claims = get_jwt()
    if not claims.get('is_admin', False):  # enforce admin role
        return jsonify({"msg": "Admins only"}), 403
    
    result = create_admin_csv.apply()
    filename = result.get()

    if not filename or not os.path.exists(filename):
        return "CSV file generation failed.", 500

    return send_file(filename, as_attachment=True)


@app.route('/download/user-csv', methods=['GET'])
@jwt_required()
def download_own_user_csv():
    user_id = get_jwt_identity()

    result = create_user_csv.apply(args=[user_id])
    filename = result.get()

    if not filename or not os.path.exists(filename):
        return "CSV file generation failed or no data found.", 404

    return send_file(filename, as_attachment=True)


# --------------------------- for testing the daily reminder and montly-report --------------------------------
# for testing imadiatly just go to this route 
@app.route('/test-reminder')
def test_reminder():
    daily_reminders.delay()
    return {"message": "Reminder task submitted"}

@app.route('/test/monthly-report')
def trigger_monthly_report():
    result = monthly_reports.apply()
    return result.get()

# ---------  making the route and for checking the backend job and implement on button -------  

@app.route('/api/send-daily-reminder', methods=['POST'])
@jwt_required()
def send_daily_reminder_api():
    claims = get_jwt()
    if not claims.get('is_admin', False):  # enforce admin role
        return jsonify({"msg": "Admins only"}), 403

    daily_reminders.delay()
    return jsonify({"msg": "Reminder emails have been queued."}), 200

# this montly report user or any one can able to get 
@app.route('/api/monthly_report',methods=['POST'])
@jwt_required()
def send_monthly_report():

    monthly_reports.delay()
    return jsonify({"msg": "daily reminder emails have been queued."}), 200


# 
# 
# ------------------------------------------------------------------------------------------------------------
