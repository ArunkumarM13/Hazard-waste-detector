import base64
import io

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


# Maximum upload size
app.config[
    "MAX_CONTENT_LENGTH"
] = (
    MAX_UPLOAD_MB
    * 1024
    * 1024
)


# Load YOLO models
model_manager = ModelManager()


# --------------------------------------------------
# MAIN DASHBOARD
# --------------------------------------------------

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# --------------------------------------------------
# MODEL COMPARISON PAGE
# --------------------------------------------------

@app.route("/comparison")
def comparison():

    return render_template(
        "comparison.html"
    )


# --------------------------------------------------
# AVAILABLE MODELS
# --------------------------------------------------

@app.route("/api/models")
def available_models():

    return jsonify({

        "models":
            model_manager.available_models()

    })


# --------------------------------------------------
# DECODE IMAGE
# --------------------------------------------------

def decode_image(data_url):

    if "," in data_url:

        data_url = data_url.split(
            ",",
            1
        )[1]


    raw = base64.b64decode(
        data_url
    )


    return Image.open(
        io.BytesIO(raw)
    ).convert("RGB")


# --------------------------------------------------
# PREPARE RESPONSE
# --------------------------------------------------

def prepare_response(output):

    image = Image.fromarray(
        output["annotated_image"]
    )


    buffer = io.BytesIO()


    image.save(
        buffer,
        format="JPEG",
        quality=90
    )


    encoded = base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")


    return {

        "detections":
            output["detections"],

        "count":
            output["count"],

        "inference_time":
            output["inference_time"],

        "image":
            "data:image/jpeg;base64,"
            + encoded
    }


# --------------------------------------------------
# PREDICTION API
# --------------------------------------------------

@app.route(
    "/api/predict",
    methods=["POST"]
)
def predict_api():

    data = request.get_json(
        silent=True
    ) or {}


    model_name = data.get(
        "model",
        "yolov8n"
    )


    image_data = data.get(
        "image"
    )


    if not image_data:

        return jsonify({

            "error":
                "Image is required"

        }), 400


    try:

        # Get selected model
        model = model_manager.get(
            model_name
        )


        # Convert image
        image = decode_image(
            image_data
        )


        # Run YOLO
        output = predict(
            model,
            image
        )


        # Send result
        return jsonify(
            prepare_response(
                output
            )
        )


    except Exception as error:

        return jsonify({

            "error":
                str(error)

        }), 500


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.route("/health")
def health():

    return jsonify({

        "status":
            "healthy",

        "models":
            model_manager.available_models()

    })


# --------------------------------------------------
# RUN APPLICATION
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )