import os

from huggingface_hub import hf_hub_download


# --------------------------------------------------
# Project base directory
# --------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


# --------------------------------------------------
# Local models directory
# --------------------------------------------------

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


# --------------------------------------------------
# Hugging Face private repository
# --------------------------------------------------

HF_REPO_ID = os.getenv(
    "HF_REPO_ID",
    "Arunkumar4747/Hazard-Waste-Models"
)

HF_TOKEN = os.getenv("HF_TOKEN")


# --------------------------------------------------
# Get model path
# --------------------------------------------------

def get_model_path(filename):

    # If HF_TOKEN exists, download/use private
    # Hugging Face model
    if HF_TOKEN:

        return hf_hub_download(
            repo_id=HF_REPO_ID,
            filename=filename,
            token=HF_TOKEN
        )

    # Otherwise use local model
    return os.path.join(
        MODEL_DIR,
        filename
    )


# --------------------------------------------------
# YOLO models
# --------------------------------------------------

YOLOV8N_PATH = get_model_path(
    "yolov8n_best.pt"
)

YOLOV8S_PATH = get_model_path(
    "yolov8s_best.pt"
)


# --------------------------------------------------
# Detection confidence
# --------------------------------------------------

CONFIDENCE_THRESHOLD = float(
    os.getenv(
        "CONFIDENCE_THRESHOLD",
        "0.25"
    )
)


# --------------------------------------------------
# Maximum image upload size
# --------------------------------------------------

MAX_UPLOAD_MB = int(
    os.getenv(
        "MAX_UPLOAD_MB",
        "10"
    )
)