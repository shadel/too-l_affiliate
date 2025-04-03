import os
import json


class delete_groups_data:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_delete = os.path.join(current_dir, '..', 'data', 'data_delete.json')
        
        with open(self.data_delete, 'r',encoding='utf-8') as file_delete:
            file_delete_data = json.load(file_delete)
            self.selectedAccount = file_delete_data['selectedAccount']
            self.accounts_deleles = file_delete_data['accounts']
            self.typedelete = file_delete_data['type_delete']
        if  file_delete_data['type_delete'] == 'deletepage':
            self.data_sweep = os.path.join(current_dir, '..', 'data', 'sweep_page.json')
        elif file_delete_data['type_delete'] == 'deleteaccount':
            self.data_sweep = os.path.join(current_dir, '..', 'data', 'sweep_clone.json')
    def main(self):
          # Lấy tất cả trừ phần tử đầu tiên

        with open(self.data_sweep, 'r',encoding='utf-8') as data_sweeps_file:
            data_sweeps = json.load(data_sweeps_file)
            
            for data_sweep in data_sweeps:
                if data_sweep['name_groups'] == self.selectedAccount:
                    data_accounts = data_sweep['data']
                    # Lọc danh sách để giữ lại các phần tử không trùng `uid`
                    if self.typedelete == 'deleteaccount':
                        filtered_accounts = [
                            data_account for data_account in data_accounts
                            if not any(data_account['uid'] == accounts_delele['uid'] for accounts_delele in self.accounts_deleles)
                        ]
                    elif self.typedelete == 'deletepage':
                        filtered_accounts = [
                            data_account for data_account in data_accounts
                            if not any(data_account['uid_page'] == accounts_delele['uid_page'] for accounts_delele in self.accounts_deleles)
                        ]
                    # Cập nhật lại data_sweep['data'] sau khi lọc
                    data_sweep['data'] = filtered_accounts

                    # Kiểm tra nếu danh sách bị xóa hết
                    if not filtered_accounts:
                        # Nếu danh sách rỗng, xóa name_groups
                        data_sweeps.remove(data_sweep)
        
        # Ghi lại dữ liệu vào file nếu có thay đổi
        with open(self.data_sweep, 'w',encoding='utf-8') as data_sweeps_file:
            json.dump(data_sweeps, data_sweeps_file, indent=4)

        # In kết quả


delete_groups_data().main()