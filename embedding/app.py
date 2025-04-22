import logging
from PIL import Image
from flask import Flask, request, jsonify
from utils.openai_clip import get_image_embedding

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the Flask app
app = Flask(__name__)


@app.route('/get_image_embedding', methods=['POST'])
def upload_image_api():
    """API endpoint to upload an image and generate its embedding"""
    try:
        # Check if image is provided
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        
        # Validate the file
        if image_file.filename == '':
            return jsonify({'error': 'No image provided'}), 400
        
        # Read and save the image
        image = Image.open(image_file).convert('RGB')
        
        # Generate embedding using OpenAI CLIP
        embedding = get_image_embedding(image)
        
        return jsonify({
            'embedding': embedding
        })
        
    except Exception as e:
        logger.exception("Error uploading image")
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search_similar_api():
    """API endpoint to search for similar images"""
    try:
        # Check if query image is provided
        if 'query_image' not in request.files:
            return jsonify({'error': 'No query image provided'}), 400
        
        query_image_file = request.files['query_image']
        
        # Validate the file
        if query_image_file.filename == '':
            return jsonify({'error': 'No query image provided'}), 400
        
        # Read the image
        query_image = Image.open(query_image_file).convert('RGB')
        
        # Generate embedding using OpenAI CLIP
        query_embedding = get_image_embedding(query_image)
        
        # Find similar images
        limit = int(request.form.get('limit', 5))
        similar_images = find_similar_images(query_embedding, limit=limit)
        
        return jsonify({'similar_images': similar_images})
        
    except Exception as e:
        logger.exception("Error searching for similar images")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v0/swarm/peers', methods=['POST'])
def handle_ipfs_swarm_peers():
    """Handle IPFS swarm peers requests with an empty response"""
    logger.info("Received IPFS swarm peers request")
    return jsonify({
        "Peers": []
    })
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
