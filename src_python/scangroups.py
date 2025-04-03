import time
import sys,os,re
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from time import sleep
class scangroups:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_scan = os.path.join(current_dir, '..', 'data', 'scangroups.json')
        self.data_sweep = os.path.join(current_dir, '..', 'data', 'sweep_clone.json')
        with open(self.data_scan, 'r',encoding='utf-8') as datas_scan:
            data_scan = json.load(datas_scan)
            self.selectedGroup = data_scan['selectedGroup']
            self.keyword = data_scan['keyword']
            self.maxGroups = data_scan['maxGroups']
            self.concurrentRuns = data_scan['concurrentRuns']
        with open(self.data_sweep, 'r',encoding='utf-8') as data_accounts:
            data_accounts = json.load(data_accounts)
            for data_account in data_accounts:
                if data_account['name_groups'] == self.selectedGroup:
                    self.uid = data_account['data'][0]['uid']
                    self.password = data_account['data'][0]['password']
                    self.twoFA = data_account['data'][0]['twoFA']
                    self.cookie = data_account['data'][0]['cookie']
        
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

        # Tạo tùy chọn trình duyệt
        options = webdriver.ChromeOptions()
        options.add_argument("--start-maximized")
        options.add_argument("--disable-blink-features=AutomationControlled")  # Tắt nhận diện Selenium
        options.add_argument(f"user-agent={user_agent}")  # Thêm User-Agent
        # options.add_argument("--headless")  # Chạy Chrome ở chế độ không giao diện người dùng
        options.add_argument("window-size=400x600")  # Giảm kích thước màn hình
        options.add_argument("--disable-gpu")  # Tắt GPU nếu không cần thiết
        options.add_argument("--no-sandbox")  # Tắt sandbox
        options.add_argument("--disable-software-rasterizer")  # Tắt phần mềm rasterizer

        prefs = {"profile.default_content_setting_values.notifications": 2}
        options.add_experimental_option("prefs", prefs)
        # Khởi tạo trình duyệt
        self.driver = webdriver.Chrome(options=options)
    def login_facebook_cookie(self, cookie_string):
        try:
            cookies = []
            # Chia chuỗi cookie và thêm các cookie vào danh sách
            for item in cookie_string.split(";"):
                if "=" in item:  # Kiểm tra xem có dấu '=' hay không
                    key, value = item.split("=", 1)
                    cookies.append({"name": key.strip(), "value": value.strip()})
                else:
                    pass
            # Mở trang Facebook trước khi thêm cookie
            self.driver.get('https://www.facebook.com')
            sleep(2)  # Đảm bảo trang đã tải xong

            # Thêm cookie vào trình duyệt
            for cookie in cookies:
                cookie["domain"] = ".facebook.com"
                self.driver.add_cookie(cookie)

            # Làm mới lại trang sau khi thêm cookie
            self.driver.refresh()

            # Kiểm tra xem bạn đã đăng nhập thành công chưa
            sleep(3)
            if "facebook" in self.driver.current_url:
                return True
            else:
                return False

        except Exception as e:
            return False
    def login_facebook_user(self,username,password):
        try:
            self.driver.find_element(By.ID, "email").send_keys(username)
            sleep(1/2)
            self.driver.find_element(By.ID, "pass").send_keys(password)
            sleep(1/2)
            self.driver.find_element(By.NAME, "login").click()
            return True
        except Exception as e:
            return False 
    def error_send(self,status):
        data = {
            "type": "error",
            "status": status,
        }
        print(json.dumps(data))
        sys.stdout.flush()
    def scoll_get_page(self,pixels = 2000):
        while True:
            self.driver.execute_script(f"window.scrollBy(0, {pixels});")
            current_scroll_position = self.driver.execute_script("return window.pageYOffset + window.innerHeight;")
            total_page_height = self.driver.execute_script("return document.body.scrollHeight;")
            if current_scroll_position >= total_page_height:
                return False
    def get_page(self,name_page,numberuidpages):
        uid_page = []
        info_page = []
        stt = 0
        self.driver.get('https://www.facebook.com/groups/feed/')
        sleep(5)
        # input search page 
        try:
            search_page = self.driver.find_element(By.XPATH, "/html/body/div[1]/div/div[1]/div[1]/div/div[3]/div/div/div[1]/div[1]/div[1]/div/div[2]/div/div/div/div/label/input")
        except:
            search_page = self.driver.find_element(By.XPATH, "/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div[1]/div/div[2]/div/div/div/div/label/input")
        search_page.send_keys(name_page)
        search_page.send_keys(Keys.RETURN)
        sleep(2)
        info_skipped = False  # Cờ để theo dõi đã bỏ qua giá trị đầu tiên của info

        while True:
            # try:
                # Lấy source dữ liệu từ trang
                source = self.get_sources()

                # Lấy thông tin về nhóm (thành viên, bài viết/ngày) và UID
                infos = re.findall(r'-webkit-line-clamp: 2; display: -webkit-box;">([^<]+)</span></span>', source)
                uids = re.findall(r'href="https://www.facebook.com/groups/([^"]+)/"', source)

                # Bỏ qua giá trị đầu tiên của info (là bộ lọc)
                if not info_skipped and infos:
                    infos = infos[1:]  # Bỏ qua giá trị đầu tiên
                    info_skipped = True
                
                # Đồng bộ hóa info và uid
                for info, uid in zip(infos, uids):
                    if uid not in uid_page and info not in info_page:
                        uid_page.append(uid)
                        info_page.append(info)
                        info_data = info.split('·')
                        stt += 1

                        # Kiểm tra và lấy giá trị với giá trị mặc định nếu không tồn tại
                        group_type = info_data[0].strip() if len(info_data) > 0 else "Unknown"
                        member_count = info_data[1].strip() if len(info_data) > 1 else "Unknown"
                        posts_per_day = info_data[2].strip() if len(info_data) > 2 else "Unknown"

                        # Tạo đối tượng data_scan với các dữ liệu cần thiết
                        data_scan = {
                            "type": "",
                            "id": stt,
                            "uid": uid,  # Lấy UID từ info_data
                            "keyword": self.keyword,
                            "groupName": self.selectedGroup,
                            "groupType": group_type,
                            "memberCount": member_count,
                            "PostsperDay": posts_per_day,
                            "url": f"https://www.facebook.com/groups/{uid}/"
                        }

                        # In ra dữ liệu dưới dạng JSON (mảng JSON nếu có nhiều nhóm)
                        print(json.dumps(data_scan))
                        sys.stdout.flush()

                        sleep(0.2)
                        
                    if stt >= int(self.maxGroups):  # Kiểm tra nếu stt đã đạt maxGroups
                        return True
                self.scoll_get_page()
            # except Exception as e:
            #     print(e)
            #     return False
    def login(self):
        if self.cookie == "":
            if self.login_facebook_user(self.uid, self.password):
                return True
            else:
                return False
        else:
            if self.login_facebook_cookie(self.cookie):
                return True
            else:
                return False
    def get_sources(self):
        page_source = self.driver.page_source
        return page_source
    def check_die(self):
        sleep(2)
        self.driver.get("https://www.facebook.com/profile/")
        source = self.get_sources()
        # with open("source.html", "w", encoding="utf-8") as file:
        #     file.write(source)
        try:
            self.get_uid = source.split('href="https://www.facebook.com/profile.php?id=')[1].split('&amp;')[0]
            self.get_name = source.split('x1pd3egz x1a2a7pz">')[1].split('<!-- -->&nbsp')[0]
            return True
        except Exception as e:
            return False
    def main(self):
        if self.login():
            if self.check_die():
                success= self.get_page(self.keyword, self.maxGroups)
                if success:
                    data = {
                        "type": "success",
                        "status": f'Lấy thành công {self.maxGroups} Groups',
                    }
                    print(json.dumps(data))
                    sys.stdout.flush()
                else:
                    self.error_send('Get groups thất bại')
            else:
                self.error_send('UID/COOKIE DIE')
        else:
            self.error_send('UID/COOKIE không đúng định dạng')
            
scangroups().main()   
# # Giả lập công việc và in dữ liệu mỗi 5 giây
# mock_data =    {"id": 43, "uid": "106921569054927", "keyword": "Kinh doanh", "groupName": "KINH DOANH ONLINE", "reviewStatus": "Kiểm duyệt", "groupType": "Riêng tư", "memberCount": 12000, "url": "https://www.facebook.com/groups/106921569054927/"}
#     # Thêm nhiều dữ liệu nếu cần


# time.sleep(5)  # Chờ 5 giây
# sys.stdout.flush()  # Đảm bảo dữ liệu được gửi ra ngay lập tức
