export class InputManager {
  constructor() {
    this.keys = new Set();
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      isDown: false,
      rightDown: false,
    };
    this.specialRequested = false;
    this.dashRequested = false;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);

    this.canvas = null;
    this.camera = null;
  }

  attach(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;

    // Default mouse to center
    this.mouse.x = canvas.width / 2;
    this.mouse.y = canvas.height / 2;
    if (camera) {
      this.mouse.worldX = this.mouse.x + camera.x;
      this.mouse.worldY = this.mouse.y + camera.y;
    }

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('contextmenu', this._onContextMenu);
  }

  detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
      this.canvas.removeEventListener('mousedown', this._onMouseDown);
      this.canvas.removeEventListener('contextmenu', this._onContextMenu);
    }
    window.removeEventListener('mouseup', this._onMouseUp);
    this.keys.clear();
  }

  _updateMouseCoords(e) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / (rect.width || 1);
    const scaleY = this.canvas.height / (rect.height || 1);

    this.mouse.x = (e.clientX - rect.left) * scaleX;
    this.mouse.y = (e.clientY - rect.top) * scaleY;

    if (this.camera) {
      this.mouse.worldX = this.mouse.x + this.camera.x;
      this.mouse.worldY = this.mouse.y + this.camera.y;
    } else {
      this.mouse.worldX = this.mouse.x;
      this.mouse.worldY = this.mouse.y;
    }
  }

  _onKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys.add(key);
    this.keys.add(e.code);

    if (e.code === 'Space' || key === ' ') {
      this.dashRequested = true;
      e.preventDefault();
    }
    if (key === 'e' || key === 'q') {
      this.specialRequested = true;
    }
  }

  _onKeyUp(e) {
    const key = e.key.toLowerCase();
    this.keys.delete(key);
    this.keys.delete(e.code);
  }

  _onMouseMove(e) {
    this._updateMouseCoords(e);
  }

  _onMouseDown(e) {
    this._updateMouseCoords(e);
    if (e.button === 0) {
      this.mouse.isDown = true;
    } else if (e.button === 2) {
      this.mouse.rightDown = true;
      this.specialRequested = true;
    }
  }

  _onMouseUp(e) {
    if (e.button === 0) {
      this.mouse.isDown = false;
    } else if (e.button === 2) {
      this.mouse.rightDown = false;
    }
  }

  _onContextMenu(e) {
    e.preventDefault();
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;

    // Up: W or ArrowUp
    if (this.keys.has('w') || this.keys.has('arrowup') || this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      dy -= 1;
    }
    // Down: S or ArrowDown
    if (this.keys.has('s') || this.keys.has('arrowdown') || this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      dy += 1;
    }
    // Left: A or ArrowLeft
    if (this.keys.has('a') || this.keys.has('arrowleft') || this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      dx -= 1;
    }
    // Right: D or ArrowRight
    if (this.keys.has('d') || this.keys.has('arrowright') || this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      dx += 1;
    }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    return { dx, dy };
  }

  consumeDash() {
    const requested = this.dashRequested;
    this.dashRequested = false;
    return requested;
  }

  consumeSpecial() {
    const requested = this.specialRequested;
    this.specialRequested = false;
    return requested;
  }

  updateWorldMouse(camera) {
    this.camera = camera;
    if (this.camera) {
      this.mouse.worldX = this.mouse.x + this.camera.x;
      this.mouse.worldY = this.mouse.y + this.camera.y;
    }
  }
}
