
function onOpenCvReady() {
    document.getElementById('status')
        .remove();
}

function logOperationTime(operationName, millisSinceLastOp) {
    let now = (new Date()).getMilliseconds();
    let operationDuration = now - millisSinceLastOp;

    console.log(operationName + " took " + operationDuration + "ms");
    return now;
}

function mapGrandientToValueSmallerThanTen(colors, alpha) {
    return parseInt((colors+alpha)/4.0);
}

function analyseGradientsAndPrintGreaterThan(threshold, imgInput) {
    if (!imgInput.isContinuous()) {
        return;
    }

    let rows = imgInput.rows;
    let cols = imgInput.cols;
    let gradientOutput = cv.Mat.zeros(rows, cols, imgInput.type());

    let allUsedColors = new Map();
    let allUsedColorsCounter = new Map();
    
    let maxbrightnessOfPixel = 0;
    for (let row=0; row < rows; row++) {
        for (let col=0; col < cols; col++) {
            let R = imgInput.ucharAt(row, col * imgInput.channels());
            let G = imgInput.ucharAt(row, col * imgInput.channels() + 1);
            let B = imgInput.ucharAt(row, col * imgInput.channels() + 2);
            let A = imgInput.ucharAt(row, col * imgInput.channels() + 3);

            let brightnessOfPixel = mapGrandientToValueSmallerThanTen(R+G+B, A);
            if (brightnessOfPixel > maxbrightnessOfPixel) {
                maxbrightnessOfPixel = brightnessOfPixel;
            }
        }
    }
    
    for (let row=0; row < rows; row++) {
        for (let col=0; col < cols; col++) {
        
            let R = imgInput.ucharAt(row, col * imgInput.channels());
            let G = imgInput.ucharAt(row, col * imgInput.channels() + 1);
            let B = imgInput.ucharAt(row, col * imgInput.channels() + 2);
            let A = imgInput.ucharAt(row, col * imgInput.channels() + 3);

            // let brightnessOfPixel = R + "," + G + "," + B + "," + A;
            let brightnessOfPixel = mapGrandientToValueSmallerThanTen(R+G+B, A);

            if (brightnessOfPixel / maxbrightnessOfPixel > threshold) {
                gradientOutput.ucharPtr(row, col)[0] = R;
                gradientOutput.ucharPtr(row, col)[1] = G;
                gradientOutput.ucharPtr(row, col)[2] = B;
                gradientOutput.ucharPtr(row, col)[3] = A;
            }
            
            if (allUsedColors.has(brightnessOfPixel)){
                allUsedColors.set(brightnessOfPixel, allUsedColors.get(brightnessOfPixel) + 1);
            }
            else {
                allUsedColors.set(brightnessOfPixel, 1);
            }
        }
    }
    
    for (let color of allUsedColors.keys()){
        allUsedColorsCounter.set(allUsedColors.get(color), color);
    }
        
    console.log(allUsedColorsCounter);
    return gradientOutput;
}

function detectMaxLengthForNumberOfContours(contours, noOfGreatContoursToFind) {
    let contourLengthHistogram = calcContourLengthHistogram(contours);
    let contourMaxLength = calcContourMaxLengthForGreatestContoursOf(noOfGreatContoursToFind, contourLengthHistogram);
    return contourMaxLength;
}

function calcContourMaxLengthForGreatestContoursOf(noOfGreatContoursToFind, contourLengthHistogram) {
    let maxLength = 0;
    let isContourNumberToFindGiven = noOfGreatContoursToFind > 0;
    for (const [cKey, cValue] of contourLengthHistogram.entries()) {
        if (cKey > maxLength)
            maxLength = cKey;
    }

    let contourMaxLengthForGreatestContours = maxLength;
    for (let contourLength = maxLength; contourLength > 0; --contourLength) {
        
        // value not present in histogram
        if (!contourLengthHistogram.has(contourLength)){
            continue;
        }

        // value present; add the contour size to allowed one
        contourMaxLengthForGreatestContours = contourLength;

        // check if number of wanted contours is reached
        noOfGreatContoursToFind = noOfGreatContoursToFind - contourLengthHistogram.get(contourLength);
        //console.log("added contour of length " + contourLength + "\tcontours to find left:" + noOfGreatContoursToFind);
        if (isContourNumberToFindGiven && noOfGreatContoursToFind <= 0) {
            break;
        }
    }

    return contourMaxLengthForGreatestContours;
}

function calcContourLengthHistogram(contours) {
    let contourLengthCount = new Map();
    for (let i = 0; i < contours.size(); i++) {

        let countOfContour = contours.get(i).data.length;

        if (contourLengthCount.has(countOfContour)){
            contourLengthCount.set(countOfContour, contourLengthCount.get(countOfContour) + 1);
        }
        else {
            contourLengthCount.set(countOfContour, 1);
        }
    }
    return contourLengthCount;
}

function drawContoursWithRandomScalar(src, target, noOfContoursToFind, lineThickness, canvasOutputName) {
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    let contourMaxLength = detectMaxLengthForNumberOfContours(contours, noOfContoursToFind);

    // draw contours with random Scalar
    let contourFillCounter = 0;
    for (let i = 0; i < contours.size(); i++) {
        let contourLength = contours.get(i).data.length;
        if (contourLength <= contourMaxLength) {
            continue;
        }
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
        cv.drawContours(target, contours, i, color, lineThickness, cv.LINE_8); // , hierarchy, 100);
        contourFillCounter++;
    }
    console.log(contourFillCounter + " contours were drawn");
    
    cv.imshow(canvasOutputName, target);

    target.delete();
}
