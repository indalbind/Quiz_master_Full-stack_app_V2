class Config(object):
    DEBUG = False
    TESTING = False
    CACHE_TYPE = "RedisCache"
    CACHE_DEFAULT_TIMEOUT = 300
    

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///quizex.db'
    SECRET_KEY = 'ausus'  # For general app security
    SECURITY_PASSWORD_HASH = "bcrypt" # for select the algo for hasing password
    SECURITY_PASSWORD_SALT =' tufgaming' # use if password same then give unique hasing 
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = False  # You might want to disable CSRF for APIs
    CACHE_REDIS_HOST = "localhost"
    CACHE_REDIS_PORT = 6379
    CACHE_REDIS_DB = 0

    # JWT Configurations
    JWT_SECRET_KEY = 'your_jwt_secret_key_here'  # Secret key for signing JWT tokens
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # Set token expiration time (1 hour)
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # Optional: set refresh token expiration (30 days)

