from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import base64
import io
import cv2
import numpy as np
import insightface
from modules.person import detect_person, visulize_person

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageRequest(BaseModel):
    image: str  # Base64 encoded image

@app.post("/v1/person_detection")
async def detect_and_visualize(request: ImageRequest):
    try:
        image_data = base64.b64decode(request.image.split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Detect person and get bounding boxes
        bboxes, vbboxes = detect_person(img)
        
        # Visualize detection results
        output_img = visulize_person(img.copy(), bboxes, vbboxes)
        
        # Convert the output image to bytes
        is_success, buffer = cv2.imencode(".jpg", output_img)
        if not is_success:
            raise HTTPException(status_code=500, detail="Failed to encode output image")
        
        # Convert to base64 for response
        img_base64 = base64.b64encode(buffer.tobytes()).decode()
        return {
            "status": "succeeded",
            "output": f"data:image/jpeg;base64,{img_base64}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/person_detection/{prediction_id}")
async def get_prediction(prediction_id: str):
    # Since we're not implementing actual prediction storage,
    # this endpoint will return a 404
    raise HTTPException(status_code=404, detail="Prediction not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
