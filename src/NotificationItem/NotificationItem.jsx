/**
 * NotificationItem.jsx
 *
 * Component that manages a single component.
 *
 */
import React, { Component } from 'react';
import { observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import merge from 'object-assign';
// Used the create short ids for React components
import shortid from 'shortid';
import { Animate } from 'react-move';
import { easeExpInOut } from 'd3-ease';

import Constants from '../constants';
import Helpers from '../helpers';

// Styles
import styles from '../styles';

@inject('store')
@observer
class NotificationItem extends Component {
  constructor(props) {
    super(props);

    const {
      store,
      uid,
      noAnimation,
      onAdd,
      onRemove,
      allowHTML,
    } = this.props;

    this.isMounted = false;
    this.introAnimationComplete = false;
    this.outroAnimationComplete = false;
    this.isAnimating = false;
    this.notificationTimer = null;
    this.notificationStyle = new Map();
    this.removeCount = 0;
    this.noAnimation = noAnimation;
    this.onAdd = onAdd;
    this.onRemove = onRemove;
    this.allowHTML = allowHTML;

    // Get a reference to the notification store.
    this.store = store.notificationStore;

    // Set the uid to a local var
    this.uid = uid;

    this.styles = new Map();
    this.overrideStyle = {};
    this.elements = new Map();
    const tElements = {
      notification: 'NotificationItem',
      title: 'Title',
      messageWrapper: 'MessageWrapper',
      dismiss: 'Dismiss',
      action: 'Action',
      actionWrapper: 'ActionWrapper',
    };
    this.elements.merge(tElements);

    // TODO: This probably needs to reference the actual element.
    // Get the notification
    this.notification = this.store.notifications.get(this.uid);

    // Set the final actual time locally
    this.dismissTime = parseInt(this.notification.autoDismiss, 0) * 1000;

    if (!this.notification) {
      console.log(`Issue finding notification with uid ${this.uid}.`);
      return false;
    }
  }

  componentWillMount() {
    const self = this;

    // Set a timer to auto dismiss the notification if ...
    if (this.notification.autoDismiss) {
      this.notificationTimer = new Helpers.Timer(() => {
        self.hideNotification();
        self.onTransitionEnd();
      }, this.dismissTime);
    }

    if (!this.isMounted) {
      // Take the styles passed via props and override defaults.
      this.setOverrideStyle(this.notification.style);

      // Set the height to the element offset height
      this.notification.height = this.notification.offsetHeight;

      // Grab the notification level from store
      const level = this.notification.level;

      // Get the styles for each part of the notification
      // from the styles.js file.
      const tStyles = {
        notification: this.byElement('notification')(level),
        title: this.byElement('title')(level),
        dismiss: this.byElement('dismiss')(level),
        messageWrapper: this.byElement('messageWrapper')(level),
        actionWrapper: this.byElement('actionWrapper')(level),
        action: this.byElement('action')(level),
      };

      // Set the styles
      this.styles.merge(tStyles);

      // Set the initial notification styles
      this.notificationStyle.merge(this.getNotificationStyle());

      if (this.overrideStyle.length > 0) {
        this.notificationStyle.merge(this.overrideStyle);
      }

      // Show the animation.
      this.showNotification();
    }
  }

  componentDidMount() {
    // const component = this.componentReference;
    // console.log(component);
    // const transitionEvent = whichTransitionEvent();

    // Add the transition to the element.
    // Watch for transition end
    // if (!this.noAnimation) {
    //   if (transitionEvent) {
    //     component.addEventListener(transitionEvent, this.onTransitionEnd);
    //   } else {
    //     this.noAnimation = true;
    //   }
    // }

    // Say it's mounted
    if (!this.isMounted) {
      this.isMounted = true;
    }
  }

  componentWillUnmount() {
    // const component = this.componentReference;
    // console.log(component);
    // const transitionEvent = whichTransitionEvent();
    //
    // // Remove the transitionEvent listener
    // component.removeEventListener(transitionEvent, this.onTransitionEnd);

    // Say it's unmounted
    if (this.isMounted) {
      this.isMounted = false;
    }
  }

  onTransitionEnd() {
    if (this.removeCount > 0) return;
    if (this.notification.removed) {
      this.removeCount += 1;
      this.removeNotification();
    }
  }

  /**
   * setOverrideStyle
   */
  setOverrideStyle(style) {
    this.notification.overrideStyle = style;
  }

  /**
   * getCssPropertyByPosition
   */
  getCssPropertyByPosition() {
    const position = this.notification.position;
    let css = {};
    switch (position) {
      case Constants.positions.tl:
      case Constants.positions.bl:
        css = {
          property: 'left',
          value: -200,
        };
        break;

      case Constants.positions.tr:
      case Constants.positions.br:
        css = {
          property: 'right',
          value: -200,
        };
        break;

      case Constants.positions.tc:
        css = {
          property: 'top',
          value: -100,
        };
        break;

      case Constants.positions.bc:
        css = {
          property: 'bottom',
          value: -100,
        };
        break;

      default:
        break;
    }

    return css;
  }

  /**
   * getTitle
   * Handles building the title element.
   */
  getTitle() {
    return (
      <h4
        className="notification-title"
        style={this.styles.title}
      >
        {this.notification.title}
      </h4>
    );
  }

  /**
   * getActionButton
   * Handles building the action button element.
   */
  getActionButton() {
    return (
      <div
        className="notification-action-wrapper"
        style={this.styles.actionWrapper}
      >
        <button
          className="notification-action-button"
          onClick={this.defaultAction}
          style={this.styles.action}
        >
          {this.notification.action.label}
        </button>
      </div>
    );
  }

  /**
   * getMessage
   * Handles populating the element with the message from the store.
   * @param {void}
   */
  getMessage() {
    if (this.props.allowHTML) {
      return (
        <div
          className="notification-message"
          style={this.styles.messageWrapper}
          dangerouslySetInnerHTML={{
            __html: this.notification.message,
          }}
        />
      );
    }
    return (
      <div
        className="notification-message"
        style={this.styles.messageWrapper}
      >
        {this.notification.message}
      </div>
    );
  }

  /**
   * getDismissButton
   * Handles building the dismiss button
   * @param {void}
   */
  getDismissButton() {
    return (
      <span
        className="notification-dismiss"
        style={this.styles.get('dismiss')}
      >&times;</span>
    );
  }

  /**
   * getNotificationStyle
   * Handles building the style that is later applied to the notification.
   * @param {void}
   * @return {object}
   */
  getNotificationStyle() {
    const style = observable(new Map());
    style.merge(
      this.styles.get('notification'),
    );
    const cssByPos = observable(new Map());
    cssByPos.merge(
      this.getCssPropertyByPosition(),
    );

    const property = cssByPos.get('property');
    // if (!this.notification.visible && !this.notification.removed) {
    //   style.set(property, cssByPos.get('value'));
    // }
    //
    // if (this.notification.visible && !this.notification.removed) {
    //   style.set('height', this.notification.height);
    //   style.set(property, 0);
    // }

    style.set('height', this.notification.height);
    style.set(property, cssByPos.get('value'));

    if (this.notification.removed) {
      style.set('overlay', 'hidden');
      style.set('height', 0);
      style.set('marginTop', 0);
      style.set('paddingTop', 0);
      style.set('paddingBottom', 0);
    }

    // Handles getting the visibility based on the current notification visible
    // const opacity = this.notification.visible
    //   ? this.styles.get('notification').isVisible.opacity
    //   : this.styles.get('notification').isHidden.opacity;
    //
    // style.set('opacity', opacity);

    return style;
  }

  /**
   * getClassName
   * Handles getting the class that is later applied to the notification.
   * @param {void}
   */
  getClassName() {
    let className = `notification notification-${this.level}`;
    // TODO: Get this information from the store.
    if (this.notification.visible) {
      className += ' notification-visible';
    } else if (this.notification.visible === false) {
      className += ' notification-hidden';
    }

    if (!this.dismissible) {
      className += ' notification-not-dismissible';
    }
    return className;
  }

  /**
   * byElement
   * Handles getting the styles based on the element type.
   */
  byElement(element) {
    const self = this;
    return (level) => {
      const styleElement = self.elements.get(element);
      const override = self.overrideStyle[styleElement] || {};
      if (!self.overrideStyle) return {};
      return merge(
        {},
        styles[styleElement].DefaultStyle,
        styles[styleElement][level],
        override.DefaultStyle,
        override[level],
      );
    };
  }

  /**
   * dismiss
   */
  dismiss = () => {
    if (!this.notification.dismissible) {
      return;
    }
    // Set the dismissTime to zero, so there's no react-move delay on the leave.
    this.dismissTime = 0;
    // Hide the notification
    this.hideNotification();
  }

  /**
   * showNotification
   * Handles running the CSS transition.
   */
  showNotification() {
    if (this.isMounted) {
      this.notification.visible = true;
      this.notification.removed = false;
    }
    // Fire the callback.
    this.addNotification();
    // setTimeout(() => {
    //   if (this.notification.isMounted) {
    //     this.notification.visible = true;
    //   }
    // }, 50);
  }

  /**
   * handleMouseEnter
   */
  handleMouseEnter = () => {
    // Pause the autoDismiss timer.
    if (this.notification.autoDismiss) {
      this.notificationTimer.pause();
    }
  }

  /**
   * handleMouseLeave
   */
  handleMouseLeave = () => {
    // Resume the autoDismiss timer.
    if (this.notification.autoDismiss) {
      this.notificationTimer.resume();
    }
  }

  /**
   * addNotification
   */
  addNotification() {
    if (this.onAdd) {
      console.log(`Adding notification ${this.notification.uid}`);
      this.onAdd(this.notification.uid);
    }
  }

  /**
   * removeNotification
   */
  removeNotification() {
    if (this.onRemove) {
      console.log(`Removing notification ${this.notification.uid}`);
      this.onRemove(this.notification.uid);
    }
  }

  /**
   * hideNotification
   */
  hideNotification() {
    if (this.isMounted) {
      this.notification.visible = false;
      this.notification.removed = true;
    }

    // Setting this to true should trigger the leave animation
    this.introAnimationComplete = true;
    this.isAnimating = false;

    // Clear the timer if it's going
    if (this.notificationTimer) {
      this.notificationTimer.clear();
    }
    // console.log('--------------- BEFORE ---------------');
    // console.log(this.store.notifications);
    // if (this.isMounted) {
    //   // Update the notification in the store.
    //   this.notification.visible = false;
    //   this.notification.removed = false;
    //   this.store.notifications.set(this.notification.uid, this.notification);
    // }
    // console.log(this.store.notifications);
    // console.log('--------------- AFTER ---------------');

    if (this.noAnimation) {
      this.removeNotification();
    }
  }

  /**
   * defaultAction
   */
  defaultAction(event) {
    event.preventDefault();
    this.hideNotification();
    if (typeof this.action.callback === 'function') {
      this.action.callback();
    }
  }

  @observable uid;
  @observable action;
  @observable styles;
  @observable notification;
  @observable notificationStyle;
  @observable notificationTimer;
  @observable noAnimation;
  @observable removeCount;
  @observable onAdd;
  @observable onRemove;
  @observable elements;
  @observable introAnimationComplete;
  @observable outroAnimationComplete;
  @observable isAnimating;
  @observable isMounted;
  @observable dismissTime;
  overrideStyle;
  componentReference;

  render() {
    const {
      children,
    } = this.props;

    // Local vars
    let dismissElement = null;
    let actionButtonElement = null;
    let titleElement = null;
    let messageElement = null;

    const className = `notification notification-${this.notification.level}`;

    // Apply dismiss styles
    if (!this.notification.dismissible) {
      this.styles.get('notification').cursor = 'default';
    }

    if (this.notification.title) {
      titleElement = this.getTitle();
    }

    if (this.notification.message) {
      messageElement = this.getMessage();
    }

    if (this.notification.dismissible) {
      dismissElement = this.getDismissButton();
    }

    if (this.action) {
      actionButtonElement = this.getActionButton();
    }

    if (this.props.children) {
      actionButtonElement = children;
    }

    const defaultEnter = {
      opacity: [1],
      timing: {
        duration: 750,
        ease: easeExpInOut,
      },
    };
    const defaultUpdate = {
      opacity: [1],
      timing: {
        duration: 750,
        ease: easeExpInOut,
      },
    };
    const defaultLeave = {
      opacity: [0],
      timing: {
        duration: 500,
        ease: easeExpInOut,
      },
    };

    const tAnimationProps = this.getCssPropertyByPosition();
    const startAnimationByPosition = {};
    startAnimationByPosition[tAnimationProps.property] = `${tAnimationProps.value}px`;
    const startAnimation = Object.assign(
      {},
      startAnimationByPosition,
      defaultEnter,
    );
    const enterAnimation = Object.assign(
      {},
      styles.Containers[this.notification.position],
      defaultEnter,
    );
    const updateAnimation = Object.assign(
      {},
      defaultUpdate,
    );
    const leaveAnimation = Object.assign(
      {},
      startAnimationByPosition,
      defaultLeave,
    );
    return (
      <Animate
        show={!this.introAnimationComplete}
        start={startAnimation}
        enter={enterAnimation}
        update={updateAnimation}
        leave={leaveAnimation}
      >
        {(data) => {
          // Update the local notification styles based on the changes from react-move (Animate).
          this.notificationStyle.set('opacity', data.opacity);
          // Animate the property found in the constants.
          this.notificationStyle.set(tAnimationProps.property, data[tAnimationProps.property]);

          // Check to see if the outro animation has completed.
          if (data.opacity === 0 && !this.outroAnimationComplete && this.introAnimationComplete) {
            this.outroAnimationComplete = true;
          }

          return (
            <div
              // ref={(c) => {
              //   this.componentReference = c;
              // }}
              role="presentation"
              onClick={this.dismiss}
              onMouseEnter={this.handleMouseEnter}
              onMouseLeave={this.handleMouseLeave}
              className={className}
              key={shortid.generate()}
              style={this.notificationStyle.toJS()}
            >
              {titleElement}
              {messageElement}
              {dismissElement}
              {actionButtonElement}
            </div>
          );
        }}
      </Animate>
    );
  }
}

NotificationItem.defaultProps = {
  uid: 3400,
  allowHTML: false,
  noAnimation: false,
  onAdd: () => {},
  onRemove: () => {},
  children: '',
};

NotificationItem.propTypes = {
  store: PropTypes.objectOf(PropTypes.object),
  uid: PropTypes.number.isRequired,
  onAdd: PropTypes.func,
  onRemove: PropTypes.func,
  allowHTML: PropTypes.bool,
  noAnimation: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
  ]),
};

export default NotificationItem;
