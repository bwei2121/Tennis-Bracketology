from django.core.management.utils import get_random_secret_key 

# Creates secret key for Django secret key in settings.py   
def secret_key():
  print(get_random_secret_key()) 

secret_key()