import * as THREE from 'three';

/**
 * Vehicle Customization System
 * Allows players to customize paint colors and purchase upgrades
 */
export class VehicleCustomization {
  constructor(vehicle, scene) {
    this.vehicle = vehicle;
    this.scene = scene;
    
    // Player currency
    this.credits = this.loadCredits();
    
    // Paint colors available
    this.paintColors = [
      { name: 'Silver', color: 0xc0c0c0, price: 0 },      // Default
      { name: 'Red', color: 0xff0000, price: 500 },
      { name: 'Blue', color: 0x0066ff, price: 500 },
      { name: 'Green', color: 0x00ff00, price: 500 },
      { name: 'Yellow', color: 0xffff00, price: 500 },
      { name: 'Orange', color: 0xff8800, price: 500 },
      { name: 'Purple', color: 0x9933ff, price: 500 },
      { name: 'Pink', color: 0xff66ff, price: 500 },
      { name: 'Black', color: 0x1a1a1a, price: 750 },
      { name: 'White', color: 0xffffff, price: 750 },
      { name: 'Gold', color: 0xffd700, price: 1000 },
      { name: 'Chrome', color: 0xe8e8e8, price: 1500 }
    ];
    
    // Performance upgrades
    this.upgrades = {
      engine: {
        name: 'Engine',
        levels: [
          { level: 1, name: 'Stock', accelerationBoost: 0, price: 0, owned: true },
          { level: 2, name: 'Stage 1', accelerationBoost: 0.3, price: 1000, owned: false },
          { level: 3, name: 'Stage 2', accelerationBoost: 0.6, price: 2000, owned: false },
          { level: 4, name: 'Stage 3', accelerationBoost: 1.0, price: 3500, owned: false }
        ],
        currentLevel: 1
      },
      turbo: {
        name: 'Turbo',
        levels: [
          { level: 1, name: 'None', speedBoost: 0, price: 0, owned: true },
          { level: 2, name: 'Basic', speedBoost: 5, price: 1500, owned: false },
          { level: 3, name: 'Sport', speedBoost: 10, price: 2500, owned: false },
          { level: 4, name: 'Race', speedBoost: 15, price: 4000, owned: false }
        ],
        currentLevel: 1
      },
      handling: {
        name: 'Handling',
        levels: [
          { level: 1, name: 'Stock', turnSpeedBoost: 0, price: 0, owned: true },
          { level: 2, name: 'Sport Suspension', turnSpeedBoost: 0.005, price: 800, owned: false },
          { level: 3, name: 'Race Suspension', turnSpeedBoost: 0.010, price: 1500, owned: false },
          { level: 4, name: 'Pro Suspension', turnSpeedBoost: 0.015, price: 2500, owned: false }
        ],
        currentLevel: 1
      },
      brakes: {
        name: 'Brakes',
        levels: [
          { level: 1, name: 'Stock', brakeBoost: 0, price: 0, owned: true },
          { level: 2, name: 'Performance', brakeBoost: 0.05, price: 600, owned: false },
          { level: 3, name: 'Carbon Ceramic', brakeBoost: 0.10, price: 1200, owned: false }
        ],
        currentLevel: 1
      }
    };
    
    // Current customization
    this.currentPaint = this.loadPaint();
    this.loadUpgrades();
    
    // Create UI
    this.createUI();
    
    // Apply saved customization
    this.applyPaint(this.currentPaint);
    this.applyAllUpgrades();
    
    console.log('🎨 Vehicle customization system initialized');
  }
  
