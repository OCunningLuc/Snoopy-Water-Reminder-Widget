const { ipcRenderer } = require('electron');

const idlePreview = document.getElementById('idle-preview');
const alertPreview = document.getElementById('alert-preview');
const rewardPreview = document.getElementById('reward-preview');

const interval30 = document.getElementById('interval-30');
const interval45 = document.getElementById('interval-45');
const interval60 = document.getElementById('interval-60');
const intervalCustom = document.getElementById('interval-custom');
const customIntervalInput = document.getElementById('custom-interval-input');

const soundToggle = document.getElementById('sound-toggle');
const alertReminderTextInput = document.getElementById(
  'alert-reminder-text-input',
);
const rewardReminderTextInput = document.getElementById(
  'reward-reminder-text-input',
);
const reminderColorInput = document.getElementById('reminder-color-input');
const selectSoundButton = document.getElementById('select-sound-button');
const soundFileName = document.getElementById('sound-file-name');

const resetButton = document.getElementById('reset-button');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');
const exitAppButton = document.getElementById('exit-app-button');

const avatarButtons = document.querySelectorAll('[data-avatar-state]');

let currentSettings = null;

function renderSettings(settings) {
  currentSettings = settings;

  if (settings.avatars) {
    idlePreview.src = settings.avatars.idleUrl;
    alertPreview.src = settings.avatars.alertUrl;
    rewardPreview.src = settings.avatars.rewardUrl;
  }

  const interval = settings.intervalMinutes || 60;
  if (interval === 30) {
    interval30.checked = true;
    customIntervalInput.value = '';
  } else if (interval === 45) {
    interval45.checked = true;
    customIntervalInput.value = '';
  } else if (interval === 60) {
    interval60.checked = true;
    customIntervalInput.value = '';
  } else {
    intervalCustom.checked = true;
    customIntervalInput.value = String(interval);
  }

  soundToggle.checked = !!settings.soundEnabled;

  const alertText = settings.alertReminderText || '该喝水啦！';
  alertReminderTextInput.value = alertText;
  const rewardText = settings.rewardReminderText || '蒸蚌！';
  rewardReminderTextInput.value = rewardText;

  const color = settings.reminderColor || '#ffffff';
  reminderColorInput.value = color;

  const soundUrl = settings.soundUrl || '';
  if (soundUrl) {
    const decoded = decodeURIComponent(soundUrl);
    const parts = decoded.split('/');
    soundFileName.textContent = parts[parts.length - 1] || 'alert.mp3';
  } else {
    soundFileName.textContent = 'alert.mp3';
  }
}

function getIntervalFromUI() {
  if (interval30.checked) return 30;
  if (interval45.checked) return 45;
  if (interval60.checked) return 60;
  if (intervalCustom.checked) {
    const value = Number(customIntervalInput.value || '0');
    if (!Number.isFinite(value) || value <= 0) {
      return 60;
    }
    // 允许任意正数分钟（例如 1 分钟、2 分钟），不再强制下限 10 分钟
    return value;
  }
  return 60;
}

function wireIntervalInteractions() {
  [interval30, interval45, interval60].forEach((el) => {
    el.addEventListener('change', () => {
      if (el.checked) {
        customIntervalInput.value = '';
      }
    });
  });

  intervalCustom.addEventListener('change', () => {
    if (intervalCustom.checked && !customIntervalInput.value) {
      customIntervalInput.value = '60';
    }
  });

  customIntervalInput.addEventListener('focus', () => {
    intervalCustom.checked = true;
  });
}

function wireAvatarButtons() {
  avatarButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const state = button.getAttribute('data-avatar-state');
      const updated = await ipcRenderer.invoke('select-avatar', state);
      if (updated) {
        renderSettings(updated);
      }
    });
  });
}

function wireSoundButtons() {
  selectSoundButton.addEventListener('click', async () => {
    const updated = await ipcRenderer.invoke('select-sound');
    if (updated) {
      renderSettings(updated);
    }
  });
}

function wireFooterButtons() {
  resetButton.addEventListener('click', async () => {
    const updated = await ipcRenderer.invoke('reset-settings');
    if (updated) {
      renderSettings(updated);
    }
  });

  saveButton.addEventListener('click', async () => {
    const intervalMinutes = getIntervalFromUI();
    const soundEnabled = soundToggle.checked;
    const alertReminderText = alertReminderTextInput.value || '该喝水啦！';
    const rewardReminderText = rewardReminderTextInput.value || '蒸蚌！';
    const reminderColor = reminderColorInput.value || '#ffffff';

    const updated = await ipcRenderer.invoke('update-settings', {
      intervalMinutes,
      soundEnabled,
      alertReminderText,
      rewardReminderText,
      reminderColor,
    });

    if (updated) {
      renderSettings(updated);
    }
    window.close();
  });

  cancelButton.addEventListener('click', () => {
    window.close();
  });

  exitAppButton.addEventListener('click', async () => {
    await ipcRenderer.invoke('quit-app');
  });
}

async function init() {
  const settings = await ipcRenderer.invoke('get-settings');
  renderSettings(settings);
  wireIntervalInteractions();
  wireAvatarButtons();
  wireSoundButtons();
  wireFooterButtons();

  ipcRenderer.on('settings-updated', (event, updated) => {
    renderSettings(updated);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to init settings window:', error);
  });
});

