import { useMemo } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { IBoard, ISpace } from '../boards';
import { selectCurrentBoard, selectSelectedSpaceIndices, SpaceIndexMap } from './boardState';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useCurrentBoard(): IBoard {
  return useAppSelector(selectCurrentBoard);
}

export function useSelectedSpaceIndicesMap(): SpaceIndexMap {
  return useAppSelector(selectSelectedSpaceIndices);
}

export function useSelectedSpaceIndices(): number[] {
  const selectedSpaceMap = useSelectedSpaceIndicesMap();
  return useMemo(() => {
    const indices = [];
    for (let index in selectedSpaceMap) {
      indices.push(parseInt(index, 10));
    }
    return indices;
  }, [selectedSpaceMap]);
}

export function useSelectedSpaces(): ISpace[] {
  const board = useCurrentBoard();
  const selectedSpaceMap = useSelectedSpaceIndicesMap();
  return useMemo(() => {
    const selectedSpaces = [];
    for (let index in selectedSpaceMap) {
      const space = board.spaces[index];
      if (space) {
        selectedSpaces.push(space);
      }
    }
    return selectedSpaces;
  }, [board, selectedSpaceMap]);
}