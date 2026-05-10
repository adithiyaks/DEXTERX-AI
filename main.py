from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import json
from datetime import datetime
import pdfplumber
import spacy
import io
import re
import tempfile
import os
from vision_engine import process_cctv_footage # Importing your new modular microservice

# Initialize the classical NLP model (This is what you point out to the judges)
nlp = spacy.load("en_core_web_sm")

# Initialize FastAPI App
app = FastAPI(title="DEXTERX AI Forensic API")

# CRITICAL FOR HACKATHONS: Configure CORS so Next.js can communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"], # Support both common ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Featherless Client
client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key="rc_73638273c69714a175dff56fd4c69af0c745b378aaff5ab76157cce311317f7d" # Make sure to replace this!
)

FAST_FALLBACK_MODELS = [
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Llama-3.1-8B-Instruct",
]

def call_featherless_chat(messages, max_tokens: int, response_format=None, timeout: float = 60.0):
    last_error = None

    for model in FAST_FALLBACK_MODELS:
        try:
            request_kwargs = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.0,
                "timeout": timeout,
            }

            if response_format is not None:
                request_kwargs["response_format"] = response_format

            response = client.chat.completions.create(**request_kwargs)
            message = response.choices[0].message

            if not message or message.content is None:
                raise HTTPException(status_code=500, detail="AI returned an empty response.")

            return response, message.content.strip(), model
        except Exception as exc:
            last_error = exc
            print(f"AI request failed for {model}: {str(exc)}")

    raise HTTPException(status_code=502, detail=f"AI request failed after retries: {str(last_error)}")

# Define the input data structure
class ReportRequest(BaseModel):
    report_text: str

# Internal Function: The Advanced Deterministic Logic
def calculate_tod_internally(tod_data: dict) -> dict:
    risk_flags = []
    
    # Extract data with graceful fallbacks
    body_temp_f = tod_data.get("body_temp_f")
    ambient_temp_f = tod_data.get("ambient_temp_f")
    rigor_mortis = tod_data.get("rigor_mortis") or "none"
    livor_mortis = tod_data.get("livor_mortis") or "none"
    last_known_alive = tod_data.get("last_known_alive")

    # Fallback Logic: If body temp is missing, we cannot run the math
    if body_temp_f is None:
        return {
            "status": "Skipped",
            "reason": "Insufficient data (Missing Body Temperature) to calculate Time of Death.",
            "investigative_flags": risk_flags
        }

    # Fallback Logic: If ambient is missing, assume 72.0F and flag it
    if ambient_temp_f is None:
        ambient_temp_f = 72.0
        risk_flags.append("WARNING: Ambient temperature not found in report. Assumed standard 72.0°F.")

    anomaly_score = 0
    max_possible_hours = float('inf')

    # 1. Chronological Baseline Check
    if last_known_alive:
        try:
            last_alive_dt = datetime.fromisoformat(last_known_alive)
            # Mock current time for the hackathon context
            current_time = datetime.fromisoformat("2026-05-09T16:00:00") 
            max_possible_hours = (current_time - last_alive_dt).total_seconds() / 3600
        except ValueError:
            risk_flags.append("WARNING: Invalid timestamp format for last seen alive. Skipping timeline contradiction check.")

    # 2. Algor Mortis (Temperature) with Environmental Calibration
    temp_diff = 98.4 - body_temp_f
    
    # Edge Case A: Hyperthermia or Antemortem Struggle
    if body_temp_f > 98.6:
        anomaly_score += 20
        risk_flags.append("Body temp exceeds normal baseline. Possible hyperthermia, infection, or intense antemortem struggle.")
        hours_since_death = 0.5
        
    # Edge Case B: Environmental Equilibrium (The Glaister Limit)
    elif abs(body_temp_f - ambient_temp_f) < 2.0:
        anomaly_score += 15
        risk_flags.append("Body has reached ambient temperature equilibrium. Standard cooling equations are invalid. TOD > 24 hours.")
        hours_since_death = 24.0
        
    else:
        # Dynamic Cooling Rate based on extreme ambient temps
        if ambient_temp_f < 50.0:
            cooling_rate = 2.0  # Cools faster in cold
            risk_flags.append("Cold environment detected: Accelerated cooling rate applied.")
        elif ambient_temp_f > 85.0:
            cooling_rate = 1.0  # Cools slower in heat
            risk_flags.append("Hot environment detected: Decelerated cooling rate applied.")
        else:
            cooling_rate = 1.5  # Standard rate
            
        hours_since_death = max(0, temp_diff / cooling_rate)

    # 3. Chronological Integrity Check
    if max_possible_hours != float('inf') and hours_since_death > max_possible_hours:
        anomaly_score += 50
        risk_flags.append(f"TIMELINE CONTRADICTION: Estimated TOD ({round(hours_since_death, 1)} hrs ago) is BEFORE the subject was last seen alive ({round(max_possible_hours, 1)} hrs ago).")

    # 4. Rigor Mortis Cross-Reference Matrix
    if rigor_mortis == "none" and hours_since_death > 6 and ambient_temp_f > 60:
        anomaly_score += 30
        risk_flags.append("Suspicious: Rigor Mortis absent despite timeline suggesting it should be developing.")
    elif rigor_mortis == "full" and hours_since_death < 4:
        anomaly_score += 40
        risk_flags.append("Anomaly: Full Rigor Mortis present unusually early. Possible Cadaveric Spasm or extreme physical exertion prior to death.")
    elif rigor_mortis == "passing" and hours_since_death < 24:
        anomaly_score += 45
        risk_flags.append("Impossible Physiology: Rigor Mortis is passing, but body temperature indicates death < 24 hours ago. Suspect postmortem body manipulation.")

    # 5. Livor Mortis Cross-Reference Matrix
    if livor_mortis == "fixed" and hours_since_death < 6:
        anomaly_score += 35
        risk_flags.append("Anomaly: Livor Mortis fixed unusually early. Consider specific toxins (e.g., carbon monoxide) or pre-existing circulatory conditions.")
    elif livor_mortis == "none" and hours_since_death > 4:
        anomaly_score += 25
        risk_flags.append("Suspicious: No Livor Mortis observed despite timeline. Was the body suspended or constantly moved?")

    # 6. Final Scoring & Formatting
    anomaly_score = min(100, anomaly_score)
    confidence = max(10, 95 - (anomaly_score * 0.8))
    risk_level = "CRITICAL" if anomaly_score >= 60 else "High" if anomaly_score >= 40 else "Medium" if anomaly_score >= 20 else "Low"
    margin = 1.5 if hours_since_death < 12 else 3.0

    return {
        "status": "Calculated",
        "estimated_hours_elapsed": round(hours_since_death, 1),
        "estimated_window": f"{max(0, round(hours_since_death - margin, 1))} to {round(hours_since_death + margin, 1)} hours ago",
        "anomaly_score": anomaly_score,
        "risk_level": risk_level,
        "investigative_flags": risk_flags,
        "confidence_score": round(confidence, 1)
    }

