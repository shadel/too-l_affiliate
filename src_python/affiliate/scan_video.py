from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import re,os,json,sys
from time import sleep

class SCAN_VIDEO:
    def __init__(self):
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_scan = os.path.join(current_dir, '..', '..', 'data', 'scancontent.json')
        with open(self.data_scan, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        self.typescan = self.data['data']['typescan']
        self.platform = self.data['data']['platform']
        self.keyword = self.data['data']['keyword'].replace(" ", "%20")
        self.keywordLimit = self.data['data']['keywordLimit']

        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        options = webdriver.ChromeOptions()
        options.add_argument("--start-maximized")
        options.add_argument("--disable-blink-features=AutomationControlled")  # Tắt nhận diện Selenium
        # options.add_argument("--headless")  # Chạy Chrome ở chế độ không giao diện người dùng
        options.add_argument("window-size=400x600")  # Giảm kích thước màn hình
        options.add_argument("--disable-gpu")  # Tắt GPU nếu không cần thiết
        options.add_argument("--no-sandbox")  # Tắt sandbox
        options.add_argument("--disable-software-rasterizer")  # Tắt phần mềm rasterizer
        download_dir = r"C:\shin\shinsad\tool_affiliate\video"
        prefs = {
            "profile.default_content_settings.popups": 0,
            "download.default_directory": download_dir,  # Đặt thư mục tải xuống
            "directory_upgrade": True,
        }
        options.add_experimental_option("prefs", prefs)
        # Khởi tạo trình duyệt
        self.driver = webdriver.Chrome(options=options)
        self.driver.set_window_size(400,500)

    def scoll_get_page(self,pixels = 2000):
        while True:
            self.driver.execute_script(f"window.scrollBy(0, {pixels});")
            current_scroll_position = self.driver.execute_script("return window.pageYOffset + window.innerHeight;")
            total_page_height = self.driver.execute_script("return document.body.scrollHeight;")
            if current_scroll_position >= total_page_height:
                return False

    def extract_tiktok_data(self,page_source):
        data = {
            "links": re.findall(r'href="https://www.tiktok.com/@([^"]+)"', page_source),
            "titles": re.findall(r'<div class="css-[^"]*-DivDescriptionContentContainer[^"]*">.*?<span[^>]*>([^<]+)</span>', page_source),
            "creation_dates": re.findall(r'<div class="css-[^"]*-DivTimeTag[^"]*">([^<]+)</div>', page_source),
            "views": re.findall(r'<strong[^>]*\bStrongVideoCount\b[^>]*>([^<]+)</strong>', page_source),
            "users": re.findall(r'<p[^>]*data-e2e="search-card-user-unique-id"[^>]*>([^<]+)</p>', page_source)
        }

        
        return data
    def main(self):
        self.driver.get(f'https://www.tiktok.com/search/video?q={self.keyword}')
        sleep(5)
        self.driver.refresh()
        # Chờ đến khi phần tử quan trọng xuất hiện (ví dụ: video container)
        sleep(5)
        # Lấy source sau khi trang đã load xong
        page_source = self.driver.page_source
        # Lưu vào file
        tiktok_data = self.extract_tiktok_data(page_source)
        stt = 0
        while True:
            for i in range(len(tiktok_data["links"])):
                data_scan = {
                    "id": stt,
                    "link": f'https://www.tiktok.com/@{tiktok_data["links"][i]}',
                    "title": tiktok_data["titles"][i] if i < len(tiktok_data["titles"]) else 'N/A',
                    "creation_date": tiktok_data["creation_dates"][i] if i < len(tiktok_data["creation_dates"]) else 'N/A',
                    "views": tiktok_data["views"][i] if i < len(tiktok_data["views"]) else 'N/A',
                    "user": tiktok_data["users"][i] if i < len(tiktok_data["users"]) else 'N/A'
                }
                print(json.dumps(data_scan))
                sys.stdout.flush()
                stt += 1
                sleep(0.2)
                if stt >= int(self.keywordLimit):  # Kiểm tra nếu stt đã đạt maxGroups
                    return True
            self.scoll_get_page()

if __name__ == "__main__":
    scan = SCAN_VIDEO().main()
