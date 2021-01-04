
figma.ui.onmessage = msg => {
    if (msg.type === 'create-rectangles') {
        const nodes = []

        for (let i = 0; i < msg.count; i++) {
            const rect = figma.createRectangle()
            rect.x = i * 150
            rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }]
            figma.currentPage.appendChild(rect)
            nodes.push(rect)
        }

        figma.currentPage.selection = nodes
        figma.viewport.scrollAndZoomIntoView(nodes)
    }

    figma.closePlugin()
}


// HELPER FUNCTIONS
function clone(val) {
    const type = typeof val;
    if (val === null) {
        return null;
    }
    else if (type === 'undefined' || type === 'number' ||
        type === 'string' || type === 'boolean') {
        return val;
    }
    else if (type === 'object') {
        if (val instanceof Array) {
            return val.map(x => clone(x));
        }
        else if (val instanceof Uint8Array) {
            return new Uint8Array(val);
        }
        else {
            let o = {};
            for (const key in val) {
                o[key] = clone(val[key]);
            }
            return o;
        }
    }
    throw 'unknown';
};

const getBgLayerColors = (fills) => {
    return fills.reduce((acc, curr) => {
        if (curr.type === 'SOLID') {
            acc.push(curr.color)
        } else if (curr.type.startsWith('GRADIENT')) {
            const colors = curr.gradientStops.map(stop => stop.color)
            acc = [...acc, ...colors]
        } else {
            alert(`This feature does not work with images || selection w/o fill || you need to select a layer with at least a gradient or solid fill`)
        }
        return acc;
    }, [])
}

const unNormalizeColors = (colors: { r: number, g: number, b: number }[]) => {
    return colors.map(color => ({
        r: Math.round(color.r * 255),
        g: Math.round(color.g * 255),
        b: Math.round(color.b * 255)
    }));
}

const base16to10 = (num: string) => {

    const translateLetterToNumber = (letterOrNumber) => {
        if (letterOrNumber === 'a' || letterOrNumber === 'A') {
            return '10'
        } else if (letterOrNumber === 'b' || letterOrNumber === 'B') {
            return '11'
        } else if (letterOrNumber === 'c' || letterOrNumber === 'C') {
            return '12'
        } else if (letterOrNumber === 'd' || letterOrNumber === 'D') {
            return '13'
        } else if (letterOrNumber === 'e' || letterOrNumber === 'E') {
            return '14'
        } else if (letterOrNumber === 'f' || letterOrNumber === 'F') {
            return '15'
        } else {
            return letterOrNumber
        }
    }

    let splitNum = num.split("").reverse();
    let result = splitNum.reduce((acc, curr, idx) => {
        const figure = parseInt(translateLetterToNumber(curr)) * Math.pow(16, idx)
        acc += figure;
        return acc
    }, 0);

    return result;
}

const base10to16 = (num: number) => {
    let divisionResult = num;
    let remainderArr = [];

    while (divisionResult !== 0) {
        let divisionRemainder = divisionResult % 16;
        remainderArr.push(divisionRemainder);
        divisionResult = Math.floor(divisionResult / 16)
    }

    remainderArr = remainderArr.map(remainder => {
        switch (remainder) {
            case 10:
                return 'A';
            case 11:
                return 'B';
            case 12:
                return 'C';
            case 13:
                return 'D';
            case 14:
                return 'E';
            case 15:
                return 'F';
            default:
                return remainder.toString();
        }
    })

    return remainderArr.reverse().reduce((acc, curr) => acc + curr, "")
}

const hexToRGBA = (hex, alpha = 0) => {
    const redHex = hex.slice(1, 3);
    const greenHex = hex.slice(3, 5);
    const blueHex = hex.slice(5, 7);

    const redChannel = base16to10(redHex);
    const greenChannel = base16to10(greenHex);
    const blueChannel = base16to10(blueHex);

    console.log('huha', redChannel, greenChannel, blueChannel)

    return {
        r: redChannel / 255,
        g: greenChannel / 255,
        b: blueChannel / 255,
        a: alpha
    }
};

