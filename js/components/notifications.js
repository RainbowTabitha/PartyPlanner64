"use strict";
var PP64;
(function (PP64) {
    var components;
    (function (components) {
        /** Background colors available for notifications. */
        let NotificationColor;
        (function (NotificationColor) {
            NotificationColor[NotificationColor["Red"] = 0] = "Red";
            NotificationColor[NotificationColor["Green"] = 1] = "Green";
            NotificationColor[NotificationColor["Blue"] = 2] = "Blue";
        })(NotificationColor = components.NotificationColor || (components.NotificationColor = {}));
        /** Popup notification bar entry. */
        class Notification extends React.Component {
            constructor() {
                super(...arguments);
                this.onCloseClick = () => {
                    if (this.props.onClose)
                        this.props.onClose();
                };
            }
            render() {
                const className = "notification " + this.getColorClass(this.props.color);
                return (React.createElement("div", { className: className },
                    React.createElement("div", { className: "notificationContent" }, this.props.children),
                    React.createElement("div", { className: "notificationClose", role: "button", tabIndex: 0, onClick: this.onCloseClick })));
            }
            getColorClass(color) {
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
        components.Notification = Notification;
        /** Container for several notifications. */
        class NotificationBar extends React.Component {
            render() {
                const style = {};
                if (!React.Children.count(this.props.children)) {
                    style.display = "none";
                }
                return (React.createElement("div", { className: "notificationBar", style: style }, this.props.children));
            }
        }
        components.NotificationBar = NotificationBar;
        /** Button formatted well to fit inside a Notification beside text. */
        class NotificationButton extends React.Component {
            render() {
                return (React.createElement("button", { className: "notificationButton", onClick: this.props.onClick }, this.props.children));
            }
        }
        components.NotificationButton = NotificationButton;
    })(components = PP64.components || (PP64.components = {}));
})(PP64 || (PP64 = {}));
