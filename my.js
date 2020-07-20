
function onOpenCvReady() {
    document.getElementById('status')
        .remove();
}

function logOperationTime(operationName, millisSinceLastOp) {
    let now = (new Date()).getMilliseconds();
    let operationDuration = now - millisSinceLastOp;

    if (operationDuration >= 0) {
        console.log(operationName + " took " + operationDuration + "ms");
    }
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
        
    //console.log(allUsedColorsCounter);
    return gradientOutput;
}

function drawContoursWithRandomScalar(src, target, percentOfContoursToDraw, maxNumberOfContours, lineThickness, canvasOutputName) {
    let contours = findContours(src);
    let contourMaxLength = determineContoursMaxLength(contours, percentOfContoursToDraw, maxNumberOfContours);

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

    console.log(contourFillCounter + " contours drawn (" + contours.size() + " detected)");    
    cv.imshow(canvasOutputName, target);
    target.delete();
}

function findContours(src) {
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    return contours;
}

function determineContoursMaxLength(contours, percentOfContoursToDraw, maxNumberOfContours) {
    let noOfContoursToFind;

    if (percentOfContoursToDraw == 0) {
        noOfContoursToFind = 0;
    }
    else if (maxNumberOfContours == 0 && percentOfContoursToDraw == 1.0) {
        noOfContoursToFind = contours.size() * percentOfContoursToDraw;
    }
    else {
        noOfContoursToFind = Math.min(maxNumberOfContours, contours.size() * percentOfContoursToDraw);
    }

    let contourMaxLength = detectMaxLengthForNumberOfContours(contours, noOfContoursToFind);
    return contourMaxLength;
}

async function drawContoursInnerArea(src, target, percentOfContoursToDraw, maxNumberOfContours, lineThickness, canvasOutputName) {
    let contours = findContours(src);
    let contourMaxLength = determineContoursMaxLength(contours, percentOfContoursToDraw, maxNumberOfContours);

    let contourFillCounter = 0;
    for (let i = 0; i < contours.size(); i++) {
        let contourData = contours.get(i).data32S;
        let contourLength = contourData.length;
        if (contourLength <= contourMaxLength) {
            continue;
        }

        await drawContour(contourData, target, lineThickness, canvasOutputName);
 
        contourFillCounter++;        
        cv.imshow(canvasOutputName, target);
        await sleep(200);
    }

    console.log(contourFillCounter + " contours drawn (" + contours.size() + " detected)");
    target.delete();
}

async function drawContour(contourData, target, lineThickness, canvasOutputName) {
    let R = Math.round(Math.random() * 255);
    let G = Math.round(Math.random() * 255);
    let B = Math.round(Math.random() * 255);
    let A = Math.round(Math.random() * 255);

    let x, y, color,
        x_next, y_next;

    for (let j = 0; j <= contourData.length - 2; j = j + 2) {
        x = contourData[j + 1];
        y = contourData[j];

        target.ucharPtr(x, y)[0] = R;
        target.ucharPtr(x, y)[1] = G;
        target.ucharPtr(x, y)[2] = B;
        target.ucharPtr(x, y)[3] = A;
        color = new cv.Scalar(R, G, B);

        x_next = contourData[(j + 1 + 2) % contourData.length];
        y_next = contourData[(j + 2) % contourData.length];
        cv.line(target, new cv.Point(y, x), new cv.Point(y_next, x_next), color, lineThickness);

        if (j % 7 == 0) {
            await sleep(1);
            cv.imshow(canvasOutputName, target);
        }
    }
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
