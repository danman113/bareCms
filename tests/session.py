import requests
s = requests.Session()


def register_and_login(username="test",password="wordpass123"):
    data = {
        "username": username,
        "password": password,
        "password2": password,
    }
    new_user = s.post('http://localhost:8080/register/', json=data)
    print( new_user.json() )
    assert new_user.status_code == 201
    assert new_user.json()[ 'status' ] == 1
    login = s.post('http://localhost:8080/login/', json=data)
    assert login.status_code == 201
    assert login.json()[ 'status' ] == 1

register_and_login( "adsfasddsf", "adfasdsadasd")
admin = s.get( 'http://localhost:8080/admin' )

print( admin )
