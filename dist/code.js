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
            alert(`This feature does not work with images || selection w/o fill || you need to select a layer with at least a gradient or solid fill`);
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
    console.log('rubbish?', desiredStrokeLightSource, desiredStrokeLighterBg, desiredStrokeDarkerBg);
    node["fills"] = [desiredFill];
    node["strokes"] = [desiredStrokeLighterBg, desiredStrokeDarkerBg, desiredStrokeLightSource];
    node["strokeWeight"] = strokeWeight;
    node["effects"] = desiredEffects;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9HbGFzc2lmeS8uL3NyYy9jb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsZUFBZTtBQUN6QztBQUNBO0FBQ0EsOEJBQThCLHdCQUF3QixxQkFBcUIsRUFBRTtBQUM3RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGNBQWM7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4Qix3Q0FBd0M7QUFDdEU7QUFDQTtBQUNBLDhCQUE4Qix5Q0FBeUM7QUFDdkU7QUFDQSwwQkFBMEIsd0RBQXdEO0FBQ2xGO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsVUFBVTtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw0QkFBNEI7QUFDaEQ7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IseUJBQXlCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw2RUFBNkU7QUFDakc7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IsNkVBQTZFO0FBQ2pHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw2RUFBNkU7QUFDakc7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IsNEVBQTRFO0FBQ2hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw0QkFBNEI7QUFDaEQ7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IseUJBQXlCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb2RlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gZmlnbWEudWkub25tZXNzYWdlID0gbXNnID0+IHtcbi8vICAgICBpZiAobXNnLnR5cGUgPT09ICdjcmVhdGUtcmVjdGFuZ2xlcycpIHtcbi8vICAgICAgICAgY29uc3Qgbm9kZXMgPSBbXVxuLy8gICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1zZy5jb3VudDsgaSsrKSB7XG4vLyAgICAgICAgICAgICBjb25zdCByZWN0ID0gZmlnbWEuY3JlYXRlUmVjdGFuZ2xlKClcbi8vICAgICAgICAgICAgIHJlY3QueCA9IGkgKiAxNTBcbi8vICAgICAgICAgICAgIHJlY3QuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAxLCBnOiAwLjUsIGI6IDAgfSB9XVxuLy8gICAgICAgICAgICAgZmlnbWEuY3VycmVudFBhZ2UuYXBwZW5kQ2hpbGQocmVjdClcbi8vICAgICAgICAgICAgIG5vZGVzLnB1c2gocmVjdClcbi8vICAgICAgICAgfVxuLy8gICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24gPSBub2Rlc1xuLy8gICAgICAgICBmaWdtYS52aWV3cG9ydC5zY3JvbGxBbmRab29tSW50b1ZpZXcobm9kZXMpXG4vLyAgICAgfVxuLy8gICAgIGZpZ21hLmNsb3NlUGx1Z2luKClcbi8vIH1cbi8vIGNvbnN0IGRhcmtlbkhleFRvUkdCQSA9IChoZXhDb2xvciwgYWxwaGE6IG51bWJlcikgPT4ge1xuLy8gICBjb25zdCByZ2IgPSBoZXhUb1JHQkEoaGV4Q29sb3IpO1xuLy8gICByZXR1cm4ge1xuLy8gICAgIHI6IE1hdGgubWF4KDAsIHJnYi5yICogMC45KSxcbi8vICAgICBnOiBNYXRoLm1heCgwLCByZ2IuZyAqIDAuOSksXG4vLyAgICAgYjogTWF0aC5tYXgoMCwgcmdiLmIgKiAwLjkpLFxuLy8gICAgIGE6IGFscGhhXG4vLyAgIH1cbi8vIH1cbi8vIFRoaXMgcGx1Z2luIHdpbGwgb3BlbiBhIHdpbmRvdyB0byBwcm9tcHQgdGhlIHVzZXIgdG8gZW50ZXIgYSBudW1iZXIsIGFuZFxuLy8gaXQgd2lsbCB0aGVuIGNyZWF0ZSB0aGF0IG1hbnkgcmVjdGFuZ2xlcyBvbiB0aGUgc2NyZWVuLlxuLy8gVGhpcyBmaWxlIGhvbGRzIHRoZSBtYWluIGNvZGUgZm9yIHRoZSBwbHVnaW5zLiBJdCBoYXMgYWNjZXNzIHRvIHRoZSAqZG9jdW1lbnQqLlxuLy8gWW91IGNhbiBhY2Nlc3MgYnJvd3NlciBBUElzIGluIHRoZSA8c2NyaXB0PiB0YWcgaW5zaWRlIFwidWkuaHRtbFwiIHdoaWNoIGhhcyBhXG4vLyBmdWxsIGJyb3dzZXIgZW52aXJvbm1lbnQgKHNlZSBkb2N1bWVudGF0aW9uKS5cbi8vIFRoaXMgc2hvd3MgdGhlIEhUTUwgcGFnZSBpbiBcInVpLmh0bWxcIi5cbmZpZ21hLnNob3dVSShfX2h0bWxfXywgeyBoZWlnaHQ6IDQ5MCB9KTtcbi8vV2hlbiBwbHVnaW4gbGF1bmNoZXMgZGVzZWxlY3QgYWxsIHNlbGVjdGlvbnNcbmZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IFtdO1xuZmlnbWEub24oJ3NlbGVjdGlvbmNoYW5nZScsICgpID0+IHtcbiAgICAvL2lmIHRoZXJlIGlzIG5vIHZhbGlkIHNlbGVjdGlvbiBvbiBzZWxlY3Rpb24gY2hhbmdlIGRvIG5vdGhpbmc7XG4gICAgaWYgKCFmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF0pXG4gICAgICAgIHJldHVybjtcbiAgICBjb25zdCBiZ0xheWVyQ29sb3JzID0gZ2V0QmdMYXllckNvbG9ycyhmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF1bJ2ZpbGxzJ10pO1xuICAgIGNvbnN0IHVuTm9ybWFsaXplZEJnTGF5ZXJDb2xvcnMgPSB1bk5vcm1hbGl6ZUNvbG9ycyhiZ0xheWVyQ29sb3JzKTtcbiAgICBjb25zdCBoZXhCZ0xheWVyQ29sb3JzID0gdW5Ob3JtYWxpemVkQmdMYXllckNvbG9ycy5tYXAoY29sb3IgPT4gcmdiYVRvSGV4KGNvbG9yKSk7XG4gICAgY29uc3QgdW5pcXVlQ29sb3JzID0gWy4uLm5ldyBTZXQoaGV4QmdMYXllckNvbG9ycyldO1xuICAgIGlmICh1bmlxdWVDb2xvcnMubGVuZ3RoKSB7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ3NlbGVjdGlvbi1tYWRlJywgaXNWYWxpZDogdHJ1ZSB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ3NlbGVjdGlvbi1tYWRlJywgaXNWYWxpZDogZmFsc2UgfSk7XG4gICAgfVxuICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ3JlZnJhY3RlZC1jb2xvci1vcHRpb25zJywgY29sb3JzOiB1bmlxdWVDb2xvcnMgfSk7XG4gICAgY29uc29sZS5sb2coZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uWzBdLCB1bk5vcm1hbGl6ZWRCZ0xheWVyQ29sb3JzLCBoZXhCZ0xheWVyQ29sb3JzLCB1bmlxdWVDb2xvcnMpO1xufSk7XG5maWdtYS51aS5vbm1lc3NhZ2UgPSBtc2cgPT4ge1xuICAgIC8vIE9uZSB3YXkgb2YgZGlzdGluZ3Vpc2hpbmcgYmV0d2VlbiBkaWZmZXJlbnQgdHlwZXMgb2YgbWVzc2FnZXMgc2VudCBmcm9tXG4gICAgLy8geW91ciBIVE1MIHBhZ2UgaXMgdG8gdXNlIGFuIG9iamVjdCB3aXRoIGEgXCJ0eXBlXCIgcHJvcGVydHkgbGlrZSB0aGlzLlxuICAgIGlmIChtc2cudHlwZSA9PT0gJ2dsYXNzaWZ5Jykge1xuICAgICAgICBmb3IgKGxldCBzZWxlY3Rpb24gb2YgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICBnbGFzc2lmeShzZWxlY3Rpb24sIG1zZy5saWdodEludGVuc2l0eSwgbXNnLmxpZ2h0Q29sb3IsIG1zZy5iZ0NvbG9yLCBtc2cuc3Ryb2tlV2VpZ2h0LCBtc2cuYmx1cik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1zZy50eXBlID09PSAnZGVzZWxlY3QtYWxsLXNlbGVjdGlvbnMnKSB7XG4gICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IFtdO1xuICAgIH1cbiAgICAvLyBpZiAobXNnLnR5cGUgPT09ICd1bmRvJykge1xuICAgIC8vICAgICBmb3IgKGxldCBzZWxlY3Rpb24gb2YgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uKSB7XG4gICAgLy8gICAgICAgICB1bmRvKHNlbGVjdGlvbik7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG4gICAgLy8gTWFrZSBzdXJlIHRvIGNsb3NlIHRoZSBwbHVnaW4gd2hlbiB5b3UncmUgZG9uZS4gT3RoZXJ3aXNlIHRoZSBwbHVnaW4gd2lsbFxuICAgIC8vIGtlZXAgcnVubmluZywgd2hpY2ggc2hvd3MgdGhlIGNhbmNlbCBidXR0b24gYXQgdGhlIGJvdHRvbSBvZiB0aGUgc2NyZWVuLlxuICAgIC8vIGZpZ21hLmNsb3NlUGx1Z2luKCk7XG59O1xuLy8gSEVMUEVSIEZVTkNUSU9OU1xuZnVuY3Rpb24gY2xvbmUodmFsKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZSA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgdHlwZSA9PT0gJ3N0cmluZycgfHwgdHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbC5tYXAoeCA9PiBjbG9uZSh4KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgbyA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsKSB7XG4gICAgICAgICAgICAgICAgb1trZXldID0gY2xvbmUodmFsW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgJ3Vua25vd24nO1xufVxuO1xuY29uc3QgZ2V0QmdMYXllckNvbG9ycyA9IChmaWxscykgPT4ge1xuICAgIHJldHVybiBmaWxscy5yZWR1Y2UoKGFjYywgY3VycikgPT4ge1xuICAgICAgICBpZiAoY3Vyci50eXBlID09PSAnU09MSUQnKSB7XG4gICAgICAgICAgICBhY2MucHVzaChjdXJyLmNvbG9yKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjdXJyLnR5cGUuc3RhcnRzV2l0aCgnR1JBRElFTlQnKSkge1xuICAgICAgICAgICAgY29uc3QgY29sb3JzID0gY3Vyci5ncmFkaWVudFN0b3BzLm1hcChzdG9wID0+IHN0b3AuY29sb3IpO1xuICAgICAgICAgICAgYWNjID0gWy4uLmFjYywgLi4uY29sb3JzXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFsZXJ0KGBUaGlzIGZlYXR1cmUgZG9lcyBub3Qgd29yayB3aXRoIGltYWdlcyB8fCBzZWxlY3Rpb24gdy9vIGZpbGwgfHwgeW91IG5lZWQgdG8gc2VsZWN0IGEgbGF5ZXIgd2l0aCBhdCBsZWFzdCBhIGdyYWRpZW50IG9yIHNvbGlkIGZpbGxgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH0sIFtdKTtcbn07XG5jb25zdCB1bk5vcm1hbGl6ZUNvbG9ycyA9IChjb2xvcnMpID0+IHtcbiAgICByZXR1cm4gY29sb3JzLm1hcChjb2xvciA9PiAoe1xuICAgICAgICByOiBNYXRoLnJvdW5kKGNvbG9yLnIgKiAyNTUpLFxuICAgICAgICBnOiBNYXRoLnJvdW5kKGNvbG9yLmcgKiAyNTUpLFxuICAgICAgICBiOiBNYXRoLnJvdW5kKGNvbG9yLmIgKiAyNTUpXG4gICAgfSkpO1xufTtcbmNvbnN0IGJhc2UxNnRvMTAgPSAobnVtKSA9PiB7XG4gICAgY29uc3QgdHJhbnNsYXRlTGV0dGVyVG9OdW1iZXIgPSAobGV0dGVyT3JOdW1iZXIpID0+IHtcbiAgICAgICAgaWYgKGxldHRlck9yTnVtYmVyID09PSAnYScgfHwgbGV0dGVyT3JOdW1iZXIgPT09ICdBJykge1xuICAgICAgICAgICAgcmV0dXJuICcxMCc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGV0dGVyT3JOdW1iZXIgPT09ICdiJyB8fCBsZXR0ZXJPck51bWJlciA9PT0gJ0InKSB7XG4gICAgICAgICAgICByZXR1cm4gJzExJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsZXR0ZXJPck51bWJlciA9PT0gJ2MnIHx8IGxldHRlck9yTnVtYmVyID09PSAnQycpIHtcbiAgICAgICAgICAgIHJldHVybiAnMTInO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxldHRlck9yTnVtYmVyID09PSAnZCcgfHwgbGV0dGVyT3JOdW1iZXIgPT09ICdEJykge1xuICAgICAgICAgICAgcmV0dXJuICcxMyc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGV0dGVyT3JOdW1iZXIgPT09ICdlJyB8fCBsZXR0ZXJPck51bWJlciA9PT0gJ0UnKSB7XG4gICAgICAgICAgICByZXR1cm4gJzE0JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsZXR0ZXJPck51bWJlciA9PT0gJ2YnIHx8IGxldHRlck9yTnVtYmVyID09PSAnRicpIHtcbiAgICAgICAgICAgIHJldHVybiAnMTUnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGxldHRlck9yTnVtYmVyO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBsZXQgc3BsaXROdW0gPSBudW0uc3BsaXQoXCJcIikucmV2ZXJzZSgpO1xuICAgIGxldCByZXN1bHQgPSBzcGxpdE51bS5yZWR1Y2UoKGFjYywgY3VyciwgaWR4KSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZ3VyZSA9IHBhcnNlSW50KHRyYW5zbGF0ZUxldHRlclRvTnVtYmVyKGN1cnIpKSAqIE1hdGgucG93KDE2LCBpZHgpO1xuICAgICAgICBhY2MgKz0gZmlndXJlO1xuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH0sIDApO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuY29uc3QgYmFzZTEwdG8xNiA9IChudW0pID0+IHtcbiAgICBsZXQgZGl2aXNpb25SZXN1bHQgPSBudW07XG4gICAgbGV0IHJlbWFpbmRlckFyciA9IFtdO1xuICAgIHdoaWxlIChkaXZpc2lvblJlc3VsdCAhPT0gMCkge1xuICAgICAgICBsZXQgZGl2aXNpb25SZW1haW5kZXIgPSBkaXZpc2lvblJlc3VsdCAlIDE2O1xuICAgICAgICByZW1haW5kZXJBcnIucHVzaChkaXZpc2lvblJlbWFpbmRlcik7XG4gICAgICAgIGRpdmlzaW9uUmVzdWx0ID0gTWF0aC5mbG9vcihkaXZpc2lvblJlc3VsdCAvIDE2KTtcbiAgICB9XG4gICAgcmVtYWluZGVyQXJyID0gcmVtYWluZGVyQXJyLm1hcChyZW1haW5kZXIgPT4ge1xuICAgICAgICBzd2l0Y2ggKHJlbWFpbmRlcikge1xuICAgICAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0EnO1xuICAgICAgICAgICAgY2FzZSAxMTpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0InO1xuICAgICAgICAgICAgY2FzZSAxMjpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0MnO1xuICAgICAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0QnO1xuICAgICAgICAgICAgY2FzZSAxNDpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0UnO1xuICAgICAgICAgICAgY2FzZSAxNTpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0YnO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVtYWluZGVyLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVtYWluZGVyQXJyLnJldmVyc2UoKS5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjICsgY3VyciwgXCJcIik7XG59O1xuY29uc3QgaGV4VG9SR0JBID0gKGhleCwgYWxwaGEgPSAwKSA9PiB7XG4gICAgY29uc3QgcmVkSGV4ID0gaGV4LnNsaWNlKDEsIDMpO1xuICAgIGNvbnN0IGdyZWVuSGV4ID0gaGV4LnNsaWNlKDMsIDUpO1xuICAgIGNvbnN0IGJsdWVIZXggPSBoZXguc2xpY2UoNSwgNyk7XG4gICAgY29uc3QgcmVkQ2hhbm5lbCA9IGJhc2UxNnRvMTAocmVkSGV4KTtcbiAgICBjb25zdCBncmVlbkNoYW5uZWwgPSBiYXNlMTZ0bzEwKGdyZWVuSGV4KTtcbiAgICBjb25zdCBibHVlQ2hhbm5lbCA9IGJhc2UxNnRvMTAoYmx1ZUhleCk7XG4gICAgY29uc29sZS5sb2coJ2h1aGEnLCByZWRDaGFubmVsLCBncmVlbkNoYW5uZWwsIGJsdWVDaGFubmVsKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByOiByZWRDaGFubmVsIC8gMjU1LFxuICAgICAgICBnOiBncmVlbkNoYW5uZWwgLyAyNTUsXG4gICAgICAgIGI6IGJsdWVDaGFubmVsIC8gMjU1LFxuICAgICAgICBhOiBhbHBoYVxuICAgIH07XG59O1xuY29uc3QgcmdiYVRvSGV4ID0gKHsgciwgZywgYiB9KSA9PiB7XG4gICAgY29uc3QgcmVkQ2hhbm5lbCA9IGJhc2UxMHRvMTYocik7XG4gICAgY29uc3QgZ3JlZW5DaGFubmVsID0gYmFzZTEwdG8xNihnKTtcbiAgICBjb25zdCBibHVlQ2hhbm5lbCA9IGJhc2UxMHRvMTYoYik7XG4gICAgY29uc3QgaGV4Q29sb3IgPSBcIiNcIiArIHJlZENoYW5uZWwgKyBncmVlbkNoYW5uZWwgKyBibHVlQ2hhbm5lbDtcbiAgICByZXR1cm4gaGV4Q29sb3I7XG59O1xuY29uc3QgbGlnaHRlbkhleFRvUkdCQSA9IChoZXhDb2xvciwgYWxwaGEpID0+IHtcbiAgICBjb25zdCByZ2IgPSBoZXhUb1JHQkEoaGV4Q29sb3IpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHI6IE1hdGgubWluKDEsIHJnYi5yICogMS4xKSxcbiAgICAgICAgZzogTWF0aC5taW4oMSwgcmdiLmcgKiAxLjEpLFxuICAgICAgICBiOiBNYXRoLm1pbigxLCByZ2IuYiAqIDEuMSksXG4gICAgICAgIGE6IGFscGhhXG4gICAgfTtcbn07XG5jb25zdCByYWRpYWxUb3BMZWZ0VHggPSBbMC4zNTcyNTY0NzIxMTA3NDgzLCAwLjE2MDMxNTY2MjYyMjQ1MTc4LCAwLjQ5MjAxNjg1MTkwMjAwODA2XTtcbmNvbnN0IHJhZGlhbEJvdHRvbVJpZ2h0VHggPSBbLTAuMTYwMTI4NTMzODQwMTc5NDQsIDAuMTY1Mzg5MTM1NDc5OTI3MDYsIDAuNDk2NTE5NjU0OTg5MjQyNTVdO1xuY29uc3QgcmFkaWFsQm90dG9tTGVmdFR4ID0gWzAuMzg1MDMwMDAxNDAxOTAxMjUsIC0wLjEzNDI3NTUxMDkwNzE3MzE2LCAwLjYyNDg3Mjg2MzI5MjY5NDFdO1xuY29uc3QgcmFkaWFsVG9wUmlnaHRUeCA9IFswLjE2MTA4MTUzNzYwNDMzMTk3LCAwLjE2NjQzNTEwNzU4ODc2OCwgMC4zMzY0MzgyOTgyMjU0MDI4M107XG5jb25zdCBsaW5lYXJUb3BMZWZ0VHggPSBbMC43MTQ5MTEyODIwNjI1MzA1LCAwLjMyNjYyODU2NTc4ODI2OTA0LCAtMC4wMjIxNDcxNTA3MTAyMjUxMDVdO1xuY29uc3QgbGluZWFyQm90dG9tUmlnaHRUeCA9IFstMC4zMjU5ODE3OTU3ODc4MTEzLCAwLjMzMDgzMDY2MzQ0MjYxMTcsIDAuNDk3MDE0MDQ1NzE1MzMyMDNdO1xubGV0IGRlc2lyZWRGaWxsID0ge1xuICAgIHR5cGU6IFwiR1JBRElFTlRfUkFESUFMXCIsXG4gICAgdmlzaWJsZTogdHJ1ZSxcbiAgICBvcGFjaXR5OiAxLFxuICAgIGJsZW5kTW9kZTogXCJOT1JNQUxcIixcbiAgICBncmFkaWVudFN0b3BzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEsIGE6IDAuNDAgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAwXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEsIGE6IDAgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAxXG4gICAgICAgIH1cbiAgICBdLFxuICAgIGdyYWRpZW50VHJhbnNmb3JtOiBbXG4gICAgICAgIHJhZGlhbFRvcExlZnRUeCxcbiAgICAgICAgcmFkaWFsQm90dG9tUmlnaHRUeFxuICAgIF1cbn07XG5sZXQgZGVzaXJlZFN0cm9rZUxpZ2h0ZXJCZyA9IHtcbiAgICB0eXBlOiBcIkdSQURJRU5UX1JBRElBTFwiLFxuICAgIHZpc2libGU6IHRydWUsXG4gICAgb3BhY2l0eTogMSxcbiAgICBibGVuZE1vZGU6IFwiTk9STUFMXCIsXG4gICAgZ3JhZGllbnRTdG9wczogW1xuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAwLjQwNTcyOTE3NDYxMzk1MjY0LCBnOiAwLjYyNTgzNDE2NzAwMzYzMTYsIGI6IDAuNzkxNjY2Njg2NTM0ODgxNiwgYTogMSB9LFxuICAgICAgICAgICAgcG9zaXRpb246IDBcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgY29sb3I6IHsgcjogMC40MDM5MjE1NzQzNTQxNzE3NSwgZzogMC42Mjc0NTEwMDI1OTc4MDg4LCBiOiAwLjc5MjE1Njg3NTEzMzUxNDQsIGE6IDAgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAxXG4gICAgICAgIH1cbiAgICBdLFxuICAgIGdyYWRpZW50VHJhbnNmb3JtOiBbXG4gICAgICAgIHJhZGlhbFRvcExlZnRUeCxcbiAgICAgICAgcmFkaWFsQm90dG9tUmlnaHRUeFxuICAgIF1cbn07XG5sZXQgZGVzaXJlZFN0cm9rZURhcmtlckJnID0ge1xuICAgIHR5cGU6IFwiR1JBRElFTlRfUkFESUFMXCIsXG4gICAgdmlzaWJsZTogdHJ1ZSxcbiAgICBvcGFjaXR5OiAxLFxuICAgIGJsZW5kTW9kZTogXCJOT1JNQUxcIixcbiAgICBncmFkaWVudFN0b3BzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDAuMTkwNTU1NTcyNTA5NzY1NjIsIGc6IDAuNTQ3NjM0NTQxOTg4MzcyOCwgYjogMC44MTY2NjY2NjI2OTMwMjM3LCBhOiAxIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAwLjE5MjE1Njg2NjE5MjgxNzcsIGc6IDAuNTQ5MDE5NjM0NzIzNjYzMywgYjogMC44MTU2ODYyODU0OTU3NTgxLCBhOiAwIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMVxuICAgICAgICB9XG4gICAgXSxcbiAgICBncmFkaWVudFRyYW5zZm9ybTogW1xuICAgICAgICByYWRpYWxCb3R0b21MZWZ0VHgsXG4gICAgICAgIHJhZGlhbFRvcFJpZ2h0VHhcbiAgICBdXG59O1xubGV0IGRlc2lyZWRTdHJva2VMaWdodFNvdXJjZSA9IHtcbiAgICB0eXBlOiBcIkdSQURJRU5UX0xJTkVBUlwiLFxuICAgIHZpc2libGU6IHRydWUsXG4gICAgb3BhY2l0eTogMSxcbiAgICBibGVuZE1vZGU6IFwiTk9STUFMXCIsXG4gICAgZ3JhZGllbnRTdG9wczogW1xuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAxLCBnOiAxLCBiOiAxLCBhOiAwLjkwIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAxLCBnOiAxLCBiOiAxLCBhOiAwIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMVxuICAgICAgICB9XG4gICAgXSxcbiAgICBncmFkaWVudFRyYW5zZm9ybTogW1xuICAgICAgICBsaW5lYXJUb3BMZWZ0VHgsXG4gICAgICAgIGxpbmVhckJvdHRvbVJpZ2h0VHhcbiAgICBdXG59O1xuY29uc3QgZGVzaXJlZFN0cm9rZVdlaWdodCA9IDM7XG5jb25zdCBkZXNpcmVkRWZmZWN0cyA9IFtcbiAgICB7IHR5cGU6IFwiQkFDS0dST1VORF9CTFVSXCIsIHJhZGl1czogNDIsIHZpc2libGU6IHRydWUgfVxuXTtcbi8vIGNvbnN0IHByZUdsYXNzQXJyYXkgPSBbXVxuY29uc3QgZ2xhc3NpZnkgPSAobm9kZSwgbGlnaHRJbnRlbnNpdHksIGxpZ2h0Q29sb3IsIGJnQ29sb3IsIHN0cm9rZVdlaWdodCwgYmx1cikgPT4ge1xuICAgIC8vY2hhbmdlIHRoZSBjb2xvciBvZiB0aGUgbGlnaHQgYXQgdGhlIGVkZ2Ugb2YgdGhlIHN0cm9rZSBmYWNpbmcgdGhlIGxpZ2h0IHNvdXJjZVxuICAgIGRlc2lyZWRTdHJva2VMaWdodFNvdXJjZS5ncmFkaWVudFN0b3BzWzBdLmNvbG9yID0gaGV4VG9SR0JBKGxpZ2h0Q29sb3IsIGxpZ2h0SW50ZW5zaXR5IC8gMTAwKTtcbiAgICAvL2NoYW5nZSB0aGUgYWxwaGEgKHJlcHJlc2VudGluZyB0aGUgbGlnaHQgYnJpZ2h0bmVzcy9pbnRlbnNpdHkpIGF0IHRoZSBlZGdlIG9mIHRoZSBzdHJva2UgZmFjaW5nIHRoZSBsaWdodCBzb3VyY2VcbiAgICAvLyBkZXNpcmVkU3Ryb2tlTGlnaHRTb3VyY2UuZ3JhZGllbnRTdG9wc1swXS5jb2xvci5hID0gbGlnaHRJbnRlbnNpdHkgLyAxMDA7XG4gICAgLy9jaGFuZ2UgdGhlIGNvbG9yIG9mIHRoZSBsaWdodCBhdCB0aGUgZWRnZSBvZiB0aGUgc3Ryb2tlIGF3YXkgZnJvbSB0aGUgbGlnaHQgc291cmNlXG4gICAgZGVzaXJlZFN0cm9rZUxpZ2h0U291cmNlLmdyYWRpZW50U3RvcHNbMV0uY29sb3IgPSBoZXhUb1JHQkEobGlnaHRDb2xvcik7XG4gICAgLy9jaGFuZ2UgdGhlIGNvbG9yIG9mIHRoZSBsaWdodCB0aGF0IGFmZmVjdHMgdGhlIGZpbGwgb2YgdGhlIHNoYXBlXG4gICAgZGVzaXJlZEZpbGwuZ3JhZGllbnRTdG9wc1swXS5jb2xvciA9IGhleFRvUkdCQShsaWdodENvbG9yLCAwLjQwKTtcbiAgICBkZXNpcmVkU3Ryb2tlTGlnaHRlckJnLmdyYWRpZW50U3RvcHNbMF0uY29sb3IgPSBsaWdodGVuSGV4VG9SR0JBKGJnQ29sb3IsIDApO1xuICAgIGRlc2lyZWRTdHJva2VMaWdodGVyQmcuZ3JhZGllbnRTdG9wc1sxXS5jb2xvciA9IGxpZ2h0ZW5IZXhUb1JHQkEoYmdDb2xvciwgMSk7XG4gICAgZGVzaXJlZFN0cm9rZURhcmtlckJnLmdyYWRpZW50U3RvcHNbMF0uY29sb3IgPSBsaWdodGVuSGV4VG9SR0JBKGJnQ29sb3IsIDApO1xuICAgIGRlc2lyZWRTdHJva2VEYXJrZXJCZy5ncmFkaWVudFN0b3BzWzFdLmNvbG9yID0gbGlnaHRlbkhleFRvUkdCQShiZ0NvbG9yLCAxKTtcbiAgICBkZXNpcmVkRWZmZWN0cy5maW5kKGVmZmVjdCA9PiBlZmZlY3QudHlwZSA9PT0gXCJCQUNLR1JPVU5EX0JMVVJcIikucmFkaXVzID0gYmx1cjtcbiAgICAvLyBjb25zdCBwcmVHbGFzcyA9IHtcbiAgICAvLyAgICAgaWQ6IG5vZGUuaWQsXG4gICAgLy8gICAgIGZpbGxzOiBub2RlW1wiZmlsbHNcIl0sXG4gICAgLy8gICAgIHN0cm9rZXM6IG5vZGVbXCJzdHJva2VzXCJdLFxuICAgIC8vICAgICBzdHJva2VXZWlnaHQ6IG5vZGVbXCJzdHJva2VXZWlnaHRcIl0sXG4gICAgLy8gICAgIGVmZmVjdHM6IG5vZGVbXCJlZmZlY3RzXCJdXG4gICAgLy8gfVxuICAgIC8vIGNvbnN0IGhhc0JlZW5BZGRlZEluZGV4ID0gcHJlR2xhc3NBcnJheS5maW5kSW5kZXgocHJlR2xhc3MgPT4gcHJlR2xhc3MuaWQgPT09IG5vZGUuaWQpXG4gICAgLy8gaWYgKGhhc0JlZW5BZGRlZEluZGV4ID49IDApIHtcbiAgICAvLyAgICAgcHJlR2xhc3NBcnJheVtoYXNCZWVuQWRkZWRJbmRleF0gPSBwcmVHbGFzcztcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgICBwcmVHbGFzc0FycmF5LnB1c2gocHJlR2xhc3MpO1xuICAgIC8vIH1cbiAgICBjb25zb2xlLmxvZygncnViYmlzaD8nLCBkZXNpcmVkU3Ryb2tlTGlnaHRTb3VyY2UsIGRlc2lyZWRTdHJva2VMaWdodGVyQmcsIGRlc2lyZWRTdHJva2VEYXJrZXJCZyk7XG4gICAgbm9kZVtcImZpbGxzXCJdID0gW2Rlc2lyZWRGaWxsXTtcbiAgICBub2RlW1wic3Ryb2tlc1wiXSA9IFtkZXNpcmVkU3Ryb2tlTGlnaHRlckJnLCBkZXNpcmVkU3Ryb2tlRGFya2VyQmcsIGRlc2lyZWRTdHJva2VMaWdodFNvdXJjZV07XG4gICAgbm9kZVtcInN0cm9rZVdlaWdodFwiXSA9IHN0cm9rZVdlaWdodDtcbiAgICBub2RlW1wiZWZmZWN0c1wiXSA9IGRlc2lyZWRFZmZlY3RzO1xufTtcbi8vIGNvbnN0IHVuZG8gPSAobm9kZTogU2NlbmVOb2RlKSA9PiB7XG4vLyAgICAgY29uc3QgcHJlR2xhc3MgPSBwcmVHbGFzc0FycmF5LmZpbmQocHJlR2xhc3MgPT4gcHJlR2xhc3MuaWQgPT09IG5vZGUuaWQpO1xuLy8gICAgIGlmIChwcmVHbGFzcykge1xuLy8gICAgICAgICBub2RlW1wiZmlsbHNcIl0gPSBwcmVHbGFzcy5maWxscztcbi8vICAgICAgICAgbm9kZVtcInN0cm9rZXNcIl0gPSBwcmVHbGFzcy5zdHJva2VzO1xuLy8gICAgICAgICBub2RlW1wic3Ryb2tlV2VpZ2h0XCJdID0gcHJlR2xhc3Muc3Ryb2tlV2VpZ2h0O1xuLy8gICAgICAgICBub2RlW1wiZWZmZWN0c1wiXSA9IHByZUdsYXNzLmVmZmVjdHM7XG4vLyAgICAgfVxuLy8gfVxuIl0sInNvdXJjZVJvb3QiOiIifQ==