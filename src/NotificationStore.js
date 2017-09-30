/**
 * DEPRECATED
 * NotificationStore.js
 * Handles notifications throughout the app.
 *
 * TODO: I'd really like this to work with react-notification-system, but I just
 * can't figure it out.
 *
 * @see https://github.com/igorprado/react-notification-system
 */

import { observable, action, toJS } from 'mobx';
import merge from 'object-assign';

// Constants
import Constants from './constants';

export default class NotificationStore {
  @observable initialized;
  // The notification objects
  @observable notifications;
  // The notification React component elements
  @observable components;
  // Transition duration
  transitionDuration = 0.5;

  constructor() {
    console.log('Created Notification Store!');
    // Set some defaults
    this.initialized = false;
    this.notifications = new Map();
    this.components = new Map();
  }

  /**
   * addNotification
   * Handles adding notifications to the queue.
   * @see https://github.com/igorprado/react-notification-system#creating-a-notification
   * @param {Object} settings Contains the notification settings.
   * @return {void}
   */
  // @action('ADD_NOTIFICATION')
  // addNotification(settings){
  //   const text = settings.message;
  //   const type = settings.level;
  //   const notification = { text, type }
  //
  //   this.notifications.push(notification);
  //   const newNotificationIndex = this.notifications.length-1;
  //   setTimeout(() => {
  //     this.deleteNotification(this.notifications[newNotificationIndex]);
  //   }, 5000);
  // }

  /**
   * deleteNotification
   * Handles deleting a notification.
   * @param {Object} notification
   * @return
   */
  // @action('DELETE_NOTIFICATION')
  // deleteNotification (notification) {
  //   if(this.notifications.length < 2){
  //     const filteredArray = this.notifications.filter(
  //       (not) => {
  //         return not !== notification;
  //       }
  //     );
  //     this.notifications.replace(filteredArray);
  //   } else {
  //     // Clear the array if there's only one notification
  //     this.notifications.clear();
  //   }
  // }
  //

  /**
   * addNotification
   * Add a notification object. This displays the notification based on the
   * object you passed.
   * Returns the notification object to be used to programmatically dismiss a
   * notification.
   * @param {object} notificationSettings A settings object that describes a notification
   * @return
   */
  @action('ADD_NOTIFICATION')
  addNotification(notificationSettings) {
    // Create a temp notification object
    const tNotification = merge({}, Constants.notification, notificationSettings);

    console.log('------- ADD NOTIFICATION -------');
    console.log(tNotification);

    if (!tNotification.level) {
      throw new Error('notification level is required.');
    }

    if (Object.keys(Constants.levels).indexOf(tNotification.level) === -1) {
      throw new Error(`'${tNotification.level}' is not a valid level.`);
    }

    if (isNaN(tNotification.autoDismiss)) {
      throw new Error('\'autoDismiss\' must be a number.');
    }

    if (Object.keys(Constants.positions).indexOf(tNotification.position) === -1) {
      throw new Error(`'${tNotification.position}' is not a valid position.`);
    }

    // Some preparations
    // TODO: Make these switch statements
    tNotification.position = tNotification.position.toLowerCase();
    tNotification.level = tNotification.level.toLowerCase();

    // Set the default properties of the notification
    tNotification.style = {};
    tNotification.visible = false;
    tNotification.removed = false;
    tNotification.isMounted = false;
    tNotification.height = 0;
    tNotification.noAnimation = false;
    tNotification.dismissible = true;
    tNotification.autoDismiss = parseInt(tNotification.autoDismiss, 10) || 5;

    tNotification.uid = tNotification.uid || this.uid || 3400;
    // TODO: Figure out a better way to handle this.
    tNotification.ref = `notification-${tNotification.uid}`;
    this.uid += 1;

    // do not add if the notification already exists based on supplied uid
    for (let i = 0; i < this.notifications.size; i += 1) {
      console.log(this.notifications.get(this.uid).uid);
      if (this.notifications.get(this.uid).uid === tNotification.uid) {
        return false;
      }
    }

    // Add the new notification to the stack
    this.notifications.set(tNotification.uid, tNotification);

    return tNotification;
  }

