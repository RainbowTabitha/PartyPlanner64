import { romhandler } from "./romhandler";
import { IBoard, ISpace } from "./boards";
import { View, Action } from "./types";
import { IEvent } from "./events/events";
import { Notification } from "./components/notifications";

export function getAppInstance(): import("./app").PP64App {
  return (window as any)._PP64instance;
}

export function changeView(view: View) {
  getAppInstance().setState({ currentView: view });
}

export function currentBoardChanged(currentBoard: IBoard) {
  getAppInstance().setState({
    currentBoard: currentBoard, // getCurrentBoard(),
    selectedSpaces: null,
    currentAction: Action.MOVE
  });
}

export function boardsChanged(boards: IBoard[]) {
  getAppInstance().setState({ boards }); // : getBoards()
}

export function romLoadedChanged() {
  getAppInstance().setState({ romLoaded: romhandler.romIsLoaded() });
}

export function changeCurrentAction(action: Action) {
  getAppInstance().setState({ currentAction: action });
}

export function getCurrentAction() {
  return getAppInstance().state.currentAction;
}

export function changeSelectedSpaces(selectedSpaces: ISpace[]) {
  getAppInstance().setState({ selectedSpaces });
}

export function getSelectedSpaces() {
  return getAppInstance().state.selectedSpaces;
}

export function changeCurrentEvent(event: IEvent | null) {
  getAppInstance().setState({ currentEvent: event });
}

export function getCurrentEvent() {
  return getAppInstance().state.currentEvent;
}

export function blockUI(blocked: boolean) {
  getAppInstance().setState({ blocked: !!blocked });
}

export function showMessage(message?: string) {
  getAppInstance().setState({ blocked: !!message, message: message || "", messageHTML: "" });
}

export function showMessageHTML(html: string) {
  getAppInstance().setState({ blocked: !!html, message: "", messageHTML: html || "" });
}

export function refresh() {
  getAppInstance().forceUpdate();
}

export function addNotification(notification: React.ReactElement<Notification>) {
  const notifications = getAppInstance().state.notifications.slice();
  notifications.push(notification);
  getAppInstance().setState({ notifications });
}

export function removeNotification(notification: React.ReactElement<Notification>) {
  const notifications = getAppInstance().state.notifications.slice();
  const index = notifications.indexOf(notification);
  notifications.splice(index, 1);
  getAppInstance().setState({ notifications });
}
