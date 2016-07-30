import requests
import subprocess
import pytest
import time
import threading


from os import remove

cms = None

class CmsInstance(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        self.ps = None
    def run(self):
        self.ps = subprocess.Popen(["node", "../index.js"], stdout=subprocess.PIPE)
    def kill(self):
        self.ps.kill()
    def get_error(self):
        return self.ps.stdout.readline()

def server_setup():
    thread = CmsInstance()
    thread.start()
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
    admin_page = requests.get('http://localhost:8080/admin')
    assert admin_page.status_code == 200

@pytest.mark.get
def test_get_admin_pages():
    admin_page = requests.get('http://localhost:8080/admin/pages')
    assert admin_page.status_code == 200

@pytest.mark.get
def test_get_404():
    page_404 = requests.get('http://localhost:8080/404')
    assert page_404.status_code == 404

@pytest.mark.admin
def test_new_page():
    page_data = {
        "title": "Title",
        "options": "{}",
        "data": "| Hello"
    }
    new_page = requests.put('http://localhost:8080/pages/', json=page_data)
    assert new_page.json()['status'] == 1
    new_page_content = requests.get('http://localhost:8080/pages/')
    assert new_page_content.status_code == 200
    assert new_page_content.text == page_data['data'][2:]
    new_page = requests.put('http://localhost:8080/pages/', json=page_data)
    assert new_page.json()['status'] != 1
    new_page_content = requests.get('http://localhost:8080/pages/')
    assert new_page_content.status_code == 200
    assert new_page_content.text == page_data['data'][2:]
    page_data = {
        "title": "Title",
        "options": "{}",
        "data": ""
    }
    new_page = requests.put('http://localhost:8080/pages/no_data_page', json=page_data)
    assert new_page.json()['status'] != 1
    dead_page = requests.get('http://localhost:8080/pages/no_data_page')
    assert dead_page.status_code == 404
    page_data = {
        "title": "",
        "options": "{}",
        "data": "| Hi"
    }
    new_page = requests.put('http://localhost:8080/pages/no_title_page', json=page_data)
    assert new_page.json()['status'] != 1
    dead_page = requests.get('http://localhost:8080/pages/no_title_page')
    assert dead_page.status_code == 404
    
# def test_zwait():
#     time.sleep(200)
@pytest.mark.edge
def test_reset():
    global cms
    cms.kill()
    time.sleep(2)
    cms = server_setup()
    time.sleep(2)