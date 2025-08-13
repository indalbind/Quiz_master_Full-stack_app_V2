from flask_jwt_extended import get_jwt
from functools import wraps

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if not claims['is_admin']:
            return {'msg': 'Admin required'}, 403
        return fn(*args, **kwargs)
    return wrapper

def user_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()

        if claims['is_admin']:
            return {'msg': 'You are admin, please login as user'}, 403

        user_id = claims['sub']  

        if user_id is None:
            return {'msg': 'User ID not found in token'}, 401

        return fn(user_id=user_id, *args, **kwargs)
    return wrapper