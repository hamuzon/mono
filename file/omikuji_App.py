import requests
import tkinter as tk
from datetime import datetime
import threading
import random

# ------------------------------
# 設定
# ------------------------------
API_BASE = "https://api.hamusata.f5.si"
APP_NAME = "omikuji_app"

# USER_ID の最後3桁をランダムに生成
random_suffix = f"{random.randint(0, 999):03d}"  # 000～999
USER_ID = f"omikuji_user_otp_{random_suffix}"

WAIT_LIMIT = 10  # 秒単位

# ------------------------------
# OTP取得
# ------------------------------
def get_otp():
    try:
        resp = requests.post(
            f"{API_BASE}/api/otp/generate",
            json={"appName": APP_NAME, "userId": USER_ID}
        )
        resp.raise_for_status()
        data = resp.json()
        otp = data.get("otp")
        if not otp:
            raise Exception("OTP取得失敗")
        return otp
    except Exception as e:
        print("OTP取得失敗:", e)
        return None

# ------------------------------
# OTP検証
# ------------------------------
def verify_otp(otp):
    try:
        resp = requests.post(
            f"{API_BASE}/api/otp/verify",
            json={"appName": APP_NAME, "userId": USER_ID, "otp": otp}
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("success", False)
    except Exception as e:
        print("OTP認証失敗:", e)
        return False

# ------------------------------
# おみくじ取得
# ------------------------------
def fetch_omikuji():
    try:
        otp = get_otp()
        if not otp:
            return None
        if not verify_otp(otp):
            print("OTP検証失敗")
            return None
        resp = requests.get(f"{API_BASE}/api/v2/omikuji", timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print("取得失敗:", e)
        return None

# ------------------------------
# GUI
# ------------------------------
class OmikujiApp:
    def __init__(self, root):
        self.root = root
        root.title("御神籤(おみくじ)")
        root.geometry("400x500")
        root.configure(bg="#87cefa")

        self.title = tk.Label(root, text="御神籤(おみくじ)", font=("Noto Sans JP", 24, "bold"), bg="#87cefa")
        self.title.pack(pady=20)

        self.user_label = tk.Label(root, text=f"USER_ID: {USER_ID}", font=("Noto Sans JP", 10), bg="#87cefa")
        self.user_label.pack(pady=5)

        self.draw_btn = tk.Button(root, text="おみくじを引く", font=("Noto Sans JP", 14, "bold"), command=self.draw_omikuji)
        self.draw_btn.pack(pady=10)

        self.wait_label = tk.Label(root, text="", font=("Noto Sans JP", 10), bg="#87cefa")
        self.wait_label.pack(pady=5)

        self.result_frame = tk.Frame(root, bg="#87cefa")
        self.result_frame.pack(pady=20)

        self.result_kanji = tk.Label(self.result_frame, text="", font=("Noto Sans JP", 48, "bold"), bg="#87cefa")
        self.result_kanji.pack()

        self.result_comment = tk.Label(self.result_frame, text="", font=("Noto Sans JP", 12, "bold"), bg="#87cefa", wraplength=350, justify="center")
        self.result_comment.pack(pady=10)

        self.result_time = tk.Label(self.result_frame, text="", font=("Noto Sans JP", 9), bg="#87cefa")
        self.result_time.pack(pady=5)

    def draw_omikuji(self):
        self.draw_btn.config(state="disabled")
        self.wait_label.config(text="取得中…OTP確認中")
        threading.Thread(target=self._fetch_and_render).start()

    def _fetch_and_render(self):
        data = fetch_omikuji()
        if not data:
            self.wait_label.config(text="取得に失敗しました")
            self.draw_btn.config(state="normal")
            return
        self.root.after(0, lambda: self.render(data))
        self.start_timer(WAIT_LIMIT)

    def render(self, data):
        self.result_kanji.config(text=data.get("result", ""))
        self.result_comment.config(text=data.get("message") or data.get("comment", ""))
        ts = data.get("timestamp_unix") or data.get("timestamp")
        if ts:
            try:
                ts_dt = datetime.fromtimestamp(float(ts)/1000)
                self.result_time.config(text="更新時間: " + ts_dt.strftime("%Y-%m-%d %H:%M:%S"))
            except:
                self.result_time.config(text=f"更新時間: {ts}")
        self.wait_label.config(text="")

    def start_timer(self, seconds):
        def countdown(sec):
            if sec <= 0:
                self.draw_btn.config(state="normal")
                self.wait_label.config(text="")
                return
            self.wait_label.config(text=f"あと {sec} 秒待ってね")
            self.root.after(1000, countdown, sec-1)
        countdown(seconds)

# ------------------------------
# 実行
# ------------------------------
if __name__ == "__main__":
    root = tk.Tk()
    app = OmikujiApp(root)
    root.mainloop()
