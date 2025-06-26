const typingArea = document.getElementById('typingArea')
const container = document.getElementById('container')
console.log('Script loaded')
console.log('Typing area:', typingArea)
const keyPressSounds = [
  new Audio('./audio/coolclick.wav'),
  new Audio('./audio/softclick.wav')
]
keyPressSounds.forEach(sound => sound.volume = 0.5)

// Particle Settings
const particles = [];
const PARTICLE_COUNT = 15;
const PARTICLE_LIFESPAN = 70;
const PARTICLE_SIZE_MIN = 2;
const PARTICLE_SIZE_MAX = 4;
const PARTICLE_SPEED = 3;
const PARTICLE_COLOR = '#00FFFF';
const PARTICLE_GRAVITY = 0.05;
const PARTICLE_SPREAD_X = 10;
const PARTICLE_SPREAD_Y = 10;

// Particle system variables
const visualizerCanvas = document.getElementById('visualizerCanvas')
const ctx = visualizerCanvas.getContext('2d')
visualizerCanvas.width = container.clientWidth
visualizerCanvas.height = container.clientHeight

// --- Particle Class ---
class Particle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * PARTICLE_SPREAD_X;
        this.y = y + (Math.random() - 0.5) * PARTICLE_SPREAD_Y;
        this.size = Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) + PARTICLE_SIZE_MIN;
        this.life = 0;
        this.maxLife = PARTICLE_LIFESPAN;
        this.color = window.PARTICLE_COLOR || PARTICLE_COLOR;
        this.velocity = {
            x: (Math.random() - 0.5) * 2 * PARTICLE_SPEED,
            y: (Math.random() - 0.5) * 2 * PARTICLE_SPEED
        };
    }
    update() {
        this.velocity.y += PARTICLE_GRAVITY; // Apply gravity
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life++;
        this.alpha = 1 - (this.life / this.maxLife);
    }
    draw() {
        ctx.save()
        ctx.globalAlpha = Math.pow(this.alpha, 0.7) // Keep more opacity for longer
        ctx.shadowColor = this.color
        ctx.shadowBlur = 16 // Add glow effect
        ctx.fillStyle = this.color
        if (window.PARTICLE_SHAPE === 'square') {
            ctx.beginPath()
            ctx.rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2)
            ctx.fill()
        } else if (window.PARTICLE_SHAPE === 'triangle') {
            ctx.beginPath()
            ctx.moveTo(this.x, this.y - this.size)
            ctx.lineTo(this.x - this.size, this.y + this.size)
            ctx.lineTo(this.x + this.size, this.y + this.size)
            ctx.closePath()
            ctx.fill()
        } else if (window.PARTICLE_SHAPE === 'star') {
            ctx.beginPath()
            let spikes = 5, outerRadius = this.size, innerRadius = this.size / 2
            let rot = Math.PI / 2 * 3
            let x = this.x, y = this.y
            ctx.moveTo(x, y - outerRadius)
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius)
                rot += Math.PI / spikes
                ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius)
                rot += Math.PI / spikes
            }
            ctx.lineTo(x, y - outerRadius)
            ctx.closePath()
            ctx.fill()
        } else {
            ctx.beginPath()
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
            ctx.fill()
        }
        ctx.restore()
    }
}

function animateParticles() {
  ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height)
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    p.update()
    p.draw()
    if (p.life >= p.maxLife) {
      particles.splice(i, 1)
      i--
    }
  }
  requestAnimationFrame(animateParticles)
}
animateParticles()

typingArea.addEventListener('input', (event) => {
    // Only play sound for single character insertions or deletions
    if (event.inputType === 'insertText' || event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
        const sound = keyPressSounds[Math.floor(Math.random() * keyPressSounds.length)]
        sound.currentTime = 0
        sound.play()
    }
    // Particle emission at caret position
    const containerRect = container.getBoundingClientRect()
    const textareaRect = typingArea.getBoundingClientRect()
    // Create a hidden div to mirror the textarea
    let mirrorDiv = document.getElementById('caret-mirror-div')
    if (!mirrorDiv) {
        mirrorDiv = document.createElement('div')
        mirrorDiv.id = 'caret-mirror-div'
        document.body.appendChild(mirrorDiv)
    }
    const style = getComputedStyle(typingArea)
    mirrorDiv.style.position = 'absolute'
    mirrorDiv.style.visibility = 'hidden'
    mirrorDiv.style.whiteSpace = 'pre-wrap'
    mirrorDiv.style.wordWrap = 'break-word'
    mirrorDiv.style.font = style.font
    mirrorDiv.style.fontSize = style.fontSize
    mirrorDiv.style.fontFamily = style.fontFamily
    mirrorDiv.style.lineHeight = style.lineHeight
    mirrorDiv.style.padding = style.padding
    mirrorDiv.style.border = style.border
    mirrorDiv.style.boxSizing = style.boxSizing
    mirrorDiv.style.width = textareaRect.width + 'px'
    mirrorDiv.style.height = textareaRect.height + 'px'
    mirrorDiv.style.background = 'transparent'
    // Get text up to caret
    const value = typingArea.value
    const selectionEnd = typingArea.selectionEnd
    let beforeCaret = value.substring(0, selectionEnd)
    // Replace spaces and newlines for HTML
    beforeCaret = beforeCaret.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;')
    // Place a span at the caret
    mirrorDiv.innerHTML = beforeCaret + '<span id="caret-span">|</span>'
    // Position the mirror div over the textarea
    mirrorDiv.style.left = textareaRect.left + 'px'
    mirrorDiv.style.top = textareaRect.top + 'px'
    // Get caret span position
    const caretSpan = document.getElementById('caret-span')
    let x = textareaRect.left - containerRect.left
    let y = textareaRect.top - containerRect.top
    if (caretSpan) {
        const caretRect = caretSpan.getBoundingClientRect()
        x = caretRect.left - containerRect.left
        y = caretRect.top - containerRect.top + caretSpan.offsetHeight / 2
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(x, y))
    }
    container.style.backgroundColor = '#333'
    container.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.5)'
    setTimeout(() => {
        container.style.backgroundColor = '#222'
        container.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.2)'
    }, 100)
})

