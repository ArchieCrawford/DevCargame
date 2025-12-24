export class Minimap {
  constructor(canvasId, cybertruck) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.cybertruck = cybertruck;
    
    // Minimap settings
    this.scale = 1.5; // How much of the world to show
    this.size = 200; // Canvas size
    
    // Jefferson Ave layout
    this.scale = 2.5; // Increased scale for longer corridor
    
    this.landmarks = [
      { name: 'Walmart', x: 60, z: 1200, color: '#1a4f9a', icon: '🛒' },
      { name: 'Starbucks', x: -50, z: 800, color: '#00754a', icon: '☕' },
      { name: 'Shopping', x: -150, z: 400, color: '#888', icon: '🏬' }
    ];
  }
  
  worldToMinimap(worldX, worldZ, truckX, truckZ) {
    // Convert world coordinates to minimap coordinates
    // Center the minimap on the truck
    const relativeX = worldX - truckX;
    const relativeZ = worldZ - truckZ;
    
    const minimapX = this.size / 2 + (relativeX / this.scale);
    const minimapY = this.size / 2 + (relativeZ / this.scale);
    
    return { x: minimapX, y: minimapY };
  }
  
  draw() {
    const ctx = this.ctx;
    const truckPos = this.cybertruck.getPosition();
    const truckRot = this.cybertruck.getRotation();
    
    // Clear canvas
    ctx.clearRect(0, 0, this.size, this.size);
    
    // Fill background
    ctx.fillStyle = 'rgba(20, 20, 20, 0.5)';
    ctx.fillRect(0, 0, this.size, this.size);
    
    // Draw grid
    this.drawGrid(truckPos.x, truckPos.z);
    
    // Draw Jefferson Ave (main road)
    this.drawJeffersonAve(truckPos.x, truckPos.z);
    
    // Draw landmarks
    this.drawLandmarks(truckPos.x, truckPos.z);
    
    // Draw truck (always at center)
    this.drawTruck(truckRot);
    
    // Draw compass directions
    this.drawCompass();
  }
  
  drawGrid(truckX, truckZ) {
    const ctx = this.ctx;
    const gridSize = 20;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = -5; i <= 5; i++) {
      const worldX = Math.floor(truckX / gridSize) * gridSize + i * gridSize;
      const pos = this.worldToMinimap(worldX, truckZ, truckX, truckZ);
      
      if (pos.x >= 0 && pos.x <= this.size) {
        ctx.beginPath();
        ctx.moveTo(pos.x, 0);
        ctx.lineTo(pos.x, this.size);
        ctx.stroke();
      }
    }
    
    // Horizontal lines
    for (let i = -5; i <= 5; i++) {
      const worldZ = Math.floor(truckZ / gridSize) * gridSize + i * gridSize;
      const pos = this.worldToMinimap(truckX, worldZ, truckX, truckZ);
      
      if (pos.y >= 0 && pos.y <= this.size) {
        ctx.beginPath();
        ctx.moveTo(0, pos.y);
        ctx.lineTo(this.size, pos.y);
        ctx.stroke();
      }
    }
  }
  
  drawJeffersonAve(truckX, truckZ) {
    const ctx = this.ctx;
    
    // Main road (vertical line through minimap)
    ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 1;
    
    const roadWidth = 35 / this.scale;
    const roadStart = this.worldToMinimap(0, 0, truckX, truckZ);
    const roadEnd = this.worldToMinimap(0, 1500, truckX, truckZ);
    
    // Draw road
    ctx.fillRect(
      this.size / 2 - roadWidth / 2,
      Math.min(roadStart.y, roadEnd.y),
      roadWidth,
      Math.abs(roadEnd.y - roadStart.y)
    );
    
    // Center line
    ctx.strokeRect(
      this.size / 2 - 0.5,
      Math.min(roadStart.y, roadEnd.y),
      1,
      Math.abs(roadEnd.y - roadStart.y)
    );
  }
  
  drawLandmarks(truckX, truckZ) {
    const ctx = this.ctx;
    
    this.landmarks.forEach(landmark => {
      const pos = this.worldToMinimap(landmark.x, landmark.z, truckX, truckZ);
      
      if (this.isVisible(pos.x, pos.y, 10, 10)) {
        // Draw landmark icon
        ctx.fillStyle = landmark.color;
        ctx.fillRect(pos.x - 4, pos.y - 4, 8, 8);
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x - 4, pos.y - 4, 8, 8);
        
        // Draw label if close enough
        const distance = Math.sqrt(
          Math.pow(pos.x - this.size / 2, 2) + 
          Math.pow(pos.y - this.size / 2, 2)
        );
        
        if (distance < 60) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '9px Arial';
          ctx.fillText(landmark.icon, pos.x - 4, pos.y - 6);
        }
      }
    });
  }
  
  drawTruck(rotation) {
    const ctx = this.ctx;
    const centerX = this.size / 2;
    const centerY = this.size / 2;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    
    // Draw truck body (simple chevron/arrow shape)
    ctx.fillStyle = '#00ff88';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, -8);  // Front point
    ctx.lineTo(-5, 4);  // Back left
    ctx.lineTo(-5, 8);  // Back left corner
    ctx.lineTo(5, 8);   // Back right corner
    ctx.lineTo(5, 4);   // Back right
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // Direction indicator (small dot at front)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  drawCompass() {
    const ctx = this.ctx;
    const centerX = this.size / 2;
    const centerY = this.size / 2;
    
    // Draw N, S, E, W indicators
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // North (top)
    ctx.fillText('N', centerX, 15);
    
    // South (bottom)
    ctx.fillText('S', centerX, this.size - 15);
    
    // East (right)
    ctx.fillText('E', this.size - 15, centerY);
    
    // West (left)
    ctx.fillText('W', 15, centerY);
  }
  
  isVisible(x, y, width, height) {
    // Check if element is within minimap bounds
    return !(x + width / 2 < 0 || 
             x - width / 2 > this.size || 
             y + height / 2 < 0 || 
             y - height / 2 > this.size);
  }
}
