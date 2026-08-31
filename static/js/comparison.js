const imageInput =
    document.getElementById(
        "comparisonImage"
    );


const compareButton =
    document.getElementById(
        "compareButton"
    );


const resultN =
    document.getElementById(
        "resultN"
    );


const resultS =
    document.getElementById(
        "resultS"
    );


const timeN =
    document.getElementById(
        "timeN"
    );


const timeS =
    document.getElementById(
        "timeS"
    );


const countN =
    document.getElementById(
        "countN"
    );


const countS =
    document.getElementById(
        "countS"
    );


const winner =
    document.getElementById(
        "winner"
    );


let selectedImage = null;


/* ----------------------------------
   IMAGE SELECTION
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

                selectedImage =
                    reader.result;


                compareButton.disabled =
                    false;


                resultN.innerHTML = `
                    <p>
                        Image ready for YOLOv8n
                    </p>
                `;


                resultS.innerHTML = `
                    <p>
                        Image ready for YOLOv8s
                    </p>
                `;

            };


        reader.readAsDataURL(
            file
        );

    }
);


/* ----------------------------------
   RUN MODEL
---------------------------------- */

async function runModel(
    modelName,
    image
) {

    const start =
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
                            modelName,

                        image:
                            image

                    })

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.error ||
            "Prediction failed"
        );

    }


    const totalTime =
        (
            performance.now()
            -
            start
        ) / 1000;


    return {

        ...data,

        totalTime:
            totalTime

    };

}


/* ----------------------------------
   DISPLAY MODEL RESULT
---------------------------------- */

function displayModelResult(
    container,
    data
) {

    container.innerHTML = `

        <img
            src="${data.image}"
            alt="Detection result"
        >

    `;

}


/* ----------------------------------
   COMPARE
---------------------------------- */

compareButton.addEventListener(
    "click",
    async function() {

        if (!selectedImage) {

            return;

        }


        compareButton.disabled =
            true;


        compareButton.textContent =
            "⏳ Comparing...";


        resultN.innerHTML = `
            <p>
                YOLOv8n detecting...
            </p>
        `;


        resultS.innerHTML = `
            <p>
                YOLOv8s detecting...
            </p>
        `;


        try {

            /*
                Run YOLOv8n
            */

            const resultV8n =
                await runModel(
                    "yolov8n",
                    selectedImage
                );


            /*
                Run YOLOv8s
            */

            const resultV8s =
                await runModel(
                    "yolov8s",
                    selectedImage
                );


            /*
                Display results
            */

            displayModelResult(
                resultN,
                resultV8n
            );


            displayModelResult(
                resultS,
                resultV8s
            );


            /*
                Display metrics
            */

            timeN.textContent =
                resultV8n.inference_time
                + " s";


            timeS.textContent =
                resultV8s.inference_time
                + " s";


            countN.textContent =
                resultV8n.count;


            countS.textContent =
                resultV8s.count;


            /*
                Determine faster model
            */

            if (
                resultV8n.inference_time
                <
                resultV8s.inference_time
            ) {

                winner.textContent =
                    "⚡ YOLOv8n is faster for this image.";

            }

            else if (
                resultV8s.inference_time
                <
                resultV8n.inference_time
            ) {

                winner.textContent =
                    "⚡ YOLOv8s is faster for this image.";

            }

            else {

                winner.textContent =
                    "Both models have similar inference time.";

            }


        } catch (error) {

            resultN.innerHTML = `
                <p>
                    ❌ ${error.message}
                </p>
            `;


            resultS.innerHTML = `
                <p>
                    ❌ ${error.message}
                </p>
            `;

        }


        compareButton.disabled =
            false;


        compareButton.textContent =
            "⚖️ Compare Models";

    }
);