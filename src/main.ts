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
    
    updatePosition(e: MouseEvent) {
        this.x = e.offsetX;
        this.y = e.offsetY;
        this.execute();
    },

    execute() {
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
        let lineWidth = 7;
        if (lineWidthControls === "Thin") lineWidth = 4;
        if ( this.active == false) ctx.fillRect(this.x, this.y, lineWidth, lineWidth);
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


const points: LinePoint[] = [];
const undoStack: LinePoint[] = [];
const redoStack: LinePoint[] = [];

app.append(canvas)


canvas.addEventListener("mousedown", (event) => {
    cursor.active = true;
    updateMousePosition(event);
    const tempLinePoint = new LinePoint(cursor.x, cursor.y);
    points.push(tempLinePoint);
    undoStack.push(tempLinePoint);
    redoStack.length = 0;
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

const clearButton = createButton("clear");
clearButton.addEventListener("click", () => {
    points.length = 0;
    undoStack.length = 0;
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