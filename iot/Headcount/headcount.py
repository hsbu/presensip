from ultralytics import YOLO
import cv2
import time
from collections import deque
import statistics
import json
import ssl
from datetime import datetime
import os
from dotenv import load_dotenv
import paho.mqtt.client as mqtt

load_dotenv()

ESP32_STREAM_URL = os.getenv("ESP32_STREAM_URL", "http://YOUR_ESP32_CAM_IP:81/stream")

MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT", "8883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "presensip/headcount/kelas-01")

DEVICE_ID = os.getenv("DEVICE_ID", "esp32cam-kelas-01")
ROOM_ID = os.getenv("ROOM_ID", "kelas-01")
SAVE_INTERVAL_SECONDS = int(os.getenv("SAVE_INTERVAL_SECONDS", "300"))

if not MQTT_BROKER or not MQTT_USERNAME or not MQTT_PASSWORD:
    print("Konfigurasi MQTT belum lengkap. Cek file .env")
    exit()

model = YOLO("yolov8n.pt")

cap = cv2.VideoCapture(ESP32_STREAM_URL)

if not cap.isOpened():
    print("Gagal membuka stream ESP32-CAM")
    print(f"URL yang dicoba: {ESP32_STREAM_URL}")
    exit()

mqtt_client = mqtt.Client()
mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
mqtt_client.tls_set(tls_version=ssl.PROTOCOL_TLS)
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
mqtt_client.loop_start()

last_time = time.time()
last_publish_time = 0

count_history = deque(maxlen=30)
stable_count = 0
raw_count = 0

print("Sistem headcount berjalan")
print(f"Stream ESP32-CAM: {ESP32_STREAM_URL}")
print(f"MQTT Broker: {MQTT_BROKER}")
print(f"MQTT Topic: {MQTT_TOPIC}")
print(f"Interval publish: {SAVE_INTERVAL_SECONDS} detik")

while True:
    ret, frame = cap.read()

    if not ret:
        print("Gagal membaca frame")
        time.sleep(1)
        continue

    results = model(frame, conf=0.35, verbose=False)

    person_count = 0

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]

            if label == "person":
                person_count += 1

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2
                )

                cv2.putText(
                    frame,
                    "Person",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 0),
                    2
                )

    raw_count = person_count
    count_history.append(person_count)

    if len(count_history) >= 10:
        stable_count = int(statistics.median(count_history))
    else:
        stable_count = person_count

    current_time = time.time()
    fps = 1 / (current_time - last_time)
    last_time = current_time

    if current_time - last_publish_time >= SAVE_INTERVAL_SECONDS:
        payload = {
            "device_id": DEVICE_ID,
            "room_id": ROOM_ID,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "detected_person_count": raw_count,
            "status": "recorded"
        }

        result = mqtt_client.publish(
            MQTT_TOPIC,
            json.dumps(payload),
            qos=1,
            retain=True
        )

        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print("Data terkirim ke HiveMQ:")
            print(json.dumps(payload, indent=4))
        else:
            print("Gagal mengirim data ke HiveMQ")

        last_publish_time = current_time

    cv2.putText(
        frame,
        f"Jumlah Orang: {raw_count}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 0, 255),
        2
    )

    cv2.putText(
        frame,
        f"FPS: {fps:.2f}",
        (20, 120),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 0, 0),
        2
    )

    cv2.imshow("ESP32-CAM Head Count", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

mqtt_client.loop_stop()
mqtt_client.disconnect()
cap.release()
cv2.destroyAllWindows()