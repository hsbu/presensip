import cv2
import numpy as np
import paho.mqtt.client as mqtt
import os
from datetime import datetime

# 1. Import Library Uniface
from uniface import FaceAnalyzer, MiniFASNet 

# Fungsi matematika Cosine Similarity untuk mencocokkan wajah (Standar Industri AI)
def hitung_kemiripan(emb1, emb2):
    return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))


# 1. Setup MQTT dan Konfigurasi

broker_address = "0fe959fe2ba84c5d985711bda11c7ed3.s1.eu.hivemq.cloud" # Sesuaikan dengan Broker yang nantinya akan dipakai
port = 8883 
mqtt_user = "daoag" 
mqtt_pass = "D(#IFQIjfijoqf1" 
topic_pintu = "presensip/facerecogdoor/kelas-01" 

print("Menghubungkan ke HiveMQ Cloud...")
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.username_pw_set(mqtt_user, mqtt_pass)
client.tls_set() 
client.connect(broker_address, port, 60)
print("Terhubung!")


# 2. Setup UNIFACE (Deteksi + Identitas + Anti-Foto)
print("Memuat model AI UniFace...")

# FaceAnalyzer otomatis memuat YOLO/SCRFD (Detektor) & ArcFace (Pengenal Wajah).
# Kita selipkan MiniFASNet ke dalam "attributes" untuk mengaktifkan Passive Liveness!
analyzer = FaceAnalyzer(attributes=[MiniFASNet()])


# 3. Setup Database Wajah

print("Memuat database wajah...")
known_face_embeddings = []
known_face_names = []
dataset_dir = "dataset_wajah"

for nama_orang in os.listdir(dataset_dir):
    folder_orang = os.path.join(dataset_dir, nama_orang)
    if os.path.isdir(folder_orang):
        for nama_file in os.listdir(folder_orang):
            if nama_file.endswith((".jpg", ".png", ".jpeg")):
                path_foto = os.path.join(folder_orang, nama_file)
                foto = cv2.imread(path_foto)
                if foto is not None:
                    # Minta UniFace menganalisis foto dataset
                    faces = analyzer.analyze(foto)
                    if len(faces) > 0 and faces[0].embedding is not None:
                        known_face_embeddings.append(faces[0].embedding)
                        known_face_names.append(nama_orang)

print(f" {len(known_face_embeddings)} pola wajah 3D termuat!")


# 4. Proses Deteksi Kamera ESP32S3

url_stream = "http://192.168.18.147:81/stream"
cap = cv2.VideoCapture(url_stream)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) 

last_name_detected = ""
# Ambang batas ArcFace biasanya di 0.4 sampai 0.5. Makin tinggi makin ketat.
THRESHOLD_KEMIRIPAN = 0.45  


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
        name = "Tidak dikenal!"
     
        bbox = face.bbox.astype(int) 
        emb = face.embedding         
        
     
        
        if hasattr(face, 'liveness'):
            status_liveness = str(face.liveness).lower()
            if "real" in status_liveness or "asli" in status_liveness:
                is_real_human = True
        else:
          
            is_real_human = True 

      
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
            current_detected_name = "" 

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, status_teks, (x1, y2 + 25), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)

    # Kirim Data ke MQTT
    if current_detected_name != "" and is_real_human:
        if current_detected_name != last_name_detected:
            waktu_lengkap = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            pesan = f"Wajah {current_detected_name} dikenali pada {waktu_lengkap}."
            
            client.publish(topic_pintu, pesan)
            print(f"MQTT TERKIRIM: {pesan}")
            
            last_name_detected = current_detected_name

    if current_detected_name == "":
        last_name_detected = ""

    cv2.imshow("Presensip Face Recognition", frame)
    client.loop()
    if cv2.waitKey(1) & 0xFF == ord('q'): break

cap.release()
cv2.destroyAllWindows()