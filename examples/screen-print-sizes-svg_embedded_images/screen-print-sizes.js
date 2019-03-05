let svgObject = document.getElementById('svg-object')

const addListeners = (elArray) => {
    elArray[1].forEach(function (a) {
        a.addEventListener("click", () => {
            document.getElementById(`${elArray[0]}-input`).click()
        }, false);
    })
}
svgObject.addEventListener('load', function () {
    let svgDoc = svgObject.contentDocument;

    let ifrontregion = svgDoc.querySelectorAll('.front');
    let pfrontregion = svgDoc.querySelectorAll('#printregionsfront>path');
    let ibackregion = svgDoc.querySelectorAll('.back');
    let pbackregion = svgDoc.querySelectorAll('#printregionsback>path');
    let frontregion = [...ifrontregion, ...pfrontregion]
    let backregion = [...ibackregion, ...pbackregion]
    addListeners(['back', backregion])
    addListeners(['front', frontregion])

})

let insertImage = (region, base64img) => {
    svgObject.getSVGDocument().querySelector(`#printregions${region}`).style.display = 'none'
    svgObject.getSVGDocument().querySelectorAll(`.${region}`).forEach(x => x.setAttribute('xlink:href', base64img))
}

let loadImage = (designLocation) => {
    let file = document.getElementById(`${designLocation}-input`).files[0];
    let reader = new FileReader();
    reader.addEventListener("load", function () {
        let base64img = reader.result;
        insertImage(designLocation, base64img)
    }, false);
    if (file) {
        reader.readAsDataURL(file);
    }
}
let changeShirtColor = (color) => {
    let pathsToColor = Array.from(svgObject.getSVGDocument().getElementsByTagName('path'))
    pathsToColor.forEach((x) => {
        ((
                (x.style.fillRule == 'evenodd' && x.style.stroke) === 'none' ||
                // These two paths failed to get selected by the conditions above
                // One is the Adult Short Sleeve fill (path9993) and the other are 
                // the tiny collar bits that hang outside of the print region on the
                // 2+ Color All Over Print. Instead of this little hack I could have edited 
                // the svg to add selectors to these paths that allow them to be obtained
                // in a single conditional, but this works for now.
                (x.id === ('path10089')) ||
                (x.id === ('path9993'))) ?
            x.style.fill = color :
            null
        )
    })
    svgObject.getSVGDocument().querySelectorAll("mask>g>path").forEach(x => x.style.fill = 'white')
}

function getMousePos(a, c) {
    let b = a.getBoundingClientRect();
    return {
        x: c.clientX - b.left,
        y: c.clientY - b.top
    }
}

let cpcanvas = document.getElementById("cpcanvas"),
    cpctx = cpcanvas.getContext("2d"),
    hue = 0
drawCP(cpctx, hue);

function drawCP(a, c) {
    let b = a.createLinearGradient(0, 0, a.canvas.width, 0);
    b.addColorStop(0, "#fff");
    b.addColorStop(1, `hsl(${c}, 100%, 50%)`);
    a.fillStyle = b;
    a.fillRect(0, 0, a.canvas.width, a.canvas.height);
    b = a.createLinearGradient(0, 0, 0, a.canvas.height);
    b.addColorStop(0, "rgba(0,0,0,0)");
    b.addColorStop(1, "#000");
    a.fillStyle = b;
    a.fillRect(0, 0, a.canvas.width, a.canvas.height)
}

function CPGetPixel(a, c) {
    let b = cpcanvas.clientWidth / cpcanvas.width;
    b = cpctx.getImageData(a / b, c / b, 1, 1).data;
    b = Array.from(b)
    b.pop()
    let rgbString = `rgb(${b.join(',')})`
    return changeShirtColor(rgbString)
}

HUE.onchange = function () {
    drawCP(cpctx, this.value)
    console.log(this.value)
    let hueChange = `rgb(${hslToRgb(parseInt(this.value) / 359, 1, .5).join(',')})`
    return changeShirtColor(hueChange)
}

cpcanvas.onmousedown = function (a) {
    mousePos = getMousePos(cpcanvas, a);
    CPGetPixel(mousePos.x, mousePos.y);
    cancelMove = function (b) {
        cpcanvas.onmousemove = () => {
            return
        };
    }
    cpcanvas.onmousemove = function (a, mousePos) {
        mousePos = getMousePos(cpcanvas, a);
        CPGetPixel(mousePos.x, mousePos.y);
        cpcanvas.onmouseup = function (b) {
            cancelMove(b)
        }
        cpcanvas.onabort = function (b) {
            cancelMove(b)
        }
        cpcanvas.onmouseleave = function (b) {
            cancelMove(b)
        }
    }
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        let hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}