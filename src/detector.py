import time

import numpy as np

from PIL import Image

from .config import (
    CONFIDENCE_THRESHOLD
)


def predict(
    model,
    image,
    conf=CONFIDENCE_THRESHOLD
):

    # Convert PIL image to NumPy
    if isinstance(
        image,
        Image.Image
    ):

        image = np.array(
            image.convert("RGB")
        )


    # Start timer
    start_time = time.perf_counter()


    # YOLO prediction
    results = model.predict(
        source=image,
        conf=conf,
        verbose=False
    )


    # Calculate inference time
    inference_time = (
        time.perf_counter()
        - start_time
    )


    result = results[0]


    detections = []


    names = result.names


    # Read detected objects
    if result.boxes is not None:

        for box in result.boxes:

            class_id = int(
                box.cls[0]
            )

            confidence = float(
                box.conf[0]
            )


            detections.append({

                "class":
                    names[class_id],

                "confidence":
                    round(
                        confidence * 100,
                        2
                    ),

                "box":
                    [
                        round(
                            float(value),
                            2
                        )

                        for value in
                        box.xyxy[0].tolist()
                    ]
            })


    # Draw bounding boxes
    annotated_image = result.plot()


    return {

        "detections":
            detections,

        "count":
            len(detections),

        "inference_time":
            round(
                inference_time,
                4
            ),

        "annotated_image":
            annotated_image
    }