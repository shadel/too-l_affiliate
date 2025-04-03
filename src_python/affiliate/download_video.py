from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import re, os, json, sys
from time import sleep
import threading
import time

class DOWNLOAD_VIDEO:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_scan = os.path.join(current_dir, '..', '..', 'data', 'downloadConfig.json')
        with open(self.data_scan, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        self.threads = self.data['threads']
        self.savePath = self.data['savePath']
        self.videos = self.data['videos']
        self.success_count = 0
        self.lock = threading.Lock()

    def create_driver(self):
        """Khởi tạo một trình duyệt mới với khả năng giám sát tải xuống."""
        options = webdriver.ChromeOptions()
        options.add_argument("--start-maximized")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("window-size=400x600")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-software-rasterizer")
        
        # Thêm cài đặt cho tải xuống
        prefs = {
            "profile.default_content_settings.popups": 0,
            "download.default_directory": self.savePath,
            "download.directory_upgrade": True,
            "download.prompt_for_download": False,  # Không hỏi khi tải xuống
            "safebrowsing.enabled": True
        }
        options.add_experimental_option("prefs", prefs)
        return webdriver.Chrome(options=options)
    
    def monitor_downloads_directory(self, files_before, timeout=300):
        """Theo dõi thư mục tải xuống để biết khi nào tải xuống hoàn tất."""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            files_now = set(os.listdir(self.savePath))
            new_files = files_now - files_before
            
            # Tìm các file .mp4 mới hoặc file đang tải xuống
            downloading_files = [f for f in new_files if f.endswith('.crdownload') or f.endswith('.tmp')]
            mp4_files = [f for f in new_files if f.endswith('.mp4')]
            
            if mp4_files:
                # Tìm thấy file đã tải xuống hoàn tất
                newest_file = max(mp4_files, key=lambda x: os.path.getmtime(os.path.join(self.savePath, x)))
                # Kiểm tra xem file có ổn định (kích thước không thay đổi trong 2 giây)
                file_size_1 = os.path.getsize(os.path.join(self.savePath, newest_file))
                sleep(2)
                file_size_2 = os.path.getsize(os.path.join(self.savePath, newest_file))
                if file_size_1 == file_size_2 and file_size_1 > 0:
                    return True, newest_file
            
            if downloading_files:
                # Có file đang tải xuống, in tiến độ
                downloading_file = downloading_files[0]
                file_path = os.path.join(self.savePath, downloading_file)
                try:
                    current_size = os.path.getsize(file_path)
                    print(json.dumps({"status": f"Đang tải: {downloading_file}", "bytesReceived": current_size}), flush=True)
                except:
                    pass
            
            sleep(1)
        
        # Kiểm tra lần cuối sau khi hết thời gian
        files_now = set(os.listdir(self.savePath))
        new_files = files_now - files_before
        mp4_files = [f for f in new_files if f.endswith('.mp4')]
        
        if mp4_files:
            newest_file = max(mp4_files, key=lambda x: os.path.getmtime(os.path.join(self.savePath, x)))
            return True, newest_file
        
        return False, "Tải xuống quá thời gian"

    def download_video(self, video, thread_index=0):
        """Tải video bằng Selenium với giám sát trạng thái tải xuống."""
        link = video["link"]
        title = f"Vn_Snaptik_Com_{link.split('/')[-1]}"  # Tạo tên tệp từ liên kết video
        expected_file_path = os.path.join(self.savePath, f"{title}.mp4")
        
        driver = None
        download_success = False
        filename = None
        
        # Kiểm tra nếu file đã tồn tại
        if os.path.exists(expected_file_path):
            print(json.dumps({"link": link, "status": "Đã tồn tại"}), flush=True)
            with self.lock:
                self.success_count += 1
            return True

        try:
            driver = self.create_driver()
            driver.set_window_size(400, 600)
            
            # Định vị cửa sổ trình duyệt
            # Đặt cửa sổ theo chỉ số thread
            if thread_index < 5:  # Hàng trên: 0, 1, 2
                driver.set_window_position(400 * thread_index, 0)
            else:  # Hàng dưới: 3, 4
                driver.set_window_position(400 * (thread_index - 3), 600)
            
            # Gửi trạng thái "Đang tải"
            print(json.dumps({"link": link, "status": "Đang tải video xuống", "thread": thread_index}), flush=True)
            
            # Điều hướng đến trang video
            driver.get("https://vn.snaptik.com/")
            
            # Nhập URL TikTok
            input_field = WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.XPATH, '/html/body/section[1]/div/form/div[2]/input[1]'))
            )
            input_field.send_keys(link)
            sleep(3)
            
            # Click nút tải
            submit_button = WebDriverWait(driver, 30).until(
                EC.element_to_be_clickable((By.XPATH, '/html/body/section[1]/div/form/button'))
            )
            sleep(2)
            submit_button.click()
            
            # Chờ nút tải xuống xuất hiện
            try:
                download_button = WebDriverWait(driver, 30).until(
                    EC.element_to_be_clickable((By.XPATH, '/html/body/section/div/div[2]/div/div[2]/a[1]'))
                )
                sleep(3)
                # Lưu trạng thái thư mục trước khi click
                files_before = set(os.listdir(self.savePath))
                
                # Click nút tải xuống
                download_button.click()
                print(json.dumps({"link": link, "status": "Đã click nút tải xuống", "thread": thread_index}), flush=True)
                
                # Sử dụng hàm giám sát thư mục để theo dõi tiến trình tải xuống
                download_success, filename = self.monitor_downloads_directory(files_before)
                
                if download_success and filename:
                    print(json.dumps({"link": link, "status": f"Đã tải xong video", "thread": thread_index}), flush=True)
                else:
                    print(json.dumps({"link": link, "status": f"Vấn đề: {filename}", "thread": thread_index}), flush=True)
                
            except Exception as e:
                print(json.dumps({"link": link, "status": f"Lỗi khi tải: {str(e)}", "thread": thread_index}), flush=True)
                return False
            
        except Exception as e:
            print(json.dumps({"link": link, "status": f"Lỗi chung: {str(e)}", "thread": thread_index}), flush=True)
            return False
            
        finally:
            # Đảm bảo trình duyệt luôn được đóng
            if driver:
                try:
                    sleep(3)
                    driver.quit()
                except:
                    pass

    def run(self):
        total_downloaded = 0
        total_videos = len(self.videos)

        while total_downloaded < total_videos:
            threads = []

            # Tính số video trong nhóm hiện tại
            remaining = total_videos - total_downloaded
            videos_this_batch = min(remaining, self.threads)

            # Tạo và bắt đầu luồng cho từng video trong nhóm
            for i in range(videos_this_batch):
                video_index = total_downloaded + i
                video = self.videos[video_index]
                thread_index = i  # Đảm bảo mỗi thread có một chỉ số riêng biệt
                video_thread = threading.Thread(target=self.download_video, args=(video, thread_index))
                threads.append(video_thread)
                video_thread.start()
                time.sleep(0.5)  # Delay nhỏ giữa các luồng

            # Chờ tất cả các luồng trong nhóm hoàn thành
            for thread in threads:
                thread.join()

            # Cập nhật tổng số video đã tải
            total_downloaded += videos_this_batch

if __name__ == "__main__":
    downloader = DOWNLOAD_VIDEO()
    downloader.run()