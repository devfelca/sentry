import {
  type Dispatch,
  type Reducer,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
   * Title of the tour step.
   */
  title: string;
}

type TourStartAction<T extends TourEnumType> = {
  type: 'START_TOUR';
  stepId?: T;
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
  step: TourStep<T>;
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
   * Whether the tour is currently active.
   */
  isActive: boolean;
  /**
   * Whether the tour is available to the user. Should be set by flags or other conditions.
   */
  isAvailable: boolean;
  /**
   * Whether each step in the tour has been completely registered in the DOM.
   */
  isRegistered: boolean;
  /**
   * The ordered step IDs. Declared once when the provider is initialized.
   */
  orderedStepIds: readonly T[];
}

export function useTourReducer<T extends TourEnumType>({
  initialState,
  orderedStepIds,
}: {
  initialState: Partial<TourState<T>>;
  orderedStepIds: T[];
}): TourContextType<T> {
  const initState = {
    orderedStepIds,
    currentStep: null,
    isAvailable: false,
    isActive: false,
    isRegistered: false,
    ...initialState,
  };
  const {registry, setRegistry} = useTourRegistry<T>({stepsIds: orderedStepIds});
  const reducer: Reducer<TourState<T>, TourAction<T>> = useCallback(
    (state, action) => {
      const completeTourState = {
        ...state,
        isActive: false,
        currentStep: null,
        currentStepIndex: -1,
      };
      switch (action.type) {
        case 'REGISTER_STEP':
          // Register the single step
          setRegistry(prev => ({...prev, [action.step.id]: action.step}));
          // If all steps are registered, set the tour as registered
          if (Object.values(registry).every(Boolean)) {
            return {...state, isRegistered: true};
          }
          // If the step is not registered, do nothing
          return state;
        case 'START_TOUR': {
          // If the tour is not available, or all steps are not registered, do nothing
          if (!state.isAvailable || !state.isRegistered) {
            return state;
          }
          // If the stepId is provided, set the current step to the stepId
          const startStepIndex = action.stepId
            ? orderedStepIds.indexOf(action.stepId)
            : -1;
          if (action.stepId && startStepIndex !== -1) {
            return {
              ...state,
              currentStep: registry[action.stepId] ?? null,
              currentStepIndex: startStepIndex,
            };
          }
          // If no stepId is provided, set the current step to the first step
          if (orderedStepIds[0]) {
            return {
              ...state,
              currentStep: registry[orderedStepIds[0]] ?? null,
              currentStepIndex: 0,
            };
          }
          return state;
        }
        case 'NEXT_STEP': {
          if (!state.currentStep) {
            return state;
          }
          const nextStepIndex = orderedStepIds.indexOf(state.currentStep.id) + 1;
          const nextStepId = orderedStepIds[nextStepIndex];
          if (nextStepId) {
            return {
              ...state,
              currentStep: registry[nextStepId] ?? null,
              currentStepIndex: nextStepIndex,
            };
          }
          // If there is no next step, complete the tour
          return completeTourState;
        }
        case 'PREVIOUS_STEP': {
          if (!state.currentStep) {
            return state;
          }
          const prevStepIndex = orderedStepIds.indexOf(state.currentStep.id) - 1;
          const prevStepId = orderedStepIds[prevStepIndex];
          if (prevStepId) {
            return {
              ...state,
              currentStep: registry[prevStepId] ?? null,
              currentStepIndex: prevStepIndex,
            };
          }
          // If there is no previous step, do nothingz
          return state;
        }
        case 'END_TOUR':
          return completeTourState;
        case 'SET_CURRENT_STEP': {
          const setStepIndex = orderedStepIds.indexOf(action.step.id);
          if (setStepIndex === -1) {
            return state;
          }
          return {...state, currentStep: action.step, currentStepIndex: setStepIndex};
        }
        default:
          return state;
      }
    },
    [registry, setRegistry, orderedStepIds]
  );

  const [tour, dispatch] = useReducer(reducer, initState);

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
  [key in T]: TourStep<T> | null;
};

export function useTourRegistry<T extends TourEnumType>({stepsIds}: {stepsIds: T[]}) {
  const [registry, setRegistry] = useState<TourRegistry<T>>(
    stepsIds.reduce((reg, stepId) => {
      reg[stepId] = null;
      return reg;
    }, {} as TourRegistry<T>)
  );
  return {registry, setRegistry};
}

export function useRegisterTourStep<T extends TourEnumType>({
  focusedElement,
  step: rawStep,
  tourContext,
}: {
  focusedElement: React.ReactNode;
  step: TourStep<T>;
  tourContext: TourContextType<T>;
}): {
  element: React.ReactNode;
} {
  // Memoize the step object to prevent it from changing on every render
  const step: TourStep<T> = useMemo(
    () => ({id: rawStep.id, title: rawStep.title, description: rawStep.description}),
    [rawStep.id, rawStep.title, rawStep.description]
  );

  // Use the dispatch and tour state from the props context
  const {tour, dispatch} = tourContext;

  // Register the step in the registry
  useEffect(() => {
    dispatch({type: 'REGISTER_STEP', step});
  }, [step, dispatch]);

  const isActiveStep =
    tour.isAvailable && tour.isRegistered && tour?.currentStep?.id === step.id;

  // Return a callback that renders the element wrapped if the tour is active, registered and matches the step
  const element = isActiveStep ? (
    <TourElement step={step} tourContext={tourContext}>
      {focusedElement}
    </TourElement>
  ) : (
    focusedElement
  );
  return {element};
}
