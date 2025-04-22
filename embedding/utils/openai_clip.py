"""
Utility module for generating image embeddings using ResNet50 model (alternative to OpenAI CLIP)
"""
import logging
import numpy as np
import torch
from PIL import Image
import torchvision.transforms as transforms
import torchvision.models as models
from sklearn.decomposition import PCA

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the ResNet50 model
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")

# Load ResNet50 model with pre-trained ImageNet weights
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
# Remove the final classification layer to get features
model = torch.nn.Sequential(*list(model.children())[:-1])
model.to(device)
model.eval()

# Define image preprocessing
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                        std=[0.229, 0.224, 0.225]),
])

# Set the final embedding dimension (must be <= 2000 for PostgreSQL pgvector)
EMBEDDING_DIM = 1536

# Initialize a simple dimensionality reduction matrix for consistent embedding size
random_projection_matrix = None
RANDOM_SEED = 42
# Cache for original embeddings (used for direct comparisons)
embedding_cache = {}

def get_image_embedding(image_path_or_object, for_storage=True):
    """
    Generate embedding for an image using ResNet50 model with dimension reduction
    
    Args:
        image_path_or_object: Path to image file or PIL Image object
        for_storage: If True, returns reduced embedding for database storage
                     If False, returns original embedding for direct comparison
        
    Returns:
        list: Vector embedding of the image (reduced to EMBEDDING_DIM dimensions if for_storage=True)
    """
    global random_projection_matrix, embedding_cache
    
    try:
        # Generate a cache key
        if isinstance(image_path_or_object, str):
            cache_key = image_path_or_object
        else:
            # For PIL images, use an internal ID or memory address
            cache_key = str(id(image_path_or_object))
        
        # Check if input is a path or PIL Image
        if isinstance(image_path_or_object, str):
            # Input is a file path
            image = Image.open(image_path_or_object).convert('RGB')
        else:
            # Input is a PIL Image
            image = image_path_or_object.convert('RGB')
        
        # Preprocess the image
        img_tensor = preprocess(image).unsqueeze(0).to(device)
        
        # Extract features
        with torch.no_grad():
            features = model(img_tensor).squeeze()
        
        # Flatten and convert to numpy array
        original_embedding = features.flatten().cpu().numpy()
        
        # Store in cache
        embedding_cache[cache_key] = original_embedding
        
        # If we need the original embedding for direct comparison, return it now
        if not for_storage:
            return original_embedding.tolist()
        
        # Apply dimension reduction - using a fixed random projection for consistency
        if random_projection_matrix is None:
            # Initialize a random projection matrix with fixed seed for reproducibility
            np.random.seed(RANDOM_SEED)
            input_dim = 2048  # ResNet50 feature dimension
            random_projection_matrix = np.random.randn(input_dim, EMBEDDING_DIM) / np.sqrt(EMBEDDING_DIM)
            logger.info(f"Initialized random projection matrix: {input_dim} -> {EMBEDDING_DIM}")
        
        # Project the embedding to lower dimension
        embedding = np.dot(original_embedding, random_projection_matrix)
        
        # Normalize the embedding
        embedding = embedding / np.linalg.norm(embedding)
        
        # Convert to list for database storage
        embedding_list = embedding.tolist()
        
        logger.info(f"Successfully generated embedding with {len(embedding_list)} dimensions")
        return embedding_list
        
    except Exception as e:
        logger.error(f"Error generating image embedding: {str(e)}")
        raise