# THE OMNI-AWARE SYSTEM PROMPT
OMNI_SYSTEM_INSTRUCTION = """
You are an elite forensic, legal, and digital AI intelligence engine (DEXTERX AI). Analyze the provided crime scene document, autopsy, or FIR.
Extract the core details and return them STRICTLY as a JSON object matching this exact structure:

{
    "document_category": "AUTOPSY", "FIR", or "OMNI_SCENE",
    "probable_cause": "Core incident, cause of death, or main criminal charge",
    "injury_patterns": ["List of physical injuries. Leave empty if FIR."],
    "medical_observations": ["Medical notes. Leave empty if FIR."],
    "entities_involved": ["List of suspects, victims, officers, and organizations."],
    "legal_evidence": ["List of physical evidence, documents, or weapons."],
    "tod_metrics": {
        "body_temp_f": float or null,
        "ambient_temp_f": float or null,
        "rigor_mortis": "none", "developing", "full", "passing", or null,
        "livor_mortis": "none", "unfixed", "fixed", or null,
        "last_known_alive": "ISO 8601 datetime string" or null
    },
    "digital_correlation": {
        "nodes": [
            {"id": "String (e.g., V_PHONE)", "group": "victim", "label": "Short Display Name", "metadata": "Short detail"}
        ],
        "links": [
            {"source": "Node ID", "target": "Node ID", "value": 1, "type": "Connection description"}
        ]
    },
    "base_risk_score": integer between 0 and 100,
    "case_insights": ["3 to 4 strategic, high-level AI insights for the detective connecting the physical and digital evidence"]
}

CRITICAL RULE FOR DIGITAL CORRELATION: Infer the network of devices, people, and locations mentioned in the text. If a phone pings near a CCTV camera, create nodes for both and link them. If no digital evidence exists, return empty arrays for nodes and links.
DO NOT wrap the output in markdown code blocks. Return ONLY the raw JSON string.
"""

