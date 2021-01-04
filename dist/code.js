/******/ (() => { // webpackBootstrap
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
figma.ui.onmessage = msg => {
    if (msg.type === 'create-rectangles') {
        const nodes = [];
        for (let i = 0; i < msg.count; i++) {
            const rect = figma.createRectangle();
            rect.x = i * 150;
            rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
            figma.currentPage.appendChild(rect);
            nodes.push(rect);
        }
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
    }
    figma.closePlugin();
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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9HbGFzc2lmeS8uL3NyYy9jb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsZUFBZTtBQUN0QztBQUNBO0FBQ0EsMkJBQTJCLHdCQUF3QixxQkFBcUIsRUFBRTtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFVBQVU7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGNBQWM7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsd0NBQXdDO0FBQ3RFO0FBQ0E7QUFDQSw4QkFBOEIseUNBQXlDO0FBQ3ZFO0FBQ0EsMEJBQTBCLHdEQUF3RDtBQUNsRjtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw0QkFBNEI7QUFDaEQ7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IseUJBQXlCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw2RUFBNkU7QUFDakc7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IsNkVBQTZFO0FBQ2pHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw2RUFBNkU7QUFDakc7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IsNEVBQTRFO0FBQ2hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw0QkFBNEI7QUFDaEQ7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxvQkFBb0IseUJBQXlCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsZUFBZTtBQUN6QztBQUNBO0FBQ0EsNEJBQTRCLHVCQUF1QixvQkFBb0I7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvZGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmaWdtYS51aS5vbm1lc3NhZ2UgPSBtc2cgPT4ge1xuICAgIGlmIChtc2cudHlwZSA9PT0gJ2NyZWF0ZS1yZWN0YW5nbGVzJykge1xuICAgICAgICBjb25zdCBub2RlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1zZy5jb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCByZWN0ID0gZmlnbWEuY3JlYXRlUmVjdGFuZ2xlKCk7XG4gICAgICAgICAgICByZWN0LnggPSBpICogMTUwO1xuICAgICAgICAgICAgcmVjdC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDEsIGc6IDAuNSwgYjogMCB9IH1dO1xuICAgICAgICAgICAgZmlnbWEuY3VycmVudFBhZ2UuYXBwZW5kQ2hpbGQocmVjdCk7XG4gICAgICAgICAgICBub2Rlcy5wdXNoKHJlY3QpO1xuICAgICAgICB9XG4gICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IG5vZGVzO1xuICAgICAgICBmaWdtYS52aWV3cG9ydC5zY3JvbGxBbmRab29tSW50b1ZpZXcobm9kZXMpO1xuICAgIH1cbiAgICBmaWdtYS5jbG9zZVBsdWdpbigpO1xufTtcbi8vIEhFTFBFUiBGVU5DVElPTlNcbmZ1bmN0aW9uIGNsb25lKHZhbCkge1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsO1xuICAgIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09ICd1bmRlZmluZWQnIHx8IHR5cGUgPT09ICdudW1iZXInIHx8XG4gICAgICAgIHR5cGUgPT09ICdzdHJpbmcnIHx8IHR5cGUgPT09ICdib29sZWFuJykge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwubWFwKHggPT4gY2xvbmUoeCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSh2YWwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IG8gPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHZhbCkge1xuICAgICAgICAgICAgICAgIG9ba2V5XSA9IGNsb25lKHZhbFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRocm93ICd1bmtub3duJztcbn1cbjtcbmNvbnN0IGdldEJnTGF5ZXJDb2xvcnMgPSAoZmlsbHMpID0+IHtcbiAgICByZXR1cm4gZmlsbHMucmVkdWNlKChhY2MsIGN1cnIpID0+IHtcbiAgICAgICAgaWYgKGN1cnIudHlwZSA9PT0gJ1NPTElEJykge1xuICAgICAgICAgICAgYWNjLnB1c2goY3Vyci5jb2xvcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY3Vyci50eXBlLnN0YXJ0c1dpdGgoJ0dSQURJRU5UJykpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9ycyA9IGN1cnIuZ3JhZGllbnRTdG9wcy5tYXAoc3RvcCA9PiBzdG9wLmNvbG9yKTtcbiAgICAgICAgICAgIGFjYyA9IFsuLi5hY2MsIC4uLmNvbG9yc107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhbGVydChgVGhpcyBmZWF0dXJlIGRvZXMgbm90IHdvcmsgd2l0aCBpbWFnZXMgfHwgc2VsZWN0aW9uIHcvbyBmaWxsIHx8IHlvdSBuZWVkIHRvIHNlbGVjdCBhIGxheWVyIHdpdGggYXQgbGVhc3QgYSBncmFkaWVudCBvciBzb2xpZCBmaWxsYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCBbXSk7XG59O1xuY29uc3QgdW5Ob3JtYWxpemVDb2xvcnMgPSAoY29sb3JzKSA9PiB7XG4gICAgcmV0dXJuIGNvbG9ycy5tYXAoY29sb3IgPT4gKHtcbiAgICAgICAgcjogTWF0aC5yb3VuZChjb2xvci5yICogMjU1KSxcbiAgICAgICAgZzogTWF0aC5yb3VuZChjb2xvci5nICogMjU1KSxcbiAgICAgICAgYjogTWF0aC5yb3VuZChjb2xvci5iICogMjU1KVxuICAgIH0pKTtcbn07XG5jb25zdCBiYXNlMTZ0bzEwID0gKG51bSkgPT4ge1xuICAgIGNvbnN0IHRyYW5zbGF0ZUxldHRlclRvTnVtYmVyID0gKGxldHRlck9yTnVtYmVyKSA9PiB7XG4gICAgICAgIGlmIChsZXR0ZXJPck51bWJlciA9PT0gJ2EnIHx8IGxldHRlck9yTnVtYmVyID09PSAnQScpIHtcbiAgICAgICAgICAgIHJldHVybiAnMTAnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxldHRlck9yTnVtYmVyID09PSAnYicgfHwgbGV0dGVyT3JOdW1iZXIgPT09ICdCJykge1xuICAgICAgICAgICAgcmV0dXJuICcxMSc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGV0dGVyT3JOdW1iZXIgPT09ICdjJyB8fCBsZXR0ZXJPck51bWJlciA9PT0gJ0MnKSB7XG4gICAgICAgICAgICByZXR1cm4gJzEyJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsZXR0ZXJPck51bWJlciA9PT0gJ2QnIHx8IGxldHRlck9yTnVtYmVyID09PSAnRCcpIHtcbiAgICAgICAgICAgIHJldHVybiAnMTMnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxldHRlck9yTnVtYmVyID09PSAnZScgfHwgbGV0dGVyT3JOdW1iZXIgPT09ICdFJykge1xuICAgICAgICAgICAgcmV0dXJuICcxNCc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGV0dGVyT3JOdW1iZXIgPT09ICdmJyB8fCBsZXR0ZXJPck51bWJlciA9PT0gJ0YnKSB7XG4gICAgICAgICAgICByZXR1cm4gJzE1JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBsZXR0ZXJPck51bWJlcjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbGV0IHNwbGl0TnVtID0gbnVtLnNwbGl0KFwiXCIpLnJldmVyc2UoKTtcbiAgICBsZXQgcmVzdWx0ID0gc3BsaXROdW0ucmVkdWNlKChhY2MsIGN1cnIsIGlkeCkgPT4ge1xuICAgICAgICBjb25zdCBmaWd1cmUgPSBwYXJzZUludCh0cmFuc2xhdGVMZXR0ZXJUb051bWJlcihjdXJyKSkgKiBNYXRoLnBvdygxNiwgaWR4KTtcbiAgICAgICAgYWNjICs9IGZpZ3VyZTtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCAwKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbmNvbnN0IGJhc2UxMHRvMTYgPSAobnVtKSA9PiB7XG4gICAgbGV0IGRpdmlzaW9uUmVzdWx0ID0gbnVtO1xuICAgIGxldCByZW1haW5kZXJBcnIgPSBbXTtcbiAgICB3aGlsZSAoZGl2aXNpb25SZXN1bHQgIT09IDApIHtcbiAgICAgICAgbGV0IGRpdmlzaW9uUmVtYWluZGVyID0gZGl2aXNpb25SZXN1bHQgJSAxNjtcbiAgICAgICAgcmVtYWluZGVyQXJyLnB1c2goZGl2aXNpb25SZW1haW5kZXIpO1xuICAgICAgICBkaXZpc2lvblJlc3VsdCA9IE1hdGguZmxvb3IoZGl2aXNpb25SZXN1bHQgLyAxNik7XG4gICAgfVxuICAgIHJlbWFpbmRlckFyciA9IHJlbWFpbmRlckFyci5tYXAocmVtYWluZGVyID0+IHtcbiAgICAgICAgc3dpdGNoIChyZW1haW5kZXIpIHtcbiAgICAgICAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdBJztcbiAgICAgICAgICAgIGNhc2UgMTE6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdCJztcbiAgICAgICAgICAgIGNhc2UgMTI6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdDJztcbiAgICAgICAgICAgIGNhc2UgMTM6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdEJztcbiAgICAgICAgICAgIGNhc2UgMTQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdFJztcbiAgICAgICAgICAgIGNhc2UgMTU6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdGJztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlbWFpbmRlci50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlbWFpbmRlckFyci5yZXZlcnNlKCkucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYyArIGN1cnIsIFwiXCIpO1xufTtcbmNvbnN0IGhleFRvUkdCQSA9IChoZXgsIGFscGhhID0gMCkgPT4ge1xuICAgIGNvbnN0IHJlZEhleCA9IGhleC5zbGljZSgxLCAzKTtcbiAgICBjb25zdCBncmVlbkhleCA9IGhleC5zbGljZSgzLCA1KTtcbiAgICBjb25zdCBibHVlSGV4ID0gaGV4LnNsaWNlKDUsIDcpO1xuICAgIGNvbnN0IHJlZENoYW5uZWwgPSBiYXNlMTZ0bzEwKHJlZEhleCk7XG4gICAgY29uc3QgZ3JlZW5DaGFubmVsID0gYmFzZTE2dG8xMChncmVlbkhleCk7XG4gICAgY29uc3QgYmx1ZUNoYW5uZWwgPSBiYXNlMTZ0bzEwKGJsdWVIZXgpO1xuICAgIGNvbnNvbGUubG9nKCdodWhhJywgcmVkQ2hhbm5lbCwgZ3JlZW5DaGFubmVsLCBibHVlQ2hhbm5lbCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcjogcmVkQ2hhbm5lbCAvIDI1NSxcbiAgICAgICAgZzogZ3JlZW5DaGFubmVsIC8gMjU1LFxuICAgICAgICBiOiBibHVlQ2hhbm5lbCAvIDI1NSxcbiAgICAgICAgYTogYWxwaGFcbiAgICB9O1xufTtcbmNvbnN0IHJnYmFUb0hleCA9ICh7IHIsIGcsIGIgfSkgPT4ge1xuICAgIGNvbnN0IHJlZENoYW5uZWwgPSBiYXNlMTB0bzE2KHIpO1xuICAgIGNvbnN0IGdyZWVuQ2hhbm5lbCA9IGJhc2UxMHRvMTYoZyk7XG4gICAgY29uc3QgYmx1ZUNoYW5uZWwgPSBiYXNlMTB0bzE2KGIpO1xuICAgIGNvbnN0IGhleENvbG9yID0gXCIjXCIgKyByZWRDaGFubmVsICsgZ3JlZW5DaGFubmVsICsgYmx1ZUNoYW5uZWw7XG4gICAgcmV0dXJuIGhleENvbG9yO1xufTtcbmNvbnN0IGxpZ2h0ZW5IZXhUb1JHQkEgPSAoaGV4Q29sb3IsIGFscGhhKSA9PiB7XG4gICAgY29uc3QgcmdiID0gaGV4VG9SR0JBKGhleENvbG9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByOiBNYXRoLm1pbigxLCByZ2IuciAqIDEuMSksXG4gICAgICAgIGc6IE1hdGgubWluKDEsIHJnYi5nICogMS4xKSxcbiAgICAgICAgYjogTWF0aC5taW4oMSwgcmdiLmIgKiAxLjEpLFxuICAgICAgICBhOiBhbHBoYVxuICAgIH07XG59O1xuLy8gY29uc3QgZGFya2VuSGV4VG9SR0JBID0gKGhleENvbG9yLCBhbHBoYTogbnVtYmVyKSA9PiB7XG4vLyAgIGNvbnN0IHJnYiA9IGhleFRvUkdCQShoZXhDb2xvcik7XG4vLyAgIHJldHVybiB7XG4vLyAgICAgcjogTWF0aC5tYXgoMCwgcmdiLnIgKiAwLjkpLFxuLy8gICAgIGc6IE1hdGgubWF4KDAsIHJnYi5nICogMC45KSxcbi8vICAgICBiOiBNYXRoLm1heCgwLCByZ2IuYiAqIDAuOSksXG4vLyAgICAgYTogYWxwaGFcbi8vICAgfVxuLy8gfVxuLy8gVGhpcyBwbHVnaW4gd2lsbCBvcGVuIGEgd2luZG93IHRvIHByb21wdCB0aGUgdXNlciB0byBlbnRlciBhIG51bWJlciwgYW5kXG4vLyBpdCB3aWxsIHRoZW4gY3JlYXRlIHRoYXQgbWFueSByZWN0YW5nbGVzIG9uIHRoZSBzY3JlZW4uXG4vLyBUaGlzIGZpbGUgaG9sZHMgdGhlIG1haW4gY29kZSBmb3IgdGhlIHBsdWdpbnMuIEl0IGhhcyBhY2Nlc3MgdG8gdGhlICpkb2N1bWVudCouXG4vLyBZb3UgY2FuIGFjY2VzcyBicm93c2VyIEFQSXMgaW4gdGhlIDxzY3JpcHQ+IHRhZyBpbnNpZGUgXCJ1aS5odG1sXCIgd2hpY2ggaGFzIGFcbi8vIGZ1bGwgYnJvd3NlciBlbnZpcm9ubWVudCAoc2VlIGRvY3VtZW50YXRpb24pLlxuLy8gVGhpcyBzaG93cyB0aGUgSFRNTCBwYWdlIGluIFwidWkuaHRtbFwiLlxuZmlnbWEuc2hvd1VJKF9faHRtbF9fLCB7IGhlaWdodDogMzYwIH0pO1xuZmlnbWEub24oJ3NlbGVjdGlvbmNoYW5nZScsICgpID0+IHtcbiAgICAvLyBjb25zdCBuZXdOb2RlID0gZmlnbWEuY3JlYXRlTm9kZUZyb21TdmcoZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uLm1hcChub2RlID0+IG5vZGUudmVjdG9yUGF0aHNbMF0pWzBdLmRhdGEpXG4gICAgY29uc3QgYmdMYXllckNvbG9ycyA9IGdldEJnTGF5ZXJDb2xvcnMoZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uWzBdWydmaWxscyddKTtcbiAgICBjb25zdCB1bk5vcm1hbGl6ZWRCZ0xheWVyQ29sb3JzID0gdW5Ob3JtYWxpemVDb2xvcnMoYmdMYXllckNvbG9ycyk7XG4gICAgY29uc3QgaGV4QmdMYXllckNvbG9ycyA9IHVuTm9ybWFsaXplZEJnTGF5ZXJDb2xvcnMubWFwKGNvbG9yID0+IHJnYmFUb0hleChjb2xvcikpO1xuICAgIGNvbnN0IHVuaXF1ZUNvbG9ycyA9IFsuLi5uZXcgU2V0KGhleEJnTGF5ZXJDb2xvcnMpXTtcbiAgICBpZiAodW5pcXVlQ29sb3JzLmxlbmd0aCkge1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdzZWxlY3Rpb24tbWFkZScsIGlzVmFsaWQ6IHRydWUgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdzZWxlY3Rpb24tbWFkZScsIGlzVmFsaWQ6IGZhbHNlIH0pO1xuICAgIH1cbiAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdyZWZyYWN0ZWQtY29sb3Itb3B0aW9ucycsIGNvbG9yczogdW5pcXVlQ29sb3JzIH0pO1xuICAgIGNvbnNvbGUubG9nKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvblswXSwgdW5Ob3JtYWxpemVkQmdMYXllckNvbG9ycywgaGV4QmdMYXllckNvbG9ycywgdW5pcXVlQ29sb3JzKTtcbn0pO1xuY29uc3QgcmFkaWFsVG9wTGVmdFR4ID0gWzAuMzU3MjU2NDcyMTEwNzQ4MywgMC4xNjAzMTU2NjI2MjI0NTE3OCwgMC40OTIwMTY4NTE5MDIwMDgwNl07XG5jb25zdCByYWRpYWxCb3R0b21SaWdodFR4ID0gWy0wLjE2MDEyODUzMzg0MDE3OTQ0LCAwLjE2NTM4OTEzNTQ3OTkyNzA2LCAwLjQ5NjUxOTY1NDk4OTI0MjU1XTtcbmNvbnN0IHJhZGlhbEJvdHRvbUxlZnRUeCA9IFswLjM4NTAzMDAwMTQwMTkwMTI1LCAtMC4xMzQyNzU1MTA5MDcxNzMxNiwgMC42MjQ4NzI4NjMyOTI2OTQxXTtcbmNvbnN0IHJhZGlhbFRvcFJpZ2h0VHggPSBbMC4xNjEwODE1Mzc2MDQzMzE5NywgMC4xNjY0MzUxMDc1ODg3NjgsIDAuMzM2NDM4Mjk4MjI1NDAyODNdO1xuY29uc3QgbGluZWFyVG9wTGVmdFR4ID0gWzAuNzE0OTExMjgyMDYyNTMwNSwgMC4zMjY2Mjg1NjU3ODgyNjkwNCwgLTAuMDIyMTQ3MTUwNzEwMjI1MTA1XTtcbmNvbnN0IGxpbmVhckJvdHRvbVJpZ2h0VHggPSBbLTAuMzI1OTgxNzk1Nzg3ODExMywgMC4zMzA4MzA2NjM0NDI2MTE3LCAwLjQ5NzAxNDA0NTcxNTMzMjAzXTtcbmxldCBkZXNpcmVkRmlsbCA9IHtcbiAgICB0eXBlOiBcIkdSQURJRU5UX1JBRElBTFwiLFxuICAgIHZpc2libGU6IHRydWUsXG4gICAgb3BhY2l0eTogMSxcbiAgICBibGVuZE1vZGU6IFwiTk9STUFMXCIsXG4gICAgZ3JhZGllbnRTdG9wczogW1xuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAxLCBnOiAxLCBiOiAxLCBhOiAwLjQwIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAxLCBnOiAxLCBiOiAxLCBhOiAwIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMVxuICAgICAgICB9XG4gICAgXSxcbiAgICBncmFkaWVudFRyYW5zZm9ybTogW1xuICAgICAgICByYWRpYWxUb3BMZWZ0VHgsXG4gICAgICAgIHJhZGlhbEJvdHRvbVJpZ2h0VHhcbiAgICBdXG59O1xubGV0IGRlc2lyZWRTdHJva2VMaWdodGVyQmcgPSB7XG4gICAgdHlwZTogXCJHUkFESUVOVF9SQURJQUxcIixcbiAgICB2aXNpYmxlOiB0cnVlLFxuICAgIG9wYWNpdHk6IDEsXG4gICAgYmxlbmRNb2RlOiBcIk5PUk1BTFwiLFxuICAgIGdyYWRpZW50U3RvcHM6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgY29sb3I6IHsgcjogMC40MDU3MjkxNzQ2MTM5NTI2NCwgZzogMC42MjU4MzQxNjcwMDM2MzE2LCBiOiAwLjc5MTY2NjY4NjUzNDg4MTYsIGE6IDEgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAwXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDAuNDAzOTIxNTc0MzU0MTcxNzUsIGc6IDAuNjI3NDUxMDAyNTk3ODA4OCwgYjogMC43OTIxNTY4NzUxMzM1MTQ0LCBhOiAwIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMVxuICAgICAgICB9XG4gICAgXSxcbiAgICBncmFkaWVudFRyYW5zZm9ybTogW1xuICAgICAgICByYWRpYWxUb3BMZWZ0VHgsXG4gICAgICAgIHJhZGlhbEJvdHRvbVJpZ2h0VHhcbiAgICBdXG59O1xubGV0IGRlc2lyZWRTdHJva2VEYXJrZXJCZyA9IHtcbiAgICB0eXBlOiBcIkdSQURJRU5UX1JBRElBTFwiLFxuICAgIHZpc2libGU6IHRydWUsXG4gICAgb3BhY2l0eTogMSxcbiAgICBibGVuZE1vZGU6IFwiTk9STUFMXCIsXG4gICAgZ3JhZGllbnRTdG9wczogW1xuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAwLjE5MDU1NTU3MjUwOTc2NTYyLCBnOiAwLjU0NzYzNDU0MTk4ODM3MjgsIGI6IDAuODE2NjY2NjYyNjkzMDIzNywgYTogMSB9LFxuICAgICAgICAgICAgcG9zaXRpb246IDBcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgY29sb3I6IHsgcjogMC4xOTIxNTY4NjYxOTI4MTc3LCBnOiAwLjU0OTAxOTYzNDcyMzY2MzMsIGI6IDAuODE1Njg2Mjg1NDk1NzU4MSwgYTogMCB9LFxuICAgICAgICAgICAgcG9zaXRpb246IDFcbiAgICAgICAgfVxuICAgIF0sXG4gICAgZ3JhZGllbnRUcmFuc2Zvcm06IFtcbiAgICAgICAgcmFkaWFsQm90dG9tTGVmdFR4LFxuICAgICAgICByYWRpYWxUb3BSaWdodFR4XG4gICAgXVxufTtcbmxldCBkZXNpcmVkU3Ryb2tlTGlnaHRTb3VyY2UgPSB7XG4gICAgdHlwZTogXCJHUkFESUVOVF9MSU5FQVJcIixcbiAgICB2aXNpYmxlOiB0cnVlLFxuICAgIG9wYWNpdHk6IDEsXG4gICAgYmxlbmRNb2RlOiBcIk5PUk1BTFwiLFxuICAgIGdyYWRpZW50U3RvcHM6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgY29sb3I6IHsgcjogMSwgZzogMSwgYjogMSwgYTogMC45MCB9LFxuICAgICAgICAgICAgcG9zaXRpb246IDBcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgY29sb3I6IHsgcjogMSwgZzogMSwgYjogMSwgYTogMCB9LFxuICAgICAgICAgICAgcG9zaXRpb246IDFcbiAgICAgICAgfVxuICAgIF0sXG4gICAgZ3JhZGllbnRUcmFuc2Zvcm06IFtcbiAgICAgICAgbGluZWFyVG9wTGVmdFR4LFxuICAgICAgICBsaW5lYXJCb3R0b21SaWdodFR4XG4gICAgXVxufTtcbmNvbnN0IGRlc2lyZWRTdHJva2VXZWlnaHQgPSAzO1xuY29uc3QgZGVzaXJlZEVmZmVjdHMgPSBbXG4gICAgeyB0eXBlOiBcIkJBQ0tHUk9VTkRfQkxVUlwiLCByYWRpdXM6IDQyLCB2aXNpYmxlOiB0cnVlIH1cbl07XG4vLyBjb25zdCBwcmVHbGFzc0FycmF5ID0gW11cbmNvbnN0IGdsYXNzaWZ5ID0gKG5vZGUsIGxpZ2h0SW50ZW5zaXR5LCBsaWdodENvbG9yLCBiZ0NvbG9yLCBzdHJva2VXZWlnaHQsIGJsdXIpID0+IHtcbiAgICAvL2NoYW5nZSB0aGUgY29sb3Igb2YgdGhlIGxpZ2h0IGF0IHRoZSBlZGdlIG9mIHRoZSBzdHJva2UgZmFjaW5nIHRoZSBsaWdodCBzb3VyY2VcbiAgICBkZXNpcmVkU3Ryb2tlTGlnaHRTb3VyY2UuZ3JhZGllbnRTdG9wc1swXS5jb2xvciA9IGhleFRvUkdCQShsaWdodENvbG9yLCBsaWdodEludGVuc2l0eSAvIDEwMCk7XG4gICAgLy9jaGFuZ2UgdGhlIGFscGhhIChyZXByZXNlbnRpbmcgdGhlIGxpZ2h0IGJyaWdodG5lc3MvaW50ZW5zaXR5KSBhdCB0aGUgZWRnZSBvZiB0aGUgc3Ryb2tlIGZhY2luZyB0aGUgbGlnaHQgc291cmNlXG4gICAgLy8gZGVzaXJlZFN0cm9rZUxpZ2h0U291cmNlLmdyYWRpZW50U3RvcHNbMF0uY29sb3IuYSA9IGxpZ2h0SW50ZW5zaXR5IC8gMTAwO1xuICAgIC8vY2hhbmdlIHRoZSBjb2xvciBvZiB0aGUgbGlnaHQgYXQgdGhlIGVkZ2Ugb2YgdGhlIHN0cm9rZSBhd2F5IGZyb20gdGhlIGxpZ2h0IHNvdXJjZVxuICAgIGRlc2lyZWRTdHJva2VMaWdodFNvdXJjZS5ncmFkaWVudFN0b3BzWzFdLmNvbG9yID0gaGV4VG9SR0JBKGxpZ2h0Q29sb3IpO1xuICAgIC8vY2hhbmdlIHRoZSBjb2xvciBvZiB0aGUgbGlnaHQgdGhhdCBhZmZlY3RzIHRoZSBmaWxsIG9mIHRoZSBzaGFwZVxuICAgIGRlc2lyZWRGaWxsLmdyYWRpZW50U3RvcHNbMF0uY29sb3IgPSBoZXhUb1JHQkEobGlnaHRDb2xvciwgMC40MCk7XG4gICAgZGVzaXJlZFN0cm9rZUxpZ2h0ZXJCZy5ncmFkaWVudFN0b3BzWzBdLmNvbG9yID0gbGlnaHRlbkhleFRvUkdCQShiZ0NvbG9yLCAwKTtcbiAgICBkZXNpcmVkU3Ryb2tlTGlnaHRlckJnLmdyYWRpZW50U3RvcHNbMV0uY29sb3IgPSBsaWdodGVuSGV4VG9SR0JBKGJnQ29sb3IsIDEpO1xuICAgIGRlc2lyZWRTdHJva2VEYXJrZXJCZy5ncmFkaWVudFN0b3BzWzBdLmNvbG9yID0gbGlnaHRlbkhleFRvUkdCQShiZ0NvbG9yLCAwKTtcbiAgICBkZXNpcmVkU3Ryb2tlRGFya2VyQmcuZ3JhZGllbnRTdG9wc1sxXS5jb2xvciA9IGxpZ2h0ZW5IZXhUb1JHQkEoYmdDb2xvciwgMSk7XG4gICAgZGVzaXJlZEVmZmVjdHMuZmluZChlZmZlY3QgPT4gZWZmZWN0LnR5cGUgPT09IFwiQkFDS0dST1VORF9CTFVSXCIpLnJhZGl1cyA9IGJsdXI7XG4gICAgLy8gY29uc3QgcHJlR2xhc3MgPSB7XG4gICAgLy8gICAgIGlkOiBub2RlLmlkLFxuICAgIC8vICAgICBmaWxsczogbm9kZVtcImZpbGxzXCJdLFxuICAgIC8vICAgICBzdHJva2VzOiBub2RlW1wic3Ryb2tlc1wiXSxcbiAgICAvLyAgICAgc3Ryb2tlV2VpZ2h0OiBub2RlW1wic3Ryb2tlV2VpZ2h0XCJdLFxuICAgIC8vICAgICBlZmZlY3RzOiBub2RlW1wiZWZmZWN0c1wiXVxuICAgIC8vIH1cbiAgICAvLyBjb25zdCBoYXNCZWVuQWRkZWRJbmRleCA9IHByZUdsYXNzQXJyYXkuZmluZEluZGV4KHByZUdsYXNzID0+IHByZUdsYXNzLmlkID09PSBub2RlLmlkKVxuICAgIC8vIGlmIChoYXNCZWVuQWRkZWRJbmRleCA+PSAwKSB7XG4gICAgLy8gICAgIHByZUdsYXNzQXJyYXlbaGFzQmVlbkFkZGVkSW5kZXhdID0gcHJlR2xhc3M7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgICAgcHJlR2xhc3NBcnJheS5wdXNoKHByZUdsYXNzKTtcbiAgICAvLyB9XG4gICAgY29uc29sZS5sb2coJ3J1YmJpc2g/JywgZGVzaXJlZFN0cm9rZUxpZ2h0U291cmNlLCBkZXNpcmVkU3Ryb2tlTGlnaHRlckJnLCBkZXNpcmVkU3Ryb2tlRGFya2VyQmcpO1xuICAgIG5vZGVbXCJmaWxsc1wiXSA9IFtkZXNpcmVkRmlsbF07XG4gICAgbm9kZVtcInN0cm9rZXNcIl0gPSBbZGVzaXJlZFN0cm9rZUxpZ2h0ZXJCZywgZGVzaXJlZFN0cm9rZURhcmtlckJnLCBkZXNpcmVkU3Ryb2tlTGlnaHRTb3VyY2VdO1xuICAgIG5vZGVbXCJzdHJva2VXZWlnaHRcIl0gPSBzdHJva2VXZWlnaHQ7XG4gICAgbm9kZVtcImVmZmVjdHNcIl0gPSBkZXNpcmVkRWZmZWN0cztcbn07XG4vLyBjb25zdCB1bmRvID0gKG5vZGU6IFNjZW5lTm9kZSkgPT4ge1xuLy8gICAgIGNvbnN0IHByZUdsYXNzID0gcHJlR2xhc3NBcnJheS5maW5kKHByZUdsYXNzID0+IHByZUdsYXNzLmlkID09PSBub2RlLmlkKTtcbi8vICAgICBpZiAocHJlR2xhc3MpIHtcbi8vICAgICAgICAgbm9kZVtcImZpbGxzXCJdID0gcHJlR2xhc3MuZmlsbHM7XG4vLyAgICAgICAgIG5vZGVbXCJzdHJva2VzXCJdID0gcHJlR2xhc3Muc3Ryb2tlcztcbi8vICAgICAgICAgbm9kZVtcInN0cm9rZVdlaWdodFwiXSA9IHByZUdsYXNzLnN0cm9rZVdlaWdodDtcbi8vICAgICAgICAgbm9kZVtcImVmZmVjdHNcIl0gPSBwcmVHbGFzcy5lZmZlY3RzO1xuLy8gICAgIH1cbi8vIH1cbmZpZ21hLnVpLm9ubWVzc2FnZSA9IG1zZyA9PiB7XG4gICAgLy8gT25lIHdheSBvZiBkaXN0aW5ndWlzaGluZyBiZXR3ZWVuIGRpZmZlcmVudCB0eXBlcyBvZiBtZXNzYWdlcyBzZW50IGZyb21cbiAgICAvLyB5b3VyIEhUTUwgcGFnZSBpcyB0byB1c2UgYW4gb2JqZWN0IHdpdGggYSBcInR5cGVcIiBwcm9wZXJ0eSBsaWtlIHRoaXMuXG4gICAgaWYgKG1zZy50eXBlID09PSAnZ2xhc3NpZnknKSB7XG4gICAgICAgIC8vIGNvbnN0IG5vZGVzOiBTY2VuZU5vZGVbXSA9IFtdO1xuICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IG1zZy5jb3VudDsgaSsrKSB7XG4gICAgICAgIC8vICAgY29uc3QgcmVjdCA9IGZpZ21hLmNyZWF0ZVJlY3RhbmdsZSgpO1xuICAgICAgICAvLyAgIHJlY3QueCA9IGkgKiAxNTA7XG4gICAgICAgIC8vICAgcmVjdC5maWxscyA9IFt7dHlwZTogJ1NPTElEJywgY29sb3I6IHtyOiAxLCBnOiAwLjUsIGI6IDB9fV07XG4gICAgICAgIC8vICAgZmlnbWEuY3VycmVudFBhZ2UuYXBwZW5kQ2hpbGQocmVjdCk7XG4gICAgICAgIC8vICAgbm9kZXMucHVzaChyZWN0KTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24gPSBub2RlcztcbiAgICAgICAgLy8gZmlnbWEudmlld3BvcnQuc2Nyb2xsQW5kWm9vbUludG9WaWV3KG5vZGVzKTtcbiAgICAgICAgZm9yIChsZXQgc2VsZWN0aW9uIG9mIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbikge1xuICAgICAgICAgICAgZ2xhc3NpZnkoc2VsZWN0aW9uLCBtc2cubGlnaHRJbnRlbnNpdHksIG1zZy5saWdodENvbG9yLCBtc2cuYmdDb2xvciwgbXNnLnN0cm9rZVdlaWdodCwgbXNnLmJsdXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGlmIChtc2cudHlwZSA9PT0gJ3VuZG8nKSB7XG4gICAgLy8gICAgIGZvciAobGV0IHNlbGVjdGlvbiBvZiBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24pIHtcbiAgICAvLyAgICAgICAgIHVuZG8oc2VsZWN0aW9uKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cbiAgICAvLyBNYWtlIHN1cmUgdG8gY2xvc2UgdGhlIHBsdWdpbiB3aGVuIHlvdSdyZSBkb25lLiBPdGhlcndpc2UgdGhlIHBsdWdpbiB3aWxsXG4gICAgLy8ga2VlcCBydW5uaW5nLCB3aGljaCBzaG93cyB0aGUgY2FuY2VsIGJ1dHRvbiBhdCB0aGUgYm90dG9tIG9mIHRoZSBzY3JlZW4uXG4gICAgLy8gZmlnbWEuY2xvc2VQbHVnaW4oKTtcbn07XG4iXSwic291cmNlUm9vdCI6IiJ9