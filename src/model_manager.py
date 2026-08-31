import os

from ultralytics import YOLO

from .config import (
    YOLOV8N_PATH,
    YOLOV8S_PATH
)


class ModelManager:

    def __init__(self):

        self.models = {}

        # Load main YOLOv8n model
        self.load_model(
            "yolov8n",
            YOLOV8N_PATH
        )

        # Load YOLOv8s only if available
        if os.path.exists(
            YOLOV8S_PATH
        ):

            self.load_model(
                "yolov8s",
                YOLOV8S_PATH
            )

    def load_model(
        self,
        name,
        path
    ):

        print(
            f"Loading {name}: {path}"
        )

        self.models[name] = YOLO(
            path
        )

        print(
            f"{name} loaded successfully"
        )

    def get(self, name):

        if name not in self.models:

            raise ValueError(
                f"Model '{name}' is not available"
            )

        return self.models[name]

    def available_models(self):

        return list(
            self.models.keys()
        )