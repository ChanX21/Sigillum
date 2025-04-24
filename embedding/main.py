# server.py
from flask import Flask, request, jsonify
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
import base64
from io import BytesIO

app = Flask(__name__)
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

@app.route("/get_image_embedding", methods=["POST"])
def embed():
    data = request.json
    image_data = base64.b64decode(data["image"])
    image = Image.open(BytesIO(image_data))

    inputs = processor(images=image, return_tensors="pt")
    outputs = model.get_image_features(**inputs)
    embedding = outputs[0].tolist()
    return jsonify(embedding=embedding)

app.run(port=5001)
