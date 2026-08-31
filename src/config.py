import os


# Project base directory
BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


# Models directory
MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


# YOLOv8n main model
YOLOV8N_PATH = os.path.join(
    MODEL_DIR,
    "yolov8n_best.pt"
)


# YOLOv8s comparison model
YOLOV8S_PATH = os.path.join(
    MODEL_DIR,
    "yolov8s_best.pt"
)


# Detection confidence
CONFIDENCE_THRESHOLD = float(
    os.getenv(
        "CONFIDENCE_THRESHOLD",
        "0.25"
    )
)


# Maximum image upload size
MAX_UPLOAD_MB = int(
    os.getenv(
        "MAX_UPLOAD_MB",
        "10"
    )
)