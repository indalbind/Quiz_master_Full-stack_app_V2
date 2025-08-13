from smtplib import SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from backend.cel_worker import celery

smpt_host = "localhost"
smpt_port = 1025 # we are going to use mailhog for test 
sender_email = 'admin@gmail.com'
sender_password = ''  # Empty, because local server doesn't need password

@celery.task()
def send_email(to, subject, content):
    msg = MIMEMultipart()
    msg["To"] = to
    msg["From"] = sender_email
    msg["Subject"] = subject
    msg.attach(MIMEText(content, 'html'))

    client = SMTP(host=smpt_host, port=smpt_port)
    client.send_message(msg)
    client.quit()