const rgbaToHex = ({ r, g, b }: { r: number, g: number, b: number }) => {
    const redChannel = base10to16(r);
    const greenChannel = base10to16(g);
    const blueChannel = base10to16(b);

    const hexColor = "#" + redChannel + greenChannel + blueChannel
    return hexColor;
}

const lightenHexToRGBA = (hexColor, alpha: number) => {
    const rgb = hexToRGBA(hexColor);

    return {
        r: Math.min(1, rgb.r * 1.1),
        g: Math.min(1, rgb.g * 1.1),
        b: Math.min(1, rgb.b * 1.1),
        a: alpha
    }
}

// const darkenHexToRGBA = (hexColor, alpha: number) => {
//   const rgb = hexToRGBA(hexColor);

//   return {
//     r: Math.max(0, rgb.r * 0.9),
//     g: Math.max(0, rgb.g * 0.9),
//     b: Math.max(0, rgb.b * 0.9),
//     a: alpha
//   }
// }


// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { height: 360 });


figma.on('selectionchange', () => {
    // const newNode = figma.createNodeFromSvg(figma.currentPage.selection.map(node => node.vectorPaths[0])[0].data)
    const bgLayerColors = getBgLayerColors(figma.currentPage.selection[0]['fills']);
    const unNormalizedBgLayerColors = unNormalizeColors(bgLayerColors);
    const hexBgLayerColors = unNormalizedBgLayerColors.map(color => rgbaToHex(color));
    const uniqueColors = [...new Set(hexBgLayerColors)]

    if (uniqueColors.length) {
        figma.ui.postMessage({ type: 'selection-made', isValid: true })
    } else {
        figma.ui.postMessage({ type: 'selection-made', isValid: false })
    }

    figma.ui.postMessage({ type: 'refracted-color-options', colors: uniqueColors })

    console.log(figma.currentPage.selection[0], unNormalizedBgLayerColors, hexBgLayerColors, uniqueColors)
});

const radialTopLeftTx = [0.3572564721107483, 0.16031566262245178, 0.49201685190200806];
const radialBottomRightTx = [-0.16012853384017944, 0.16538913547992706, 0.49651965498924255];

const radialBottomLeftTx = [0.38503000140190125, -0.13427551090717316, 0.6248728632926941];
const radialTopRightTx = [0.16108153760433197, 0.166435107588768, 0.33643829822540283];

const linearTopLeftTx = [0.7149112820625305, 0.32662856578826904, -0.022147150710225105];
const linearBottomRightTx = [-0.3259817957878113, 0.3308306634426117, 0.49701404571533203];

let desiredFill = {
    type: "GRADIENT_RADIAL",
    visible: true,
    opacity: 1,
    blendMode: "NORMAL",
    gradientStops: [
        {
            color: { r: 1, g: 1, b: 1, a: 0.40 },
            position: 0
        },
        {
            color: { r: 1, g: 1, b: 1, a: 0 },
            position: 1
        }
    ],
    gradientTransform: [
        radialTopLeftTx,
        radialBottomRightTx
    ]
};

let desiredStrokeLighterBg = {
    type: "GRADIENT_RADIAL",
    visible: true,
    opacity: 1,
    blendMode: "NORMAL",
    gradientStops: [
        {
            color: { r: 0.40572917461395264, g: 0.6258341670036316, b: 0.7916666865348816, a: 1 },
            position: 0
        },
        {
            color: { r: 0.40392157435417175, g: 0.6274510025978088, b: 0.7921568751335144, a: 0 },
            position: 1
        }
    ],
    gradientTransform: [
        radialTopLeftTx,
        radialBottomRightTx
    ]
};

let desiredStrokeDarkerBg = {
    type: "GRADIENT_RADIAL",
    visible: true,
    opacity: 1,
    blendMode: "NORMAL",
    gradientStops: [
        {
            color: { r: 0.19055557250976562, g: 0.5476345419883728, b: 0.8166666626930237, a: 1 },
            position: 0
        },
        {
            color: { r: 0.1921568661928177, g: 0.5490196347236633, b: 0.8156862854957581, a: 0 },
            position: 1
        }
    ],
    gradientTransform: [
        radialBottomLeftTx,
        radialTopRightTx
    ]
};

