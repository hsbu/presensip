import cv2
import numpy as np
import paho.mqtt.client as mqtt
import os
import json
from datetime import datetime

# 1. Import Library Uniface 
from uniface import FaceAnalyzer, MiniFASNet

def hitung_kemiripan(emb1, emb2):
    return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))


# 1. Setup MQTT dan Konfigurasi

broker_address = "51ace4ad82c24e15b097f875c5847afa.s1.eu.hivemq.cloud" #connect with mqtt broker for backend client
port = 8883
mqtt_user = "biometric"
mqtt_pass = "Biometric123"

topic_pintu = "presensip/facerecogdoor/kelas-01"
DEVICE_ID = "esp32-bio-01"
ROOM_ID = "kelas-01"

print("Menghubungkan ke HiveMQ Cloud...")
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.username_pw_set(mqtt_user, mqtt_pass)
client.tls_set()
client.connect(broker_address, port, 60)
print("Terhubung ke MQTT Broker!")


# Setup Model AI (Menggunakan UniFace + MiniFASNet)

print("Memuat model AI UniFace...")
# MiniFASNet akan otomatis mendeteksi apakah wajah ini asli atau foto
analyzer = FaceAnalyzer(attributes=[MiniFASNet()])

# Setup Database Wajah
print("Memuat database wajah...")
known_face_embeddings = []
known_face_names = []
dataset_dir = "dataset_wajah"

if not os.path.exists(dataset_dir):
    print(f"Peringatan: Folder '{dataset_dir}' tidak ditemukan. Membuat folder baru...")
    os.makedirs(dataset_dir)
else:
    for nama_orang in os.listdir(dataset_dir):
        folder_orang = os.path.join(dataset_dir, nama_orang)
        if os.path.isdir(folder_orang):
            for nama_file in os.listdir(folder_orang):
                if nama_file.endswith((".jpg", ".png", ".jpeg")):
                    path_foto = os.path.join(folder_orang, nama_file)
                    foto = cv2.imread(path_foto)
                    if foto is not None:
                        faces = analyzer.analyze(foto)
                        if len(faces) > 0 and faces[0].embedding is not None:
                            known_face_embeddings.append(faces[0].embedding)
                            known_face_names.append(nama_orang)
    print(f"{len(known_face_embeddings)} pola wajah referensi termuat!")


# Proses Deteksi Kamera ESP32S3

url_stream = "http://10.171.85.178:81/stream"#URL Stream disesuaikan dengan URL yang diberikan oleh Arduino IDE ketika terhubung ke Wi-Fi
cap = cv2.VideoCapture(url_stream)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

last_name_detected = ""
THRESHOLD_KEMIRIPAN = 0.45

print("Sistem Face Recognition Berjalan...")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Koneksi putus, menyambungkan kembali...")
        cap.release()
        cap = cv2.VideoCapture(url_stream)
        continue
    
    faces = analyzer.analyze(frame)
    current_detected_name = ""
    is_real_human = False
    
    for face in faces:
        name = "Tidak dikenal"
        bbox = face.bbox.astype(int)
        emb = face.embedding
        
        # Anti-Spoofing Logics
        if hasattr(face, 'liveness'):
            status_liveness = str(face.liveness).lower()
            if "real" in status_liveness or "asli" in status_liveness:
                is_real_human = True
        else:
            is_real_human = True 

        # Cocokkan Wajah jika asli
        if emb is not None:
            kemiripan_tertinggi = 0
            best_match_index = -1
            
            for i, known_emb in enumerate(known_face_embeddings):
                score = hitung_kemiripan(emb, known_emb)
                if score > kemiripan_tertinggi:
                    kemiripan_tertinggi = score
                    best_match_index = i
            
            if kemiripan_tertinggi > THRESHOLD_KEMIRIPAN:
                name = known_face_names[best_match_index]
                current_detected_name = name

        x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]

        if is_real_human:
            color = (0, 255, 0)
            status_teks = f"{name} (Asli)"
        else:
            color = (0, 0, 255)
            status_teks = f"{name} (Palsu/Foto)"
            current_detected_name = "" # Abaikan jika palsu

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, status_teks, (x1, y2 + 25), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)

    
    # Kirim Data JSON ke MQTT (Jika Wajah Dikenali & Asli)
  
    if current_detected_name != "" and is_real_human:
        if current_detected_name != last_name_detected:
            now_utc = datetime.utcnow()
            timestamp_iso = now_utc.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
            msg_id = f"bio-{int(now_utc.timestamp() * 1000)}"

            payload = {
                "message_id": msg_id,
                "device_id": DEVICE_ID,
                "room_id": ROOM_ID,
                "timestamp": timestamp_iso,
                "detected_person_name": current_detected_name,
                "status": "recorded",
                "data_type": "biometric"
            }
            
            json_payload = json.dumps(payload)
            result = client.publish(topic_pintu, json_payload, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print("\nData terkirim ke HiveMQ:")
                print(json.dumps(payload, indent=4))
            else:
                print("\nGagal mengirim data ke HiveMQ")

            last_name_detected = current_detected_name

    # Reset nama terakhir jika tidak ada wajah
    if len(faces) == 0:
        last_name_detected = ""

    cv2.imshow("Presensip Face Recognition", frame)
    client.loop(timeout=0.01) 
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
client.disconnect()
cv2.destroyAllWindows()