/**
 * Sound Toggle Button - UI control for sound on/off
 */
export class SoundToggleButton {
  constructor(soundManager) {
    this.soundManager = soundManager;
    this.createButton();
  }
  
  createButton() {
    const isMobile = window.innerWidth <= 768;
    
    const button = document.createElement('button');
    button.id = 'soundToggleButton';
    button.style.cssText = `
      position: fixed;
      top: ${isMobile ? '160px' : '260px'};
      right: ${isMobile ? '20px' : '40px'};
      width: ${isMobile ? '40px' : '50px'};
      height: ${isMobile ? '40px' : '50px'};
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      color: white;
      font-size: ${isMobile ? '18px' : '22px'};
      cursor: pointer;
      z-index: 1000;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    `;
    button.innerHTML = '🔊';
    button.title = 'Toggle Sound (N)';
    
    button.addEventListener('click', () => this.toggleSound());
    
    // Hover effect (desktop only)
    if (!isMobile) {
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(255, 255, 255, 0.25)';
        button.style.transform = 'scale(1.1)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(255, 255, 255, 0.15)';
        button.style.transform = 'scale(1)';
      });
    }
    
    document.body.appendChild(button);
    this.button = button;
  }
  
  toggleSound() {
    if (!this.soundManager) return;
    
    const enabled = this.soundManager.toggleMute();
    this.button.innerHTML = enabled ? '🔊' : '🔇';
    this.button.title = enabled ? 'Mute Sound (N)' : 'Unmute Sound (N)';
    
    // Flash effect
    this.button.style.background = enabled ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 107, 107, 0.3)';
    setTimeout(() => {
      this.button.style.background = 'rgba(255, 255, 255, 0.15)';
    }, 200);
  }
  
  destroy() {
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
  }
}
