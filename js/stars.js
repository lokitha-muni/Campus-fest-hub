/**
 * Creates a starry background effect
 * Inspired by various space/galaxy CSS effects
 */
document.addEventListener('DOMContentLoaded', function() {
    const starsContainer1 = document.getElementById('stars');
    const starsContainer2 = document.getElementById('stars2');
    const starsContainer3 = document.getElementById('stars3');
    
    // Create small stars
    createStars(starsContainer1, 700, 1);
    
    // Create medium stars
    createStars(starsContainer2, 200, 2);
    
    // Create large stars
    createStars(starsContainer3, 100, 3);
    
    // Add nebula effect
    createNebula();
});

/**
 * Creates stars with the specified size
 * @param {HTMLElement} container - The container to add stars to
 * @param {number} count - Number of stars to create
 * @param {number} size - Size of stars (1=small, 2=medium, 3=large)
 */
function createStars(container, count, size) {
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random opacity and animation delay
        const opacity = Math.random() * 0.7 + 0.3;
        const animationDelay = Math.random() * 10;
        
        star.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            background-color: rgba(255, 255, 255, ${opacity});
            border-radius: 50%;
            box-shadow: 0 0 ${size * 2}px rgba(255, 255, 255, 0.7);
            animation: twinkle ${Math.random() * 5 + 5}s infinite ${animationDelay}s;
        `;
        
        container.appendChild(star);
    }
}

/**
 * Creates nebula effects in the background
 */
function createNebula() {
    const body = document.body;
    const nebulaCount = 3;
    
    for (let i = 0; i < nebulaCount; i++) {
        const nebula = document.createElement('div');
        nebula.className = 'nebula';
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random size
        const size = Math.random() * 300 + 200;
        
        // Random color
        const colors = [
            'rgba(155, 89, 182, 0.1)',  // Purple
            'rgba(232, 67, 147, 0.1)',  // Pink
            'rgba(52, 152, 219, 0.1)',  // Blue
            'rgba(26, 188, 156, 0.1)'   // Teal
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        nebula.style.cssText = `
            position: fixed;
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: radial-gradient(circle at center, ${color} 0%, transparent 70%);
            filter: blur(30px);
            z-index: -1;
            opacity: 0.7;
            animation: pulse ${Math.random() * 10 + 20}s infinite;
        `;
        
        body.appendChild(nebula);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes twinkle {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 0.5; }
    }
`;
document.head.appendChild(style);