// --- THEME/COLOR PICKER FEATURE ---
// Create color picker UI
const colorPickerContainer = document.createElement('div')
colorPickerContainer.style.position = 'absolute'
colorPickerContainer.style.top = '20px'
colorPickerContainer.style.right = '30px'
colorPickerContainer.style.zIndex = '10'
colorPickerContainer.style.display = 'flex'
colorPickerContainer.style.alignItems = 'center'
colorPickerContainer.style.gap = '8px'
colorPickerContainer.style.background = 'rgba(24,24,24,0.85)'
colorPickerContainer.style.padding = '8px 14px'
colorPickerContainer.style.borderRadius = '8px'
colorPickerContainer.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)'
colorPickerContainer.style.userSelect = 'none'

const colorLabel = document.createElement('label')
colorLabel.textContent = 'Particle Color:'
colorLabel.style.color = '#00ffff'
colorLabel.style.fontWeight = 'bold'
colorLabel.style.fontSize = '1em'
colorLabel.style.marginRight = '4px'

const colorInput = document.createElement('input')
colorInput.type = 'color'
colorInput.value = PARTICLE_COLOR
colorInput.style.width = '32px'
colorInput.style.height = '32px'
colorInput.style.borderRadius = '6px'
colorInput.style.border = 'none'
colorInput.style.background = 'none'
colorInput.style.cursor = 'pointer'
colorInput.style.outline = 'none'
colorInput.style.padding = '0'
colorInput.style.margin = '0'

colorPickerContainer.appendChild(colorLabel)
colorPickerContainer.appendChild(colorInput)
document.body.appendChild(colorPickerContainer)

// Update particle color on change
colorInput.addEventListener('input', (e) => {
    window.PARTICLE_COLOR = e.target.value
})

// --- Canvas Resizing Handler ---
window.addEventListener('resize', () => {
    // Always match canvas to container size
    visualizerCanvas.width = container.clientWidth;
    visualizerCanvas.height = container.clientHeight;
    // Update caret-mirror-div if it exists (to keep particle/caret alignment correct)
    const mirrorDiv = document.getElementById('caret-mirror-div');
    if (mirrorDiv && typingArea) {
        const textareaRect = typingArea.getBoundingClientRect();
        mirrorDiv.style.width = textareaRect.width + 'px';
        mirrorDiv.style.height = textareaRect.height + 'px';
        mirrorDiv.style.left = textareaRect.left + 'px';
        mirrorDiv.style.top = textareaRect.top + 'px';
    }
    // For particles, clearing and redrawing is handled by animateParticles.
});

// Automatically focus the typing area when the page loads
window.addEventListener('load', () => {
    typingArea.focus();
});

// --- CONFETTI EFFECT TOGGLE ---
const confettiContainer = document.createElement('div');
confettiContainer.style.display = 'flex';
confettiContainer.style.alignItems = 'center';
confettiContainer.style.gap = '8px';
const confettiLabel = document.createElement('label');
confettiLabel.textContent = 'Confetti Burst';
confettiLabel.style.color = '#00ffff';
confettiLabel.style.fontWeight = 'bold';
const confettiToggle = document.createElement('input');
confettiToggle.type = 'checkbox';
confettiToggle.checked = true;
confettiContainer.appendChild(confettiLabel);
confettiContainer.appendChild(confettiToggle);
document.body.appendChild(confettiContainer);
confettiContainer.style.position = 'fixed';
confettiContainer.style.top = '90px';
confettiContainer.style.left = '30px';
confettiContainer.style.zIndex = '120';
confettiContainer.style.background = 'none';
confettiContainer.style.boxShadow = 'none';
confettiContainer.style.borderRadius = '6px';
confettiContainer.style.padding = '0 0 8px 0';
confettiContainer.style.marginBottom = '0';
confettiContainer.style.gap = '10px';

// --- CONFETTI PARTICLE COLORS ---
const CONFETTI_COLORS = ['#ff4b1f', '#1fa2ff', '#f9d423', '#a8ff78', '#f953c6', '#43e97b', '#fa709a'];

