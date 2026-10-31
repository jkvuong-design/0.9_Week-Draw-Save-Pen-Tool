const socket = io();

let activeColor = 'red';
let customPenDataURL = null;

// Global helper for color selection
window.selectColor = function(color, el) {
  activeColor = color;
  document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
  if (el) el.classList.add('selected');
};

// Global helper to save off-screen graphics as a pen image
window.saveIconAsPen = function() {
  if (window.iconCanvasInstance) {
    customPenDataURL = window.iconCanvasInstance.getCanvasData();
    alert('Icon saved as pen tool!');
  }
};

// Global helper to clear both canvases
window.clearAll = function() {
  socket.emit('clear_canvas');
};

// =========================================
// 1. ICON CANVAS (Off-screen Graphics setup)
// =========================================
const iconSketch = (p) => {
  p.setup = () => {
    const canvas = p.createCanvas(100, 100);
    canvas.parent('iconCanvasContainer');
    p.background(240);
    p.strokeCap(p.ROUND);
  };

  p.draw = () => {
    if (p.mouseIsPressed && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      p.stroke(activeColor);
      p.strokeWeight(6);
      p.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
    }
  };

  p.getCanvasData = () => {
    return p.canvas.toDataURL();
  };

  p.clearCanvas = () => {
    p.background(240);
  };
};

window.iconCanvasInstance = new p5(iconSketch);

// =========================================
// 2. MAIN COLLABORATIVE CANVAS
// =========================================
const mainSketch = (p) => {
  let remoteImages = {};

  p.setup = () => {
    const canvas = p.createCanvas(600, 400);
    canvas.parent('mainCanvasContainer');
    p.background(255);
    p.imageMode(p.CENTER);
  };

  p.mouseDragged = () => {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;

    if (customPenDataURL) {
      p.loadImage(customPenDataURL, (img) => {
        p.image(img, p.mouseX, p.mouseY, 30, 30);
      });

      socket.emit('draw_stamp', {
        x: p.mouseX,
        y: p.mouseY,
        imgData: customPenDataURL
      });
    } else {
      p.stroke(activeColor);
      p.strokeWeight(4);
      p.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
    }
  };

  // Socket Listener: Receive stamps from connected clients
  socket.on('draw_stamp', (data) => {
    if (!remoteImages[data.imgData]) {
      p.loadImage(data.imgData, (loadedImg) => {
        remoteImages[data.imgData] = loadedImg;
        p.image(loadedImg, data.x, data.y, 30, 30);
      });
    } else {
      p.image(remoteImages[data.imgData], data.x, data.y, 30, 30);
    }
  });

  // Socket Listener: Clear canvas remotely
  socket.on('clear_canvas', () => {
    p.background(255);
    window.iconCanvasInstance.clearCanvas();
  });
};

new p5(mainSketch);