  createUI() {
    // Main customization menu (hidden by default)
    const customMenu = document.createElement('div');
    customMenu.id = 'customizationMenu';
    customMenu.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 800px;
      max-height: 80vh;
      background: rgba(10, 10, 10, 0.95);
      border: 3px solid rgba(0, 255, 136, 0.5);
      border-radius: 16px;
      padding: 30px;
      display: none;
      flex-direction: column;
      gap: 20px;
      z-index: 10000;
      overflow-y: auto;
      backdrop-filter: blur(10px);
    `;
    
    const isMobile = window.innerWidth <= 768;
    customMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h2 style="color: #00ff88; font-size: ${isMobile ? '20px' : '32px'}; font-weight: 700; margin: 0;">CUSTOMIZE</h2>
        <button id="closeCustomMenu" style="
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        ">✕</button>
      </div>
      
      <div style="background: rgba(0, 255, 136, 0.2); padding: ${isMobile ? '10px' : '15px'}; border-radius: 8px; text-align: center;">
        <div style="color: rgba(255, 255, 255, 0.7); font-size: ${isMobile ? '11px' : '14px'}; margin-bottom: 5px;">CREDITS</div>
        <div id="creditsDisplay" style="color: #00ff88; font-size: ${isMobile ? '24px' : '36px'}; font-weight: 700;">$${this.credits}</div>
      </div>
      
      <div style="display: flex; gap: 15px; border-bottom: 2px solid rgba(255, 255, 255, 0.2); padding-bottom: 10px;">
        <button class="customTab active" data-tab="paint" style="
          flex: 1;
          padding: 12px;
          background: rgba(0, 255, 136, 0.3);
          border: 2px solid #00ff88;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        ">🎨 PAINT</button>
        <button class="customTab" data-tab="upgrades" style="
          flex: 1;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        ">⚙️ UPGRADES</button>
      </div>
      
      <div id="paintTab" class="customTabContent">
        <h3 style="color: white; margin-bottom: 15px;">Paint Colors</h3>
        <div id="paintGrid" style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 15px;
        "></div>
      </div>
      
      <div id="upgradesTab" class="customTabContent" style="display: none;">
        <h3 style="color: white; margin-bottom: 15px;">Performance Upgrades</h3>
        <div id="upgradesContainer"></div>
      </div>
    `;
    
    document.body.appendChild(customMenu);
    this.customMenu = customMenu;
    
    // Populate paint colors
    this.populatePaintGrid();
    
    // Populate upgrades
    this.populateUpgrades();
    
    // Tab switching
    document.querySelectorAll('.customTab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // Close button
    document.getElementById('closeCustomMenu').addEventListener('click', () => this.closeMenu());
    
    // Customize button (in main UI)
    const customButton = document.createElement('button');
    customButton.id = 'customizeButton';
    // Reuse isMobile from above
    customButton.style.cssText = `
      position: fixed;
      bottom: ${isMobile ? '90px' : '230px'};
      right: ${isMobile ? '20px' : '40px'};
      padding: ${isMobile ? '10px 18px' : '15px 30px'};
      background: rgba(255, 136, 0, 0.9);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      color: #fff;
      font-size: ${isMobile ? '12px' : '16px'};
      font-weight: 700;
      cursor: pointer;
      z-index: 1000;
      transition: all 0.2s;
      letter-spacing: 1px;
    `;
    customButton.textContent = isMobile ? '🎨' : '🎨 CUSTOMIZE (C)';
    customButton.addEventListener('click', () => this.openMenu());
    document.body.appendChild(customButton);
    this.customButton = customButton;
    
    // Keyboard shortcut
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        if (this.customMenu.style.display === 'flex') {
          this.closeMenu();
        } else {
          this.openMenu();
        }
      }
    });
  }
  
  populatePaintGrid() {
    const grid = document.getElementById('paintGrid');
    
    this.paintColors.forEach((paint, index) => {
      const card = document.createElement('div');
      const isOwned = paint.price === 0 || this.isPaintOwned(paint.name);
      const isCurrent = this.currentPaint === paint.name;
      
      card.style.cssText = `
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid ${isCurrent ? '#00ff88' : 'rgba(255, 255, 255, 0.2)'};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      `;
      
      card.innerHTML = `
        <div style="
          width: 80px;
          height: 80px;
          background: #${paint.color.toString(16).padStart(6, '0')};
          margin: 0 auto 10px;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.3);
        "></div>
        <div style="color: white; font-weight: 600; margin-bottom: 5px;">${paint.name}</div>
        <div style="color: ${isOwned ? '#00ff88' : '#ffd700'}; font-size: 14px;">
          ${isOwned ? (isCurrent ? 'EQUIPPED' : 'OWNED') : `$${paint.price}`}
        </div>
      `;
      
      card.addEventListener('click', () => this.selectPaint(paint));
      card.addEventListener('mouseenter', () => {
        card.style.background = 'rgba(0, 255, 136, 0.1)';
        card.style.transform = 'scale(1.05)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.background = 'rgba(255, 255, 255, 0.05)';
        card.style.transform = 'scale(1)';
      });
      
      grid.appendChild(card);
    });
  }
  
  populateUpgrades() {
    const container = document.getElementById('upgradesContainer');
    
    Object.keys(this.upgrades).forEach(upgradeKey => {
      const upgrade = this.upgrades[upgradeKey];
      
      const upgradeSection = document.createElement('div');
      upgradeSection.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
      `;
      
      upgradeSection.innerHTML = `
        <h4 style="color: #00ff88; margin-bottom: 15px; font-size: 20px;">${upgrade.name}</h4>
        <div style="color: rgba(255, 255, 255, 0.7); margin-bottom: 10px;">
          Current: <span style="color: white; font-weight: 600;">${upgrade.levels[upgrade.currentLevel - 1].name}</span>
        </div>
        <div id="upgrade-${upgradeKey}" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
      `;
      
      container.appendChild(upgradeSection);
      
      const levelContainer = document.getElementById(`upgrade-${upgradeKey}`);
      
      upgrade.levels.forEach((level, index) => {
        const isOwned = level.owned;
        const isCurrent = level.level === upgrade.currentLevel;
        
        const levelCard = document.createElement('button');
        levelCard.style.cssText = `
          flex: 1;
          min-width: 140px;
          padding: 15px;
          background: ${isCurrent ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
          border: 2px solid ${isCurrent ? '#00ff88' : 'rgba(255, 255, 255, 0.2)'};
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        `;
        
        const boostText = this.getBoostText(upgradeKey, level);
        
        levelCard.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 5px;">${level.name}</div>
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-bottom: 8px;">${boostText}</div>
          <div style="color: ${isOwned ? '#00ff88' : '#ffd700'}; font-weight: 600;">
            ${isOwned ? (isCurrent ? 'EQUIPPED' : 'OWNED') : `$${level.price}`}
          </div>
        `;
        
        levelCard.addEventListener('click', () => this.selectUpgrade(upgradeKey, level.level));
        
        levelContainer.appendChild(levelCard);
      });
    });
  }
  
  getBoostText(upgradeKey, level) {
    switch(upgradeKey) {
      case 'engine':
        return level.accelerationBoost > 0 ? `+${(level.accelerationBoost * 100).toFixed(0)}% Acceleration` : 'Stock';
      case 'turbo':
        return level.speedBoost > 0 ? `+${level.speedBoost} MPH Top Speed` : 'No boost';
      case 'handling':
        return level.turnSpeedBoost > 0 ? `+${(level.turnSpeedBoost * 100).toFixed(0)}% Turn Speed` : 'Stock';
      case 'brakes':
        return level.brakeBoost > 0 ? `+${(level.brakeBoost * 100).toFixed(0)}% Brake Power` : 'Stock';
      default:
        return '';
    }
  }
  
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.customTab').forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.style.background = 'rgba(0, 255, 136, 0.3)';
        tab.style.borderColor = '#00ff88';
      } else {
        tab.style.background = 'rgba(255, 255, 255, 0.1)';
        tab.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }
    });
    
    // Show/hide content
    document.getElementById('paintTab').style.display = tabName === 'paint' ? 'block' : 'none';
    document.getElementById('upgradesTab').style.display = tabName === 'upgrades' ? 'block' : 'none';
  }
  
  selectPaint(paint) {
    const isOwned = paint.price === 0 || this.isPaintOwned(paint.name);
    
    if (!isOwned) {
      // Purchase paint
      if (this.credits >= paint.price) {
        this.credits -= paint.price;
        this.saveCredits();
        this.markPaintOwned(paint.name);
        this.applyPaint(paint.name);
        this.currentPaint = paint.name;
        this.savePaint();
        this.updateUI();
        console.log(`✅ Purchased ${paint.name} paint for $${paint.price}`);
      } else {
        alert(`Not enough credits! You need $${paint.price} but only have $${this.credits}`);
      }
    } else {
      // Apply owned paint
      this.applyPaint(paint.name);
      this.currentPaint = paint.name;
      this.savePaint();
      this.updateUI();
      console.log(`✅ Applied ${paint.name} paint`);
    }
  }
  
  selectUpgrade(upgradeKey, level) {
    const upgrade = this.upgrades[upgradeKey];
    const targetLevel = upgrade.levels[level - 1];
    
    if (targetLevel.owned) {
      // Equip owned upgrade
      upgrade.currentLevel = level;
      this.applyUpgrade(upgradeKey);
      this.saveUpgrades();
      this.updateUI();
      console.log(`✅ Equipped ${upgrade.name} ${targetLevel.name}`);
    } else {
      // Purchase upgrade
      if (this.credits >= targetLevel.price) {
        this.credits -= targetLevel.price;
        this.saveCredits();
        targetLevel.owned = true;
        upgrade.currentLevel = level;
        this.applyUpgrade(upgradeKey);
        this.saveUpgrades();
        this.updateUI();
        console.log(`✅ Purchased ${upgrade.name} ${targetLevel.name} for $${targetLevel.price}`);
      } else {
        alert(`Not enough credits! You need $${targetLevel.price} but only have $${this.credits}`);
      }
    }
  }
  
  applyPaint(paintName) {
    const paint = this.paintColors.find(p => p.name === paintName);
    if (!paint) return;
    
    // Apply color to vehicle model
    if (this.vehicle.model) {
      this.vehicle.model.traverse((child) => {
        if (child.isMesh && child.material) {
          // Only recolor main body (skip wheels/details)
          if (!child.name || !child.name.toLowerCase().includes('wheel')) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.color.setHex(paint.color);
              });
            } else {
              child.material.color.setHex(paint.color);
            }
          }
        }
      });
    }
    
    // Also apply to placeholder if model not loaded
    if (this.vehicle.placeholder) {
      this.vehicle.placeholder.material.color.setHex(paint.color);
    }
  }
  
  applyUpgrade(upgradeKey) {
    const upgrade = this.upgrades[upgradeKey];
    const currentLevel = upgrade.levels[upgrade.currentLevel - 1];
    
    // Apply boost to vehicle profile
    const profile = this.vehicle.profile;
    
    switch(upgradeKey) {
      case 'engine':
        // Reset to base then apply boost
        const baseAccel = profile.acceleration / (1 + this.getActiveBoost('engine', 'accelerationBoost'));
        profile.acceleration = baseAccel * (1 + currentLevel.accelerationBoost);
        break;
      case 'turbo':
        const baseSpeed = profile.maxSpeed - this.getActiveBoost('turbo', 'speedBoost');
        profile.maxSpeed = baseSpeed + currentLevel.speedBoost;
        break;
      case 'handling':
        const baseTurn = profile.turnSpeed - this.getActiveBoost('handling', 'turnSpeedBoost');
        profile.turnSpeed = baseTurn + currentLevel.turnSpeedBoost;
        break;
      case 'brakes':
        const baseBrake = profile.brakeFriction + this.getActiveBoost('brakes', 'brakeBoost');
        profile.brakeFriction = baseBrake - currentLevel.brakeBoost;
        break;
    }
    
    console.log(`⚡ Applied ${upgrade.name} upgrade:`, profile);
  }
  
  getActiveBoost(upgradeKey, boostType) {
    const upgrade = this.upgrades[upgradeKey];
    const currentLevel = upgrade.levels[upgrade.currentLevel - 1];
    return currentLevel[boostType] || 0;
  }
  
  applyAllUpgrades() {
    Object.keys(this.upgrades).forEach(key => {
      this.applyUpgrade(key);
    });
  }
  
  updateUI() {
    // Update credits display
    document.getElementById('creditsDisplay').textContent = `$${this.credits}`;
    
    // Refresh paint grid and upgrades
    document.getElementById('paintGrid').innerHTML = '';
    document.getElementById('upgradesContainer').innerHTML = '';
    this.populatePaintGrid();
    this.populateUpgrades();
  }
  
  addCredits(amount) {
    this.credits += amount;
    this.saveCredits();
    this.updateUI();
    
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 255, 136, 0.95);
      color: #000;
      padding: 15px 30px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 700;
      z-index: 10001;
      pointer-events: none;
    `;
    notification.textContent = `+$${amount} Credits!`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
  }
  
  openMenu() {
    this.customMenu.style.display = 'flex';
    this.updateUI();
  }
  
  closeMenu() {
    this.customMenu.style.display = 'none';
  }
  
  // Persistence methods
  isPaintOwned(paintName) {
    const owned = localStorage.getItem('ownedPaints') || '["Silver"]';
    return JSON.parse(owned).includes(paintName);
  }
  
  markPaintOwned(paintName) {
    const owned = localStorage.getItem('ownedPaints') || '["Silver"]';
    const ownedArray = JSON.parse(owned);
    if (!ownedArray.includes(paintName)) {
      ownedArray.push(paintName);
      localStorage.setItem('ownedPaints', JSON.stringify(ownedArray));
    }
  }
  
  loadPaint() {
    return localStorage.getItem('currentPaint') || 'Silver';
  }
  
  savePaint() {
    localStorage.setItem('currentPaint', this.currentPaint);
  }
  
  loadCredits() {
    return parseInt(localStorage.getItem('playerCredits') || '5000', 10);
  }
  
  saveCredits() {
    localStorage.setItem('playerCredits', this.credits.toString());
  }
  
  loadUpgrades() {
    const saved = localStorage.getItem('vehicleUpgrades');
    if (saved) {
      const data = JSON.parse(saved);
      Object.keys(data).forEach(key => {
        if (this.upgrades[key]) {
          this.upgrades[key].currentLevel = data[key].currentLevel;
          this.upgrades[key].levels.forEach((level, index) => {
            level.owned = data[key].ownedLevels.includes(level.level);
          });
        }
      });
    }
  }
  
  saveUpgrades() {
    const data = {};
    Object.keys(this.upgrades).forEach(key => {
      data[key] = {
        currentLevel: this.upgrades[key].currentLevel,
        ownedLevels: this.upgrades[key].levels.filter(l => l.owned).map(l => l.level)
      };
    });
    localStorage.setItem('vehicleUpgrades', JSON.stringify(data));
  }
  
  destroy() {
    if (this.customMenu && this.customMenu.parentNode) {
      this.customMenu.parentNode.removeChild(this.customMenu);
    }
    if (this.customButton && this.customButton.parentNode) {
      this.customButton.parentNode.removeChild(this.customButton);
    }
  }
}
