import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!; // Rendering Context
const cursor = { active: false, x: 0, y: 0 }; //Mouse Cursor

interface Point {
    x: number;
    y: number;
}

const points: Point[] = [];

app.append(canvas)

canvas.addEventListener("mousedown", (event) => {
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
});

canvas.addEventListener("mouseup", () => {
    cursor.active = false;
});



canvas.addEventListener("mousemove", (event) => {
    if (cursor.active) {
        //Push to points
        points.push({ x: event.offsetX, y: event.offsetY });
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
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