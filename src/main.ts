import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

let lineWidthControls: "Thin" | "Thick" = "Thin";
let globalRotation = 0;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!; 
const scale = globalThis.devicePixelRatio;
canvas.width = 256 * scale;
canvas.height = 256 * scale;
ctx.scale(scale, scale);

const cursor = { 
    active: false, 
    x: 0, 
    y: 0,
    sticker: "🤡",
    
    updatePosition(e: MouseEvent) {
        const canvas = e.target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        
        this.x = e.offsetX / rect.width * canvas.width;
        this.y = e.offsetY / rect.height * canvas.height + 10;

        this.execute();
    },

    setSticker(string: string) {
        this.sticker = string;
        setButtonAsSelected(string);
    },

    execute() {
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
        let lineWidth = 8;
        ctx.font = "30px Arial";
        if (lineWidthControls === "Thin"){ 
            lineWidth = 4;
            ctx.font = "15px Arial";
        }

        if (this.active == false) {
            ctx.save(); // Save the current state
            ctx.translate(this.x, this.y); // Move to the sticker's position
            ctx.rotate((globalRotation * Math.PI) / 180); // Rotate the context
            ctx.translate(-this.x, -this.y); // Move back

            if (this.sticker == "Draw") ctx.fillRect(this.x, this.y, lineWidth, lineWidth);
            else ctx.fillText(this.sticker, this.x, this.y);

            ctx.restore(); // Restore the previous state
        }
    },
};  


interface Point {
    localPoints: [{x: number, y: number}];
    display(context: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}

class LinePoint implements Point {
    localPoints: [{ x: number; y: number; }];
    lineThickness: "Thick" | "Thin" = "Thin";
    constructor(x:number, y:number) {
        this.localPoints = [{x, y}];
        this.lineThickness = lineWidthControls;
      }
    display(ctx: CanvasRenderingContext2D) {
        if (this.lineThickness === "Thin") {
            ctx.lineWidth = 3;
        } else {
            ctx.lineWidth = 7;
        }
        ctx.beginPath();
        ctx.fill();
        for (let i = 1; i < this.localPoints.length; i++) {
            ctx.lineTo(this.localPoints[i].x, this.localPoints[i].y);
        }
        ctx.stroke();
        ctx.closePath();
      }
      drag(x:number, y:number) { 
        this.localPoints.push({x, y});
      }

}

class StickerPoint implements Point {
    localSticker: string = cursor.sticker;
    localPoints: [{ x: number; y: number; }];
    lineThickness: "Thick" | "Thin" = "Thin";
    rotation: number = globalRotation;
    constructor(x:number, y:number) {
        this.localPoints = [{x, y}];
        this.lineThickness = lineWidthControls;
        this.rotation = globalRotation;
      }
    display(ctx: CanvasRenderingContext2D) {
        ctx.save(); // Save the current state
        ctx.translate(this.localPoints[0].x, this.localPoints[0].y); // Move to the sticker's position
        ctx.rotate((this.rotation * Math.PI) / 180); // Rotate the context
        ctx.translate(-this.localPoints[0].x, -this.localPoints[0].y); // Move back

        if (this.lineThickness === "Thin") ctx.font = "15px Arial";
        else ctx.font = "30px Arial";
        
        ctx.fillText(this.localSticker, this.localPoints[0].x, this.localPoints[0].y);
        ctx.restore(); // Restore the previous state
    }
      
