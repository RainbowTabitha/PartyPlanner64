import { romhandler } from "../../packages/lib/romhandler";
import { Action, View } from "../../packages/lib/types";
import { IEvent } from "../../packages/lib/events/events";
import { Notification } from "./components/notifications";
import { IDecisionTreeNode } from "../../packages/lib/ai/aitrees";
import { store } from "./store";
import {
  blockUIAction,
  confirmFromUserAction,
  promptUserAction,
  showMessageAction,
  showMessageHTMLAction,
} from "./blocker";
import {
  addNotificationAction,
  changeCurrentActionAction,
  changeViewAction,
  removeNotificationAction,
  setOverrideBgAction,
  setRomLoadedAction,
} from "./appState";
import {
  setTemporaryUIConnections,
  changeCurrentEventAction,
  clearSelectedSpacesAction,
  EventType,
  selectCurrentBoard,
  selectCurrentEvent,
  setHighlightedSpacesAction,
  setHoveredBoardEventIndexAction,
  setSelectedSpacesAction,
  SpaceIndexMap,
  selectCurrentEventType,
  selectSelectedSpaceIndices,
} from "./boardState";
import { ActionCreators as ReduxUndoActionCreators } from "redux-undo";

export function getAppInstance(): import("./app").PP64App {
  return (window as any)._PP64instance;
}

export function changeView(view: View): void {
  store.dispatch(changeViewAction(view));
  clearUndoHistory();
}

export function currentBoardChanged() {
  changeCurrentAction(Action.MOVE);
  setOverrideBg(null);
  getAppInstance().setState({
    aiTree: null,
  });
  clearUndoHistory();
}

export function boardsChanged() {
  getAppInstance().setState({ aiTree: null });
}

export function romLoadedChanged() {
  store.dispatch(setRomLoadedAction(romhandler.romIsLoaded()));
  clearUndoHistory();
}

export function changeCurrentAction(action: Action) {
  store.dispatch(changeCurrentActionAction(action));
}

export function getCurrentAction() {
  return store.getState().app.currentAction;
}

export function clearSelectedSpaces() {
  store.dispatch(clearSelectedSpacesAction());
}

export function changeSelectedSpaces(selectedSpaceIndices: number[]) {
  store.dispatch(setSelectedSpacesAction(selectedSpaceIndices));
}

export function getSelectedSpaceIndices(): SpaceIndexMap {
  return selectSelectedSpaceIndices(store.getState());
}

export function getValidSelectedSpaceIndices(): number[] {
  const state = store.getState();
  const curBoard = selectCurrentBoard(state);
  const selectedSpaceIndices = getSelectedSpaceIndices();
  const selectedIndices = [];
  for (const index in selectedSpaceIndices) {
    const space = curBoard.spaces[index];

    // TODO: There can be bad indices in the set when switching between boards.
    if (space) {
      selectedIndices.push(parseInt(index, 10));
    }
  }
  return selectedIndices;
}

export function getSelectedSpaces() {
  const state = store.getState();
  const curBoard = selectCurrentBoard(state);
  const selectedSpaceIndices = getValidSelectedSpaceIndices();
  const selectedSpaces = [];
  for (const index of selectedSpaceIndices) {
    const space = curBoard.spaces[index];
    selectedSpaces.push(space);
  }
  return selectedSpaces;
}

export function highlightSpaces(spaceIndices: number[]): void {
  store.dispatch(setHighlightedSpacesAction({ spaceIndices }));
}

export function drawConnection(x1: number, y1: number, x2: number, y2: number) {
  store.dispatch(
    setTemporaryUIConnections({ connections: [[x1, y1, x2, y2]] }),
  );
}

export function changeCurrentEvent(eventId: string | null, isBoard?: boolean) {
  let eventType = EventType.None;
  if (eventId) {
    eventType = isBoard ? EventType.Board : EventType.Library;
  }
  store.dispatch(
    changeCurrentEventAction({
      id: eventId,
      type: eventType,
    }),
  );
}

export function getCurrentEvent(): IEvent | null {
  return selectCurrentEvent(store.getState());
}

export function getCurrentEventIsBoardEvent(): boolean {
  return selectCurrentEventType(store.getState()) === EventType.Board;
}

export function setHoveredBoardEvent(hoveredBoardEventIndex: number) {
  store.dispatch(
    setHoveredBoardEventIndexAction({ eventIndex: hoveredBoardEventIndex }),
  );
}

export function setOverrideBg(overrideBg: string | null) {
  store.dispatch(setOverrideBgAction(overrideBg));
}

export function blockUI(blocked: boolean): void {
  store.dispatch(blockUIAction(blocked));
}

export function showMessage(message?: string) {
  store.dispatch(showMessageAction(message));
}

export function showMessageHTML(html: string) {
  store.dispatch(showMessageHTMLAction(html));
}

export function confirmFromUser(message: string): Promise<boolean> {
  let resolveFunction: (value: boolean) => void;
  const promise = new Promise<boolean>((resolve) => {
    resolveFunction = resolve;
  });
  store.dispatch(
    confirmFromUserAction({
      message,
      onConfirmed: (value?: string) => {
        resolveFunction(value !== undefined);
      },
    }),
  );
  return promise;
}

/**
 * Displays a "modal" prompt to collect a value from the user.
 * Promise resolves to undefined if the user cancels.
 */
export function promptUser(message: string): Promise<string | undefined> {
  let resolveFunction: (value?: string) => void;
  const promise = new Promise<string | undefined>((resolve) => {
    resolveFunction = resolve;
  });
  store.dispatch(promptUserAction({ message, onSubmit: resolveFunction! }));
  return promise;
}

export function refresh() {
  getAppInstance().forceUpdate();
}

export function addNotification(
  notification: React.ReactElement<Notification>,
) {
  store.dispatch(addNotificationAction({ notification: notification as any }));
}

export function removeNotification(notificationKey: string) {
  store.dispatch(removeNotificationAction({ notificationKey }));
}

export function changeDecisionTree(tree: IDecisionTreeNode[] | null): void {
  getAppInstance().setState({ aiTree: tree });
}

export function undo(): void {
  store.dispatch(ReduxUndoActionCreators.undo());
}

export function redo(): void {
  store.dispatch(ReduxUndoActionCreators.redo());
}

export function clearUndoHistory(): void {
  store.dispatch(ReduxUndoActionCreators.clearHistory());
}