let desiredStrokeLightSource = {
    type: "GRADIENT_LINEAR",
    visible: true,
    opacity: 1,
    blendMode: "NORMAL",
    gradientStops: [
        {
            color: { r: 1, g: 1, b: 1, a: 0.90 },
            position: 0
        },
        {
            color: { r: 1, g: 1, b: 1, a: 0 },
            position: 1
        }
    ],
    gradientTransform: [
        linearTopLeftTx,
        linearBottomRightTx
    ]
};

const desiredStrokeWeight = 3;

const desiredEffects = [
    { type: "BACKGROUND_BLUR", radius: 42, visible: true }
]

// const preGlassArray = []

const glassify = (node: SceneNode, lightIntensity: number, lightColor: string, bgColor: string, strokeWeight: number, blur: number) => {

    //change the color of the light at the edge of the stroke facing the light source
    desiredStrokeLightSource.gradientStops[0].color = hexToRGBA(lightColor, lightIntensity / 100);
    //change the alpha (representing the light brightness/intensity) at the edge of the stroke facing the light source
    // desiredStrokeLightSource.gradientStops[0].color.a = lightIntensity / 100;

    //change the color of the light at the edge of the stroke away from the light source
    desiredStrokeLightSource.gradientStops[1].color = hexToRGBA(lightColor);
    //change the color of the light that affects the fill of the shape
    desiredFill.gradientStops[0].color = hexToRGBA(lightColor, 0.40)

    desiredStrokeLighterBg.gradientStops[0].color = lightenHexToRGBA(bgColor, 0);
    desiredStrokeLighterBg.gradientStops[1].color = lightenHexToRGBA(bgColor, 1);

    desiredStrokeDarkerBg.gradientStops[0].color = lightenHexToRGBA(bgColor, 0);
    desiredStrokeDarkerBg.gradientStops[1].color = lightenHexToRGBA(bgColor, 1);

    desiredEffects.find(effect => effect.type === "BACKGROUND_BLUR").radius = blur;

    // const preGlass = {
    //     id: node.id,
    //     fills: node["fills"],
    //     strokes: node["strokes"],
    //     strokeWeight: node["strokeWeight"],
    //     effects: node["effects"]
    // }

    // const hasBeenAddedIndex = preGlassArray.findIndex(preGlass => preGlass.id === node.id)

    // if (hasBeenAddedIndex >= 0) {
    //     preGlassArray[hasBeenAddedIndex] = preGlass;
    // } else {
    //     preGlassArray.push(preGlass);
    // }

    console.log('rubbish?', desiredStrokeLightSource, desiredStrokeLighterBg, desiredStrokeDarkerBg)


    node["fills"] = [desiredFill];
    node["strokes"] = [desiredStrokeLighterBg, desiredStrokeDarkerBg, desiredStrokeLightSource];
    node["strokeWeight"] = strokeWeight;
    node["effects"] = desiredEffects;

}

// const undo = (node: SceneNode) => {
//     const preGlass = preGlassArray.find(preGlass => preGlass.id === node.id);

//     if (preGlass) {
//         node["fills"] = preGlass.fills;
//         node["strokes"] = preGlass.strokes;
//         node["strokeWeight"] = preGlass.strokeWeight;
//         node["effects"] = preGlass.effects;
//     }
// }

figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'glassify') {
        // const nodes: SceneNode[] = [];
        // for (let i = 0; i < msg.count; i++) {
        //   const rect = figma.createRectangle();
        //   rect.x = i * 150;
        //   rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
        //   figma.currentPage.appendChild(rect);
        //   nodes.push(rect);
        // }
        // figma.currentPage.selection = nodes;
        // figma.viewport.scrollAndZoomIntoView(nodes);

        for (let selection of figma.currentPage.selection) {
            glassify(selection, msg.lightIntensity, msg.lightColor, msg.bgColor, msg.strokeWeight, msg.blur);
        }
    }

    // if (msg.type === 'undo') {
    //     for (let selection of figma.currentPage.selection) {
    //         undo(selection);
    //     }
    // }

    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    // figma.closePlugin();
};



