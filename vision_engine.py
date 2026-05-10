import cv2
import math
import os
from ultralytics import YOLO

# Load the pre-trained COCO dataset model automatically
vision_model = YOLO('yolov8n.pt') 

def process_cctv_footage(video_path: str) -> str:
    """
    Ingests an MP4 file, processes 1 frame per second through YOLOv8,
    and returns a formatted text log of detected entities.
    """
    cap = cv2.VideoCapture(video_path)
    
    # Fallback to 30 FPS if video metadata is missing
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    if fps == 0: 
        fps = 30.0
        
    cctv_log = "--- AUTOMATED CCTV VISION LOG (YOLOv8) ---\n"
    frame_count = 0
    detected_timeline = {}

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break
            
        # Process 1 frame every second to save compute time
        if frame_count % math.ceil(fps) == 0:
            timestamp_sec = int(frame_count / fps)
            
            # Run the neural network
            results = vision_model(frame, verbose=False)
            
            detected_objects = []
            for r in results:
                for box in r.boxes:
                    class_id = int(box.cls[0])
                    class_name = vision_model.names[class_id]
                    confidence = math.ceil((box.conf[0]*100)) / 100
                    
                    # Confidence threshold: Only log if we are 60%+ sure
                    if confidence > 0.60:
                        detected_objects.append(f"{class_name} ({confidence*100}%)")
            
            if detected_objects:
                # Group detections by timestamp
                time_str = f"00:{str(timestamp_sec).zfill(2)}"
                detected_timeline[time_str] = list(set(detected_objects))

        frame_count += 1
        
    cap.release()
    
    # Format the dictionary into a chronological text log
    for time_str, objects in detected_timeline.items():
        cctv_log += f"[{time_str}] Detected Entities: {', '.join(objects)}\n"
        
    return cctv_log