  /**
   * getNotificationRef
   * @param {int} uid The notification uid.
   * @return {string}
   */
  @action('GET_NOTIFICATION')
  getNotificationRef(uid) {
    // const self = this;
    // let foundNotification = null;
    //
    // Object.keys(this.refs).forEach(
    //   (container) => {
    //     if (container.indexOf('container') > -1) {
    //       Object.keys(self.refs[container].refs).forEach(
    //         (tNotification) => {
    //           const uid = notification.uid ? notification.uid : notification;
    //           if (tNotification === `notification${uid}`) {
    //             // NOTE: Stop iterating further and return the found notification.
    //             // Since UIDs are uniques and there won't be another notification found.
    //             foundNotification = self.refs[container].refs[tNotification];
    //
    //             console.log('------ FOUND NOTIFICATION ------');
    //             console.log(foundNotification);
    //           }
    //         },
    //       );
    //     }
    //   },
    // );

    // return foundNotification;
    return this.notifications[uid].ref;
  }

  /**
   * removeNotification
   * @param {int} uid The id of the notifcation to remove.
   */
  @action('DELETE_NOTIFICATION')
  removeNotification(uid) {
    return this.hideNotification(uid);
  }

  /**
   * editNotification
   * Edit a notification programmatically. You can pass an object previously
   * returned by addNotification() or by onAdd() callback. If passing an object,
   * you need to make sure it must contain the uid property. You can pass only
   * the uid too: editNotification(uid).
   * @param {int, object} notification Notification object must contain uid.
   * @return {object}
   */
  @action('EDIT_NOTIFICATION')
  editNotification(notificationSettings, newNotificationSettings) {
    let foundNotification = null;
    // NOTE: Find state notification to update by using
    // `setState` and forcing React to re-render the component.
    const uid = notificationSettings.uid ? notificationSettings.uid : notificationSettings;

    const newNotifications = this.notifications.filter(
      (storeNotification) => {
        if (uid === storeNotification.uid) {
          foundNotification = storeNotification;
          return false;
        }
        return true;
      },
    );

    if (!foundNotification) {
      return;
    }

    newNotifications.push(merge(
      {},
      foundNotification,
      newNotificationSettings,
    ));

    this.notifications.replace(newNotifications);
  }

  /**
   * clearNotifications
   * Handles clearing all of the notifications
   * @see https://mobx.js.org/refguide/array.html
   */
  @action('CLEAR_NOTIFICATIONS')
  clearNotifications() {
    // const self = this;
    // Object.keys(this.refs)
    //   .forEach((container) => {
    //     if (container.indexOf('container') > -1) {
    //       Object.keys(self.refs[container].refs)
    //         .forEach((tNotification) => {
    //           self.refs[container].refs[tNotification].hideNotification();
    //         });
    //     }
    //   });

    // TODO: See if the mobx clear is better.
    this.notifications.clear();
  }

  /**
   * addSimpleNotification
   * Handles adding notifications to the queue.
   * @param {string} message Message of the notification
   * @param {string} level Level of the notification. Available: success, error, warning and info
   */
  @action addSimpleNotification(message, level) {
    this.addNotification({
      message,
      level,
    });
  }

  /**
   * addErrorNotification
   * Handles adding an error notification to the queue.
   * @param {string} message Message of the notification
   */
  @action addErrorNotification(message) {
    this.addNotification({
      message,
      level: 'error',
    });
  }

  /**
   * addSuccessNotification
   * Handles adding an success notification to the queue.
   * @param {string} message Message of the notification
   */
  @action addSuccessNotification(message) {
    this.addNotification({
      message,
      level: 'success',
    });
  }

  /**
   * addWarningNotification
   * Handles adding an warning notification to the queue.
   * @param {string} message Message of the notification
   */
  @action addWarningNotification(message) {
    this.addNotification({
      message,
      level: 'warning',
    });
  }

  /**
   * addInfoNotification
   * Handles adding an info notification to the queue.
   * @param {string} message Message of the notification
   */
  @action addInfoNotification(message) {
    this.addNotification({
      message,
      level: 'info',
    });
  }
}
