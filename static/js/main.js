const imageInput = document.getElementById("imageInput");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const result = document.getElementById("result");
const cameraMessage = document.getElementById("cameraMessage");
const startCamera = document.getElementById("startCamera");
const stopCamera = document.getElementById("stopCamera");

let cameraStream = null;
let webcamTimer = null;
let isProcessing = false;


/* =====================================================
   SEND IMAGE TO FLASK
===================================================== */

async function sendImage(imageData) {

    console.log("sendImage() called");

    if (isProcessing) {
        console.log("Prediction already running...");
        return;
    }

    if (!imageData) {
        console.error("No image data received");
        return;
    }

    isProcessing = true;

    result.innerHTML = `
        <div class="empty-result">
            <div class="empty-icon">⏳</div>
            <p>Detecting...</p>
        </div>
    `;

    try {

        const requestStart = performance.now();

        console.log("Sending request to /api/predict...");

        const response = await fetch("/api/predict", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                model: "yolov8n",
                image: imageData
            })

        });


        console.log(
            "API response status:",
            response.status
        );


        const responseText = await response.text();

        console.log(
            "API response:",
            responseText
        );


        let data = {};

        try {

            if (responseText) {
                data = JSON.parse(responseText);
            }

        } catch (jsonError) {

            console.error(
                "JSON parsing failed:",
                jsonError
            );

            throw new Error(
                "Server returned invalid response"
            );

        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Server error: ${response.status} ${response.statusText}`
            );

        }


        const requestTime =
            (
                performance.now() -
                requestStart
            ) / 1000;


        console.log(
            "Prediction successful:",
            data
        );


        displayResult(
            data,
            requestTime
        );


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );


        result.innerHTML = `

            <div class="empty-result">

                <div class="empty-icon">
                    ❌
                </div>

                <p>
                    Error: ${error.message}
                </p>

            </div>

        `;

    } finally {

        isProcessing = false;

    }

}


/* =====================================================
   DISPLAY RESULT
===================================================== */

function displayResult(data, requestTime) {

    let detectionHTML = "";


    if (
        data.detections &&
        data.detections.length > 0
    ) {

        detectionHTML =
            data.detections
                .map(function(detection) {

                    return `

                        <div class="detection-item">

                            <strong>
                                ${detection.class}
                            </strong>

                            <span>
                                ${detection.confidence}%
                            </span>

                        </div>

                    `;

                })
                .join("");


    } else {

        detectionHTML = `

            <div class="detection-item">

                <span>
                    No hazardous waste detected
                </span>

            </div>

        `;

    }


    result.innerHTML = `

        <img
            class="result-image"
            src="${data.image}"
            alt="Detection Result"
        >


        <div class="stats">

            <div class="stat">

                <span class="stat-title">
                    Objects Detected
                </span>

                <span class="stat-value">
                    ${data.count ?? 0}
                </span>

            </div>


            <div class="stat">

                <span class="stat-title">
                    Inference Time
                </span>

                <span class="stat-value">
                    ${data.inference_time ?? "N/A"}s
                </span>

            </div>


            <div class="stat">

                <span class="stat-title">
                    Total Request Time
                </span>

                <span class="stat-value">
                    ${requestTime.toFixed(3)}s
                </span>

            </div>

        </div>


        <div class="detection-list">

            <h3>
                Detected Objects
            </h3>

            ${detectionHTML}

        </div>

    `;

}


/* =====================================================
   IMAGE UPLOAD
===================================================== */

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function(event) {

            console.log("Image selected");

            const file =
                event.target.files[0];


            if (!file) {

                console.log("No file selected");

                return;

            }


            console.log(
                "Selected file:",
                file.name,
                file.size,
                file.type
            );


            const reader =
                new FileReader();


            reader.onload = function() {

                console.log(
                    "Image converted to Base64"
                );

                sendImage(
                    reader.result
                );

            };


            reader.onerror = function() {

                console.error(
                    "FileReader error"
                );

            };


            reader.readAsDataURL(file);

        }
    );

}


/* =====================================================
   START WEBCAM
===================================================== */

if (startCamera) {

    startCamera.addEventListener(
        "click",
        async function() {

            console.log(
                "Start Webcam clicked"
            );


            try {

                if (!navigator.mediaDevices) {

                    throw new Error(
                        "Camera API is not supported by this browser"
                    );

                }


                cameraStream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({

                            video: true,

                            audio: false

                        });


                console.log(
                    "Camera access granted"
                );


                video.srcObject =
                    cameraStream;


                cameraMessage.style.display =
                    "none";


                if (webcamTimer) {

                    clearInterval(
                        webcamTimer
                    );

                }


                webcamTimer =
                    setInterval(
                        captureFrame,
                        2000
                    );


                console.log(
                    "Webcam detection started"
                );

            } catch (error) {

                console.error(
                    "Webcam error:",
                    error
                );


                alert(
                    "Unable to access webcam: " +
                    error.message
                );

            }

        }
    );

}


/* =====================================================
   CAPTURE WEBCAM FRAME
===================================================== */

function captureFrame() {

    console.log(
        "Capturing webcam frame..."
    );


    if (!cameraStream) {

        console.log(
            "Camera stream not available"
        );

        return;

    }


    if (!video) {

        console.error(
            "Video element not found"
        );

        return;

    }


    if (video.readyState < 2) {

        console.log(
            "Video is not ready"
        );

        return;

    }


    if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
    ) {

        console.log(
            "Invalid video dimensions"
        );

        return;

    }


    canvas.width =
        video.videoWidth;


    canvas.height =
        video.videoHeight;


    const context =
        canvas.getContext("2d");


    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    const imageData =
        canvas.toDataURL(
            "image/jpeg",
            0.60
        );


    console.log(
        "Webcam frame captured"
    );


    sendImage(
        imageData
    );

}


/* =====================================================
   STOP WEBCAM
===================================================== */

if (stopCamera) {

    stopCamera.addEventListener(
        "click",
        function() {

            console.log(
                "Stop Webcam clicked"
            );


            if (webcamTimer) {

                clearInterval(
                    webcamTimer
                );

                webcamTimer = null;

            }


            if (cameraStream) {

                cameraStream
                    .getTracks()
                    .forEach(
                        function(track) {

                            track.stop();

                        }
                    );

                cameraStream = null;

            }


            if (video) {

                video.srcObject =
                    null;

            }


            if (cameraMessage) {

                cameraMessage.style.display =
                    "block";

            }


            console.log(
                "Webcam stopped"
            );

        }
    );

}


/* =====================================================
   PAGE LOADED
===================================================== */

console.log(
    "main.js loaded successfully"
);

console.log(
    "imageInput:",
    imageInput
);

console.log(
    "video:",
    video
);

console.log(
    "canvas:",
    canvas
);

console.log(
    "result:",
    result
);