// --- CONFETTI EFFECT LOGIC ---
function spawnConfetti(x, y) {
  for (let i = 0; i < 18; i++) {
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const angle = (Math.PI * 2 * i) / 18;
    const speed = 3 + Math.random() * 2;
    const confetti = new Particle(x, y);
    confetti.size = 3 + Math.random() * 2;
    confetti.color = color;
    confetti.velocity.x = Math.cos(angle) * speed;
    confetti.velocity.y = Math.sin(angle) * speed;
    confetti.maxLife = 50 + Math.random() * 20;
    particles.push(confetti);
  }
}

// --- TRIGGER CONFETTI ON "cool" OR EVERY 100 CHARACTERS ---
let lastConfettiMilestone = 0;
// Debounce confetti trigger
let confettiDebounceTimeout = null;
function debouncedConfettiTrigger(fn) {
    if (confettiDebounceTimeout) clearTimeout(confettiDebounceTimeout);
    confettiDebounceTimeout = setTimeout(fn, 300); // 300ms debounce
}
const originalInputHandler = typingArea.oninput;
typingArea.addEventListener('input', (event) => {
    // Only play sound for single character insertions or deletions
    if (event.inputType === 'insertText' || event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
        const sound = keyPressSounds[Math.floor(Math.random() * keyPressSounds.length)]
        sound.currentTime = 0
        sound.play()
    }
    // Particle emission at caret position
    const containerRect = container.getBoundingClientRect()
    const textareaRect = typingArea.getBoundingClientRect()
    // Create a hidden div to mirror the textarea
    let mirrorDiv = document.getElementById('caret-mirror-div')
    if (!mirrorDiv) {
        mirrorDiv = document.createElement('div')
        mirrorDiv.id = 'caret-mirror-div'
        document.body.appendChild(mirrorDiv)
    }
    const style = getComputedStyle(typingArea)
    mirrorDiv.style.position = 'absolute'
    mirrorDiv.style.visibility = 'hidden'
    mirrorDiv.style.whiteSpace = 'pre-wrap'
    mirrorDiv.style.wordWrap = 'break-word'
    mirrorDiv.style.font = style.font
    mirrorDiv.style.fontSize = style.fontSize
    mirrorDiv.style.fontFamily = style.fontFamily
    mirrorDiv.style.lineHeight = style.lineHeight
    mirrorDiv.style.padding = style.padding
    mirrorDiv.style.border = style.border
    mirrorDiv.style.boxSizing = style.boxSizing
    mirrorDiv.style.width = textareaRect.width + 'px'
    mirrorDiv.style.height = textareaRect.height + 'px'
    mirrorDiv.style.background = 'transparent'
    // Get text up to caret
    const value = typingArea.value
    const selectionEnd = typingArea.selectionEnd
    let beforeCaret = value.substring(0, selectionEnd)
    // Replace spaces and newlines for HTML
    beforeCaret = beforeCaret.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;')
    // Place a span at the caret
    mirrorDiv.innerHTML = beforeCaret + '<span id="caret-span">|</span>'
    // Position the mirror div over the textarea
    mirrorDiv.style.left = textareaRect.left + 'px'
    mirrorDiv.style.top = textareaRect.top + 'px'
    // Get caret span position
    const caretSpan = document.getElementById('caret-span')
    let x = textareaRect.left - containerRect.left
    let y = textareaRect.top - containerRect.top
    if (caretSpan) {
        const caretRect = caretSpan.getBoundingClientRect()
        x = caretRect.left - containerRect.left
        y = caretRect.top - containerRect.top + caretSpan.offsetHeight / 2
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(x, y))
    }
    container.style.backgroundColor = '#333'
    container.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.5)'
    setTimeout(() => {
        container.style.backgroundColor = '#222'
        container.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.2)'
    }, 100)
    if (confettiToggle.checked) {
        debouncedConfettiTrigger(() => {
            const value = typingArea.value;
            // Confetti on word "cool"
            if (/\\bcool\\b/i.test(value)) {
                const containerRect = container.getBoundingClientRect();
                const textareaRect = typingArea.getBoundingClientRect();
                let x = textareaRect.left - containerRect.left + textareaRect.width / 2;
                let y = textareaRect.top - containerRect.top + textareaRect.height / 2;
                spawnConfetti(x, y);
            }
            // Confetti every 100 characters
            const milestone = Math.floor(value.length / 100);
            if (milestone > lastConfettiMilestone) {
                lastConfettiMilestone = milestone;
                const containerRect = container.getBoundingClientRect();
                const textareaRect = typingArea.getBoundingClientRect();
                let x = textareaRect.left - containerRect.left + textareaRect.width / 2;
                let y = textareaRect.top - containerRect.top + textareaRect.height / 2;
                spawnConfetti(x, y);
            }
            if (value.length < 100) lastConfettiMilestone = 0;
        });
    }
})

