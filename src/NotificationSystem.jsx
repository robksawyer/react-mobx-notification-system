/**
 * NotificationSystem
 */
import React, { Component } from 'react';
import { observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import merge from 'object-assign';
// Used the create short ids for React components
import shortid from 'shortid';

// Components
import NotificationContainer from './NotificationContainer';

// Constants
import Constants from './constants';

// Styles
import styles from './styles';

@inject('store')
@observer
class NotificationSystem extends Component {
  constructor(props) {
    super(props);

    this.isMounted = false;

    this.store = props.store.notificationStore;

    this.overrideStyle = props.style;
  }

  componentDidMount() {
    // Set mount status
    this.isMounted = true;

    // There should only be one instance of the Notification System.
    if (NotificationSystem.instance) {
      console.warn('NotificationSystem', 'Attempting to mount a second system into the DOM.');
    }
    NotificationSystem.instance = this;
  }

  componentWillUnmount() {
    this.isMounted = false;
    // Clear the instance val
    if (NotificationSystem.instance === this) {
      NotificationSystem.instance = null;
    }
  }

  /**
   * wrapper
   */
  wrapper() {
    if (!this.overrideStyle) return {};
    return merge({}, styles.Wrapper, this.overrideStyle);
    // UPDATE: Removed Wrapper. TODO: Test this more.
    // return merge({}, styles.Wrapper, this.overrideStyle.Wrapper);
  }

  @observable isMounted;
  @observable overrideStyle;

  /**
   * didNotificationGetRemoved
   * Handles removing the notification from the store.
   */
  didNotificationGetRemoved(uid) {
    const { notificationStore } = this.props.store;
    let notification = notificationStore.notifications.get(uid);
    if (!notification) {
      return true;
    }

    // Remove the notification from the store map
    notificationStore.notifications.delete(uid);

    // Check to see if the notification still exists.
    this.notification = notificationStore.notifications.get(uid);

    // Fire the callback
    if (!this.notification && notification.onRemove) {
      notification.onRemove(notification);
      notification = null;
    }
    // Send a result back
    if (!this.notification) {
      return true;
    }
    return false;
  }

  /**
   * didNotificationGetAdded
   * Handles firing the callback passed.
   */
  didNotificationGetAdded(uid) {
    const { notificationStore } = this.props.store;
    const notification = notificationStore.notifications.get(uid);

    if (notification && notification.onAdd) {
      notification.onAdd(notification);
    }
  }

  render() {
    const {
      noAnimation,
      allowHTML,
    } = this.props;

    const { notificationStore } = this.props.store;

    let containers = null;

    // Get the notifications from the store.
    // const notifications = notificationStore.notifications;
    if (notificationStore.notifications.size) {
      // Make the containers for the notification.
      containers = Object.keys(Constants.positions).map(
        (position) => {
          // Get the notifications based on a certain position.
          const tNotifications = [];
          notificationStore.notifications.forEach(
            (value) => {
              if (position === value.position) {
                tNotifications.push(value);
              }
            },
          );

          // If there aren't any notifications return null
          if (!tNotifications.length) {
            return null;
          }

          return (
            <NotificationContainer
              ref={`container-${position}`} // TODO: Do we really need this?
              key={position}
              // key={ shortid.generate() }
              position={position}
              onRemove={this.didNotificationGetRemoved}
              onAdd={this.didNotificationGetAdded}
              noAnimation={noAnimation}
              allowHTML={allowHTML}
            />
          );
        },
      );
    }

    return (
      <div
        className="notifications-wrapper"
        style={this.wrapper()}
      >
        { containers }
      </div>
    );
  }

  // These just proxy the current actively mounted instance.
  // statics: {
  //   addNotification: (notification) => {
  //     if (NotificationSystem.instance) {
  //       return NotificationSystem.instance.addNotification(notification);
  //     }
  //     console.warn('NotificationSystem', 'No instance to add notification.', notification);
  //     // return notification to prevent null pointer errors.
  //     return notification;
  //   },
  //   removeNotification: (notification) => {
  //     if (NotificationSystem.instance) {
  //       return NotificationSystem.instance.remoteNotification(notification);
  //     }
  //     console.warn('NotificationSystem', 'No instance to remote notification.', notification);
  //     return notification;
  //   },
  //   editNotification: (notification) => {
  //     if (NotificationSystem.instance) {
  //       return NotificationSystem.instance.editNotification(notification);
  //     }
  //     console.warn('NotificationSystem', 'No instance to edit notification.', notification);
  //     return notification;
  //   },
  //   clearNotifications: () => {
  //     if (NotificationSystem.instance) {
  //       return NotificationSystem.instance.clearNotifications();
  //     }
  //     console.warn('NotificationSystem', 'No instance to clear notifications.');
  //     return null;
  //   }
  // }
}

NotificationSystem.defaultProps = {
  style: false,
  noAnimation: false,
  allowHTML: true,
};

NotificationSystem.propTypes = {
  store: PropTypes.oneOfType([PropTypes.object]),
  style: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  noAnimation: PropTypes.bool,
  allowHTML: PropTypes.bool,
};

export default NotificationSystem;
