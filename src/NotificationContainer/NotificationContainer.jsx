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
    const { position } = this.props;
    // Fix position if width is overrided
    this.style = this.container(position);
    if (this.overrideWidth &&
      (position === Constants.positions.tc ||
         position === Constants.positions.bc)) {
      this.style.marginLeft = -(this.overrideWidth / 2);
    }

    // Add the notification components to a MobX map for display later.
    this.getNotificationItems();
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
      position,
    } = this.props;

    this.store.notifications.forEach(
      (value) => {
        // Only add the notification item if the position matches
        if (position === value.position) {
          const tNote = this.store.notifications.get(value.uid);
          tNote.component =
              (<NotificationItem
                key={value.uid}
                uid={value.uid}
                noAnimation={noAnimation}
                allowHTML={allowHTML}
                onRemove={onRemove}
                onAdd={onAdd}
              >
                {children}
              </NotificationItem>);
          this.store.notifications.set(value.uid, tNote);
        }
      },
    );
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
    const { position } = this.props;
    // TODO: Figure out why this code is here.
    // if ([
    //   Constants.positions.bl,
    //   Constants.positions.br,
    //   Constants.positions.bc,
    // ].indexOf(position) > -1) {
    //   this.store.notifications.values().reverse();
    // }
    const notifications = [];
    if (this.store.notifications.size > 0) {
      this.store.notifications.forEach(
        (data) => {
          if (data.position === position) {
            notifications.push(this.store.notifications.get(data.uid).component);
          }
        },
      );
    }
    return (
      <div
        className={`notifications notifications-${position}`}
        style={this.style}
      >
        { notifications }
      </div>
    );
  }
}

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