// --- HAMBURGER MENU & SLIDING PANEL ORGANIZER ---
// Create hamburger button
const hamburger = document.createElement('div');
hamburger.id = 'hamburger-menu';
hamburger.setAttribute('role', 'button');
hamburger.setAttribute('tabindex', '0');
hamburger.setAttribute('aria-label', 'Open settings menu');
hamburger.setAttribute('aria-controls', 'sliding-panel');
hamburger.setAttribute('aria-expanded', 'false');
hamburger.innerHTML = '<div></div><div></div><div></div>';
hamburger.style.position = 'fixed';
hamburger.style.top = '24px';
hamburger.style.left = '24px';
hamburger.style.width = '38px';
hamburger.style.height = '38px';
hamburger.style.display = 'flex';
hamburger.style.flexDirection = 'column';
hamburger.style.justifyContent = 'center';
hamburger.style.alignItems = 'center';
hamburger.style.gap = '6px';
hamburger.style.cursor = 'pointer';
hamburger.style.zIndex = '20000'; // Ensure hamburger is always on top of the sidebar
hamburger.style.background = 'rgba(24,24,24,0.92)';
hamburger.style.border = '2px solid #00ffff'; // Add border for visibility
[...hamburger.children].forEach(bar => {
    bar.style.width = '24px';
    bar.style.height = '4px';
    bar.style.background = '#00ffff';
    bar.style.borderRadius = '2px';
    bar.style.transition = 'all 0.3s cubic-bezier(.68,-0.55,.27,1.55)';
});
document.body.appendChild(hamburger);

// Keyboard accessibility for hamburger
hamburger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        hamburger.click();
    }
});

// Create sliding panel
const slidingPanel = document.createElement('nav');
slidingPanel.id = 'sliding-panel';
slidingPanel.setAttribute('role', 'region');
slidingPanel.setAttribute('aria-label', 'Settings Sidebar');
slidingPanel.setAttribute('tabindex', '-1');
slidingPanel.style.position = 'fixed';
slidingPanel.style.top = '0';
slidingPanel.style.left = '0';
slidingPanel.style.height = '100vh';
slidingPanel.style.width = '320px';
slidingPanel.style.maxWidth = '90vw';
slidingPanel.style.background = 'rgba(18,18,18,0.98)';
slidingPanel.style.boxShadow = '2px 0 24px rgba(0,255,255,0.10)'; // Softer shadow
slidingPanel.style.borderRadius = '0 12px 12px 0'; // Rounded right corners
slidingPanel.style.transform = 'translateX(-110%)';
slidingPanel.style.transition = 'transform 0.35s cubic-bezier(.68,-0.55,.27,1.55)';
slidingPanel.style.zIndex = '10010'; // Sidebar below hamburger
slidingPanel.style.display = 'flex';
slidingPanel.style.flexDirection = 'column';
slidingPanel.style.gap = '20px'; // Slightly tighter gap
slidingPanel.style.padding = '60px 28px 28px 28px'; // More balanced padding
document.body.appendChild(slidingPanel);

// Move controls into the panel
slidingPanel.appendChild(colorPickerContainer);
slidingPanel.appendChild(confettiContainer);
// If you have more controls (sound, theme, etc), append them here
// Example: slidingPanel.appendChild(soundControlContainer);

// Hide original floating controls
colorPickerContainer.style.position = 'static';
colorPickerContainer.style.top = '';
colorPickerContainer.style.right = '';
colorPickerContainer.style.boxShadow = 'none';
colorPickerContainer.style.background = 'none';
colorPickerContainer.style.marginBottom = '0';
colorPickerContainer.style.gap = '10px';
confettiContainer.style.position = 'static';
confettiContainer.style.top = '';
confettiContainer.style.left = '';
confettiContainer.style.zIndex = '';
confettiContainer.style.background = 'none';
confettiContainer.style.boxShadow = 'none';
confettiContainer.style.marginBottom = '0';
confettiContainer.style.gap = '10px';

// --- SOUND CONTROLS ---
const soundControlContainer = document.createElement('div');
soundControlContainer.style.display = 'flex';
soundControlContainer.style.alignItems = 'center';
soundControlContainer.style.gap = '10px';
const soundLabel = document.createElement('label');
soundLabel.textContent = 'Sound:';
soundLabel.style.color = '#00ffff';
soundLabel.style.fontWeight = 'bold';
const volumeSlider = document.createElement('input');
volumeSlider.type = 'range';
volumeSlider.min = '0';
volumeSlider.max = '1';
volumeSlider.step = '0.01';
volumeSlider.value = keyPressSounds[0].volume;
volumeSlider.style.width = '80px';
const muteButton = document.createElement('button');
muteButton.textContent = 'Mute';
muteButton.style.background = '#222';
muteButton.style.color = '#00ffff';
muteButton.style.border = 'none';
muteButton.style.borderRadius = '4px';
muteButton.style.padding = '2px 10px';
muteButton.style.cursor = 'pointer';
let isMuted = false;
volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    keyPressSounds.forEach(s => s.volume = vol);
    if (vol === 0) {
        isMuted = true;
        muteButton.textContent = 'Unmute';
    } else {
        isMuted = false;
        muteButton.textContent = 'Mute';
    }
});
muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
        keyPressSounds.forEach(s => s.volume = 0);
        muteButton.textContent = 'Unmute';
        volumeSlider.value = 0;
    } else {
        keyPressSounds.forEach(s => s.volume = 0.5);
        muteButton.textContent = 'Mute';
        volumeSlider.value = 0.5;
    }
});
soundControlContainer.appendChild(soundLabel);
soundControlContainer.appendChild(volumeSlider);
soundControlContainer.appendChild(muteButton);
slidingPanel.appendChild(soundControlContainer);

