from supabase import create_client
import json
import os

class Client:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_client_file = os.path.join(current_dir, '..', 'data', 'action_client.json')
        self.key_file = os.path.join(current_dir, '..', 'data', 'key.json')
        
        # Kết nối với Supabase
        SQL_url = "https://vqluvnrjixxpfffawkps.supabase.co"
        SQL_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbHV2bnJqaXh4cGZmZmF3a3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzgzMjIzOSwiZXhwIjoyMDQ5NDA4MjM5fQ.AZ8SMebm4F8dRWdg-hv8dMwa997dUcSAVoctAFd9VO0"
        self.supabase = create_client(SQL_url, SQL_key)

        try:
            key_response = self.supabase.table("key_spam_groups").select("*").execute()
            self.key_data = key_response.data or []
        except Exception as e:
            print(f"Lỗi khi kết nối với Supabase: {e}")
            self.key_data = []

        # Đọc tệp JSON
        self.data_client = self.load_json(self.data_client_file, {})
        self.key = self.load_json(self.key_file, {'key': ''})

    def load_json(self, filepath, default):
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            return default

    def send_data(self, key, status, message):
        return {
            'key': key,
            'status': status,
            'message': message
        }

    def sucsend_datacess(self, entry, status, message):
        return {
            'key': entry['key'],
            'status': status,
            'message': message
        }

    def check_key(self):
        if not self.key.get('key'):
            print(json.dumps(self.send_data(self.key, 'False', 'Key not specified')))
            return

        key_found = False
        for entry in self.key_data:
            if self.key['key'] == entry.get('key'):
                key_found = True
                if entry.get('status') == 'OPEN':
                    print(json.dumps(self.send_data(entry['key'], 'True', 'Key đúng')))
                else:
                    print(json.dumps(self.send_data(entry['key'], 'False', 'Key hết hạn')))
                    self.delete_key()
                break
        
        if not key_found:
            print(json.dumps(self.send_data(self.key['key'], 'False', 'Key không tồn tại')))

    def get_savekey(self):
        key_to_check = self.data_client['key']
        key_found = False
        for entry in self.key_data:
            if key_to_check == entry.get('key'):
                key_found = True
                status = entry.get('status', 'UNKNOWN')
                if status == 'OPEN':
                    print(json.dumps(self.sucsend_datacess(entry, 'True', 'Key đúng')))
                    data = {
                        'key': key_to_check
                    }
                    with open('data/key.json', 'w') as f:
                        json.dump(data, f, ensure_ascii=False, indent=4)
                elif status == 'CLOSE':
                    print(json.dumps(self.send_data(entry['key'], 'False', 'Key hết hạn')))
                else:
                    print(json.dumps(self.send_data(entry['key'], 'False', 'Key lỗi liên hệ administrative')))
                break

        if not key_found:
            print(json.dumps(self.send_data(key_to_check, 'False', 'Key không tồn tại')))

    def delete_key(self):
        try:
            os.remove(self.key_file)
            print("Đã xóa key.json")
        except FileNotFoundError:
            print("Tệp key.json không tồn tại để xóa.")
        except Exception as e:
            print(f"Lỗi khi xóa key.json: {e}")

    def main(self):
        status = self.data_client.get('status')
        if status == 'deleted':
            self.delete_key()
        elif status == 'save_key':
            self.get_savekey()
        elif status == 'check_key':
            self.check_key()

if __name__ == "__main__":
    Client().main()
