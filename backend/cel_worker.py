from celery import Celery, Task

celery = None  # Singleton instance

def create_celery(app):
    global celery
    class FlaskTask(Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery = Celery(
        app.name,
        task_cls=FlaskTask,
        broker = 'redis://localhost:6379/0',
        backend = 'redis://localhost:6379/1'
    )
    celery.conf.update(
        timezone='Asia/Kolkata',
        broker_connection_retry_on_startup=True
    )
    return celery