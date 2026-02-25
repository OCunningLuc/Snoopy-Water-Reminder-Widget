const { ipcRenderer } = require('electron');

const STATE_IDLE = 'idle';
const STATE_ALERT = 'alert';
const STATE_REWARD = 'reward';

let state = STATE_IDLE;
let settings = null;
let alertTimer = null;
let rewardTimer = null;
let isFirstAlert = true;

let isDragging = false;
let dragOffset = { x: 0, y: 0 };

const container = document.getElementById('widget-container');
const avatarImg = document.getElementById('avatar');
const bubble = document.getElementById('bubble');

const alertAudio = new Audio();

function applyBubbleText() {
  if (!settings) return;
  let text = '';
  if (state === STATE_REWARD) {
    text = settings.rewardReminderText || '蒸蚌！';
  } else {
    text = settings.alertReminderText || '该喝水啦！';
  }
  bubble.textContent = text;
  const color = settings.reminderColor || '#ffffff';
  bubble.style.color = color;
}

function applyAvatars() {
  if (!settings) return;
  if (state === STATE_IDLE) {
    avatarImg.src = settings.avatars.idleUrl;
  } else if (state === STATE_ALERT) {
    avatarImg.src = settings.avatars.alertUrl;
  } else if (state === STATE_REWARD) {
    avatarImg.src = settings.avatars.rewardUrl;
  }
}

function applySound() {
  if (!settings) return;
  alertAudio.src = settings.soundUrl || '';
  alertAudio.volume = 0.9;
}

function clearTimers() {
  if (alertTimer) {
    clearTimeout(alertTimer);
    alertTimer = null;
  }
  if (rewardTimer) {
    clearTimeout(rewardTimer);
    rewardTimer = null;
  }
}

function scheduleNextAlert() {
  clearTimers();
  if (!settings || !settings.intervalMinutes) return;
  // 第一次启动时，先用 5 秒快速预览提醒；之后按设置的间隔来
  const delayMs = isFirstAlert
    ? 5000
    : settings.intervalMinutes * 60 * 1000;
  isFirstAlert = false;
  alertTimer = setTimeout(() => {
    enterAlertState();
  }, delayMs);
}

function showBubble() {
  bubble.classList.remove('hidden');
  requestAnimationFrame(() => {
    bubble.classList.add('visible');
  });
}

function hideBubble() {
  bubble.classList.remove('visible');
  bubble.classList.add('hidden');
}

function enterIdleState() {
  state = STATE_IDLE;
  hideBubble();
  applyAvatars();
  applyBubbleText();
  scheduleNextAlert();
}

function enterAlertState() {
  state = STATE_ALERT;
  applyAvatars();
  applyBubbleText();
  showBubble();
  if (settings && settings.soundEnabled && alertAudio.src) {
    alertAudio.currentTime = 0;
    alertAudio
      .play()
      // eslint-disable-next-line no-console
      .catch((e) => console.warn('Failed to play alert sound:', e));
  }
}

function enterRewardState() {
  state = STATE_REWARD;
  applyAvatars();
  applyBubbleText();
  showBubble();
  clearTimers();
  rewardTimer = setTimeout(() => {
    enterIdleState();
  }, 4000);
}

function handleUserConfirmed() {
  if (state !== STATE_ALERT) return;
  enterRewardState();
}

function setupDrag() {
  container.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    isDragging = true;
    container.classList.add('dragging');
    dragOffset.x = event.screenX - window.screenX;
    dragOffset.y = event.screenY - window.screenY;
  });

  window.addEventListener('mousemove', (event) => {
    if (!isDragging) return;
    const targetX = event.screenX - dragOffset.x;
    const targetY = event.screenY - dragOffset.y;
    ipcRenderer.send('move-widget', { x: targetX, y: targetY });
  });

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove('dragging');
  }

  window.addEventListener('mouseup', endDrag);
  window.addEventListener('mouseleave', endDrag);
}

function setupBubbleAndClicks() {
  bubble.addEventListener('click', (event) => {
    event.stopPropagation();
    handleUserConfirmed();
  });

  avatarImg.addEventListener('click', () => {
    if (state === STATE_ALERT) {
      handleUserConfirmed();
    }
  });

  container.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    ipcRenderer.invoke('show-widget-menu');
  });
}

async function init() {
  setupDrag();
  setupBubbleAndClicks();

  settings = await ipcRenderer.invoke('get-settings');
  applyAvatars();
  applySound();
  applyBubbleText();
  scheduleNextAlert();

  ipcRenderer.on('settings-updated', (event, updated) => {
    settings = updated;
    applySound();
    applyAvatars();
    applyBubbleText();
    if (state === STATE_IDLE) {
      scheduleNextAlert();
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to init widget:', error);
  });
});

