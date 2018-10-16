namespace PP64.components {
  /** Background colors available for notifications. */
  export enum NotificationColor {
    Red,
    Green,
    Blue,
  }

  interface INotificationProps {
    color: NotificationColor;
    onClose?(): any;
  }

  /** Popup notification bar entry. */
  export class Notification extends React.Component<INotificationProps> {
    render() {
      const className = "notification " + this.getColorClass(this.props.color);
      return (
        <div className={className}>
          <div className="notificationContent">
            {this.props.children}
          </div>
          <div className="notificationClose" role="button" tabIndex={0}
            onClick={this.onCloseClick} />
        </div>
      );
    }

    onCloseClick = () => {
      if (this.props.onClose)
        this.props.onClose();
    }

    getColorClass(color: NotificationColor): string {
      switch (color) {
        case NotificationColor.Red:
          return "notificationRed";
        case NotificationColor.Green:
          return "notificationGreen";
        case NotificationColor.Blue:
          return "notificationBlue";
      }
    }
  }

  interface INotificationBarProps {
  }

  /** Container for several notifications. */
  export class NotificationBar extends React.Component<INotificationBarProps> {
    render() {
      const style: any = {};
      if (!React.Children.count(this.props.children)) {
        style.display = "none";
      }
      return (
        <div className="notificationBar" style={style}>
          {this.props.children}
        </div>
      );
    }
  }

  interface INotificationButtonProps {
    onClick?(): any;
  }

  /** Button formatted well to fit inside a Notification beside text. */
  export class NotificationButton extends React.Component<INotificationButtonProps> {
    render() {
      return (
        <button className="notificationButton" onClick={this.props.onClick}>
          {this.props.children}
        </button>
      );
    }
  }
}
