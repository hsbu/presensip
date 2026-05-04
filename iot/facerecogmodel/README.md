# ESP32 Face Recognition Door MQTT
```text
Proyek ini digunakan untuk mengenali identitas wajah dan melakukan verifikasi keaslian (*liveness detection* / anti-spoofing) dari *stream* video ESP32-CAM. Sistem menggunakan library UniFace dan mengirimkan data log kehadiran ke HiveMQ melalui protokol MQTT.
```
## Arsitektur Sistem

```text
ESP32-S3 WROOM + Kamera
         |
         | Video stream via WiFi
         v
Python + UniFace
         |
         | Detected face & Liveness verification
         v
HiveMQ MQTT Broker
```


## Struktur Folder
```text
facerecogmodel/
├── facerecogdoor.py
├── requirements.txt
├── README.md
├── dataset_wajah/
│   ├── .gitkeep
│   └── 18223016 Muhammad Daffa Al Ghifari/
│       ├── foto_1.jpg
│       └── foto_2.jpg
└── Door Unit(CameraWebServer)/
        ├── CameraWebServer2.ino
        ├── app_httpd.cpp
        ├── board_config.h
        ├── camera_index.h
        ├── camera_pins.h
        ├── ci.yml
        └── partitions.csv
```
## Kebutuhan Hardware:
```text
ESP32-S3 WROOM Camera Module

Kabel USB Type-C (untuk upload dan power)

Power supply 5V minimal 1A

Laptop / PC / mini PC untuk menjalankan UniFace

WiFi 2.4 GHz
```

## Software
```text
Python 3.x

Arduino IDE

ESP32 board package

HiveMQ Cloud account
```

## Setup ESP32-S3

1. Buka Arduino IDE.

2. Install board ESP32 dari Board Manager.

3. Buka folder berikut:
```text
iot/DoorUnit(CameraWebServer)/CameraWebServer2.ino
```
4. Pastikan model kamera yang digunakan adalah ESP32S3 WROOM:
```text
#define CAMERA_MODEL_ESP32S3_EYE
```

5. Masukkan SSID dan password WiFi di file .ino:
```text
const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";
```

6. Upload program ke ESP32.

7. Setelah upload selesai, buka Serial Monitor pada baud rate 115200. Jika berhasil, Serial Monitor akan menampilkan IP ESP32-CAM, misalnya:
```text
WiFi Terhubung!
Sistem Siap! Masukkan link ini ke Python: [http://192.168.xx.xx:81/stream](http://192.168.xx.xx:81/stream)
```

## Setup Python Environment
Install dependencies:
```text
pip install -r requirements.txt
```

Isi requirements.txt:
```text
uniface
opencv-python
numpy
paho-mqtt
```
## Setup Database Wajah
Sistem memuat data referensi wajah secara dinamis pada saat program pertama kali dijalankan.

Buat folder dengan nama dataset_wajah di direktori yang sama dengan facerecogdoor.py.

Buat sub-folder menggunakan nama masing-masing individu (contoh: 18223016 Muhammad Daffa Al Ghifari).

Masukkan foto referensi ke dalam sub-folder tersebut. File gambar yang didukung adalah .jpg, .jpeg, dan .png

## Setup HiveMQ MQTT
1. Login ke HiveMQ Cloud.  

2. Buat cluster baru.  

3. Masuk ke bagian Access Management.  

4. Buat credential baru (misal username: daoag dan password: D(#IFQIjfijoqf1).  

5. Berikan permission berikut:
```text
Topic: presensip/facerecogdoor/kelas-01
Permission: Publish and Subscribe
```

## Menjalankan Program
Pastikan virtual environment aktif (jika menggunakan venv).  

Jalankan program:
```text
python facerecogdoor.py
```
Jika berhasil, terminal akan menampilkan informasi seperti:
```text
Menghubungkan ke HiveMQ Cloud...
Terhubung!
Memuat model AI UniFace...
Memuat database wajah...
1 pola wajah 3D termuat!
```
Program akan:

1.Membaca stream dari ESP32-CAM.  

2. Menjalankan model FaceAnalyzer dari UniFace.  

3. Mendeteksi lokasi wajah, melakukan verifikasi Passive Liveness menggunakan MiniFASNet, dan mencocokkan identitas wajah dengan dataset.  

4. Menampilkan bounding box dengan warna hijau untuk wajah asli dan merah untuk wajah palsu/foto.  

5. Mengirim data ke HiveMQ hanya ketika subjek terdeteksi sebagai manusia asli dan identitasnya valid (> 0.45 threshold).  

6. Tekan tombol q pada window OpenCV untuk menghentikan program. 

## Format MQTT
Data yang dikirim ke HiveMQ menggunakan format string log:
```text
Wajah 18223016 Muhammad Daffa Al Ghifari dikenali pada 04/05/2026 09:30:08.
```

## Cara Mengambil Data dari MQTT
Data dapat diambil dengan cara subscribe ke topic MQTT yang sama. Topic yang digunakan
```text
presensip/facerecogdoor/kelas-01
```

## Mengambil Data Menggunakan HiveMQ Web Client
1. Buka HiveMQ Cloud.  

2. Masuk ke cluster.  

3. Buka Web Client.  

4. Connect menggunakan credential yang sudah dibuat.  

5. Gunakan konfigurasi berikut[cite: 15]:
```text
Host: YOUR_HIVEMQ_HOST
    Port: 8884
    Username: YOUR_HIVEMQ_USERNAME
    Password: YOUR_HIVEMQ_PASSWORD
    TLS: Enabled
    ```
6.  Subscribe ke topic[cite: 15]:
    ```text
    presensip/facerecogdoor/kelas-01
    ```
Jika program Python berhasil memverifikasi dan mengenali wajah, log pesan akan muncul di Web Client[cite: 15].
```