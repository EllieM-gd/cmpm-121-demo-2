import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

let mouseDownThisFrame = false;


const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!; 
const cursor = { active: false, x: 0, y: 0 }; //Mouse Cursor

interface Point {
    x: number;
    y: number;
}

const points: Point[] = [];
const undoStack: Point[] = [];
const redoStack: Point[] = [];

app.append(canvas)


canvas.addEventListener("mousedown", () => {
    cursor.active = true;
    mouseDownThisFrame = true;
});

canvas.addEventListener("mouseup", () => {
    cursor.active = false;
});



canvas.addEventListener("mousemove", (event) => {
    if (cursor.active) {
        //If the mouse was down this frame
        if (mouseDownThisFrame) {
            //Push this to undo stack & Clear the redo stack
            undoStack.push({ x: event.offsetX, y: event.offsetY });
            redoStack.length = 0;
            mouseDownThisFrame = false;
        }
        //Add the point to the points array
        points.push({ x: event.offsetX, y: event.offsetY });
        //Dispatch the event
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
});


canvas.addEventListener("drawing-changed", () => {
    //Clear Line
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //Redraw Line
    points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
        //If not the last point
        if (index < points.length - 1) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(points[index + 1].x, points[index + 1].y);
            ctx.stroke();
        }
    });

});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        if (points[points.length - 1].x == lastPoint?.x && points[points.length - 1].y == lastPoint?.y) {
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