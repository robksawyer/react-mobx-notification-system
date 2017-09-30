/**
 * NotificationSystem.test.jsx
 */
import React from 'react';
import NotificationSystem from './NotificationSystem.jsx';

export default [{
  name: "default",
  component: (
    <NotificationSystem>
      Hello World
    </NotificationSystem>
  ),
  test(t, component) {
    t.equal(component.is('.notification-system'), true, 'tag class');
    t.equal(component.text(), 'Hello World', 'text');
    t.end();
  }
}];