# Text Input Endpoint
@app.post("/api/analyze-report")
async def analyze_report(request: ReportRequest):
    try:
        _, raw_output, model_used = call_featherless_chat(
            messages=[
                {"role": "system", "content": OMNI_SYSTEM_INSTRUCTION},
                {"role": "user", "content": f"Analyze this report:\n\n{request.report_text}"}
            ],
            max_tokens=2000,
            response_format={"type": "json_object"},
            timeout=60.0,
        )
        print(f"AI RESPONSE RECEIVED SUCCESSFULLY FROM {model_used}.")

        # --- NEW CLEANING LOGIC: Strip markdown and filler ---
        # 1. Remove markdown backticks
        raw_output = raw_output.replace("```json", "").replace("```", "").strip()
        
        # 2. Extract ONLY the JSON object (finds the first '{' and last '}')
        start_idx = raw_output.find('{')
        end_idx = raw_output.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            raw_output = raw_output[start_idx:end_idx+1]
        else:
            raise HTTPException(status_code=500, detail="AI response did not contain a valid JSON object.")
        # -----------------------------------------------------

        try:
            structured_data = json.loads(raw_output)
            tod_data = structured_data.get("tod_metrics", {})
            
            if tod_data and tod_data.get("body_temp_f") is not None:
                tod_results = calculate_tod_internally(tod_data)
                structured_data["tod_estimation"] = tod_results
                
                # AGGREGATE THE RISK
                math_anomaly = tod_results.get("anomaly_score", 0)
                ai_risk = structured_data.get("base_risk_score", 0)
                structured_data["overall_risk_score"] = min(100, max(math_anomaly, ai_risk) + 15)
            else:
                structured_data["tod_estimation"] = {
                    "status": "Skipped",
                    "reason": "Non-biological document detected. Time of death calculations bypassed.",
                    "investigative_flags": []
                }
                structured_data["overall_risk_score"] = structured_data.get("base_risk_score", 0)
                
            return structured_data
            
        except json.JSONDecodeError:
            print("FAILED TO PARSE JSON. RAW OUTPUT WAS:")
            print(raw_output)
            raise HTTPException(status_code=500, detail="AI returned malformed data. Please try again.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Hardcoded Correlation Demo (Kept just in case you want to hit it separately later)
@app.get("/api/correlate-evidence")
async def correlate_evidence():
    nodes = [
        {"id": "V_PHONE", "group": "victim", "label": "Victim's Mobile", "metadata": "Last ping: 22:45"},
        {"id": "TOWER_4", "group": "infrastructure", "label": "Cell Tower (Sector 4)", "metadata": "Radius: 2km"},
        {"id": "CCTV_MAIN", "group": "evidence", "label": "CCTV (Main St)", "metadata": "Timestamp: 22:47"},
        {"id": "SUSPECT_CAR", "group": "suspect", "label": "Unregistered SUV", "metadata": "License Plate Match: 88%"}
    ]
    links = [
        {"source": "V_PHONE", "target": "TOWER_4", "value": 1, "type": "Spatial Proximity"},
        {"source": "TOWER_4", "target": "CCTV_MAIN", "value": 2, "type": "Network Handshake"},
        {"source": "CCTV_MAIN", "target": "SUSPECT_CAR", "value": 3, "type": "Temporal Match (CRITICAL)"},
        {"source": "V_PHONE", "target": "SUSPECT_CAR", "value": 3, "type": "Inferred Trajectory"}
    ]
    return {"status": "Correlated", "nodes": nodes, "links": links}


from fastapi import Form # Make sure this is imported at the top!

@app.post("/api/process-cctv")
async def process_cctv(file: UploadFile = File(...), report_text: str = Form(None)):
    filename = file.filename or ""
    if not filename.lower().endswith('.mp4'):
        raise HTTPException(status_code=400, detail="Only MP4 videos are supported.")

    # 1. Save the uploaded video temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        content = await file.read()
        temp_video.write(content)
        temp_path = temp_video.name

    try:
        # 2. Run the YOLOv8 Vision Engine
        print("RUNNING YOLOv8 VISION ENGINE...")
        yolo_log = process_cctv_footage(temp_path)
        print("YOLO EXTRACTION COMPLETE:\n", yolo_log)

        # 3. THE IRONCLAD MERGE PROMPT
        # We explicitly lock down how the AI should handle the two conflicting data types.

        # Protect against frontend sending "undefined" or empty strings
        safe_report_text = report_text if report_text and report_text.strip() not in ["", "undefined", "null"] else "No biological or field text provided. Base your analysis purely on the video logs."

        combined_prompt = f"""
        TASK: You are DEXTERX AI. You are receiving two simultaneous data streams. You must fuse them into a SINGLE, perfect JSON object.

        --- DATA STREAM : FIELD REPORT (Biological & Legal) ---
        {safe_report_text}

        --- DATA STREAM 2: YOLOv8 CCTV VISION LOGS (Digital & Spatial) ---
        {yolo_log}

        EXECUTION RULES:
        1. Read STREAM 1 to fill out `probable_cause`, `injury_patterns`, `tod_metrics`, and `entities_involved`.
        2. Read STREAM 2 to build the `digital_correlation` nodes and links. If STREAM 2 shows a 'car' and 'person', create nodes for them and link them to the camera.
        3. Cross-reference the timestamps in STREAM 1 with STREAM 2 to generate the `case_insights`.
        4. Output ONLY raw JSON. Do not add any conversational text, prefixes, or markdown formatting.
        """

        print("SENDING MERGED DATA TO AI ENGINE...")

        _, raw_output, model_used = call_featherless_chat(
            messages=[
                {"role": "system", "content": OMNI_SYSTEM_INSTRUCTION},
                {"role": "user", "content": combined_prompt}
            ],
            max_tokens=1800,
            response_format={"type": "json_object"},
            timeout=60.0,
        )
        print(f"AI RESPONSE RECEIVED SUCCESSFULLY FROM {model_used}.")

        # 4. Clean the JSON output
        clean_text = re.sub(r"```json", "", raw_output, flags=re.IGNORECASE)
        clean_text = re.sub(r"```", "", clean_text)
        
        start_idx = clean_text.find('{')
        end_idx = clean_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_string = clean_text[start_idx:end_idx+1]
        else:
            raise HTTPException(status_code=500, detail="AI response did not contain a valid JSON object.")

        # 5. Parse JSON and Re-Enable the Math Engine!
        try:
            structured_data = json.loads(json_string)
            tod_data = structured_data.get("tod_metrics", {})
            
            # We must run the biological math because the user provided text!
            if tod_data and tod_data.get("body_temp_f") is not None:
                tod_results = calculate_tod_internally(tod_data)
                structured_data["tod_estimation"] = tod_results
                
                math_anomaly = tod_results.get("anomaly_score", 0)
                ai_risk = structured_data.get("base_risk_score", 0)
                structured_data["overall_risk_score"] = min(100, max(math_anomaly, ai_risk) + 15)
            else:
                structured_data["tod_estimation"] = {
                    "status": "Skipped",
                    "reason": "Missing biological metrics. Time of death calculations bypassed.",
                    "investigative_flags": []
                }
                structured_data["overall_risk_score"] = structured_data.get("base_risk_score", 0)
                
            return structured_data

        except json.JSONDecodeError as e:
            print(f"JSON DECODE ERROR: {str(e)}\nSTRING WAS: {json_string}")
            
            # THE HACKATHON LIFESAVER: Return a safe fallback instead of crashing
            print("CRASH AVOIDED: Returning Fallback Data to Frontend.")
            return {
                "document_category": "OMNI_SCENE",
                "probable_cause": "SYSTEM ERROR: AI Engine timed out or returned incomplete data.",
                "injury_patterns": ["Data stream interrupted."],
                "medical_observations": ["Check API connection."],
                "entities_involved": ["SYSTEM_ERROR"],
                "legal_evidence": ["N/A"],
                "tod_metrics": {},
                "digital_correlation": {"nodes": [], "links": []},
                "base_risk_score": 0,
                "overall_risk_score": 0,
                "case_insights": ["CRITICAL ERROR: Language Model connection timed out. Please use a faster model or check network stability."],
                "tod_estimation": {
                    "status": "Failed",
                    "reason": "AI parsing failure.",
                    "investigative_flags": []
                }
            }

    except Exception as e:
        print(f"GENERAL ENDPOINT ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# Health check endpoint
@app.get("/")
async def root():
    return {"status": "DEXTERX AI Engine is Online"}