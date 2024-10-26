import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

let lineWidthControls: "Thin" | "Thick" = "Thin";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!; 
const cursor = { 
    active: false, 
    x: 0, 
    y: 0,
    sticker: "🤡",
    
    updatePosition(e: MouseEvent) {
        const canvas = e.target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width;
        console.log(rect);
        
        this.x = (e.clientX - rect.left) * scale;
        this.y = (e.clientY - rect.top) * scale;
        console.log(this.x, this.y);
        this.execute();

    },

    setSticker(string: string) {
        this.sticker = string;
        setButtonAsSelected(string);
    },

    execute() {
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
        let lineWidth = 7;
        if (lineWidthControls === "Thin") lineWidth = 4;
        if ( this.active == false) {
           if (this.sticker == "Draw") ctx.fillRect(this.x, this.y, lineWidth, lineWidth);
           else ctx.fillText(this.sticker, this.x, this.y);

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
    constructor(x:number, y:number) {
        this.localPoints = [{x, y}];
      }
    display(ctx: CanvasRenderingContext2D) {
        ctx.fillText(this.localSticker, this.localPoints[0].x, this.localPoints[0].y);
      }
      
    drag(x:number, y:number) { 
        //Move the sticker to the new position
        this.localPoints[0].x = x;
        this.localPoints[0].y = y;
    }

}


const points: Point[] = [];
const undoStack: Point[] = [];
const redoStack: Point[] = [];

app.append(canvas)


canvas.addEventListener("mousedown", (event) => {
    cursor.active = true;
    updateMousePosition(event);
    if (cursor.sticker === "Draw") {
        const tempLinePoint = new LinePoint(cursor.x, cursor.y);
        points.push(tempLinePoint);
        undoStack.push(tempLinePoint);
        redoStack.length = 0;
    }
    else {
        const tempStickerPoint = new StickerPoint(cursor.x, cursor.y);
        points.push(tempStickerPoint);
        undoStack.push(tempStickerPoint);
        redoStack.length = 0;
    }
});

canvas.addEventListener("mouseup", () => {
    disableMouse()
});

function disableMouse() {
    cursor.active = false;
}



canvas.addEventListener("mousemove", (event) => {
    updateMousePosition(event);
    if (cursor.active) {
        points[points.length - 1].drag(cursor.x, cursor.y);
        //Dispatch the event
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
    disableMouse()
    lineWidthControls = "Thin";
    thinLineButton.classList.add("selectedTool");
    thickLineButton.classList.remove("selectedTool");
});

const thickLineButton = createButton("thick");
thickLineButton.addEventListener("click", () => {
    disableMouse()
    lineWidthControls = "Thick";
    thickLineButton.classList.add("selectedTool");
    thinLineButton.classList.remove("selectedTool");
});
const buttonList: HTMLButtonElement[] = [];
buttonList[0] = createStickerButton("🤡");
buttonList[0].classList.add("selectedTool");
buttonList[1] = createStickerButton("🐟");
buttonList[2] = createStickerButton("💩");
buttonList[3] = createStickerButton("❤️");
buttonList[4] = createStickerButton("Draw");

function setButtonAsSelected(string: string) {
    buttonList.forEach(button => {
        if (button.innerHTML === string) {
            button.classList.add("selectedTool");
        } else {
            button.classList.remove("selectedTool");
        }
    });
}