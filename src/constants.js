/**
 * constants.js
 */
const Constants = {

  // Positions
  positions: {
    tl: 'tl',
    tr: 'tr',
    tc: 'tc',
    bl: 'bl',
    br: 'br',
    bc: 'bc',
  },

  // Levels
  levels: {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  },

  // Notification defaults
  notification: {
    title: '',
    message: '',
    style: {},
    visible: false,
    removed: false,
    height: 0,
    noAnimation: false,
    level: 'success',
    position: 'tr',
    autoDismiss: 5,
    dismissible: true,
    action: null,
  },
};

export default Constants;
