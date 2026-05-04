HTTP ingestion endpoint for IoT devices

POST /api/iot/ingest
- Header: `x-api-key: <IOT_API_KEY>` or `?api_key=` query
- Body (JSON):
```
{
  "session_id": "FIRESTORE_SESSION_DOC_ID",  // optional if room_id maps to classrooms/{room_id}/activeSession
  "device_id": "esp32cam-kelas-01",
  "room_id": "kelas-01",
  "timestamp": "2026-05-03 18:30:00",
  "detected_person_count": 41,
  "status": "recorded",
  "data_type": "biometric"  // optional: 'biometric' or 'headcount'
}
```

Example curl:

```bash
curl -X POST http://localhost:3001/api/iot/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: replace_with_key" \
  -d '{"device_id":"esp32cam-kelas-01","room_id":"kelas-01","timestamp":"2026-05-03T18:30:00","detected_person_count":25,"status":"recorded","data_type":"headcount"}'
```

Python example (requests):

```python
import requests
url = 'http://YOUR_BACKEND:3001/api/iot/ingest'
headers = {'x-api-key': 'replace_with_key'}
payload = {
  'device_id': 'esp32cam-kelas-01',
  'room_id': 'kelas-01',
  'timestamp': '2026-05-03T18:30:00',
  'detected_person_count': 25,
  'status': 'recorded',
  'data_type': 'headcount'
}
resp = requests.post(url, json=payload, headers=headers)
print(resp.status_code, resp.json())
```
