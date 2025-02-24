import {type Dispatch, type Reducer, useCallback, useState} from 'react';
import {useReducer} from 'react';

import {TourElement} from 'sentry/components/tours/styles';

export type TourEnumType = string | number;

export interface TourStep<T extends TourEnumType> {
  /**
   * Description of the tour step.
   */
  description: string;
  /**
   * Unique ID for the tour step.
   */
  id: T;
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
type TourRegisterStepAction<T extends TourEnumType> = {
  stepId: T;
  type: 'REGISTER_STEP';
};

export type TourAction<T extends TourEnumType> =
  | TourStartAction<T>
  | TourNextStepAction
  | TourPreviousStepAction
  | TourEndAction
  | TourSetCurrentStepAction<T>
  | TourRegisterStepAction<T>;

export interface TourState<T extends TourEnumType> {
  /**
   * The current active tour step.
   */
  currentStep: TourStep<T> | null;
  /**
   * The current step index.
   */
  currentStepIndex: number;
  /**
   * Whether the tour is available to the user.
   */
  isAvailable: boolean;
  /**
   * Whether the tour has already been completed by the user.
   */
  isComplete: boolean;
  /**
   * Whether the tour has been completely registered in the DOM.
   */
  isRegistered: boolean;
  /**
   * The total number of steps in the tour.
   */
  totalSteps: number;
}

export function useTourReducer<T extends TourEnumType>({
  initialState,
  allStepIds,
}: {
  allStepIds: T[];
  initialState: TourState<T>;
}): TourContextType<T> {
  const {registry, setRegistry} = useTourRegistry<T>({allStepIds});
  const reducer: Reducer<TourState<T>, TourAction<T>> = useCallback(
    (state, action) => {
      switch (action.type) {
        case 'REGISTER_STEP':
          // Register the single step
          setRegistry(prev => ({...prev, [action.stepId]: true}));
          // If all steps are registered, set the tour as registered
          if (Object.values(registry).every(Boolean)) {
            return {...state, isRegistered: true};
          }
          // If the step is not registered, do nothing
          return state;
        case 'START_TOUR':
          // If the tour is not available, do nothing
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
    },
    [registry, setRegistry]
  );

  const [tour, dispatch] = useReducer(reducer, initialState);

  return {
    tour,
    registry,
    dispatch,
  };
}

export interface TourContextType<T extends TourEnumType> {
  dispatch: Dispatch<TourAction<T>>;
  registry: TourRegistry<T>;
  tour: TourState<T>;
}

type TourRegistry<T extends TourEnumType> = {
  [key in T]: boolean;
};

export function useTourRegistry<T extends TourEnumType>({allStepIds}: {allStepIds: T[]}) {
  const [registry, setRegistry] = useState<TourRegistry<T>>(
    allStepIds.reduce((acc, id) => {
      acc[id] = false;
      return acc;
    }, {} as TourRegistry<T>)
  );
  return {registry, setRegistry};
}

export function useTourStep<T extends TourEnumType>({
  focusedElement,
  step,
  state,
  dispatch,
}: {
  dispatch: Dispatch<TourAction<T>>;
  focusedElement: React.ReactNode;
  state: TourState<T>;
  step: TourStep<T>;
}) {
  const renderElement = useCallback(() => {
    return state?.currentStep?.id === step.id ? (
      <TourElement step={step} dispatch={dispatch} state={state}>
        {focusedElement}
      </TourElement>
    ) : (
      focusedElement
    );
  }, [focusedElement, step, dispatch, state]);
  return {renderElement};
}