// --- PARTICLE CUSTOMIZATION CONTROLS ---
const particleControlContainer = document.createElement('div');
particleControlContainer.style.display = 'flex';
particleControlContainer.style.flexDirection = 'column';
particleControlContainer.style.gap = '8px';
particleControlContainer.style.width = '100%';
const particleTitle = document.createElement('div');
particleTitle.textContent = 'Particle Customization';
particleTitle.style.color = '#00ffff';
particleTitle.style.fontWeight = 'bold';
particleTitle.style.marginBottom = '2px';
particleControlContainer.appendChild(particleTitle);
// Size
const sizeLabel = document.createElement('label');
sizeLabel.textContent = 'Size:';
sizeLabel.style.color = '#aaa';
const sizeInput = document.createElement('input');
sizeInput.type = 'range';
sizeInput.min = '1';
sizeInput.max = '12';
sizeInput.value = PARTICLE_SIZE_MAX;
sizeInput.style.width = '80px';
sizeInput.addEventListener('input', (e) => {
    window.PARTICLE_SIZE_MAX = parseFloat(e.target.value);
});
// Speed
const speedLabel = document.createElement('label');
speedLabel.textContent = 'Speed:';
speedLabel.style.color = '#aaa';
const speedInput = document.createElement('input');
speedInput.type = 'range';
speedInput.min = '1';
speedInput.max = '10';
speedInput.value = PARTICLE_SPEED;
speedInput.style.width = '80px';
speedInput.addEventListener('input', (e) => {
    window.PARTICLE_SPEED = parseFloat(e.target.value);
});
// Count
const countLabel = document.createElement('label');
countLabel.textContent = 'Count:';
countLabel.style.color = '#aaa';
const countInput = document.createElement('input');
countInput.type = 'range';
countInput.min = '1';
countInput.max = '40';
countInput.value = PARTICLE_COUNT;
countInput.style.width = '80px';
countInput.addEventListener('input', (e) => {
    window.PARTICLE_COUNT = parseInt(e.target.value);
});
// Add controls to container (no shape selector here)
const row1 = document.createElement('div');
row1.style.display = 'flex';
row1.style.gap = '8px';
row1.appendChild(sizeLabel);
row1.appendChild(sizeInput);
row1.appendChild(speedLabel);
row1.appendChild(speedInput);
const row2 = document.createElement('div');
row2.style.display = 'flex';
row2.style.gap = '8px';
row2.appendChild(countLabel);
row2.appendChild(countInput);
particleControlContainer.appendChild(row1);
particleControlContainer.appendChild(row2);
slidingPanel.appendChild(particleControlContainer);

// --- PARTICLE SHAPE SELECTOR (FINAL POLISH) ---
const particleShapeContainer = document.createElement('div');
particleShapeContainer.style.display = 'flex';
particleShapeContainer.style.alignItems = 'center';
particleShapeContainer.style.gap = '10px';
const particleShapeLabel = document.createElement('label');
particleShapeLabel.textContent = 'Shape:';
particleShapeLabel.style.color = '#aaa';
particleShapeLabel.style.marginRight = '4px';
const particleShapeSelect = document.createElement('select');
particleShapeSelect.setAttribute('aria-label', 'Particle Shape');
particleShapeSelect.style.padding = '2px 8px';
particleShapeSelect.style.borderRadius = '4px';
particleShapeSelect.style.border = '1px solid #00ffff';
particleShapeSelect.style.background = '#181818';
particleShapeSelect.style.color = '#00ffff';
particleShapeSelect.style.outline = 'none';
['circle', 'square', 'triangle', 'star'].forEach(shape => {
    const opt = document.createElement('option');
    opt.value = shape;
    opt.textContent = shape.charAt(0).toUpperCase() + shape.slice(1);
    particleShapeSelect.appendChild(opt);
});
particleShapeSelect.value = 'circle';
particleShapeSelect.addEventListener('change', (e) => {
    window.PARTICLE_SHAPE = e.target.value;
});
particleShapeContainer.appendChild(particleShapeLabel);
particleShapeContainer.appendChild(particleShapeSelect);
slidingPanel.appendChild(particleShapeContainer);

