import threading
import os
import json
import sys
import requests
import re
from time import sleep
from functools import partial
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from tempfile import mkdtemp

class scanPage:
    def __init__(self):
        
        # Khởi tạo trình duyệt
        self.drivers = {}
        self.headers = {
            'authority': 'mbasic.facebook.com',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
            'cache-control': 'no-cache',
            # 'cookie': 'sb=ghGyZMQNd-t6C2gxm9HaLy-K; datr=06z5ZKQ_PD93TumELUma7cKL; c_user=61553593387589; m_page_voice=61553593387589; wd=1920x953; xs=26%3AxiRE_Mj5FTTHXw%3A2%3A1702093751%3A-1%3A3840%3A%3AAcXgp1cnQnA_P0BM0gKajywPOSKux8f9lBXZkvPJLbNV; fr=1F8xDEivHDXIRkOGa.AWV3ZyPVlx1mv7TVdNvZW1k28PM.BlrnSJ.QI.AAA.0.0.BlrnSO.AWVA8j9XCWw; presence=C%7B%22t3%22%3A%5B%7B%22o%22%3A0%2C%22i%22%3A%22u.100084875303481%22%7D%5D%2C%22utc3%22%3A1705931980995%2C%22v%22%3A1%7D',
            'dpr': '1',
            'pragma': 'no-cache',
            'referer': 'https://mbasic.facebook.com/groups/?category=membership&ref_component=mbasic_home_header&ref_page=%2Fwap%2Fprofile_tribe.php&refid=18&paipv=0&eav=AfYJ6S5zcXGn5g1V7l6Vi5yawN-eek0udvObJuP5HH424cC-UOXTCLarroH1kSpcYZc',
            'sec-ch-prefers-color-scheme': 'light',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-full-version-list': '"Not_A Brand";v="8.0.0.0", "Chromium";v="120.0.6099.225", "Google Chrome";v="120.0.6099.225"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-model': '""',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua-platform-version': '"10.0.0"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'viewport-width': '958',
        }
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_scan = os.path.join(current_dir, '..', 'data', 'scanpages.json')
        self.data_sweep = os.path.join(current_dir, '..', 'data', 'sweep_clone.json')
        
        # Load dữ liệu từ file JSON
        with open(self.data_scan, 'r', encoding='utf-8') as data_scans:
            data_scan = json.load(data_scans)
        with open(self.data_sweep, 'r', encoding='utf-8') as data_sweeps:
            data_sweep = json.load(data_sweeps)

        self.data_cookies = [
            data['data'] for data in data_sweep 
            if data['name_groups'] == data_scan['selectedGroup']
        ]
        self.cookie = [
            cookie['cookie'] for cookie in self.data_cookies[0]
        ]
        self.uids = [
            uid['uid'] for uid in self.data_cookies[0]
        ]
        self.passwords = [
            password['password'] for password in self.data_cookies[0]
        ]
        self.threads = int(data_scan['thread_scanpages'])
        # print(f"Loaded {len(self.cookie)} cookies.")
    def status_send(self,status,data):
        if status == 'error':
            data = {
                "type": status,
                "uid": data['uid'],
                # "password": data['password'],
                "cookie_account": data['cookie'],
                "status": data['status'],
            }
        elif status == 'success':
            data = {
                "type": status,
                "id": data['id'],
                "uid": data['uid'],
                "name_account": data['name_account'],
                "cookie_account": data['cookie_account'],
                "name_page": data['name_page'],
                "uid_page": data['uid_page'],
                "cookie_page": data['cookie_page'],
                "url_page": data['url_page'],
                "status": data['status']
            }
        print(json.dumps(data))
        sys.stdout.flush()
    def get_sources(self, thread_id):
        return self.drivers[thread_id].page_source
    def login_facebook_cookie(self, cookie_string, thread_id):
        try:
            cookies = []
            for item in cookie_string.split(";"):
                if "=" in item:
                    key, value = item.split("=", 1)
                    cookies.append({"name": key.strip(), "value": value.strip()})
                    
            self.drivers[thread_id].get('https://www.facebook.com')
            sleep(2)

            for cookie in cookies:
                cookie["domain"] = ".facebook.com"
                self.drivers[thread_id].add_cookie(cookie)

            self.drivers[thread_id].refresh()
            sleep(3)
            
            if "facebook" in self.drivers[thread_id].current_url:
                return True
            return False

        except Exception as e:
            # print(f"Error in thread {thread_id}: {str(e)}")
            return False
    def login(self, cookie, thread_id):
        if self.login_facebook_cookie(cookie, thread_id):
            return True
        return False
    def check_die(self, thread_id):
        sleep(2)
        self.drivers[thread_id].get("https://www.facebook.com/profile/")
        source = self.get_sources(thread_id)
        try:
            self.name = (source.split('class="html-h1 xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x1vvkbs x1heor9g x1qlqyl8 x1pd3egz x1a2a7pz">')[1].split('<!-- -->&nbsp;')[0])
            return True
        except Exception as e:
            # print(e)
            return False
    def scan_pages(self,cookie):
        try:
            cookies = {
                'sb': cookie.split('sb=')[1].split(';')[0],
                'datr': cookie.split('datr=')[1].split(';')[0],
                'c_user': cookie.split('c_user=')[1].split(';')[0],
                'xs': cookie.split('xs=')[1].split(';')[0],
                'fr': cookie.split('fr=')[1].split(';')[0],
                'presence': cookie.split('presence=')[1].split(';')[0],
            }
        except:
            cookies = {
                'sb': cookie.split('sb=')[1].split(';')[0],
                'datr': cookie.split('datr=')[1].split(';')[0],
                'c_user': cookie.split('c_user=')[1].split(';')[0],
                'xs': cookie.split('xs=')[1].split(';')[0],
                'fr': cookie.split('fr=')[1].split(';')[0], 
            }
        response = requests.get('https://www.facebook.com/pages/?category=your_pages&ref=bookmarks', cookies=cookies, headers=self.headers).text
        pattern = r'"is_profile_plus":true,"id":"(\d+)","name":"([^"]+)"'
        matches = re.findall(pattern, response)
        stt = 0
        # In ra kết quả
        for match in matches:
            id_value, name_value = match
            cookies['i_user'] = id_value
            cookie_page = "; ".join([f"{key}={value}" for key, value in cookies.items()])
            stt += 1
            data = {
                "id": stt,
                "uid": self.uid,
                "name_account": self.name,
                "cookie_account": cookie,
                "name_page": name_value,
                "uid_page": id_value,
                "cookie_page": cookie_page,
                "url_page": f'https://www.facebook.com/{id_value}',
                "status": "scan page successfully",
            }
            self.status_send('success',data)
            sleep(0.2)
    def main(self, cookie):
        thread_id = threading.get_ident()
        
        try:
            # Khởi tạo driver riêng cho mỗi thread
            user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            options = webdriver.ChromeOptions()
            options.add_argument("--start-maximized")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_argument(f"user-agent={user_agent}")
            options.add_argument("window-size=400x600")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-software-rasterizer")

            # Tạo thư mục riêng cho mỗi thread
            temp_dir = mkdtemp()
            options.add_argument(f"user-data-dir={temp_dir}")

            # Lưu driver vào dictionary với key là thread_id
            self.drivers[thread_id] = webdriver.Chrome(options=options)

            if self.login(cookie, thread_id):
                if self.check_die(thread_id):
                    self.scan_pages(cookie)
                else:
                    data = {
                        "uid": self.uid,
                        "password": self.password,
                        "cookie": cookie,
                        "status": "UID/COOKIE DIE",
                    }
                    self.status_send('error',data)
            else:
                data = {
                    "uid": self.uid,
                    "password": self.password,
                    "cookie": cookie,
                    "status": "UID/COOKIE không đúng định dạng",
                }
                self.status_send('error',data)

        finally:
            # Đóng driver khi thread kết thúc
            if thread_id in self.drivers:
                try:
                    self.drivers[thread_id].quit()
                except:
                    pass
                del self.drivers[thread_id]
    def thread_scanPages(self):
        num_cookies = len(self.cookie)
        for i in range(0, num_cookies, self.threads):
            threads = []
            for j in range(self.threads):
                if i + j < num_cookies:
                    cookie = self.cookie[i + j]
                    self.uid = self.uids[i + j]
                    self.password = self.passwords[i + j]
                    thread = threading.Thread(target=partial(self.main, cookie))
                    threads.append(thread)
                    thread.start()
            
            for thread in threads:
                thread.join()
scanPage().thread_scanPages()