    drag(x:number, y:number) { 
        this.localPoints[0].x = x;
        this.localPoints[0].y = y;
    }

}


const points: Point[] = [];
const undoStack: Point[] = [];
const redoStack: Point[] = [];

app.append(canvas)


canvas.addEventListener("mousedown", (event) => {
    updateMousePosition(event);
    if (cursor.sticker === "Draw") {
        const tempLinePoint = new LinePoint(cursor.x, cursor.y);
        points.push(tempLinePoint);
        undoStack.push(tempLinePoint);
    }
    else {
        const tempStickerPoint = new StickerPoint(cursor.x, cursor.y);
        points.push(tempStickerPoint);
        undoStack.push(tempStickerPoint);
    }
    redoStack.length = 0;
    cursor.active = true;
});

canvas.addEventListener("mouseup", () => {
    disableMouseIsActive()
});

function disableMouseIsActive() {
    cursor.active = false;
}

canvas.addEventListener("mousemove", (event) => {
    updateMousePosition(event);
    if (cursor.active) {
        points[points.length - 1].drag(cursor.x, cursor.y);
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
});

canvas.addEventListener("drawing-changed", () => {
    //Clear Lines
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //Redraw Lines
    points.forEach((point) => {
        point.display(ctx);
        }
    );
});

function updateMousePosition(event: MouseEvent) {
    cursor.updatePosition(event);
}

// -------- BUTTONS --------
// -------------------------
function createButton(text: string){
    const button = document.createElement("button");
    button.innerHTML = text;
    document.body.append(button);
    return button;
}

const stickerDiv = document.createElement("div");
app.append(stickerDiv);
function createStickerButton(text: string){
    const button = document.createElement("button");
    button.innerHTML = text;
    stickerDiv.append(button);
    button.addEventListener("click", () => {
        disableMouseIsActive();
        cursor.setSticker(text);
    });
    return button;
}

const clearButton = createButton("clear");
clearButton.addEventListener("click", () => {
    undoStack.length = 0;
    points.length = 0;
    redoStack.length = 0;
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

const undoButton = createButton("undo");
undoButton.addEventListener("click", () => {
    undoStack.pop();
    if (points.length) redoStack.push(points.pop()!);

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

const redoButton = createButton("redo");
redoButton.addEventListener("click", () => {
    const undoSavePoint = redoStack.pop();
    if (undoSavePoint) {
        points.push(undoSavePoint!);
        undoStack.push(undoSavePoint);        
    }
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

const thinLineButton = createButton("thin");
thinLineButton.classList.add("selectedTool");
thinLineButton.addEventListener("click", () => {
    disableMouseIsActive()
    lineWidthControls = "Thin";
    thinLineButton.classList.add("selectedTool");
    thickLineButton.classList.remove("selectedTool");
});

const thickLineButton = createButton("thick");
thickLineButton.addEventListener("click", () => {
    disableMouseIsActive()
    lineWidthControls = "Thick";
    thickLineButton.classList.add("selectedTool");
    thinLineButton.classList.remove("selectedTool");
});
const exportButton = createButton("export");
exportButton.addEventListener("click", () => {
    //Create new canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1024;
    tempCanvas.height = 1024;
    //Create new context
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.scale(4, 4);
    //Fill new context
    points.forEach((point) => {
        point.display(tempCtx);
    });
    //Handle Download
    const anchor = document.createElement("a");
    anchor.href = tempCanvas.toDataURL("image/png");
    anchor.download = "sketch.png";
    anchor.click();
});

const rotationSlider = document.createElement("input");
rotationSlider.type = "range";
rotationSlider.min = "0";
rotationSlider.max = "360";
rotationSlider.value = "0";
rotationSlider.step = "1";
rotationSlider.addEventListener("input", () => {
    globalRotation = parseInt(rotationSlider.value);
});
stickerDiv.append(rotationSlider);

// STICKER BUTTONS 
const buttonList: HTMLButtonElement[] = [];
buttonList[0] = createStickerButton("🤡");
buttonList[0].classList.add("selectedTool");
buttonList[1] = createStickerButton("🐟");
buttonList[2] = createStickerButton("💩");
buttonList[3] = createStickerButton("❤️");
buttonList[4] = createStickerButton("Draw");
buttonList[5] = createCustomStickerButton();

function setButtonAsSelected(string: string) {
    let found = false;
    buttonList.forEach(button => {
        if (button.innerHTML === string) {
            found = true;
            button.classList.add("selectedTool");
        } else {
            button.classList.remove("selectedTool");
        }
    });
    if (!found) {
        buttonList[5].classList.add("selectedTool");
    }
}

function createCustomStickerButton(){
    const button = document.createElement("button");
    button.innerHTML = "Custom";
    stickerDiv.append(button);
    button.addEventListener("click", () => {
        const text = prompt("Enter a custom sticker");
        if (text != null) cursor.setSticker(text);
    });
    return button;
}