// --- THEME DROPDOWN ---
const themeContainer = document.createElement('div');
themeContainer.style.display = 'flex';
themeContainer.style.alignItems = 'center';
themeContainer.style.gap = '10px';
const themeLabel = document.createElement('label');
themeLabel.textContent = 'Theme:';
themeLabel.style.color = '#00ffff';
themeLabel.style.fontWeight = 'bold';
const themeSelect = document.createElement('select');
const themes = [
    { name: 'Dark', value: 'dark' },
    { name: 'Light', value: 'light' },
    { name: 'Accent', value: 'accent' }
];
themes.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.value;
    opt.textContent = t.name;
    themeSelect.appendChild(opt);
});
themeSelect.value = 'dark';
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.style.background = '#181818';
        container.style.background = '#222';
        container.style.color = '#fff';
        slidingPanel.style.background = 'rgba(18,18,18,0.98)';
    } else if (theme === 'light') {
        document.body.style.background = '#f5f5f5';
        container.style.background = '#fff';
        container.style.color = '#222';
        slidingPanel.style.background = 'rgba(255,255,255,0.98)';
    } else if (theme === 'accent') {
        document.body.style.background = 'linear-gradient(135deg, #00c3ff 0%, #ffff1c 100%)';
        container.style.background = 'rgba(0,0,0,0.7)';
        container.style.color = '#fff';
        slidingPanel.style.background = 'rgba(0,0,0,0.85)';
    }
}
themeSelect.addEventListener('change', (e) => {
    applyTheme(e.target.value);
});
themeContainer.appendChild(themeLabel);
themeContainer.appendChild(themeSelect);
slidingPanel.appendChild(themeContainer);

// --- ACCESSIBILITY IMPROVEMENTS ---
colorInput.setAttribute('aria-label', 'Particle Color');
colorInput.setAttribute('tabindex', '0');
volumeSlider.setAttribute('aria-label', 'Sound Volume');
volumeSlider.setAttribute('tabindex', '0');
muteButton.setAttribute('aria-label', 'Mute/Unmute Sound');
muteButton.setAttribute('tabindex', '0');
sizeInput.setAttribute('aria-label', 'Particle Size');
sizeInput.setAttribute('tabindex', '0');
speedInput.setAttribute('aria-label', 'Particle Speed');
speedInput.setAttribute('tabindex', '0');
countInput.setAttribute('aria-label', 'Particle Count');
countInput.setAttribute('tabindex', '0');
themeSelect.setAttribute('aria-label', 'Theme');
themeSelect.setAttribute('tabindex', '0');
confettiToggle.setAttribute('aria-label', 'Toggle Confetti Burst');
confettiToggle.setAttribute('tabindex', '0');
// Add visible focus style for all sidebar controls
const style = document.createElement('style');
style.textContent = `
#sliding-panel input:focus, #sliding-panel button:focus, #sliding-panel select:focus, #hamburger-menu:focus {
    outline: 2px solid #00ffff !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px #00ffff33;
}
`;
document.head.appendChild(style);

// --- SECTION HEADERS & GROUPING FOR SIDEBAR CONTROLS ---
slidingPanel.innerHTML = '';

// Sound Section
const soundSectionHeader = document.createElement('div');
soundSectionHeader.textContent = 'Sound Settings';
soundSectionHeader.setAttribute('role', 'heading');
soundSectionHeader.setAttribute('aria-level', '2');
soundSectionHeader.style.fontWeight = 'bold';
soundSectionHeader.style.fontSize = '1.08em';
soundSectionHeader.style.color = '#00ffff';
soundSectionHeader.style.margin = '8px 0 4px 0';
soundSectionHeader.style.letterSpacing = '0.5px';
slidingPanel.appendChild(soundSectionHeader);
slidingPanel.appendChild(soundControlContainer);

// Particle Section
const particleSectionHeader = document.createElement('div');
particleSectionHeader.textContent = 'Particle Settings';
particleSectionHeader.setAttribute('role', 'heading');
particleSectionHeader.setAttribute('aria-level', '2');
particleSectionHeader.style.fontWeight = 'bold';
particleSectionHeader.style.fontSize = '1.08em';
particleSectionHeader.style.color = '#00ffff';
particleSectionHeader.style.margin = '16px 0 4px 0';
particleSectionHeader.style.letterSpacing = '0.5px';
slidingPanel.appendChild(particleSectionHeader);
slidingPanel.appendChild(particleControlContainer);
slidingPanel.appendChild(particleShapeContainer);
slidingPanel.appendChild(colorPickerContainer);

// Confetti Section
const confettiSectionHeader = document.createElement('div');
confettiSectionHeader.textContent = 'Confetti';
confettiSectionHeader.setAttribute('role', 'heading');
confettiSectionHeader.setAttribute('aria-level', '2');
confettiSectionHeader.style.fontWeight = 'bold';
confettiSectionHeader.style.fontSize = '1.08em';
confettiSectionHeader.style.color = '#00ffff';
confettiSectionHeader.style.margin = '16px 0 4px 0';
confettiSectionHeader.style.letterSpacing = '0.5px';
slidingPanel.appendChild(confettiSectionHeader);
slidingPanel.appendChild(confettiContainer);

// Theme Section
const themeSectionHeader = document.createElement('div');
themeSectionHeader.textContent = 'Theme & Appearance';
themeSectionHeader.setAttribute('role', 'heading');
themeSectionHeader.setAttribute('aria-level', '2');
themeSectionHeader.style.fontWeight = 'bold';
themeSectionHeader.style.fontSize = '1.08em';
themeSectionHeader.style.color = '#00ffff';
themeSectionHeader.style.margin = '16px 0 4px 0';
themeSectionHeader.style.letterSpacing = '0.5px';
slidingPanel.appendChild(themeSectionHeader);
slidingPanel.appendChild(themeContainer);

