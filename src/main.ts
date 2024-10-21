import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const canvas = document.createElement("canvas");
//const ctx = canvas.getContext("2d")!; // Rendering Context, Will be used later

app.appendChild(canvas);