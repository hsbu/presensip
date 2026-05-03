# ESP32 Headcount MQTT

Project ini digunakan untuk menghitung jumlah orang yang terdeteksi dari stream ESP32-CAM menggunakan YOLO, lalu mengirimkan data hasil deteksi ke HiveMQ melalui MQTT.

## Arsitektur Sistem

```text
ESP32-CAM + OV2640
        ↓
Video stream via WiFi
        ↓
Python + YOLO
        ↓
Detected person count
        ↓
HiveMQ MQTT Broker
```

## Struktur Folder

```text
esp32-headcount/
├── headcount.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
└── CameraWebServer/
        ├── CameraWebServer.ino
        ├── app_httpd.cpp
        ├── camera_index.h
        ├── camera_pins.h
        ├── ci.json
        └── partitions.csv
```

## Kebutuhan

Hardware:

```text
ESP32-CAM AI Thinker
OV2640 camera module
USB to TTL / FTDI programmer
Power supply 5V minimal 1A
Laptop / PC / mini PC untuk menjalankan YOLO
WiFi 2.4 GHz
```

Software:

```text
Python 3.12
Arduino IDE
ESP32 board package
HiveMQ Cloud account
```

## Setup ESP32-CAM

1. Buka Arduino IDE.
2. Install board ESP32 dari Board Manager.
3. Buka folder berikut:

```text
esp32/CameraWebServer/CameraWebServer.ino
```

4. Pastikan model kamera yang digunakan adalah AI Thinker:

```cpp
#define CAMERA_MODEL_AI_THINKER
```

5. Masukkan SSID dan password WiFi di file `.ino`:

```cpp
const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";
```

6. Upload program ke ESP32-CAM.

Koneksi upload menggunakan USB to TTL:

```text
FTDI 5V     → ESP32-CAM 5V
FTDI GND    → ESP32-CAM GND
FTDI TX     → ESP32-CAM U0R
FTDI RX     → ESP32-CAM U0T
ESP32 GPIO0 → GND saat upload
```

Setelah upload selesai:

```text
Cabut GPIO0 dari GND
Tekan tombol RESET
Buka Serial Monitor pada baud rate 115200
```

Jika berhasil, Serial Monitor akan menampilkan IP ESP32-CAM, misalnya:

```text
WiFi connected
Camera Ready! Use 'http://192.168.xx.xx' to connect
```

Buka alamat IP tersebut di browser:

```text
http://192.168.xx.xx
```

Stream kamera biasanya tersedia di:

```text
http://192.168.xx.xx:81/stream
```

## Setup Python Environment

Clone repository, lalu

Install dependencies:

```bash
pip install -r requirements.txt
```

Isi `requirements.txt`:

```txt
ultralytics
opencv-python
paho-mqtt
python-dotenv
```

## Setup Environment Variable

Buat file `.env` berdasarkan `.env.example`:

```bash
copy .env.example .env
```

Isi `.env`:

```env
ESP32_STREAM_URL=http://YOUR_ESP32_CAM_IP:81/stream

MQTT_BROKER=YOUR_HIVEMQ_HOST
MQTT_PORT=8883
MQTT_USERNAME=YOUR_HIVEMQ_USERNAME
MQTT_PASSWORD=YOUR_HIVEMQ_PASSWORD
MQTT_TOPIC=presensip/headcount/kelas-01

DEVICE_ID=esp32cam-kelas-01
ROOM_ID=kelas-01
SAVE_INTERVAL_SECONDS=300
```

Contoh:

```env
ESP32_STREAM_URL=http://192.168.18.20:81/stream

MQTT_BROKER=xxxxxxxxxxxx.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=esp32_headcount
MQTT_PASSWORD=your_password
MQTT_TOPIC=presensip/headcount/kelas-01

DEVICE_ID=esp32cam-kelas-01
ROOM_ID=kelas-01
SAVE_INTERVAL_SECONDS=10
```

Catatan:

```text
Jangan gunakan https:// pada MQTT_BROKER.
Gunakan host broker saja.
```

Benar:

```env
MQTT_BROKER=xxxxxxxxxxxx.s1.eu.hivemq.cloud
```

Salah:

```env
MQTT_BROKER=https://xxxxxxxxxxxx.s1.eu.hivemq.cloud
```

## Setup HiveMQ MQTT

1. Login ke HiveMQ Cloud.
2. Buat cluster baru.
3. Masuk ke bagian Access Management.
4. Buat credential baru.
5. Berikan permission berikut:

```text
Topic: presensip/headcount/#
Permission: Publish and Subscribe
```

Atau lebih spesifik:

```text
Topic: presensip/headcount/kelas-01
Permission: Publish and Subscribe
```

Untuk program Python, permission minimal yang dibutuhkan adalah `Publish`.

Untuk melihat data dari Web Client, permission yang dibutuhkan adalah `Subscribe`.

## Menjalankan Program

Pastikan virtual environment aktif:

```powershell
.\venv\Scripts\Activate.ps1
```

Jalankan program:

```bash
python headcount.py
```

Jika berhasil, terminal akan menampilkan informasi seperti:

```text
Sistem headcount berjalan
Stream ESP32-CAM: http://192.168.18.20:81/stream
MQTT Broker: xxxxxxxxxxxx.s1.eu.hivemq.cloud
MQTT Topic: presensip/headcount/kelas-01
Interval publish: 300 detik
```

Program akan:

```text
1. Membaca stream dari ESP32-CAM
2. Menjalankan YOLO untuk mendeteksi manusia
3. Menghitung jumlah label person
4. Menampilkan bounding box pada window OpenCV
5. Mengirim data ke HiveMQ setiap 5 menit
```

Tekan tombol `q` pada window OpenCV untuk menghentikan program.

## Format Data MQTT

Data yang dikirim ke HiveMQ menggunakan format JSON:

```json
{
    "device_id": "esp32cam-kelas-01",
    "room_id": "kelas-01",
    "timestamp": "2026-05-03 18:30:00",
    "detected_person_count": 41,
    "status": "recorded"
}
```

Penjelasan field:

```text
device_id              = ID perangkat kamera
room_id                = ID kelas atau ruangan
timestamp              = waktu data dicatat
detected_person_count  = jumlah orang yang terdeteksi pada saat pencatatan
status                 = status data
```

## Cara Mengambil Data dari MQTT

Data dapat diambil dengan cara subscribe ke topic MQTT yang sama.

Topic yang digunakan:

```text
presensip/headcount/kelas-01
```

## Mengambil Data Menggunakan HiveMQ Web Client

1. Buka HiveMQ Cloud.
2. Masuk ke cluster.
3. Buka Web Client.
4. Connect menggunakan credential yang sudah dibuat.
5. Gunakan konfigurasi berikut:

```text
Host: YOUR_HIVEMQ_HOST
Port: 8884
Username: YOUR_HIVEMQ_USERNAME
Password: YOUR_HIVEMQ_PASSWORD
TLS: Enabled
```

6. Subscribe ke topic:

```text
presensip/headcount/kelas-01
```

Jika program Python berhasil publish data, pesan JSON akan muncul di Web Client.

Untuk menerima semua topic, bisa subscribe ke:

```text
#
```

Namun untuk project ini lebih disarankan menggunakan topic spesifik:

```text
presensip/headcount/kelas-01
```