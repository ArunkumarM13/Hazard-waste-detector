const imageInput =
    document.getElementById(
        "imageInput"
    );


const video =
    document.getElementById(
        "video"
    );


const canvas =
    document.getElementById(
        "canvas"
    );


const result =
    document.getElementById(
        "result"
    );


const cameraMessage =
    document.getElementById(
        "cameraMessage"
    );


let cameraStream = null;

let webcamTimer = null;

let isProcessing = false;


/* ----------------------------------
   SEND IMAGE TO FLASK
---------------------------------- */

async function sendImage(
    imageData
) {

    if (isProcessing) {

        return;

    }


    isProcessing = true;


    result.innerHTML = `
        <div class="empty-result">
            <div class="empty-icon">
                ⏳
            </div>

            <p>
                Detecting...
            </p>
        </div>
    `;


    try {

        const requestStart =
            performance.now();


        const response =
            await fetch(
                "/api/predict",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            model:
                                "yolov8n",

                            image:
                                imageData

                        })

                }
            );


 const responseText =
    await response.text();

let data = {};

try {

    data = responseText
        ? JSON.parse(responseText)
        : {};

} catch (error) {

    console.error(
        "Invalid JSON response:",
        responseText
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
                performance.now()
                -
                requestStart
            ) / 1000;


        displayResult(
            data,
            requestTime
        );


    } catch (error) {

        result.innerHTML = `

            <div class="empty-result">

                <div class="empty-icon">
                    ❌
                </div>

                <p>
                    Error:
                    ${error.message}
                </p>

            </div>

        `;

    } finally {

        isProcessing = false;

    }

}


/* ----------------------------------
   DISPLAY RESULT
---------------------------------- */

function displayResult(
    data,
    requestTime
) {

    let detectionHTML = "";


    if (
        data.detections &&
        data.detections.length > 0
    ) {

        detectionHTML =
            data.detections
                .map(
                    detection => `

                        <div
                            class="detection-item"
                        >

                            <strong>
                                ${detection.class}
                            </strong>

                            <span>
                                ${detection.confidence}%
                            </span>

                        </div>

                    `
                )
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
                    ${data.count}
                </span>

            </div>


            <div class="stat">

                <span class="stat-title">
                    Inference Time
                </span>

                <span class="stat-value">
                    ${data.inference_time}s
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


/* ----------------------------------
   IMAGE UPLOAD
---------------------------------- */

imageInput.addEventListener(
    "change",
    function(event) {

        const file =
            event.target.files[0];


        if (!file) {

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            function() {

                sendImage(
                    reader.result
                );

            };


        reader.readAsDataURL(
            file
        );

    }
);


/* ----------------------------------
   START WEBCAM
---------------------------------- */

document
    .getElementById(
        "startCamera"
    )
    .addEventListener(
        "click",
        async function() {

            try {

                cameraStream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({

                            video: true,

                            audio: false

                        });


                video.srcObject =
                    cameraStream;


                cameraMessage.style.display =
                    "none";


                /*
                    Capture one frame
                    every 1 second.
                */

                webcamTimer =
                    setInterval(
                        captureFrame,
                        1000
                    );


            } catch (error) {

                alert(
                    "Unable to access webcam: "
                    +
                    error.message
                );

            }

        }
    );


/* ----------------------------------
   CAPTURE WEBCAM FRAME
---------------------------------- */

function captureFrame() {

    if (
        !cameraStream ||
        video.readyState < 2
    ) {

        return;

    }


    canvas.width =
        video.videoWidth;


    canvas.height =
        video.videoHeight;


    const context =
        canvas.getContext(
            "2d"
        );


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
            0.75
        );


    sendImage(
        imageData
    );

}


/* ----------------------------------
   STOP WEBCAM
---------------------------------- */

document
    .getElementById(
        "stopCamera"
    )
    .addEventListener(
        "click",
        function() {

            clearInterval(
                webcamTimer
            );


            webcamTimer = null;


            if (cameraStream) {

                cameraStream
                    .getTracks()
                    .forEach(
                        track => {
                            track.stop();
                        }
                    );

                cameraStream = null;

            }


            video.srcObject =
                null;


            cameraMessage.style.display =
                "block";

        }
    );