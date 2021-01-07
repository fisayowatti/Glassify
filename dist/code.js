/******/ (() => { // webpackBootstrap
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
// figma.ui.onmessage = msg => {
//     if (msg.type === 'create-rectangles') {
//         const nodes = []
//         for (let i = 0; i < msg.count; i++) {
//             const rect = figma.createRectangle()
//             rect.x = i * 150
//             rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }]
//             figma.currentPage.appendChild(rect)
//             nodes.push(rect)
//         }
//         figma.currentPage.selection = nodes
//         figma.viewport.scrollAndZoomIntoView(nodes)
//     }
//     figma.closePlugin()
// }
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
figma.showUI(__html__, { height: 490 });
//When plugin launches deselect all selections
figma.currentPage.selection = [];
figma.on('selectionchange', () => {
    //if there is no valid selection on selection change do nothing;
    if (!figma.currentPage.selection[0])
        return;
    const bgLayerColors = getBgLayerColors(figma.currentPage.selection[0]['fills']);
    const unNormalizedBgLayerColors = unNormalizeColors(bgLayerColors);
    const hexBgLayerColors = unNormalizedBgLayerColors.map(color => rgbaToHex(color));
    const uniqueColors = [...new Set(hexBgLayerColors)];
    if (uniqueColors.length) {
        figma.ui.postMessage({ type: 'selection-made', isValid: true });
    }
    else {
        figma.ui.postMessage({ type: 'selection-made', isValid: false });
    }
    figma.ui.postMessage({ type: 'refracted-color-options', colors: uniqueColors });
    console.log(figma.currentPage.selection[0], unNormalizedBgLayerColors, hexBgLayerColors, uniqueColors);
});
figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'glassify') {
        for (let selection of figma.currentPage.selection) {
            glassify(selection, msg.lightIntensity, msg.lightColor, msg.bgColor, msg.strokeWeight, msg.blur);
        }
    }
    if (msg.type === 'deselect-all-selections') {
        figma.currentPage.selection = [];
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
}
;
const getBgLayerColors = (fills) => {
    return fills.reduce((acc, curr) => {
        if (curr.type === 'SOLID') {
            acc.push(curr.color);
        }
        else if (curr.type.startsWith('GRADIENT')) {
            const colors = curr.gradientStops.map(stop => stop.color);
            acc = [...acc, ...colors];
        }
        else {
            figma.notify(`You need to select a layer with at least a gradient or solid fill`);
        }
        return acc;
    }, []);
};
const unNormalizeColors = (colors) => {
    return colors.map(color => ({
        r: Math.round(color.r * 255),
        g: Math.round(color.g * 255),
        b: Math.round(color.b * 255)
    }));
};
const base16to10 = (num) => {
    const translateLetterToNumber = (letterOrNumber) => {
        if (letterOrNumber === 'a' || letterOrNumber === 'A') {
            return '10';
        }
        else if (letterOrNumber === 'b' || letterOrNumber === 'B') {
            return '11';
        }
        else if (letterOrNumber === 'c' || letterOrNumber === 'C') {
            return '12';
        }
        else if (letterOrNumber === 'd' || letterOrNumber === 'D') {
            return '13';
        }
        else if (letterOrNumber === 'e' || letterOrNumber === 'E') {
            return '14';
        }
        else if (letterOrNumber === 'f' || letterOrNumber === 'F') {
            return '15';
        }
        else {
            return letterOrNumber;
        }
    };
    let splitNum = num.split("").reverse();
    let result = splitNum.reduce((acc, curr, idx) => {
        const figure = parseInt(translateLetterToNumber(curr)) * Math.pow(16, idx);
        acc += figure;
        return acc;
    }, 0);
    return result;
};
const base10to16 = (num) => {
    let divisionResult = num;
    let remainderArr = [];
    while (divisionResult !== 0) {
        let divisionRemainder = divisionResult % 16;
        remainderArr.push(divisionRemainder);
        divisionResult = Math.floor(divisionResult / 16);
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
    });
    return remainderArr.reverse().reduce((acc, curr) => acc + curr, "");
};
const hexToRGBA = (hex, alpha = 0) => {
    const redHex = hex.slice(1, 3);
    const greenHex = hex.slice(3, 5);
    const blueHex = hex.slice(5, 7);
    const redChannel = base16to10(redHex);
    const greenChannel = base16to10(greenHex);
    const blueChannel = base16to10(blueHex);
    console.log('huha', redChannel, greenChannel, blueChannel);
    return {
        r: redChannel / 255,
        g: greenChannel / 255,
        b: blueChannel / 255,
        a: alpha
    };
};
const rgbaToHex = ({ r, g, b }) => {
    const redChannel = base10to16(r);
    const greenChannel = base10to16(g);
    const blueChannel = base10to16(b);
    const hexColor = "#" + redChannel + greenChannel + blueChannel;
    return hexColor;
};
const lightenHexToRGBA = (hexColor, alpha) => {
    const rgb = hexToRGBA(hexColor);
    return {
        r: Math.min(1, rgb.r * 1.1),
        g: Math.min(1, rgb.g * 1.1),
        b: Math.min(1, rgb.b * 1.1),
        a: alpha
    };
};
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
];
// const preGlassArray = []
const glassify = (node, lightIntensity, lightColor, bgColor, strokeWeight, blur) => {
    //change the color of the light at the edge of the stroke facing the light source
    desiredStrokeLightSource.gradientStops[0].color = hexToRGBA(lightColor, lightIntensity / 100);
    //change the alpha (representing the light brightness/intensity) at the edge of the stroke facing the light source
    // desiredStrokeLightSource.gradientStops[0].color.a = lightIntensity / 100;
    //change the color of the light at the edge of the stroke away from the light source
    desiredStrokeLightSource.gradientStops[1].color = hexToRGBA(lightColor);
    //change the color of the light that affects the fill of the shape
    desiredFill.gradientStops[0].color = hexToRGBA(lightColor, 0.40);
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
    // console.log('rubbish?', desiredStrokeLightSource, desiredStrokeLighterBg, desiredStrokeDarkerBg)
    node["fills"] = [desiredFill];
    node["strokes"] = [desiredStrokeLighterBg, desiredStrokeDarkerBg, desiredStrokeLightSource];
    node["strokeWeight"] = strokeWeight;
    node["effects"] = desiredEffects;
    figma.closePlugin();
};
// const undo = (node: SceneNode) => {
//     const preGlass = preGlassArray.find(preGlass => preGlass.id === node.id);
//     if (preGlass) {
//         node["fills"] = preGlass.fills;
//         node["strokes"] = preGlass.strokes;
//         node["strokeWeight"] = preGlass.strokeWeight;
//         node["effects"] = preGlass.effects;
//     }
// }

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9HbGFzc2lmeS8uL3NyYy9jb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsZUFBZTtBQUN6QztBQUNBO0FBQ0EsOEJBQThCLHdCQUF3QixxQkFBcUIsRUFBRTtBQUM3RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGNBQWM7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4Qix3Q0FBd0M7QUFDdEU7QUFDQTtBQUNBLDhCQUE4Qix5Q0FBeUM7QUFDdkU7QUFDQSwwQkFBMEIsd0RBQXdEO0FBQ2xGO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsVUFBVTtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw0QkFBNEI7QUFDaEQ7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IseUJBQXlCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw2RUFBNkU7QUFDakc7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IsNkVBQTZFO0FBQ2pHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw2RUFBNkU7QUFDakc7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IsNEVBQTRFO0FBQ2hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw0QkFBNEI7QUFDaEQ7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IseUJBQXlCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvZGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBmaWdtYS51aS5vbm1lc3NhZ2UgPSBtc2cgPT4ge1xuLy8gICAgIGlmIChtc2cudHlwZSA9PT0gJ2NyZWF0ZS1yZWN0YW5nbGVzJykge1xuLy8gICAgICAgICBjb25zdCBub2RlcyA9IFtdXG4vLyAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbXNnLmNvdW50OyBpKyspIHtcbi8vICAgICAgICAgICAgIGNvbnN0IHJlY3QgPSBmaWdtYS5jcmVhdGVSZWN0YW5nbGUoKVxuLy8gICAgICAgICAgICAgcmVjdC54ID0gaSAqIDE1MFxuLy8gICAgICAgICAgICAgcmVjdC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDEsIGc6IDAuNSwgYjogMCB9IH1dXG4vLyAgICAgICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5hcHBlbmRDaGlsZChyZWN0KVxuLy8gICAgICAgICAgICAgbm9kZXMucHVzaChyZWN0KVxuLy8gICAgICAgICB9XG4vLyAgICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IG5vZGVzXG4vLyAgICAgICAgIGZpZ21hLnZpZXdwb3J0LnNjcm9sbEFuZFpvb21JbnRvVmlldyhub2Rlcylcbi8vICAgICB9XG4vLyAgICAgZmlnbWEuY2xvc2VQbHVnaW4oKVxuLy8gfVxuLy8gY29uc3QgZGFya2VuSGV4VG9SR0JBID0gKGhleENvbG9yLCBhbHBoYTogbnVtYmVyKSA9PiB7XG4vLyAgIGNvbnN0IHJnYiA9IGhleFRvUkdCQShoZXhDb2xvcik7XG4vLyAgIHJldHVybiB7XG4vLyAgICAgcjogTWF0aC5tYXgoMCwgcmdiLnIgKiAwLjkpLFxuLy8gICAgIGc6IE1hdGgubWF4KDAsIHJnYi5nICogMC45KSxcbi8vICAgICBiOiBNYXRoLm1heCgwLCByZ2IuYiAqIDAuOSksXG4vLyAgICAgYTogYWxwaGFcbi8vICAgfVxuLy8gfVxuLy8gVGhpcyBwbHVnaW4gd2lsbCBvcGVuIGEgd2luZG93IHRvIHByb21wdCB0aGUgdXNlciB0byBlbnRlciBhIG51bWJlciwgYW5kXG4vLyBpdCB3aWxsIHRoZW4gY3JlYXRlIHRoYXQgbWFueSByZWN0YW5nbGVzIG9uIHRoZSBzY3JlZW4uXG4vLyBUaGlzIGZpbGUgaG9sZHMgdGhlIG1haW4gY29kZSBmb3IgdGhlIHBsdWdpbnMuIEl0IGhhcyBhY2Nlc3MgdG8gdGhlICpkb2N1bWVudCouXG4vLyBZb3UgY2FuIGFjY2VzcyBicm93c2VyIEFQSXMgaW4gdGhlIDxzY3JpcHQ+IHRhZyBpbnNpZGUgXCJ1aS5odG1sXCIgd2hpY2ggaGFzIGFcbi8vIGZ1bGwgYnJvd3NlciBlbnZpcm9ubWVudCAoc2VlIGRvY3VtZW50YXRpb24pLlxuLy8gVGhpcyBzaG93cyB0aGUgSFRNTCBwYWdlIGluIFwidWkuaHRtbFwiLlxuZmlnbWEuc2hvd1VJKF9faHRtbF9fLCB7IGhlaWdodDogNDkwIH0pO1xuLy9XaGVuIHBsdWdpbiBsYXVuY2hlcyBkZXNlbGVjdCBhbGwgc2VsZWN0aW9uc1xuZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uID0gW107XG5maWdtYS5vbignc2VsZWN0aW9uY2hhbmdlJywgKCkgPT4ge1xuICAgIC8vaWYgdGhlcmUgaXMgbm8gdmFsaWQgc2VsZWN0aW9uIG9uIHNlbGVjdGlvbiBjaGFuZ2UgZG8gbm90aGluZztcbiAgICBpZiAoIWZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvblswXSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGNvbnN0IGJnTGF5ZXJDb2xvcnMgPSBnZXRCZ0xheWVyQ29sb3JzKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvblswXVsnZmlsbHMnXSk7XG4gICAgY29uc3QgdW5Ob3JtYWxpemVkQmdMYXllckNvbG9ycyA9IHVuTm9ybWFsaXplQ29sb3JzKGJnTGF5ZXJDb2xvcnMpO1xuICAgIGNvbnN0IGhleEJnTGF5ZXJDb2xvcnMgPSB1bk5vcm1hbGl6ZWRCZ0xheWVyQ29sb3JzLm1hcChjb2xvciA9PiByZ2JhVG9IZXgoY29sb3IpKTtcbiAgICBjb25zdCB1bmlxdWVDb2xvcnMgPSBbLi4ubmV3IFNldChoZXhCZ0xheWVyQ29sb3JzKV07XG4gICAgaWYgKHVuaXF1ZUNvbG9ycy5sZW5ndGgpIHtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAnc2VsZWN0aW9uLW1hZGUnLCBpc1ZhbGlkOiB0cnVlIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAnc2VsZWN0aW9uLW1hZGUnLCBpc1ZhbGlkOiBmYWxzZSB9KTtcbiAgICB9XG4gICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAncmVmcmFjdGVkLWNvbG9yLW9wdGlvbnMnLCBjb2xvcnM6IHVuaXF1ZUNvbG9ycyB9KTtcbiAgICBjb25zb2xlLmxvZyhmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF0sIHVuTm9ybWFsaXplZEJnTGF5ZXJDb2xvcnMsIGhleEJnTGF5ZXJDb2xvcnMsIHVuaXF1ZUNvbG9ycyk7XG59KTtcbmZpZ21hLnVpLm9ubWVzc2FnZSA9IG1zZyA9PiB7XG4gICAgLy8gT25lIHdheSBvZiBkaXN0aW5ndWlzaGluZyBiZXR3ZWVuIGRpZmZlcmVudCB0eXBlcyBvZiBtZXNzYWdlcyBzZW50IGZyb21cbiAgICAvLyB5b3VyIEhUTUwgcGFnZSBpcyB0byB1c2UgYW4gb2JqZWN0IHdpdGggYSBcInR5cGVcIiBwcm9wZXJ0eSBsaWtlIHRoaXMuXG4gICAgaWYgKG1zZy50eXBlID09PSAnZ2xhc3NpZnknKSB7XG4gICAgICAgIGZvciAobGV0IHNlbGVjdGlvbiBvZiBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIGdsYXNzaWZ5KHNlbGVjdGlvbiwgbXNnLmxpZ2h0SW50ZW5zaXR5LCBtc2cubGlnaHRDb2xvciwgbXNnLmJnQ29sb3IsIG1zZy5zdHJva2VXZWlnaHQsIG1zZy5ibHVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09ICdkZXNlbGVjdC1hbGwtc2VsZWN0aW9ucycpIHtcbiAgICAgICAgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uID0gW107XG4gICAgfVxuICAgIC8vIGlmIChtc2cudHlwZSA9PT0gJ3VuZG8nKSB7XG4gICAgLy8gICAgIGZvciAobGV0IHNlbGVjdGlvbiBvZiBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24pIHtcbiAgICAvLyAgICAgICAgIHVuZG8oc2VsZWN0aW9uKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cbiAgICAvLyBNYWtlIHN1cmUgdG8gY2xvc2UgdGhlIHBsdWdpbiB3aGVuIHlvdSdyZSBkb25lLiBPdGhlcndpc2UgdGhlIHBsdWdpbiB3aWxsXG4gICAgLy8ga2VlcCBydW5uaW5nLCB3aGljaCBzaG93cyB0aGUgY2FuY2VsIGJ1dHRvbiBhdCB0aGUgYm90dG9tIG9mIHRoZSBzY3JlZW4uXG4gICAgLy8gZmlnbWEuY2xvc2VQbHVnaW4oKTtcbn07XG4vLyBIRUxQRVIgRlVOQ1RJT05TXG5mdW5jdGlvbiBjbG9uZSh2YWwpIHtcbiAgICBjb25zdCB0eXBlID0gdHlwZW9mIHZhbDtcbiAgICBpZiAodmFsID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlID09PSAndW5kZWZpbmVkJyB8fCB0eXBlID09PSAnbnVtYmVyJyB8fFxuICAgICAgICB0eXBlID09PSAnc3RyaW5nJyB8fCB0eXBlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsLm1hcCh4ID0+IGNsb25lKHgpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkodmFsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCBvID0ge307XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB2YWwpIHtcbiAgICAgICAgICAgICAgICBvW2tleV0gPSBjbG9uZSh2YWxba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyAndW5rbm93bic7XG59XG47XG5jb25zdCBnZXRCZ0xheWVyQ29sb3JzID0gKGZpbGxzKSA9PiB7XG4gICAgcmV0dXJuIGZpbGxzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XG4gICAgICAgIGlmIChjdXJyLnR5cGUgPT09ICdTT0xJRCcpIHtcbiAgICAgICAgICAgIGFjYy5wdXNoKGN1cnIuY29sb3IpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGN1cnIudHlwZS5zdGFydHNXaXRoKCdHUkFESUVOVCcpKSB7XG4gICAgICAgICAgICBjb25zdCBjb2xvcnMgPSBjdXJyLmdyYWRpZW50U3RvcHMubWFwKHN0b3AgPT4gc3RvcC5jb2xvcik7XG4gICAgICAgICAgICBhY2MgPSBbLi4uYWNjLCAuLi5jb2xvcnNdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmlnbWEubm90aWZ5KGBZb3UgbmVlZCB0byBzZWxlY3QgYSBsYXllciB3aXRoIGF0IGxlYXN0IGEgZ3JhZGllbnQgb3Igc29saWQgZmlsbGApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgW10pO1xufTtcbmNvbnN0IHVuTm9ybWFsaXplQ29sb3JzID0gKGNvbG9ycykgPT4ge1xuICAgIHJldHVybiBjb2xvcnMubWFwKGNvbG9yID0+ICh7XG4gICAgICAgIHI6IE1hdGgucm91bmQoY29sb3IuciAqIDI1NSksXG4gICAgICAgIGc6IE1hdGgucm91bmQoY29sb3IuZyAqIDI1NSksXG4gICAgICAgIGI6IE1hdGgucm91bmQoY29sb3IuYiAqIDI1NSlcbiAgICB9KSk7XG59O1xuY29uc3QgYmFzZTE2dG8xMCA9IChudW0pID0+IHtcbiAgICBjb25zdCB0cmFuc2xhdGVMZXR0ZXJUb051bWJlciA9IChsZXR0ZXJPck51bWJlcikgPT4ge1xuICAgICAgICBpZiAobGV0dGVyT3JOdW1iZXIgPT09ICdhJyB8fCBsZXR0ZXJPck51bWJlciA9PT0gJ0EnKSB7XG4gICAgICAgICAgICByZXR1cm4gJzEwJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsZXR0ZXJPck51bWJlciA9PT0gJ2InIHx8IGxldHRlck9yTnVtYmVyID09PSAnQicpIHtcbiAgICAgICAgICAgIHJldHVybiAnMTEnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxldHRlck9yTnVtYmVyID09PSAnYycgfHwgbGV0dGVyT3JOdW1iZXIgPT09ICdDJykge1xuICAgICAgICAgICAgcmV0dXJuICcxMic7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGV0dGVyT3JOdW1iZXIgPT09ICdkJyB8fCBsZXR0ZXJPck51bWJlciA9PT0gJ0QnKSB7XG4gICAgICAgICAgICByZXR1cm4gJzEzJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsZXR0ZXJPck51bWJlciA9PT0gJ2UnIHx8IGxldHRlck9yTnVtYmVyID09PSAnRScpIHtcbiAgICAgICAgICAgIHJldHVybiAnMTQnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxldHRlck9yTnVtYmVyID09PSAnZicgfHwgbGV0dGVyT3JOdW1iZXIgPT09ICdGJykge1xuICAgICAgICAgICAgcmV0dXJuICcxNSc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbGV0dGVyT3JOdW1iZXI7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGxldCBzcGxpdE51bSA9IG51bS5zcGxpdChcIlwiKS5yZXZlcnNlKCk7XG4gICAgbGV0IHJlc3VsdCA9IHNwbGl0TnVtLnJlZHVjZSgoYWNjLCBjdXJyLCBpZHgpID0+IHtcbiAgICAgICAgY29uc3QgZmlndXJlID0gcGFyc2VJbnQodHJhbnNsYXRlTGV0dGVyVG9OdW1iZXIoY3VycikpICogTWF0aC5wb3coMTYsIGlkeCk7XG4gICAgICAgIGFjYyArPSBmaWd1cmU7XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgMCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5jb25zdCBiYXNlMTB0bzE2ID0gKG51bSkgPT4ge1xuICAgIGxldCBkaXZpc2lvblJlc3VsdCA9IG51bTtcbiAgICBsZXQgcmVtYWluZGVyQXJyID0gW107XG4gICAgd2hpbGUgKGRpdmlzaW9uUmVzdWx0ICE9PSAwKSB7XG4gICAgICAgIGxldCBkaXZpc2lvblJlbWFpbmRlciA9IGRpdmlzaW9uUmVzdWx0ICUgMTY7XG4gICAgICAgIHJlbWFpbmRlckFyci5wdXNoKGRpdmlzaW9uUmVtYWluZGVyKTtcbiAgICAgICAgZGl2aXNpb25SZXN1bHQgPSBNYXRoLmZsb29yKGRpdmlzaW9uUmVzdWx0IC8gMTYpO1xuICAgIH1cbiAgICByZW1haW5kZXJBcnIgPSByZW1haW5kZXJBcnIubWFwKHJlbWFpbmRlciA9PiB7XG4gICAgICAgIHN3aXRjaCAocmVtYWluZGVyKSB7XG4gICAgICAgICAgICBjYXNlIDEwOlxuICAgICAgICAgICAgICAgIHJldHVybiAnQSc7XG4gICAgICAgICAgICBjYXNlIDExOlxuICAgICAgICAgICAgICAgIHJldHVybiAnQic7XG4gICAgICAgICAgICBjYXNlIDEyOlxuICAgICAgICAgICAgICAgIHJldHVybiAnQyc7XG4gICAgICAgICAgICBjYXNlIDEzOlxuICAgICAgICAgICAgICAgIHJldHVybiAnRCc7XG4gICAgICAgICAgICBjYXNlIDE0OlxuICAgICAgICAgICAgICAgIHJldHVybiAnRSc7XG4gICAgICAgICAgICBjYXNlIDE1OlxuICAgICAgICAgICAgICAgIHJldHVybiAnRic7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiByZW1haW5kZXIudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZW1haW5kZXJBcnIucmV2ZXJzZSgpLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MgKyBjdXJyLCBcIlwiKTtcbn07XG5jb25zdCBoZXhUb1JHQkEgPSAoaGV4LCBhbHBoYSA9IDApID0+IHtcbiAgICBjb25zdCByZWRIZXggPSBoZXguc2xpY2UoMSwgMyk7XG4gICAgY29uc3QgZ3JlZW5IZXggPSBoZXguc2xpY2UoMywgNSk7XG4gICAgY29uc3QgYmx1ZUhleCA9IGhleC5zbGljZSg1LCA3KTtcbiAgICBjb25zdCByZWRDaGFubmVsID0gYmFzZTE2dG8xMChyZWRIZXgpO1xuICAgIGNvbnN0IGdyZWVuQ2hhbm5lbCA9IGJhc2UxNnRvMTAoZ3JlZW5IZXgpO1xuICAgIGNvbnN0IGJsdWVDaGFubmVsID0gYmFzZTE2dG8xMChibHVlSGV4KTtcbiAgICBjb25zb2xlLmxvZygnaHVoYScsIHJlZENoYW5uZWwsIGdyZWVuQ2hhbm5lbCwgYmx1ZUNoYW5uZWwpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHI6IHJlZENoYW5uZWwgLyAyNTUsXG4gICAgICAgIGc6IGdyZWVuQ2hhbm5lbCAvIDI1NSxcbiAgICAgICAgYjogYmx1ZUNoYW5uZWwgLyAyNTUsXG4gICAgICAgIGE6IGFscGhhXG4gICAgfTtcbn07XG5jb25zdCByZ2JhVG9IZXggPSAoeyByLCBnLCBiIH0pID0+IHtcbiAgICBjb25zdCByZWRDaGFubmVsID0gYmFzZTEwdG8xNihyKTtcbiAgICBjb25zdCBncmVlbkNoYW5uZWwgPSBiYXNlMTB0bzE2KGcpO1xuICAgIGNvbnN0IGJsdWVDaGFubmVsID0gYmFzZTEwdG8xNihiKTtcbiAgICBjb25zdCBoZXhDb2xvciA9IFwiI1wiICsgcmVkQ2hhbm5lbCArIGdyZWVuQ2hhbm5lbCArIGJsdWVDaGFubmVsO1xuICAgIHJldHVybiBoZXhDb2xvcjtcbn07XG5jb25zdCBsaWdodGVuSGV4VG9SR0JBID0gKGhleENvbG9yLCBhbHBoYSkgPT4ge1xuICAgIGNvbnN0IHJnYiA9IGhleFRvUkdCQShoZXhDb2xvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcjogTWF0aC5taW4oMSwgcmdiLnIgKiAxLjEpLFxuICAgICAgICBnOiBNYXRoLm1pbigxLCByZ2IuZyAqIDEuMSksXG4gICAgICAgIGI6IE1hdGgubWluKDEsIHJnYi5iICogMS4xKSxcbiAgICAgICAgYTogYWxwaGFcbiAgICB9O1xufTtcbmNvbnN0IHJhZGlhbFRvcExlZnRUeCA9IFswLjM1NzI1NjQ3MjExMDc0ODMsIDAuMTYwMzE1NjYyNjIyNDUxNzgsIDAuNDkyMDE2ODUxOTAyMDA4MDZdO1xuY29uc3QgcmFkaWFsQm90dG9tUmlnaHRUeCA9IFstMC4xNjAxMjg1MzM4NDAxNzk0NCwgMC4xNjUzODkxMzU0Nzk5MjcwNiwgMC40OTY1MTk2NTQ5ODkyNDI1NV07XG5jb25zdCByYWRpYWxCb3R0b21MZWZ0VHggPSBbMC4zODUwMzAwMDE0MDE5MDEyNSwgLTAuMTM0Mjc1NTEwOTA3MTczMTYsIDAuNjI0ODcyODYzMjkyNjk0MV07XG5jb25zdCByYWRpYWxUb3BSaWdodFR4ID0gWzAuMTYxMDgxNTM3NjA0MzMxOTcsIDAuMTY2NDM1MTA3NTg4NzY4LCAwLjMzNjQzODI5ODIyNTQwMjgzXTtcbmNvbnN0IGxpbmVhclRvcExlZnRUeCA9IFswLjcxNDkxMTI4MjA2MjUzMDUsIDAuMzI2NjI4NTY1Nzg4MjY5MDQsIC0wLjAyMjE0NzE1MDcxMDIyNTEwNV07XG5jb25zdCBsaW5lYXJCb3R0b21SaWdodFR4ID0gWy0wLjMyNTk4MTc5NTc4NzgxMTMsIDAuMzMwODMwNjYzNDQyNjExNywgMC40OTcwMTQwNDU3MTUzMzIwM107XG5sZXQgZGVzaXJlZEZpbGwgPSB7XG4gICAgdHlwZTogXCJHUkFESUVOVF9SQURJQUxcIixcbiAgICB2aXNpYmxlOiB0cnVlLFxuICAgIG9wYWNpdHk6IDEsXG4gICAgYmxlbmRNb2RlOiBcIk5PUk1BTFwiLFxuICAgIGdyYWRpZW50U3RvcHM6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgY29sb3I6IHsgcjogMSwgZzogMSwgYjogMSwgYTogMC40MCB9LFxuICAgICAgICAgICAgcG9zaXRpb246IDBcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgY29sb3I6IHsgcjogMSwgZzogMSwgYjogMSwgYTogMCB9LFxuICAgICAgICAgICAgcG9zaXRpb246IDFcbiAgICAgICAgfVxuICAgIF0sXG4gICAgZ3JhZGllbnRUcmFuc2Zvcm06IFtcbiAgICAgICAgcmFkaWFsVG9wTGVmdFR4LFxuICAgICAgICByYWRpYWxCb3R0b21SaWdodFR4XG4gICAgXVxufTtcbmxldCBkZXNpcmVkU3Ryb2tlTGlnaHRlckJnID0ge1xuICAgIHR5cGU6IFwiR1JBRElFTlRfUkFESUFMXCIsXG4gICAgdmlzaWJsZTogdHJ1ZSxcbiAgICBvcGFjaXR5OiAxLFxuICAgIGJsZW5kTW9kZTogXCJOT1JNQUxcIixcbiAgICBncmFkaWVudFN0b3BzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDAuNDA1NzI5MTc0NjEzOTUyNjQsIGc6IDAuNjI1ODM0MTY3MDAzNjMxNiwgYjogMC43OTE2NjY2ODY1MzQ4ODE2LCBhOiAxIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAwLjQwMzkyMTU3NDM1NDE3MTc1LCBnOiAwLjYyNzQ1MTAwMjU5NzgwODgsIGI6IDAuNzkyMTU2ODc1MTMzNTE0NCwgYTogMCB9LFxuICAgICAgICAgICAgcG9zaXRpb246IDFcbiAgICAgICAgfVxuICAgIF0sXG4gICAgZ3JhZGllbnRUcmFuc2Zvcm06IFtcbiAgICAgICAgcmFkaWFsVG9wTGVmdFR4LFxuICAgICAgICByYWRpYWxCb3R0b21SaWdodFR4XG4gICAgXVxufTtcbmxldCBkZXNpcmVkU3Ryb2tlRGFya2VyQmcgPSB7XG4gICAgdHlwZTogXCJHUkFESUVOVF9SQURJQUxcIixcbiAgICB2aXNpYmxlOiB0cnVlLFxuICAgIG9wYWNpdHk6IDEsXG4gICAgYmxlbmRNb2RlOiBcIk5PUk1BTFwiLFxuICAgIGdyYWRpZW50U3RvcHM6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgY29sb3I6IHsgcjogMC4xOTA1NTU1NzI1MDk3NjU2MiwgZzogMC41NDc2MzQ1NDE5ODgzNzI4LCBiOiAwLjgxNjY2NjY2MjY5MzAyMzcsIGE6IDEgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAwXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDAuMTkyMTU2ODY2MTkyODE3NywgZzogMC41NDkwMTk2MzQ3MjM2NjMzLCBiOiAwLjgxNTY4NjI4NTQ5NTc1ODEsIGE6IDAgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAxXG4gICAgICAgIH1cbiAgICBdLFxuICAgIGdyYWRpZW50VHJhbnNmb3JtOiBbXG4gICAgICAgIHJhZGlhbEJvdHRvbUxlZnRUeCxcbiAgICAgICAgcmFkaWFsVG9wUmlnaHRUeFxuICAgIF1cbn07XG5sZXQgZGVzaXJlZFN0cm9rZUxpZ2h0U291cmNlID0ge1xuICAgIHR5cGU6IFwiR1JBRElFTlRfTElORUFSXCIsXG4gICAgdmlzaWJsZTogdHJ1ZSxcbiAgICBvcGFjaXR5OiAxLFxuICAgIGJsZW5kTW9kZTogXCJOT1JNQUxcIixcbiAgICBncmFkaWVudFN0b3BzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEsIGE6IDAuOTAgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAwXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEsIGE6IDAgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAxXG4gICAgICAgIH1cbiAgICBdLFxuICAgIGdyYWRpZW50VHJhbnNmb3JtOiBbXG4gICAgICAgIGxpbmVhclRvcExlZnRUeCxcbiAgICAgICAgbGluZWFyQm90dG9tUmlnaHRUeFxuICAgIF1cbn07XG5jb25zdCBkZXNpcmVkU3Ryb2tlV2VpZ2h0ID0gMztcbmNvbnN0IGRlc2lyZWRFZmZlY3RzID0gW1xuICAgIHsgdHlwZTogXCJCQUNLR1JPVU5EX0JMVVJcIiwgcmFkaXVzOiA0MiwgdmlzaWJsZTogdHJ1ZSB9XG5dO1xuLy8gY29uc3QgcHJlR2xhc3NBcnJheSA9IFtdXG5jb25zdCBnbGFzc2lmeSA9IChub2RlLCBsaWdodEludGVuc2l0eSwgbGlnaHRDb2xvciwgYmdDb2xvciwgc3Ryb2tlV2VpZ2h0LCBibHVyKSA9PiB7XG4gICAgLy9jaGFuZ2UgdGhlIGNvbG9yIG9mIHRoZSBsaWdodCBhdCB0aGUgZWRnZSBvZiB0aGUgc3Ryb2tlIGZhY2luZyB0aGUgbGlnaHQgc291cmNlXG4gICAgZGVzaXJlZFN0cm9rZUxpZ2h0U291cmNlLmdyYWRpZW50U3RvcHNbMF0uY29sb3IgPSBoZXhUb1JHQkEobGlnaHRDb2xvciwgbGlnaHRJbnRlbnNpdHkgLyAxMDApO1xuICAgIC8vY2hhbmdlIHRoZSBhbHBoYSAocmVwcmVzZW50aW5nIHRoZSBsaWdodCBicmlnaHRuZXNzL2ludGVuc2l0eSkgYXQgdGhlIGVkZ2Ugb2YgdGhlIHN0cm9rZSBmYWNpbmcgdGhlIGxpZ2h0IHNvdXJjZVxuICAgIC8vIGRlc2lyZWRTdHJva2VMaWdodFNvdXJjZS5ncmFkaWVudFN0b3BzWzBdLmNvbG9yLmEgPSBsaWdodEludGVuc2l0eSAvIDEwMDtcbiAgICAvL2NoYW5nZSB0aGUgY29sb3Igb2YgdGhlIGxpZ2h0IGF0IHRoZSBlZGdlIG9mIHRoZSBzdHJva2UgYXdheSBmcm9tIHRoZSBsaWdodCBzb3VyY2VcbiAgICBkZXNpcmVkU3Ryb2tlTGlnaHRTb3VyY2UuZ3JhZGllbnRTdG9wc1sxXS5jb2xvciA9IGhleFRvUkdCQShsaWdodENvbG9yKTtcbiAgICAvL2NoYW5nZSB0aGUgY29sb3Igb2YgdGhlIGxpZ2h0IHRoYXQgYWZmZWN0cyB0aGUgZmlsbCBvZiB0aGUgc2hhcGVcbiAgICBkZXNpcmVkRmlsbC5ncmFkaWVudFN0b3BzWzBdLmNvbG9yID0gaGV4VG9SR0JBKGxpZ2h0Q29sb3IsIDAuNDApO1xuICAgIGRlc2lyZWRTdHJva2VMaWdodGVyQmcuZ3JhZGllbnRTdG9wc1swXS5jb2xvciA9IGxpZ2h0ZW5IZXhUb1JHQkEoYmdDb2xvciwgMCk7XG4gICAgZGVzaXJlZFN0cm9rZUxpZ2h0ZXJCZy5ncmFkaWVudFN0b3BzWzFdLmNvbG9yID0gbGlnaHRlbkhleFRvUkdCQShiZ0NvbG9yLCAxKTtcbiAgICBkZXNpcmVkU3Ryb2tlRGFya2VyQmcuZ3JhZGllbnRTdG9wc1swXS5jb2xvciA9IGxpZ2h0ZW5IZXhUb1JHQkEoYmdDb2xvciwgMCk7XG4gICAgZGVzaXJlZFN0cm9rZURhcmtlckJnLmdyYWRpZW50U3RvcHNbMV0uY29sb3IgPSBsaWdodGVuSGV4VG9SR0JBKGJnQ29sb3IsIDEpO1xuICAgIGRlc2lyZWRFZmZlY3RzLmZpbmQoZWZmZWN0ID0+IGVmZmVjdC50eXBlID09PSBcIkJBQ0tHUk9VTkRfQkxVUlwiKS5yYWRpdXMgPSBibHVyO1xuICAgIC8vIGNvbnN0IHByZUdsYXNzID0ge1xuICAgIC8vICAgICBpZDogbm9kZS5pZCxcbiAgICAvLyAgICAgZmlsbHM6IG5vZGVbXCJmaWxsc1wiXSxcbiAgICAvLyAgICAgc3Ryb2tlczogbm9kZVtcInN0cm9rZXNcIl0sXG4gICAgLy8gICAgIHN0cm9rZVdlaWdodDogbm9kZVtcInN0cm9rZVdlaWdodFwiXSxcbiAgICAvLyAgICAgZWZmZWN0czogbm9kZVtcImVmZmVjdHNcIl1cbiAgICAvLyB9XG4gICAgLy8gY29uc3QgaGFzQmVlbkFkZGVkSW5kZXggPSBwcmVHbGFzc0FycmF5LmZpbmRJbmRleChwcmVHbGFzcyA9PiBwcmVHbGFzcy5pZCA9PT0gbm9kZS5pZClcbiAgICAvLyBpZiAoaGFzQmVlbkFkZGVkSW5kZXggPj0gMCkge1xuICAgIC8vICAgICBwcmVHbGFzc0FycmF5W2hhc0JlZW5BZGRlZEluZGV4XSA9IHByZUdsYXNzO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICAgIHByZUdsYXNzQXJyYXkucHVzaChwcmVHbGFzcyk7XG4gICAgLy8gfVxuICAgIC8vIGNvbnNvbGUubG9nKCdydWJiaXNoPycsIGRlc2lyZWRTdHJva2VMaWdodFNvdXJjZSwgZGVzaXJlZFN0cm9rZUxpZ2h0ZXJCZywgZGVzaXJlZFN0cm9rZURhcmtlckJnKVxuICAgIG5vZGVbXCJmaWxsc1wiXSA9IFtkZXNpcmVkRmlsbF07XG4gICAgbm9kZVtcInN0cm9rZXNcIl0gPSBbZGVzaXJlZFN0cm9rZUxpZ2h0ZXJCZywgZGVzaXJlZFN0cm9rZURhcmtlckJnLCBkZXNpcmVkU3Ryb2tlTGlnaHRTb3VyY2VdO1xuICAgIG5vZGVbXCJzdHJva2VXZWlnaHRcIl0gPSBzdHJva2VXZWlnaHQ7XG4gICAgbm9kZVtcImVmZmVjdHNcIl0gPSBkZXNpcmVkRWZmZWN0cztcbiAgICBmaWdtYS5jbG9zZVBsdWdpbigpO1xufTtcbi8vIGNvbnN0IHVuZG8gPSAobm9kZTogU2NlbmVOb2RlKSA9PiB7XG4vLyAgICAgY29uc3QgcHJlR2xhc3MgPSBwcmVHbGFzc0FycmF5LmZpbmQocHJlR2xhc3MgPT4gcHJlR2xhc3MuaWQgPT09IG5vZGUuaWQpO1xuLy8gICAgIGlmIChwcmVHbGFzcykge1xuLy8gICAgICAgICBub2RlW1wiZmlsbHNcIl0gPSBwcmVHbGFzcy5maWxscztcbi8vICAgICAgICAgbm9kZVtcInN0cm9rZXNcIl0gPSBwcmVHbGFzcy5zdHJva2VzO1xuLy8gICAgICAgICBub2RlW1wic3Ryb2tlV2VpZ2h0XCJdID0gcHJlR2xhc3Muc3Ryb2tlV2VpZ2h0O1xuLy8gICAgICAgICBub2RlW1wiZWZmZWN0c1wiXSA9IHByZUdsYXNzLmVmZmVjdHM7XG4vLyAgICAgfVxuLy8gfVxuIl0sInNvdXJjZVJvb3QiOiIifQ==