// --- HAMBURGER MENU TOGGLE LOGIC ---
let panelOpen = false;
function setHamburgerAria() {
    hamburger.setAttribute('aria-expanded', panelOpen ? 'true' : 'false');
}
// Replace hamburger click logic
hamburger.addEventListener('click', () => {
    panelOpen = !panelOpen;
    setHamburgerAria();
    if (panelOpen) {
        openSidebar();
    } else {
        closeSidebar();
    }
});

sidebarOverlay.addEventListener('click', () => {
    panelOpen = false;
    setHamburgerAria();
    closeSidebar();
});

// Keyboard accessibility: close sidebar with Escape
window.addEventListener('keydown', (e) => {
    if (panelOpen && (e.key === 'Escape' || e.key === 'Esc')) {
        panelOpen = false;
        setHamburgerAria();
        closeSidebar();
        hamburger.focus();
    }
});

// Focus trap inside sidebar
function trapSidebarFocus() {
    const focusable = slidingPanel.querySelectorAll('input, button, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();
    function handleTab(e) {
        if (!panelOpen) return;
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }
    slidingPanel.addEventListener('keydown', handleTab);
    // Remove handler when sidebar closes
    function cleanup() {
        slidingPanel.removeEventListener('keydown', handleTab);
        window.removeEventListener('sidebarCloseCleanup', cleanup);
    }
    window.addEventListener('sidebarCloseCleanup', cleanup);
}
function triggerSidebarCloseCleanup() {
    const event = new Event('sidebarCloseCleanup');
    window.dispatchEvent(event);
}

// --- SIDEBAR OPEN/CLOSE FUNCTIONS (FIX FOR REFERENCE ERRORS) ---
function openSidebar() {
    slidingPanel.style.transform = 'translateX(0)';
    hamburger.style.transform = 'scale(1.08)';
    hamburger.children[0].style.transform = 'translateY(10px) rotate(45deg)';
    hamburger.children[1].style.opacity = '0';
    hamburger.children[2].style.transform = 'translateY(-10px) rotate(-45deg)';
    sidebarOverlay.style.display = 'block';
    setTimeout(() => {
        sidebarOverlay.style.opacity = '1';
        sidebarOverlay.style.pointerEvents = 'auto';
    }, 10);
    trapSidebarFocus();
}
function closeSidebar() {
    slidingPanel.style.transform = 'translateX(-110%)';
    hamburger.style.transform = '';
    hamburger.children[0].style.transform = '';
    hamburger.children[1].style.opacity = '1';
    hamburger.children[2].style.transform = '';
    sidebarOverlay.style.opacity = '0';
    sidebarOverlay.style.pointerEvents = 'none';
    setTimeout(() => {
        if (!panelOpen) sidebarOverlay.style.display = 'none';
        triggerSidebarCloseCleanup();
    }, 250);
}

// --- PERSIST SETTINGS TO LOCALSTORAGE ---
function saveSettings() {
    const settings = {
        theme: themeSelect.value,
        soundVolume: volumeSlider.value,
        isMuted: isMuted,
        particleColor: colorInput.value,
        particleSize: sizeInput.value,
        particleSpeed: speedInput.value,
        particleCount: countInput.value,
        particleShape: particleShapeSelect.value, // <-- use correct selector
        confetti: confettiToggle.checked
    };
    localStorage.setItem('justcoolSettings', JSON.stringify(settings));
}
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('justcoolSettings'));
    if (!settings) return;
    if (settings.theme) {
        themeSelect.value = settings.theme;
        applyTheme(settings.theme);
    }
    if (settings.soundVolume) {
        volumeSlider.value = settings.soundVolume;
        keyPressSounds.forEach(s => s.volume = parseFloat(settings.soundVolume));
    }
    if (typeof settings.isMuted === 'boolean') {
        isMuted = settings.isMuted;
        if (isMuted) {
            keyPressSounds.forEach(s => s.volume = 0);
            muteButton.textContent = 'Unmute';
            volumeSlider.value = 0;
        } else {
            muteButton.textContent = 'Mute';
        }
    }
    if (settings.particleColor) {
        colorInput.value = settings.particleColor;
        window.PARTICLE_COLOR = settings.particleColor;
    }
    if (settings.particleSize) {
        sizeInput.value = settings.particleSize;
        window.PARTICLE_SIZE_MAX = parseFloat(settings.particleSize);
    }
    if (settings.particleSpeed) {
        speedInput.value = settings.particleSpeed;
        window.PARTICLE_SPEED = parseFloat(settings.particleSpeed);
    }
    if (settings.particleCount) {
        countInput.value = settings.particleCount;
        window.PARTICLE_COUNT = parseInt(settings.particleCount);
    }
    if (settings.particleShape) {
        particleShapeSelect.value = settings.particleShape;
        window.PARTICLE_SHAPE = settings.particleShape;
    }
    if (typeof settings.confetti === 'boolean') {
        confettiToggle.checked = settings.confetti;
    }
}
// Save on change
[themeSelect, volumeSlider, muteButton, colorInput, sizeInput, speedInput, countInput, particleShapeSelect, confettiToggle].forEach(el => {
    el.addEventListener('change', saveSettings);
    el.addEventListener('input', saveSettings);
});
window.addEventListener('DOMContentLoaded', loadSettings);

