import { CONFIG } from './config.js';

/**
 * Lap Timer System - Track lap times around checkpoint circuit
 */
export class LapTimer {
  constructor(vehicle) {
    this.vehicle = vehicle;
    this.checkpoints = CONFIG.lapCheckpoints;
    this.currentCheckpoint = 0;
    this.isActive = false;
    this.startTime = null;
    this.currentLapTime = 0;
    this.bestLapTime = this.loadBestTime();
    this.lastCheckpointTime = 0;
    
    // UI elements
    this.createUI();
    
    console.log('⏱️ Lap timer initialized');
  }
  
  createUI() {
    // Create lap timer UI
    const timerContainer = document.createElement('div');
    timerContainer.id = 'lapTimerContainer';
    timerContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(10, 10, 10, 0.9);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      padding: 20px 30px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      backdrop-filter: blur(10px);
      pointer-events: none;
      z-index: 100;
    `;
    
    timerContainer.innerHTML = `
      <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6); margin-bottom: 10px; letter-spacing: 1px;">CURRENT LAP</div>
      <div id="currentLapTime" style="font-size: 48px; font-weight: 700; font-variant-numeric: tabular-nums; color: #00ff88;">0:00.000</div>
      <div id="checkpointInfo" style="font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-top: 10px;">Checkpoint 1/4</div>
      <div id="bestLapTime" style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
        BEST: <span style="color: #ffd700; font-weight: 600;">--:--:---</span>
      </div>
    `;
    
    document.body.appendChild(timerContainer);
    this.timerContainer = timerContainer;
    
    // Press T to start hint
    const startHint = document.createElement('div');
    startHint.id = 'lapTimerHint';
    startHint.style.cssText = `
      position: absolute;
      top: 160px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(10, 10, 10, 0.85);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 8px 20px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 1px;
      backdrop-filter: blur(10px);
      z-index: 100;
    `;
    startHint.textContent = 'Press T to start lap timer';
    document.body.appendChild(startHint);
    this.startHint = startHint;
    
    // Update best time display
    this.updateBestTimeDisplay();
  }
  
  updateBestTimeDisplay() {
    const bestTimeEl = this.timerContainer.querySelector('#bestLapTime span');
    if (this.bestLapTime) {
      bestTimeEl.textContent = this.formatTime(this.bestLapTime);
    }
  }
  
  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
  
  start() {
    if (this.isActive) {
      console.log('⏱️ Lap timer already active');
      return;
    }
    
    this.isActive = true;
    this.startTime = Date.now();
    this.currentCheckpoint = 0;
    this.lastCheckpointTime = this.startTime;
    
    // Show timer UI
    this.timerContainer.style.opacity = '1';
    this.startHint.style.display = 'none';
    
    console.log('⏱️ Lap timer started!');
  }
  
  stop() {
    this.isActive = false;
    this.timerContainer.style.opacity = '0';
    this.startHint.style.display = 'block';
  }
  
  reset() {
    this.currentCheckpoint = 0;
    this.currentLapTime = 0;
    this.isActive = false;
    this.startTime = null;
    this.timerContainer.style.opacity = '0';
    this.startHint.style.display = 'block';
  }
  
  update() {
    if (!this.isActive) return;
    
    const vehiclePos = this.vehicle.getPosition();
    
    // Update current lap time
    this.currentLapTime = Date.now() - this.startTime;
    const currentTimeEl = this.timerContainer.querySelector('#currentLapTime');
    currentTimeEl.textContent = this.formatTime(this.currentLapTime);
    
    // Check if we're at the next checkpoint
    const nextCheckpoint = this.checkpoints[this.currentCheckpoint];
    const distToCheckpoint = Math.sqrt(
      Math.pow(vehiclePos.x - nextCheckpoint.x, 2) +
      Math.pow(vehiclePos.z - nextCheckpoint.z, 2)
    );
    
    if (distToCheckpoint < nextCheckpoint.radius) {
      this.hitCheckpoint();
    }
  }
  
  hitCheckpoint() {
    this.currentCheckpoint++;
    
    const checkpointInfoEl = this.timerContainer.querySelector('#checkpointInfo');
    
    // Check if we completed the lap
    if (this.currentCheckpoint >= this.checkpoints.length) {
      this.completeLap();
    } else {
      // Show checkpoint progress
      checkpointInfoEl.textContent = `Checkpoint ${this.currentCheckpoint + 1}/${this.checkpoints.length}`;
      console.log(`⏱️ Checkpoint ${this.currentCheckpoint}/${this.checkpoints.length}`);
    }
  }
  
  completeLap() {
    const lapTime = this.currentLapTime;
    console.log(`🏁 Lap completed! Time: ${this.formatTime(lapTime)}`);
    
    // Check if it's a new best time
    if (!this.bestLapTime || lapTime < this.bestLapTime) {
      this.bestLapTime = lapTime;
      this.saveBestTime(lapTime);
      this.updateBestTimeDisplay();
      
      // Flash effect for new record
      const currentTimeEl = this.timerContainer.querySelector('#currentLapTime');
      currentTimeEl.style.color = '#ffd700';
      setTimeout(() => {
        currentTimeEl.style.color = '#00ff88';
      }, 1000);
      
      console.log('🏆 NEW BEST LAP TIME!');
    }
    
    // Reset for next lap
    this.currentCheckpoint = 0;
    this.startTime = Date.now();
  }
  
  saveBestTime(time) {
    try {
      localStorage.setItem('bestLapTime', time.toString());
    } catch (e) {
      console.warn('Could not save best lap time:', e);
    }
  }
  
  loadBestTime() {
    try {
      const saved = localStorage.getItem('bestLapTime');
      return saved ? parseInt(saved, 10) : null;
    } catch (e) {
      console.warn('Could not load best lap time:', e);
      return null;
    }
  }
  
  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
  }
  
  destroy() {
    if (this.timerContainer && this.timerContainer.parentNode) {
      this.timerContainer.parentNode.removeChild(this.timerContainer);
    }
    if (this.startHint && this.startHint.parentNode) {
      this.startHint.parentNode.removeChild(this.startHint);
    }
  }
}
