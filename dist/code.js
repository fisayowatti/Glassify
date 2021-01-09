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
let page = 'refracted-color-page';
figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'glassify') {
        if (!figma.currentPage.selection[0]) {
            figma.notify("Please select a layer to continue");
        }
        for (let selection of figma.currentPage.selection) {
            glassify(selection, msg.lightIntensity, msg.lightColor, msg.bgColor, msg.strokeWeight, msg.blur);
        }
    }
    if (msg.type === 'deselect-all-selections') {
        figma.currentPage.selection = [];
    }
    if (msg.type === 'on-refracted-color-page') {
        page = 'refracted-color-page';
    }
    if (msg.type === 'on-glassify-page') {
        page = 'glassify-page';
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
let handler;
figma.on('selectionchange', () => {
    if (page == 'refracted-color-page') {
        console.log('page', page, figma.currentPage.selection[0]);
        //if there is no valid selection on selection change do nothing;
        if (!figma.currentPage.selection[0])
            return;
        if (!figma.currentPage.selection[0]['fills'] ||
            (!figma.currentPage.selection[0]['fills'].some(fill => fill.type === 'SOLID') &&
                !figma.currentPage.selection[0]['fills'].some(fill => fill.type.startsWith('GRADIENT')))) {
            //notify the user of the invalid selection
            handler = figma.notify(`Please select a layer that's not a group and has at least 1 solid or gradient fill`);
            //deselect the invalid selection
            figma.currentPage.selection = [];
            //do not continue with any other operation
            return;
        }
        //if all exceptions are passed, cancel any notification that may be active before proceeding
        if (handler)
            handler.cancel();
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
    }
    if (page === 'glassify-page') {
        console.log('page', page, figma.currentPage.selection.map(sel => sel.type));
        //if there is no valid selection on selection change do nothing;
        if (!figma.currentPage.selection[0])
            return;
        if (figma.currentPage.selection.some(sel => sel.type == "COMPONENT" || sel.type == "COMPONENT_SET" || sel.type == "INSTANCE" || sel.type == "GROUP")) {
            //notify the user of the invalid selection(s)
            handler = figma.notify("For groups or components, you should target any or all of their children instead");
            //deselect the invalid selection(s)
            figma.currentPage.selection = figma.currentPage.selection.filter(sel => sel.type !== "COMPONENT" && sel.type !== "COMPONENT_SET" && sel.type !== "INSTANCE" && sel.type !== "GROUP");
        }
    }
    // console.log(figma.currentPage.selection[0]['fills'])
});
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
    if (num === 0) {
        return "00";
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9HbGFzc2lmeS8uL3NyYy9jb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsZUFBZTtBQUN6QztBQUNBO0FBQ0EsOEJBQThCLHdCQUF3QixxQkFBcUIsRUFBRTtBQUM3RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGNBQWM7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWtDLHdDQUF3QztBQUMxRTtBQUNBO0FBQ0Esa0NBQWtDLHlDQUF5QztBQUMzRTtBQUNBLDhCQUE4Qix3REFBd0Q7QUFDdEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixVQUFVO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDRCQUE0QjtBQUNoRDtBQUNBLFNBQVM7QUFDVDtBQUNBLG9CQUFvQix5QkFBeUI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDZFQUE2RTtBQUNqRztBQUNBLFNBQVM7QUFDVDtBQUNBLG9CQUFvQiw2RUFBNkU7QUFDakc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDZFQUE2RTtBQUNqRztBQUNBLFNBQVM7QUFDVDtBQUNBLG9CQUFvQiw0RUFBNEU7QUFDaEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDRCQUE0QjtBQUNoRDtBQUNBLFNBQVM7QUFDVDtBQUNBLG9CQUFvQix5QkFBeUI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29kZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGZpZ21hLnVpLm9ubWVzc2FnZSA9IG1zZyA9PiB7XG4vLyAgICAgaWYgKG1zZy50eXBlID09PSAnY3JlYXRlLXJlY3RhbmdsZXMnKSB7XG4vLyAgICAgICAgIGNvbnN0IG5vZGVzID0gW11cbi8vICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtc2cuY291bnQ7IGkrKykge1xuLy8gICAgICAgICAgICAgY29uc3QgcmVjdCA9IGZpZ21hLmNyZWF0ZVJlY3RhbmdsZSgpXG4vLyAgICAgICAgICAgICByZWN0LnggPSBpICogMTUwXG4vLyAgICAgICAgICAgICByZWN0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMSwgZzogMC41LCBiOiAwIH0gfV1cbi8vICAgICAgICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLmFwcGVuZENoaWxkKHJlY3QpXG4vLyAgICAgICAgICAgICBub2Rlcy5wdXNoKHJlY3QpXG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uID0gbm9kZXNcbi8vICAgICAgICAgZmlnbWEudmlld3BvcnQuc2Nyb2xsQW5kWm9vbUludG9WaWV3KG5vZGVzKVxuLy8gICAgIH1cbi8vICAgICBmaWdtYS5jbG9zZVBsdWdpbigpXG4vLyB9XG4vLyBjb25zdCBkYXJrZW5IZXhUb1JHQkEgPSAoaGV4Q29sb3IsIGFscGhhOiBudW1iZXIpID0+IHtcbi8vICAgY29uc3QgcmdiID0gaGV4VG9SR0JBKGhleENvbG9yKTtcbi8vICAgcmV0dXJuIHtcbi8vICAgICByOiBNYXRoLm1heCgwLCByZ2IuciAqIDAuOSksXG4vLyAgICAgZzogTWF0aC5tYXgoMCwgcmdiLmcgKiAwLjkpLFxuLy8gICAgIGI6IE1hdGgubWF4KDAsIHJnYi5iICogMC45KSxcbi8vICAgICBhOiBhbHBoYVxuLy8gICB9XG4vLyB9XG4vLyBUaGlzIHBsdWdpbiB3aWxsIG9wZW4gYSB3aW5kb3cgdG8gcHJvbXB0IHRoZSB1c2VyIHRvIGVudGVyIGEgbnVtYmVyLCBhbmRcbi8vIGl0IHdpbGwgdGhlbiBjcmVhdGUgdGhhdCBtYW55IHJlY3RhbmdsZXMgb24gdGhlIHNjcmVlbi5cbi8vIFRoaXMgZmlsZSBob2xkcyB0aGUgbWFpbiBjb2RlIGZvciB0aGUgcGx1Z2lucy4gSXQgaGFzIGFjY2VzcyB0byB0aGUgKmRvY3VtZW50Ki5cbi8vIFlvdSBjYW4gYWNjZXNzIGJyb3dzZXIgQVBJcyBpbiB0aGUgPHNjcmlwdD4gdGFnIGluc2lkZSBcInVpLmh0bWxcIiB3aGljaCBoYXMgYVxuLy8gZnVsbCBicm93c2VyIGVudmlyb25tZW50IChzZWUgZG9jdW1lbnRhdGlvbikuXG4vLyBUaGlzIHNob3dzIHRoZSBIVE1MIHBhZ2UgaW4gXCJ1aS5odG1sXCIuXG5maWdtYS5zaG93VUkoX19odG1sX18sIHsgaGVpZ2h0OiA0OTAgfSk7XG4vL1doZW4gcGx1Z2luIGxhdW5jaGVzIGRlc2VsZWN0IGFsbCBzZWxlY3Rpb25zXG5maWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24gPSBbXTtcbmxldCBwYWdlID0gJ3JlZnJhY3RlZC1jb2xvci1wYWdlJztcbmZpZ21hLnVpLm9ubWVzc2FnZSA9IG1zZyA9PiB7XG4gICAgLy8gT25lIHdheSBvZiBkaXN0aW5ndWlzaGluZyBiZXR3ZWVuIGRpZmZlcmVudCB0eXBlcyBvZiBtZXNzYWdlcyBzZW50IGZyb21cbiAgICAvLyB5b3VyIEhUTUwgcGFnZSBpcyB0byB1c2UgYW4gb2JqZWN0IHdpdGggYSBcInR5cGVcIiBwcm9wZXJ0eSBsaWtlIHRoaXMuXG4gICAgaWYgKG1zZy50eXBlID09PSAnZ2xhc3NpZnknKSB7XG4gICAgICAgIGlmICghZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uWzBdKSB7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoXCJQbGVhc2Ugc2VsZWN0IGEgbGF5ZXIgdG8gY29udGludWVcIik7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgc2VsZWN0aW9uIG9mIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbikge1xuICAgICAgICAgICAgZ2xhc3NpZnkoc2VsZWN0aW9uLCBtc2cubGlnaHRJbnRlbnNpdHksIG1zZy5saWdodENvbG9yLCBtc2cuYmdDb2xvciwgbXNnLnN0cm9rZVdlaWdodCwgbXNnLmJsdXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChtc2cudHlwZSA9PT0gJ2Rlc2VsZWN0LWFsbC1zZWxlY3Rpb25zJykge1xuICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24gPSBbXTtcbiAgICB9XG4gICAgaWYgKG1zZy50eXBlID09PSAnb24tcmVmcmFjdGVkLWNvbG9yLXBhZ2UnKSB7XG4gICAgICAgIHBhZ2UgPSAncmVmcmFjdGVkLWNvbG9yLXBhZ2UnO1xuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09ICdvbi1nbGFzc2lmeS1wYWdlJykge1xuICAgICAgICBwYWdlID0gJ2dsYXNzaWZ5LXBhZ2UnO1xuICAgIH1cbiAgICAvLyBpZiAobXNnLnR5cGUgPT09ICd1bmRvJykge1xuICAgIC8vICAgICBmb3IgKGxldCBzZWxlY3Rpb24gb2YgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uKSB7XG4gICAgLy8gICAgICAgICB1bmRvKHNlbGVjdGlvbik7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG4gICAgLy8gTWFrZSBzdXJlIHRvIGNsb3NlIHRoZSBwbHVnaW4gd2hlbiB5b3UncmUgZG9uZS4gT3RoZXJ3aXNlIHRoZSBwbHVnaW4gd2lsbFxuICAgIC8vIGtlZXAgcnVubmluZywgd2hpY2ggc2hvd3MgdGhlIGNhbmNlbCBidXR0b24gYXQgdGhlIGJvdHRvbSBvZiB0aGUgc2NyZWVuLlxuICAgIC8vIGZpZ21hLmNsb3NlUGx1Z2luKCk7XG59O1xubGV0IGhhbmRsZXI7XG5maWdtYS5vbignc2VsZWN0aW9uY2hhbmdlJywgKCkgPT4ge1xuICAgIGlmIChwYWdlID09ICdyZWZyYWN0ZWQtY29sb3ItcGFnZScpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3BhZ2UnLCBwYWdlLCBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF0pO1xuICAgICAgICAvL2lmIHRoZXJlIGlzIG5vIHZhbGlkIHNlbGVjdGlvbiBvbiBzZWxlY3Rpb24gY2hhbmdlIGRvIG5vdGhpbmc7XG4gICAgICAgIGlmICghZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uWzBdKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoIWZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvblswXVsnZmlsbHMnXSB8fFxuICAgICAgICAgICAgKCFmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF1bJ2ZpbGxzJ10uc29tZShmaWxsID0+IGZpbGwudHlwZSA9PT0gJ1NPTElEJykgJiZcbiAgICAgICAgICAgICAgICAhZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uWzBdWydmaWxscyddLnNvbWUoZmlsbCA9PiBmaWxsLnR5cGUuc3RhcnRzV2l0aCgnR1JBRElFTlQnKSkpKSB7XG4gICAgICAgICAgICAvL25vdGlmeSB0aGUgdXNlciBvZiB0aGUgaW52YWxpZCBzZWxlY3Rpb25cbiAgICAgICAgICAgIGhhbmRsZXIgPSBmaWdtYS5ub3RpZnkoYFBsZWFzZSBzZWxlY3QgYSBsYXllciB0aGF0J3Mgbm90IGEgZ3JvdXAgYW5kIGhhcyBhdCBsZWFzdCAxIHNvbGlkIG9yIGdyYWRpZW50IGZpbGxgKTtcbiAgICAgICAgICAgIC8vZGVzZWxlY3QgdGhlIGludmFsaWQgc2VsZWN0aW9uXG4gICAgICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24gPSBbXTtcbiAgICAgICAgICAgIC8vZG8gbm90IGNvbnRpbnVlIHdpdGggYW55IG90aGVyIG9wZXJhdGlvblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vaWYgYWxsIGV4Y2VwdGlvbnMgYXJlIHBhc3NlZCwgY2FuY2VsIGFueSBub3RpZmljYXRpb24gdGhhdCBtYXkgYmUgYWN0aXZlIGJlZm9yZSBwcm9jZWVkaW5nXG4gICAgICAgIGlmIChoYW5kbGVyKVxuICAgICAgICAgICAgaGFuZGxlci5jYW5jZWwoKTtcbiAgICAgICAgY29uc3QgYmdMYXllckNvbG9ycyA9IGdldEJnTGF5ZXJDb2xvcnMoZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uWzBdWydmaWxscyddKTtcbiAgICAgICAgY29uc3QgdW5Ob3JtYWxpemVkQmdMYXllckNvbG9ycyA9IHVuTm9ybWFsaXplQ29sb3JzKGJnTGF5ZXJDb2xvcnMpO1xuICAgICAgICBjb25zdCBoZXhCZ0xheWVyQ29sb3JzID0gdW5Ob3JtYWxpemVkQmdMYXllckNvbG9ycy5tYXAoY29sb3IgPT4gcmdiYVRvSGV4KGNvbG9yKSk7XG4gICAgICAgIGNvbnN0IHVuaXF1ZUNvbG9ycyA9IFsuLi5uZXcgU2V0KGhleEJnTGF5ZXJDb2xvcnMpXTtcbiAgICAgICAgaWYgKHVuaXF1ZUNvbG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ3NlbGVjdGlvbi1tYWRlJywgaXNWYWxpZDogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ3NlbGVjdGlvbi1tYWRlJywgaXNWYWxpZDogZmFsc2UgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAncmVmcmFjdGVkLWNvbG9yLW9wdGlvbnMnLCBjb2xvcnM6IHVuaXF1ZUNvbG9ycyB9KTtcbiAgICAgICAgY29uc29sZS5sb2coZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uWzBdLCB1bk5vcm1hbGl6ZWRCZ0xheWVyQ29sb3JzLCBoZXhCZ0xheWVyQ29sb3JzLCB1bmlxdWVDb2xvcnMpO1xuICAgIH1cbiAgICBpZiAocGFnZSA9PT0gJ2dsYXNzaWZ5LXBhZ2UnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdwYWdlJywgcGFnZSwgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uLm1hcChzZWwgPT4gc2VsLnR5cGUpKTtcbiAgICAgICAgLy9pZiB0aGVyZSBpcyBubyB2YWxpZCBzZWxlY3Rpb24gb24gc2VsZWN0aW9uIGNoYW5nZSBkbyBub3RoaW5nO1xuICAgICAgICBpZiAoIWZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvblswXSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbi5zb21lKHNlbCA9PiBzZWwudHlwZSA9PSBcIkNPTVBPTkVOVFwiIHx8IHNlbC50eXBlID09IFwiQ09NUE9ORU5UX1NFVFwiIHx8IHNlbC50eXBlID09IFwiSU5TVEFOQ0VcIiB8fCBzZWwudHlwZSA9PSBcIkdST1VQXCIpKSB7XG4gICAgICAgICAgICAvL25vdGlmeSB0aGUgdXNlciBvZiB0aGUgaW52YWxpZCBzZWxlY3Rpb24ocylcbiAgICAgICAgICAgIGhhbmRsZXIgPSBmaWdtYS5ub3RpZnkoXCJGb3IgZ3JvdXBzIG9yIGNvbXBvbmVudHMsIHlvdSBzaG91bGQgdGFyZ2V0IGFueSBvciBhbGwgb2YgdGhlaXIgY2hpbGRyZW4gaW5zdGVhZFwiKTtcbiAgICAgICAgICAgIC8vZGVzZWxlY3QgdGhlIGludmFsaWQgc2VsZWN0aW9uKHMpXG4gICAgICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24gPSBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24uZmlsdGVyKHNlbCA9PiBzZWwudHlwZSAhPT0gXCJDT01QT05FTlRcIiAmJiBzZWwudHlwZSAhPT0gXCJDT01QT05FTlRfU0VUXCIgJiYgc2VsLnR5cGUgIT09IFwiSU5TVEFOQ0VcIiAmJiBzZWwudHlwZSAhPT0gXCJHUk9VUFwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF1bJ2ZpbGxzJ10pXG59KTtcbi8vIEhFTFBFUiBGVU5DVElPTlNcbmZ1bmN0aW9uIGNsb25lKHZhbCkge1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsO1xuICAgIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09ICd1bmRlZmluZWQnIHx8IHR5cGUgPT09ICdudW1iZXInIHx8XG4gICAgICAgIHR5cGUgPT09ICdzdHJpbmcnIHx8IHR5cGUgPT09ICdib29sZWFuJykge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwubWFwKHggPT4gY2xvbmUoeCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSh2YWwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IG8gPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHZhbCkge1xuICAgICAgICAgICAgICAgIG9ba2V5XSA9IGNsb25lKHZhbFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRocm93ICd1bmtub3duJztcbn1cbjtcbmNvbnN0IGdldEJnTGF5ZXJDb2xvcnMgPSAoZmlsbHMpID0+IHtcbiAgICByZXR1cm4gZmlsbHMucmVkdWNlKChhY2MsIGN1cnIpID0+IHtcbiAgICAgICAgaWYgKGN1cnIudHlwZSA9PT0gJ1NPTElEJykge1xuICAgICAgICAgICAgYWNjLnB1c2goY3Vyci5jb2xvcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY3Vyci50eXBlLnN0YXJ0c1dpdGgoJ0dSQURJRU5UJykpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9ycyA9IGN1cnIuZ3JhZGllbnRTdG9wcy5tYXAoc3RvcCA9PiBzdG9wLmNvbG9yKTtcbiAgICAgICAgICAgIGFjYyA9IFsuLi5hY2MsIC4uLmNvbG9yc107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCBbXSk7XG59O1xuY29uc3QgdW5Ob3JtYWxpemVDb2xvcnMgPSAoY29sb3JzKSA9PiB7XG4gICAgcmV0dXJuIGNvbG9ycy5tYXAoY29sb3IgPT4gKHtcbiAgICAgICAgcjogTWF0aC5yb3VuZChjb2xvci5yICogMjU1KSxcbiAgICAgICAgZzogTWF0aC5yb3VuZChjb2xvci5nICogMjU1KSxcbiAgICAgICAgYjogTWF0aC5yb3VuZChjb2xvci5iICogMjU1KVxuICAgIH0pKTtcbn07XG5jb25zdCBiYXNlMTZ0bzEwID0gKG51bSkgPT4ge1xuICAgIGNvbnN0IHRyYW5zbGF0ZUxldHRlclRvTnVtYmVyID0gKGxldHRlck9yTnVtYmVyKSA9PiB7XG4gICAgICAgIGlmIChsZXR0ZXJPck51bWJlciA9PT0gJ2EnIHx8IGxldHRlck9yTnVtYmVyID09PSAnQScpIHtcbiAgICAgICAgICAgIHJldHVybiAnMTAnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxldHRlck9yTnVtYmVyID09PSAnYicgfHwgbGV0dGVyT3JOdW1iZXIgPT09ICdCJykge1xuICAgICAgICAgICAgcmV0dXJuICcxMSc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGV0dGVyT3JOdW1iZXIgPT09ICdjJyB8fCBsZXR0ZXJPck51bWJlciA9PT0gJ0MnKSB7XG4gICAgICAgICAgICByZXR1cm4gJzEyJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsZXR0ZXJPck51bWJlciA9PT0gJ2QnIHx8IGxldHRlck9yTnVtYmVyID09PSAnRCcpIHtcbiAgICAgICAgICAgIHJldHVybiAnMTMnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxldHRlck9yTnVtYmVyID09PSAnZScgfHwgbGV0dGVyT3JOdW1iZXIgPT09ICdFJykge1xuICAgICAgICAgICAgcmV0dXJuICcxNCc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGV0dGVyT3JOdW1iZXIgPT09ICdmJyB8fCBsZXR0ZXJPck51bWJlciA9PT0gJ0YnKSB7XG4gICAgICAgICAgICByZXR1cm4gJzE1JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBsZXR0ZXJPck51bWJlcjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbGV0IHNwbGl0TnVtID0gbnVtLnNwbGl0KFwiXCIpLnJldmVyc2UoKTtcbiAgICBsZXQgcmVzdWx0ID0gc3BsaXROdW0ucmVkdWNlKChhY2MsIGN1cnIsIGlkeCkgPT4ge1xuICAgICAgICBjb25zdCBmaWd1cmUgPSBwYXJzZUludCh0cmFuc2xhdGVMZXR0ZXJUb051bWJlcihjdXJyKSkgKiBNYXRoLnBvdygxNiwgaWR4KTtcbiAgICAgICAgYWNjICs9IGZpZ3VyZTtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCAwKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbmNvbnN0IGJhc2UxMHRvMTYgPSAobnVtKSA9PiB7XG4gICAgbGV0IGRpdmlzaW9uUmVzdWx0ID0gbnVtO1xuICAgIGxldCByZW1haW5kZXJBcnIgPSBbXTtcbiAgICB3aGlsZSAoZGl2aXNpb25SZXN1bHQgIT09IDApIHtcbiAgICAgICAgbGV0IGRpdmlzaW9uUmVtYWluZGVyID0gZGl2aXNpb25SZXN1bHQgJSAxNjtcbiAgICAgICAgcmVtYWluZGVyQXJyLnB1c2goZGl2aXNpb25SZW1haW5kZXIpO1xuICAgICAgICBkaXZpc2lvblJlc3VsdCA9IE1hdGguZmxvb3IoZGl2aXNpb25SZXN1bHQgLyAxNik7XG4gICAgfVxuICAgIHJlbWFpbmRlckFyciA9IHJlbWFpbmRlckFyci5tYXAocmVtYWluZGVyID0+IHtcbiAgICAgICAgc3dpdGNoIChyZW1haW5kZXIpIHtcbiAgICAgICAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdBJztcbiAgICAgICAgICAgIGNhc2UgMTE6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdCJztcbiAgICAgICAgICAgIGNhc2UgMTI6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdDJztcbiAgICAgICAgICAgIGNhc2UgMTM6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdEJztcbiAgICAgICAgICAgIGNhc2UgMTQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdFJztcbiAgICAgICAgICAgIGNhc2UgMTU6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdGJztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlbWFpbmRlci50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKG51bSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gXCIwMFwiO1xuICAgIH1cbiAgICByZXR1cm4gcmVtYWluZGVyQXJyLnJldmVyc2UoKS5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjICsgY3VyciwgXCJcIik7XG59O1xuY29uc3QgaGV4VG9SR0JBID0gKGhleCwgYWxwaGEgPSAwKSA9PiB7XG4gICAgY29uc3QgcmVkSGV4ID0gaGV4LnNsaWNlKDEsIDMpO1xuICAgIGNvbnN0IGdyZWVuSGV4ID0gaGV4LnNsaWNlKDMsIDUpO1xuICAgIGNvbnN0IGJsdWVIZXggPSBoZXguc2xpY2UoNSwgNyk7XG4gICAgY29uc3QgcmVkQ2hhbm5lbCA9IGJhc2UxNnRvMTAocmVkSGV4KTtcbiAgICBjb25zdCBncmVlbkNoYW5uZWwgPSBiYXNlMTZ0bzEwKGdyZWVuSGV4KTtcbiAgICBjb25zdCBibHVlQ2hhbm5lbCA9IGJhc2UxNnRvMTAoYmx1ZUhleCk7XG4gICAgY29uc29sZS5sb2coJ2h1aGEnLCByZWRDaGFubmVsLCBncmVlbkNoYW5uZWwsIGJsdWVDaGFubmVsKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByOiByZWRDaGFubmVsIC8gMjU1LFxuICAgICAgICBnOiBncmVlbkNoYW5uZWwgLyAyNTUsXG4gICAgICAgIGI6IGJsdWVDaGFubmVsIC8gMjU1LFxuICAgICAgICBhOiBhbHBoYVxuICAgIH07XG59O1xuY29uc3QgcmdiYVRvSGV4ID0gKHsgciwgZywgYiB9KSA9PiB7XG4gICAgY29uc3QgcmVkQ2hhbm5lbCA9IGJhc2UxMHRvMTYocik7XG4gICAgY29uc3QgZ3JlZW5DaGFubmVsID0gYmFzZTEwdG8xNihnKTtcbiAgICBjb25zdCBibHVlQ2hhbm5lbCA9IGJhc2UxMHRvMTYoYik7XG4gICAgY29uc3QgaGV4Q29sb3IgPSBcIiNcIiArIHJlZENoYW5uZWwgKyBncmVlbkNoYW5uZWwgKyBibHVlQ2hhbm5lbDtcbiAgICByZXR1cm4gaGV4Q29sb3I7XG59O1xuY29uc3QgbGlnaHRlbkhleFRvUkdCQSA9IChoZXhDb2xvciwgYWxwaGEpID0+IHtcbiAgICBjb25zdCByZ2IgPSBoZXhUb1JHQkEoaGV4Q29sb3IpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHI6IE1hdGgubWluKDEsIHJnYi5yICogMS4xKSxcbiAgICAgICAgZzogTWF0aC5taW4oMSwgcmdiLmcgKiAxLjEpLFxuICAgICAgICBiOiBNYXRoLm1pbigxLCByZ2IuYiAqIDEuMSksXG4gICAgICAgIGE6IGFscGhhXG4gICAgfTtcbn07XG5jb25zdCByYWRpYWxUb3BMZWZ0VHggPSBbMC4zNTcyNTY0NzIxMTA3NDgzLCAwLjE2MDMxNTY2MjYyMjQ1MTc4LCAwLjQ5MjAxNjg1MTkwMjAwODA2XTtcbmNvbnN0IHJhZGlhbEJvdHRvbVJpZ2h0VHggPSBbLTAuMTYwMTI4NTMzODQwMTc5NDQsIDAuMTY1Mzg5MTM1NDc5OTI3MDYsIDAuNDk2NTE5NjU0OTg5MjQyNTVdO1xuY29uc3QgcmFkaWFsQm90dG9tTGVmdFR4ID0gWzAuMzg1MDMwMDAxNDAxOTAxMjUsIC0wLjEzNDI3NTUxMDkwNzE3MzE2LCAwLjYyNDg3Mjg2MzI5MjY5NDFdO1xuY29uc3QgcmFkaWFsVG9wUmlnaHRUeCA9IFswLjE2MTA4MTUzNzYwNDMzMTk3LCAwLjE2NjQzNTEwNzU4ODc2OCwgMC4zMzY0MzgyOTgyMjU0MDI4M107XG5jb25zdCBsaW5lYXJUb3BMZWZ0VHggPSBbMC43MTQ5MTEyODIwNjI1MzA1LCAwLjMyNjYyODU2NTc4ODI2OTA0LCAtMC4wMjIxNDcxNTA3MTAyMjUxMDVdO1xuY29uc3QgbGluZWFyQm90dG9tUmlnaHRUeCA9IFstMC4zMjU5ODE3OTU3ODc4MTEzLCAwLjMzMDgzMDY2MzQ0MjYxMTcsIDAuNDk3MDE0MDQ1NzE1MzMyMDNdO1xubGV0IGRlc2lyZWRGaWxsID0ge1xuICAgIHR5cGU6IFwiR1JBRElFTlRfUkFESUFMXCIsXG4gICAgdmlzaWJsZTogdHJ1ZSxcbiAgICBvcGFjaXR5OiAxLFxuICAgIGJsZW5kTW9kZTogXCJOT1JNQUxcIixcbiAgICBncmFkaWVudFN0b3BzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEsIGE6IDAuNDAgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAwXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEsIGE6IDAgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAxXG4gICAgICAgIH1cbiAgICBdLFxuICAgIGdyYWRpZW50VHJhbnNmb3JtOiBbXG4gICAgICAgIHJhZGlhbFRvcExlZnRUeCxcbiAgICAgICAgcmFkaWFsQm90dG9tUmlnaHRUeFxuICAgIF1cbn07XG5sZXQgZGVzaXJlZFN0cm9rZUxpZ2h0ZXJCZyA9IHtcbiAgICB0eXBlOiBcIkdSQURJRU5UX1JBRElBTFwiLFxuICAgIHZpc2libGU6IHRydWUsXG4gICAgb3BhY2l0eTogMSxcbiAgICBibGVuZE1vZGU6IFwiTk9STUFMXCIsXG4gICAgZ3JhZGllbnRTdG9wczogW1xuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAwLjQwNTcyOTE3NDYxMzk1MjY0LCBnOiAwLjYyNTgzNDE2NzAwMzYzMTYsIGI6IDAuNzkxNjY2Njg2NTM0ODgxNiwgYTogMSB9LFxuICAgICAgICAgICAgcG9zaXRpb246IDBcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgY29sb3I6IHsgcjogMC40MDM5MjE1NzQzNTQxNzE3NSwgZzogMC42Mjc0NTEwMDI1OTc4MDg4LCBiOiAwLjc5MjE1Njg3NTEzMzUxNDQsIGE6IDAgfSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAxXG4gICAgICAgIH1cbiAgICBdLFxuICAgIGdyYWRpZW50VHJhbnNmb3JtOiBbXG4gICAgICAgIHJhZGlhbFRvcExlZnRUeCxcbiAgICAgICAgcmFkaWFsQm90dG9tUmlnaHRUeFxuICAgIF1cbn07XG5sZXQgZGVzaXJlZFN0cm9rZURhcmtlckJnID0ge1xuICAgIHR5cGU6IFwiR1JBRElFTlRfUkFESUFMXCIsXG4gICAgdmlzaWJsZTogdHJ1ZSxcbiAgICBvcGFjaXR5OiAxLFxuICAgIGJsZW5kTW9kZTogXCJOT1JNQUxcIixcbiAgICBncmFkaWVudFN0b3BzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbG9yOiB7IHI6IDAuMTkwNTU1NTcyNTA5NzY1NjIsIGc6IDAuNTQ3NjM0NTQxOTg4MzcyOCwgYjogMC44MTY2NjY2NjI2OTMwMjM3LCBhOiAxIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAwLjE5MjE1Njg2NjE5MjgxNzcsIGc6IDAuNTQ5MDE5NjM0NzIzNjYzMywgYjogMC44MTU2ODYyODU0OTU3NTgxLCBhOiAwIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMVxuICAgICAgICB9XG4gICAgXSxcbiAgICBncmFkaWVudFRyYW5zZm9ybTogW1xuICAgICAgICByYWRpYWxCb3R0b21MZWZ0VHgsXG4gICAgICAgIHJhZGlhbFRvcFJpZ2h0VHhcbiAgICBdXG59O1xubGV0IGRlc2lyZWRTdHJva2VMaWdodFNvdXJjZSA9IHtcbiAgICB0eXBlOiBcIkdSQURJRU5UX0xJTkVBUlwiLFxuICAgIHZpc2libGU6IHRydWUsXG4gICAgb3BhY2l0eTogMSxcbiAgICBibGVuZE1vZGU6IFwiTk9STUFMXCIsXG4gICAgZ3JhZGllbnRTdG9wczogW1xuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAxLCBnOiAxLCBiOiAxLCBhOiAwLjkwIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBjb2xvcjogeyByOiAxLCBnOiAxLCBiOiAxLCBhOiAwIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjogMVxuICAgICAgICB9XG4gICAgXSxcbiAgICBncmFkaWVudFRyYW5zZm9ybTogW1xuICAgICAgICBsaW5lYXJUb3BMZWZ0VHgsXG4gICAgICAgIGxpbmVhckJvdHRvbVJpZ2h0VHhcbiAgICBdXG59O1xuY29uc3QgZGVzaXJlZFN0cm9rZVdlaWdodCA9IDM7XG5jb25zdCBkZXNpcmVkRWZmZWN0cyA9IFtcbiAgICB7IHR5cGU6IFwiQkFDS0dST1VORF9CTFVSXCIsIHJhZGl1czogNDIsIHZpc2libGU6IHRydWUgfVxuXTtcbi8vIGNvbnN0IHByZUdsYXNzQXJyYXkgPSBbXVxuY29uc3QgZ2xhc3NpZnkgPSAobm9kZSwgbGlnaHRJbnRlbnNpdHksIGxpZ2h0Q29sb3IsIGJnQ29sb3IsIHN0cm9rZVdlaWdodCwgYmx1cikgPT4ge1xuICAgIC8vY2hhbmdlIHRoZSBjb2xvciBvZiB0aGUgbGlnaHQgYXQgdGhlIGVkZ2Ugb2YgdGhlIHN0cm9rZSBmYWNpbmcgdGhlIGxpZ2h0IHNvdXJjZVxuICAgIGRlc2lyZWRTdHJva2VMaWdodFNvdXJjZS5ncmFkaWVudFN0b3BzWzBdLmNvbG9yID0gaGV4VG9SR0JBKGxpZ2h0Q29sb3IsIGxpZ2h0SW50ZW5zaXR5IC8gMTAwKTtcbiAgICAvL2NoYW5nZSB0aGUgYWxwaGEgKHJlcHJlc2VudGluZyB0aGUgbGlnaHQgYnJpZ2h0bmVzcy9pbnRlbnNpdHkpIGF0IHRoZSBlZGdlIG9mIHRoZSBzdHJva2UgZmFjaW5nIHRoZSBsaWdodCBzb3VyY2VcbiAgICAvLyBkZXNpcmVkU3Ryb2tlTGlnaHRTb3VyY2UuZ3JhZGllbnRTdG9wc1swXS5jb2xvci5hID0gbGlnaHRJbnRlbnNpdHkgLyAxMDA7XG4gICAgLy9jaGFuZ2UgdGhlIGNvbG9yIG9mIHRoZSBsaWdodCBhdCB0aGUgZWRnZSBvZiB0aGUgc3Ryb2tlIGF3YXkgZnJvbSB0aGUgbGlnaHQgc291cmNlXG4gICAgZGVzaXJlZFN0cm9rZUxpZ2h0U291cmNlLmdyYWRpZW50U3RvcHNbMV0uY29sb3IgPSBoZXhUb1JHQkEobGlnaHRDb2xvcik7XG4gICAgLy9jaGFuZ2UgdGhlIGNvbG9yIG9mIHRoZSBsaWdodCB0aGF0IGFmZmVjdHMgdGhlIGZpbGwgb2YgdGhlIHNoYXBlXG4gICAgZGVzaXJlZEZpbGwuZ3JhZGllbnRTdG9wc1swXS5jb2xvciA9IGhleFRvUkdCQShsaWdodENvbG9yLCAwLjQwKTtcbiAgICBkZXNpcmVkU3Ryb2tlTGlnaHRlckJnLmdyYWRpZW50U3RvcHNbMF0uY29sb3IgPSBsaWdodGVuSGV4VG9SR0JBKGJnQ29sb3IsIDApO1xuICAgIGRlc2lyZWRTdHJva2VMaWdodGVyQmcuZ3JhZGllbnRTdG9wc1sxXS5jb2xvciA9IGxpZ2h0ZW5IZXhUb1JHQkEoYmdDb2xvciwgMSk7XG4gICAgZGVzaXJlZFN0cm9rZURhcmtlckJnLmdyYWRpZW50U3RvcHNbMF0uY29sb3IgPSBsaWdodGVuSGV4VG9SR0JBKGJnQ29sb3IsIDApO1xuICAgIGRlc2lyZWRTdHJva2VEYXJrZXJCZy5ncmFkaWVudFN0b3BzWzFdLmNvbG9yID0gbGlnaHRlbkhleFRvUkdCQShiZ0NvbG9yLCAxKTtcbiAgICBkZXNpcmVkRWZmZWN0cy5maW5kKGVmZmVjdCA9PiBlZmZlY3QudHlwZSA9PT0gXCJCQUNLR1JPVU5EX0JMVVJcIikucmFkaXVzID0gYmx1cjtcbiAgICAvLyBjb25zdCBwcmVHbGFzcyA9IHtcbiAgICAvLyAgICAgaWQ6IG5vZGUuaWQsXG4gICAgLy8gICAgIGZpbGxzOiBub2RlW1wiZmlsbHNcIl0sXG4gICAgLy8gICAgIHN0cm9rZXM6IG5vZGVbXCJzdHJva2VzXCJdLFxuICAgIC8vICAgICBzdHJva2VXZWlnaHQ6IG5vZGVbXCJzdHJva2VXZWlnaHRcIl0sXG4gICAgLy8gICAgIGVmZmVjdHM6IG5vZGVbXCJlZmZlY3RzXCJdXG4gICAgLy8gfVxuICAgIC8vIGNvbnN0IGhhc0JlZW5BZGRlZEluZGV4ID0gcHJlR2xhc3NBcnJheS5maW5kSW5kZXgocHJlR2xhc3MgPT4gcHJlR2xhc3MuaWQgPT09IG5vZGUuaWQpXG4gICAgLy8gaWYgKGhhc0JlZW5BZGRlZEluZGV4ID49IDApIHtcbiAgICAvLyAgICAgcHJlR2xhc3NBcnJheVtoYXNCZWVuQWRkZWRJbmRleF0gPSBwcmVHbGFzcztcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgICBwcmVHbGFzc0FycmF5LnB1c2gocHJlR2xhc3MpO1xuICAgIC8vIH1cbiAgICAvLyBjb25zb2xlLmxvZygncnViYmlzaD8nLCBkZXNpcmVkU3Ryb2tlTGlnaHRTb3VyY2UsIGRlc2lyZWRTdHJva2VMaWdodGVyQmcsIGRlc2lyZWRTdHJva2VEYXJrZXJCZylcbiAgICBub2RlW1wiZmlsbHNcIl0gPSBbZGVzaXJlZEZpbGxdO1xuICAgIG5vZGVbXCJzdHJva2VzXCJdID0gW2Rlc2lyZWRTdHJva2VMaWdodGVyQmcsIGRlc2lyZWRTdHJva2VEYXJrZXJCZywgZGVzaXJlZFN0cm9rZUxpZ2h0U291cmNlXTtcbiAgICBub2RlW1wic3Ryb2tlV2VpZ2h0XCJdID0gc3Ryb2tlV2VpZ2h0O1xuICAgIG5vZGVbXCJlZmZlY3RzXCJdID0gZGVzaXJlZEVmZmVjdHM7XG4gICAgZmlnbWEuY2xvc2VQbHVnaW4oKTtcbn07XG4vLyBjb25zdCB1bmRvID0gKG5vZGU6IFNjZW5lTm9kZSkgPT4ge1xuLy8gICAgIGNvbnN0IHByZUdsYXNzID0gcHJlR2xhc3NBcnJheS5maW5kKHByZUdsYXNzID0+IHByZUdsYXNzLmlkID09PSBub2RlLmlkKTtcbi8vICAgICBpZiAocHJlR2xhc3MpIHtcbi8vICAgICAgICAgbm9kZVtcImZpbGxzXCJdID0gcHJlR2xhc3MuZmlsbHM7XG4vLyAgICAgICAgIG5vZGVbXCJzdHJva2VzXCJdID0gcHJlR2xhc3Muc3Ryb2tlcztcbi8vICAgICAgICAgbm9kZVtcInN0cm9rZVdlaWdodFwiXSA9IHByZUdsYXNzLnN0cm9rZVdlaWdodDtcbi8vICAgICAgICAgbm9kZVtcImVmZmVjdHNcIl0gPSBwcmVHbGFzcy5lZmZlY3RzO1xuLy8gICAgIH1cbi8vIH1cbiJdLCJzb3VyY2VSb290IjoiIn0=