// --- FINAL TOUCHES ---
document.body.style.background = '#181818';
container.style.background = '#222';
container.style.color = '#fff';
slidingPanel.style.background = 'rgba(18,18,18,0.98)';
applyTheme('dark');
window.PARTICLE_COLOR = PARTICLE_COLOR;
window.PARTICLE_SIZE_MAX = PARTICLE_SIZE_MAX;
window.PARTICLE_SPEED = PARTICLE_SPEED;
window.PARTICLE_COUNT = PARTICLE_COUNT;
window.PARTICLE_LIFESPAN = PARTICLE_LIFESPAN;
window.PARTICLE_GRAVITY = PARTICLE_GRAVITY;
window.PARTICLE_SHAPE = 'circle';

// --- DEBUGGING ---
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') {
        console.log('Debug Info:');
        console.log('  PARTICLE_COLOR:', PARTICLE_COLOR);
        console.log('  PARTICLE_SIZE_MAX:', PARTICLE_SIZE_MAX);
        console.log('  PARTICLE_SPEED:', PARTICLE_SPEED);
        console.log('  PARTICLE_COUNT:', PARTICLE_COUNT);
        console.log('  PARTICLE_LIFESPAN:', PARTICLE_LIFESPAN);
        console.log('  PARTICLE_GRAVITY:', PARTICLE_GRAVITY);
        console.log('  PARTICLE_SHAPE:', PARTICLE_SHAPE);
    }
});

// --- PATCH PARTICLE DRAW FOR ADVANCED SHAPES ---
const originalDraw = Particle.prototype.draw;
Particle.prototype.draw = function() {
    ctx.save();
    ctx.globalAlpha = Math.pow(this.alpha, 0.7);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = this.color;
    if (window.PARTICLE_SHAPE === 'square') {
        ctx.beginPath();
        ctx.rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
        ctx.fill();
    } else if (window.PARTICLE_SHAPE === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x - this.size, this.y + this.size);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.closePath();
        ctx.fill();
    } else if (window.PARTICLE_SHAPE === 'star') {
        ctx.beginPath();
        let spikes = 5, outerRadius = this.size, innerRadius = this.size / 2;
        let rot = Math.PI / 2 * 3;
        let x = this.x, y = this.y;
        ctx.moveTo(x, y - outerRadius);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
            rot += Math.PI / spikes;
            ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
            rot += Math.PI / spikes;
        }
        ctx.lineTo(x, y - outerRadius);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

// --- MOBILE & DESKTOP FRIENDLINESS IMPROVEMENTS ---
// Responsive sidebar width
slidingPanel.style.width = 'min(320px, 90vw)';
slidingPanel.style.maxWidth = '90vw';
// Responsive hamburger size
hamburger.style.width = 'min(44px, 12vw)';
hamburger.style.height = 'min(44px, 12vw)';
[...hamburger.children].forEach(bar => {
    bar.style.width = '60%';
    bar.style.height = '4px';
});
// Ensure all controls have minimum touch target size
[soundControlContainer, muteButton, volumeSlider, sizeInput, speedInput, countInput, colorInput, particleShapeSelect, themeSelect, confettiToggle].forEach(el => {
    if (el && el.style) {
        el.style.minHeight = '44px';
        el.style.minWidth = '44px';
    }
});
// Make font sizes responsive
slidingPanel.style.fontSize = 'clamp(1em, 2.5vw, 1.15em)';
// Make section headers more readable on mobile
[soundSectionHeader, particleSectionHeader, confettiSectionHeader, themeSectionHeader].forEach(header => {
    header.style.fontSize = 'clamp(1.08em, 3vw, 1.2em)';
});
// Make color picker and shape selector more touch friendly
colorInput.style.width = '40px';
colorInput.style.height = '40px';
particleShapeSelect.style.minHeight = '44px';
particleShapeSelect.style.minWidth = '44px';
// --- END MOBILE & DESKTOP FRIENDLINESS IMPROVEMENTS ---
// --- LOGO INSERTION (TOP CENTER) ---
window.addEventListener('DOMContentLoaded', () => {
    // Create logo container
    const logoContainer = document.createElement('div');
    logoContainer.style.position = 'fixed';
    logoContainer.style.top = '12px';
    logoContainer.style.left = '50%';
    logoContainer.style.transform = 'translateX(-50%)';
    logoContainer.style.zIndex = '30000';
    logoContainer.style.display = 'flex';
    logoContainer.style.justifyContent = 'center';
    logoContainer.style.alignItems = 'center';
    logoContainer.style.width = '180px';
    logoContainer.style.height = '48px';
    logoContainer.style.pointerEvents = 'none'; // Let clicks pass through
    // Add the logo image
    const logoImg = document.createElement('img');
    logoImg.src = 'logo.svg';
    logoImg.alt = 'justcool logo';
    logoImg.style.width = '100%';
    logoImg.style.height = 'auto';
    logoImg.style.display = 'block';
    logoImg.style.userSelect = 'none';
    logoImg.style.pointerEvents = 'none';
    logoContainer.appendChild(logoImg);
    document.body.appendChild(logoContainer);
});