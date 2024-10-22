import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!; // Rendering Context
const cursor = { active: false, x: 0, y: 0 }; //Mouse Cursor

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
        ctx.beginPath();
        ctx.moveTo(cursor.x, cursor.y);
        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
    }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});