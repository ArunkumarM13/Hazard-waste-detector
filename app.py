import base64
import io
import traceback

from flask import (
    Flask,
    render_template,
    request,
    jsonify
)

from PIL import Image

from src.config import MAX_UPLOAD_MB
from src.model_manager import ModelManager
from src.detector import predict


app = Flask(__name__)


# ==================================================
# MAX UPLOAD SIZE
# ==================================================

app.config["MAX_CONTENT_LENGTH"] = (
    MAX_UPLOAD_MB * 1024 * 1024
)


# ==================================================
# LOAD MODEL MANAGER
# ==================================================

print("========================================")
print("Starting Hazard Waste Detector")
print("========================================")

model_manager = ModelManager()

print("Model manager initialized")

print(
    "Available models:",
    model_manager.available_models()
)


# ==================================================
# HOME
# ==================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# ==================================================
# COMPARISON PAGE
# ==================================================

@app.route("/comparison")
def comparison():

    return render_template(
        "comparison.html"
    )


# ==================================================
# AVAILABLE MODELS
# ==================================================

@app.route("/api/models")
def available_models():

    try:

        return jsonify({

            "models":
                model_manager.available_models()

        })

    except Exception as error:

        print("MODEL LIST ERROR:")
        print(error)

        return jsonify({

            "error":
                str(error)

        }), 500


# ==================================================
# DECODE IMAGE
# ==================================================

def decode_image(data_url):

    if not data_url:

        raise ValueError(
            "Image data is empty"
        )


    # Remove Base64 header
    if "," in data_url:

        data_url = data_url.split(
            ",",
            1
        )[1]


    try:

        raw = base64.b64decode(
            data_url
        )

    except Exception as error:

        raise ValueError(
            "Invalid Base64 image"
        ) from error


    try:

        image = Image.open(
            io.BytesIO(raw)
        ).convert("RGB")

    except Exception as error:

        raise ValueError(
            "Invalid image file"
        ) from error


    return image


# ==================================================
# PREPARE RESPONSE
# ==================================================

def prepare_response(output):

    if "annotated_image" not in output:

        raise ValueError(
            "Prediction output does not contain annotated_image"
        )


    image = Image.fromarray(
        output["annotated_image"]
    )


    buffer = io.BytesIO()


    image.save(
        buffer,
        format="JPEG",
        quality=85,
        optimize=True
    )


    encoded = base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")


    return {

        "detections":
            output.get(
                "detections",
                []
            ),

        "count":
            output.get(
                "count",
                0
            ),

        "inference_time":
            output.get(
                "inference_time",
                0
            ),

        "image":
            "data:image/jpeg;base64,"
            + encoded

    }


# ==================================================
# PREDICTION API
# ==================================================

@app.route(
    "/api/predict",
    methods=["POST"]
)
def predict_api():

    print("")
    print("========================================")
    print("PREDICTION REQUEST RECEIVED")
    print("========================================")


    try:

        # ------------------------------------------
        # READ JSON
        # ------------------------------------------

        data = request.get_json(
            silent=True
        )


        if not data:

            print("ERROR: No JSON data")

            return jsonify({

                "error":
                    "No JSON data received"

            }), 400


        # ------------------------------------------
        # GET MODEL
        # ------------------------------------------

        model_name = data.get(
            "model",
            "yolov8n"
        )


        print(
            "Requested model:",
            model_name
        )


        # ------------------------------------------
        # GET IMAGE
        # ------------------------------------------

        image_data = data.get(
            "image"
        )


        if not image_data:

            print("ERROR: Image missing")

            return jsonify({

                "error":
                    "Image is required"

            }), 400


        print(
            "Image data received"
        )


        # ------------------------------------------
        # LOAD MODEL
        # ------------------------------------------

        print(
            "Getting model..."
        )


        model = model_manager.get(
            model_name
        )


        print(
            "Model obtained successfully"
        )


        # ------------------------------------------
        # DECODE IMAGE
        # ------------------------------------------

        print(
            "Decoding image..."
        )


        image = decode_image(
            image_data
        )


        print(
            "Image size:",
            image.size
        )


        # ------------------------------------------
        # RUN YOLO
        # ------------------------------------------

        print(
            "Starting YOLO prediction..."
        )


        output = predict(
            model,
            image
        )


        print(
            "YOLO prediction completed"
        )


        # ------------------------------------------
        # PREPARE RESPONSE
        # ------------------------------------------

        print(
            "Preparing response..."
        )


        response_data = prepare_response(
            output
        )


        print(
            "Response prepared successfully"
        )


        print(
            "Detected objects:",
            response_data["count"]
        )


        print(
            "========================================"
        )
        print(
            "PREDICTION SUCCESS"
        )
        print(
            "========================================"
        )


        return jsonify(
            response_data
        ), 200


    except Exception as error:

        print("")
        print("========================================")
        print("PREDICTION ERROR")
        print("========================================")

        print(
            "Error:",
            str(error)
        )

        traceback.print_exc()

        print(
            "========================================"
        )


        return jsonify({

            "error":
                str(error)

        }), 500


# ==================================================
# HEALTH CHECK
# ==================================================

@app.route("/health")
def health():

    try:

        models = (
            model_manager.available_models()
        )


        return jsonify({

            "status":
                "healthy",

            "models":
                models

        }), 200


    except Exception as error:

        return jsonify({

            "status":
                "error",

            "error":
                str(error)

        }), 500


# ==================================================
# RUN LOCALLY
# ==================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )