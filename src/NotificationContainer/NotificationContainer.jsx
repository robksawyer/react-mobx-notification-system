/**
 * NotificationContainer
 *
 * This holds all of the notifications.
 */
import React, { Component } from 'react';
import { observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import merge from 'object-assign';

import NotificationItem from '../NotificationItem';
import Constants from '../constants';

// Styles
import styles from '../styles';

@inject('store')
@observer
class NotificationContainer extends Component {
  constructor(props) {
    super(props);

    const { style, width } = props;
    this.overrideStyle = style;
    this.overrideWidth = width;

    this.store = props.store.notificationStore;
  }

  componentWillMount() {
    // Fix position if width is overrided
    this.style = this.container(this.props.position);
    if (this.overrideWidth &&
      (this.props.position === Constants.positions.tc ||
         this.props.position === Constants.positions.bc)) {
      this.style.marginLeft = -(this.overrideWidth / 2);
    }
  }

  /**
   * getNotificationItem
   * Handles rendering all of the notifications that are in the notifications
   * array that exist in the NotificationStore.
   */
  getNotificationItems() {
    const {
      onRemove,
      onAdd,
      noAnimation,
      allowHTML,
      children,
    } = this.props;

    const { notificationStore } = this.props.store;
    const notificationElements = [];
    notificationStore.notifications.forEach(
      value => (
        notificationElements.push(
          <NotificationItem
            key={value.uid}
            uid={value.uid}
            noAnimation={noAnimation}
            allowHTML={allowHTML}
            onRemove={onRemove}
            onAdd={onAdd}
          >
            {children}
          </NotificationItem>,
        )
      ),
    );
    return notificationElements;
  }

  /**
   * container
   */
  container(position) {
    const override = this.overrideStyle.Containers || {};
    if (!this.overrideStyle) return {};

    this.overrideWidth = styles.Containers.DefaultStyle.width;

    if (override.DefaultStyle && override.DefaultStyle.width) {
      this.overrideWidth = override.DefaultStyle.width;
    }

    if (override[position] && override[position].width) {
      this.overrideWidth = override[position].width;
    }

    return merge(
      {},
      styles.Containers.DefaultStyle,
      styles.Containers[position],
      override.DefaultStyle,
      override[position],
    );
  }

  @observable style;
  @observable overrideStyle;
  @observable overrideWidth;

  render() {
    const { notificationStore } = this.props.store;
    if ([
      Constants.positions.bl,
      Constants.positions.br,
      Constants.positions.bc,
    ].indexOf(this.props.position) > -1) {
      // TODO: Why is the array being reversed?
      notificationStore.notifications.reverse();
    }

    const notificationItemElements = this.getNotificationItems();
    return (
      <div
        className={`notifications notifications-${this.props.position}`}
        style={this.style}
      >
        {notificationItemElements}
      </div>
    );
  }
}

// const Style = {
//   overrideStyle: PropTypes.objectOf(PropTypes.string),
//   overrideWidth: PropTypes.boolean,
//   setOverrideStyle: PropTypes.function,
//   wrapper: PropTypes.function,
//   container: PropTypes.function,
//   elements: PropTypes.objectOf(PropTypes.string),
//   byElement: PropTypes.function,
// };

// const NotificationItem = {
//   position: PropTypes.string,
//   level: PropTypes.string,
//   autoDismiss: PropTypes.boolean,
//   ref: PropTypes.function,
//   uid: PropTypes.number,
// };
//

NotificationContainer.defaultProps = {
  position: 'tr',
  onRemove: () => {},
  onAdd: () => {},
  noAnimation: false,
  allowHTML: true,
  children: '',
  style: {},
  width: 0,
};

NotificationContainer.propTypes = {
  store: PropTypes.oneOfType([PropTypes.object]),
  position: PropTypes.string.isRequired,
  width: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.object]),
  onRemove: PropTypes.func,
  onAdd: PropTypes.func,
  noAnimation: PropTypes.bool,
  allowHTML: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
  ]),
};

export default NotificationContainer;
