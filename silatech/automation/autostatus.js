// ============================================
// STATUS AUTOMATION MASTER MODULE
// Initializes all status automation features
// Powered by SILA TECH
// ============================================

import { handleAutoView, handleAutoRecording } from './autoview.js';
import { handleAutoLike } from './autolike.js';
import { handleStatusSaver } from './autosave.js';
import { handleNewsletterReact } from './newsletter.js';
import { startAlwaysOnline } from './alwaysonline.js';
import { startAutoBio } from './autobio.js';

export async function initializeStatusAutomation(sock) {
    console.log('✅ Status Automation Master Module Initialized');
    
    // Start always online if enabled
    startAlwaysOnline(sock);
    
    // Start auto bio if enabled
    startAutoBio(sock);
    
    // Return handlers for use in main bot
    return {
        handleAutoView,
        handleAutoRecording,
        handleAutoLike,
        handleStatusSaver,
        handleNewsletterReact
    };
}

export default { initializeStatusAutomation };
