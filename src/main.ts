import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

let mouseDownThisFrame = false;


const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!; 
const cursor = { active: false, x: 0, y: 0 }; //Mouse Cursor

interface Point {
    localPoints: [{x: number, y: number}];
    display(context: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}

class LinePoint implements Point {
    localPoints: [{ x: number; y: number; }];
    constructor(x:number, y:number) {
        this.localPoints = [{x, y}];
      }
    display(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 4;
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
    cursor.active = false;
});



canvas.addEventListener("mousemove", (event) => {
    if (cursor.active) {
        updateMousePosition(event);
        //Move the point
        points[points.length - 1].drag(cursor.x, cursor.y);
        //Dispatch the event
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
});


canvas.addEventListener("drawing-changed", () => {
    //Clear Line
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //Redraw Line
    points.forEach((point) => {
        point.display(ctx);
        }
    );

});

function updateMousePosition(event: MouseEvent) {
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;   
}

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
    points.length = 0;
    undoStack.length = 0;
    redoStack.length = 0;
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));

});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
    const lastPoint = undoStack.pop();
    if (lastPoint) {
        redoStack.push(lastPoint);
    }
    while (points.length) {
        //If the last point is the same as the last point in the undo stack
        if (points[points.length - 1] == lastPoint && points[points.length - 1] == lastPoint) {
            break;
        }
        redoStack.push(points[points.length - 1]);
        points.pop();
    }

    if (points.length) points.pop();

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});


const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
    //Save the last point in the redo stack for the undo button
    const undoSavePoint = redoStack.pop();
    if (undoSavePoint) {
        //Save the undo point and add it to the point stack
        points.push(undoSavePoint!);
        undoStack.push(undoSavePoint);
        //Add all the points from the redo stack to the points array
        while (redoStack.length) {
            points.push(redoStack.pop()!);
        }
    }
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});