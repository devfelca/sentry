import {type Dispatch, type Reducer, useCallback} from 'react';
import {useReducer} from 'react';

type TourEnumType = string | number;

export interface TourStep<T extends TourEnumType> {
  /**
   * Description of the tour step.
   */
  description: string;
  /**
   * Element to focus on when the tour step is active.
   */
  focusedElement: () => React.ReactNode;
  /**
   * Unique key for the tour step.
   */
  key: T;
  /**
   * Next tour step. If null, this will be the final step.
   */
  nextStep: TourStep<T> | null;
  /**
   * Previous tour step. If null, this is the first step.
   */
  previousStep: TourStep<T> | null;
  /**
   * Title of the tour step.
   */
  title: string;
}

type TourStartAction<T extends TourEnumType> = {
  step: TourStep<T>;
  type: 'START_TOUR';
};
type TourNextStepAction = {
  type: 'NEXT_STEP';
};
type TourPreviousStepAction = {
  type: 'PREVIOUS_STEP';
};
type TourEndAction = {
  type: 'END_TOUR';
};

type TourSetCurrentStepAction<T extends TourEnumType> = {
  step: TourStep<T>;
  type: 'SET_CURRENT_STEP';
};

export type TourAction<T extends TourEnumType> =
  | TourStartAction<T>
  | TourNextStepAction
  | TourPreviousStepAction
  | TourEndAction
  | TourSetCurrentStepAction<T>;

export interface TourState<T extends TourEnumType> {
  /**
   * The current active tour step.
   */
  currentStep: TourStep<T> | null;
  /**
   * Whether the tour is available to the user.
   */
  isAvailable: boolean;
  /**
   * Whether the tour has already been complete.
   */
  isComplete: boolean;
}

export function useTourReducer<T extends TourEnumType>({
  initialState,
}: {
  initialState: TourState<T>;
}): TourContextType<T> {
  const reducer: Reducer<TourState<T>, TourAction<T>> = useCallback((state, action) => {
    switch (action.type) {
      case 'START_TOUR':
        return state.isAvailable ? {...state, currentStep: action.step} : state;
      case 'NEXT_STEP':
        return {...state, currentStep: state.currentStep?.nextStep ?? null};
      case 'PREVIOUS_STEP':
        return {...state, currentStep: state.currentStep?.previousStep ?? null};
      case 'END_TOUR':
        return {...state, currentStep: null, isComplete: true};
      case 'SET_CURRENT_STEP':
        return {...state, currentStep: action.step};
      default:
        return state;
    }
  }, []);

  const [tour, dispatch] = useReducer(reducer, initialState);

  return {
    tour,
    dispatch,
  };
}

export interface TourContextType<T extends TourEnumType> {
  dispatch: Dispatch<TourAction<T>>;
  tour: TourState<T>;
}
