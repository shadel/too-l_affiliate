import json
import pandas as pd
import os
from datetime import datetime

# Mở và đọc file JSON
with open(r'data/data_export.json', 'r',encoding='utf-8') as file:
    data = json.load(file)

# Tạo danh sách để lưu thông tin tài khoản
account_info_list = []

if data['type_export'] == 'export_account':
    # Lặp qua từng account và thu thập thông tin cần thiết
    for account in data['accounts']:
        account_info_list.append({
            'UID': account['UID'],
            'Status': account['Status'],
            'Password': account['Password'],
            'TwoFA': account['TwoFA'],
            'Cookie': account['Cookie']
        })
elif data['type_export'] == 'export_groups':
    for account in data['accounts']:
        account_info_list.append({
            'UID': account['uid'],
            'Tìm kiếm': account['keyword'],
            'Tên groups': account['name_groups'],
            'Loại groups': account['type_groups'],
            'Thành viên': account['member'],
            'Bài đăng': account['status'],
            'url': account['url']
        })
elif data['type_export'] == 'export_pages':
    for account in data['accounts']:
        account_info_list.append({
            'name_account': account['name_account'],
            'uid_account': account['uid_account'],
            'cookie_account': account['cookie_account'],
            'name_page': account['name_page'],
            'uid_page': account['uid_page'],
            'cookie_page': account['cookie_page'],
            'url_page': account['url_page']
        })
# Chuyển danh sách thành DataFrame
df = pd.DataFrame(account_info_list)

# Tạo thư mục 'data_export' nếu chưa tồn tại
if not os.path.exists('data_export'):
    os.makedirs('data_export')
# Tạo tên file mới dựa trên thời gian hiện tại để tránh ghi đè
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
file_name = f'data_export/account_info_{timestamp}.xlsx'

# Xuất DataFrame ra file Excel với tên mới
df.to_excel(file_name, index=False)

print(f"{file_name}")
