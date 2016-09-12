import requests
import subprocess
import pytest
import time
import threading


from os import remove

cms = None

s = requests.Session()

class CmsInstance(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        self.ps = None
    def run(self):
        self.ps = subprocess.Popen(["node", "../index.js", "--db.filename=./database.sql"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    def kill(self):
        self.ps.kill()
    def get_error(self):
        return self.ps.stdout.readline()

def register_and_login(username="test",password="wordpass123"):
    data = {
        "username": username,
        "password": password,
        "password2": password,
    }
    new_user = s.post('http://localhost:8080/register/', json=data)
    print( new_user )
    login = s.post('http://localhost:8080/login/', json=data)
    print( login.json() )
    
def server_setup():
    thread = CmsInstance()
    thread.start()
    time.sleep(1)
    register_and_login()
    print("Started thread")
    return thread

def teardown_module(module):
    print("Test Complete")
    cms.kill()
    remove('database.sql')
    
def setup_module(module):
    global cms
    cms = server_setup()
    time.sleep(5)

@pytest.mark.get
def test_get_admin():
    admin_page = s.get('http://localhost:8080/admin')
    assert admin_page.status_code == 200

@pytest.mark.get
def test_get_admin_pages():
    admin_page = s.get('http://localhost:8080/admin/pages')
    assert admin_page.status_code == 200

@pytest.mark.get
def test_get_404():
    page_404 = s.get('http://localhost:8080/404')
    assert page_404.status_code == 404

@pytest.mark.admin
def test_new_page():
    page_data = {
        "title": "Title",
        "options": "{}",
        "data": "| Hello"
    }
    new_page = s.put('http://localhost:8080/pages/', json=page_data)
    print new_page.json()
    assert new_page.json()['status'] == 1
    new_page_content = s.get('http://localhost:8080/pages/')
    assert new_page_content.status_code == 200
    assert new_page_content.text == page_data['data'][2:]
    new_page = s.put('http://localhost:8080/pages/', json=page_data)
    assert new_page.json()['status'] != 1
    new_page_content = s.get('http://localhost:8080/pages/')
    assert new_page_content.status_code == 200
    assert new_page_content.text == page_data['data'][2:]
    page_data = {
        "title": "Title",
        "options": "{}",
        "data": ""
    }
    new_page = s.put('http://localhost:8080/pages/no_data_page', json=page_data)
    assert new_page.json()['status'] != 1
    dead_page = s.get('http://localhost:8080/pages/no_data_page')
    assert dead_page.status_code == 404
    page_data = {
        "title": "",
        "options": "{}",
        "data": "| Hi"
    }
    new_page = s.put('http://localhost:8080/pages/no_title_page', json=page_data)
    assert new_page.json()['status'] != 1
    dead_page = s.get('http://localhost:8080/pages/no_title_page')
    assert dead_page.status_code == 404

def test_delete():
    page_data = {
        "title": "Title",
        "options": "{}",
        "data": "| Hello"
    }
    new_page = s.put('http://localhost:8080/pages/page_to_be_deleted', json=page_data)
    assert new_page.json()['status'] == 1
    new_page_get = s.get('http://localhost:8080/pages/page_to_be_deleted')
    assert new_page_get.status_code == 200
    new_page = s.delete('http://localhost:8080/pages/page_to_be_deleted', json=page_data)
    assert new_page.json()['status'] == 1
    print(new_page.text)
    new_page_get = s.get('http://localhost:8080/pages/page_to_be_deleted')
    assert new_page_get.status_code == 404
def test_edit():
    page_data = {
        "title": "Title",
        "options": "{}",
        "data": "| Hello"
    }
    new_page = s.put('http://localhost:8080/pages/page_to_be_edited', json=page_data)
    print new_page.json()
    assert new_page.json()['status'] == 1
    new_page_get = s.get('http://localhost:8080/pages/page_to_be_edited')
    assert new_page_get.status_code == 200
    assert new_page_get.text == "Hello"
    page_data = {
        "title": "Title",
        "options": "{}",
        "data": "| Goodbye"
    }
    new_page = s.post('http://localhost:8080/pages/page_to_be_edited', json=page_data)
    assert new_page.json()['status'] == 1
    new_page_get = s.get('http://localhost:8080/pages/page_to_be_edited')
    assert new_page_get.status_code == 200
    assert new_page_get.text == "Goodbye"

def test_new_template():
    template = "test_template";
    template_data = {
        "options": "{}",
        "data": "| ^!{pageData}"
    }
    new_template = s.put('http://localhost:8080/template/' + template, json=template_data)
    assert new_template.status_code == 201
    assert new_template.json()['status'] == 1
    page_text = "There is a carrot here <-"
    page_data = {
        "title": "Title",
        "options": "{}",
        "template": template, 
        "data": "| " + page_text
    }
    new_page = s.put('http://localhost:8080/pages/new_template_page', json=page_data)
    assert new_page.status_code == 201
    assert new_page.json()['status'] == 1
    new_page_get = s.get('http://localhost:8080/pages/new_template_page')
    assert new_page_get.status_code == 200
    print new_page_get.text
    assert new_page_get.text == "^" + page_text
    
    delete_template = s.delete('http://localhost:8080/template/' + template)
    assert delete_template.status_code == 201
    assert delete_template.json()['status'] == 1
    new_page_get = s.get('http://localhost:8080/pages/new_template_page')
    print new_page_get.text
    assert new_page_get.status_code == 200
    assert new_page_get.text == "Template " + template + " Undefined"
def test_edit_template():
    template = "test_edit_template";
    template_data = {
        "options": "{}",
        "data": "| ^!{pageData}"
    }
    new_template = s.put('http://localhost:8080/template/' + template, json=template_data)
    assert new_template.status_code == 201
    assert new_template.json()['status'] == 1
    
    page_text = "There is a carrot here <-"
    page_data = {
        "title": "Title",
        "options": "{}",
        "template": template,
        "cache": 0,
        "data": "| " + page_text
    }
    new_page_name = "new_edit_template_page"
    new_page = s.put('http://localhost:8080/pages/' + new_page_name, json=page_data)
    assert new_page.status_code == 201
    assert new_page.json()['status'] == 1
    new_page_get = s.get('http://localhost:8080/pages/' + new_page_name)
    assert new_page_get.status_code == 200
    print new_page_get.text
    assert new_page_get.text == "^" + page_text
    
    new_template_data = {
        "options": "{}",
        "data": "| *!{pageData}"
    }
    edited_template = s.post('http://localhost:8080/template/' + template, json=new_template_data)
    assert edited_template.status_code == 201
    assert edited_template.json()['status'] == 1
    
    edited_page_get = s.get('http://localhost:8080/pages/' + new_page_name)
    assert edited_page_get.status_code == 200
    print edited_page_get.text
    assert edited_page_get.text == "*" + page_text

def test_settings():
    settings_req = s.get('http://localhost:8080/settings/')
    assert settings_req.status_code == 200
    settings_list = settings_req.json()
    settings = {}
    for i in settings_list:
        settings[ i[ 'name' ] ] = i[ 'option' ]
    print 'Hello'
    settings[ "new_never_before_seen_setting" ] = "new_value";
    new_setting_req = s.post('http://localhost:8080/settings/', json=settings)
    assert new_setting_req.status_code == 201
    assert new_setting_req.json()['status'] == 1
    new_settings_req = s.get('http://localhost:8080/settings/')
    assert new_settings_req.status_code == 200
    new_settings = new_settings_req.json()
    for i in new_settings:
        assert i[ 'option' ] == settings[ i[ 'name' ] ]

def test_login( username="newUser", password="wordpass123" ):
    data = {
        "username": username,
        "password": password,
        "password2": password,
    }
    new_user = s.post('http://localhost:8080/register/', json=data)
    assert new_user.status_code == 201
    assert new_user.json()[ 'status' ] == 1
    login = s.post('http://localhost:8080/login/', json=data)
    assert login.status_code == 201
    assert login.json()[ 'status' ] == 1
    remove_user = s.delete('http://localhost:8080/register/', json=data)
    assert remove_user.status_code == 201
    assert remove_user.json()[ 'status' ] == 1
    invalid_login = s.post('http://localhost:8080/login/', json=data)
    assert invalid_login.status_code == 400
    assert invalid_login.json()[ 'status' ] == 0
    
# def test_zwait():
#     time.sleep(200)
@pytest.mark.edge
def test_reset():
    global cms
    cms.kill()
    time.sleep(2)
    cms = server_setup()
    time.sleep(2)