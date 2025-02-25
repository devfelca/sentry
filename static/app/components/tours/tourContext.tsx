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
import type {UseHoverOverlayProps} from 'sentry/utils/useHoverOverlay';

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
   * The current active tour step. If this is null, the tour is not active.
   */
  currentStep: TourStep<T> | null;
  /**
   * Whether the tour is available to the user. Should be set by flags or other conditions.
   */
  isAvailable: boolean;
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
    ...initialState,
  };
  const {registry, setRegistry} = useTourRegistry<T>({stepsIds: orderedStepIds});
  const isCompletelyRegistered = Object.values(registry).every(Boolean);
  const reducer: Reducer<TourState<T>, TourAction<T>> = useCallback(
    (state, action) => {
      const completeTourState = {
        ...state,
        isActive: false,
        currentStep: null,
      };
      switch (action.type) {
        case 'REGISTER_STEP': {
          setRegistry(prev => ({...prev, [action.step.id]: action.step}));
          return state;
        }
        case 'START_TOUR': {
          // If the tour is not available, or not all steps are registered, do nothing
          if (!state.isAvailable || !isCompletelyRegistered) {
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
            };
          }
          // If no stepId is provided, set the current step to the first step
          if (orderedStepIds[0]) {
            return {
              ...state,
              currentStep: registry[orderedStepIds[0]] ?? null,
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
            };
          }
          // If there is no previous step, do nothing
          return state;
        }
        case 'END_TOUR':
          return completeTourState;
        case 'SET_CURRENT_STEP': {
          const setStepIndex = orderedStepIds.indexOf(action.step.id);
          if (setStepIndex === -1) {
            return state;
          }
          return {...state, currentStep: action.step};
        }
        default:
          return state;
      }
    },
    [registry, setRegistry, orderedStepIds, isCompletelyRegistered]
  );

  const [tour, dispatch] = useReducer(reducer, initState);

  return {tour, registry, dispatch};
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

export interface UseRegisterTourStepProps<T extends TourEnumType> {
  focusedElement: React.ReactNode;
  step: TourStep<T>;
  tourContext: TourContextType<T>;
  position?: UseHoverOverlayProps['position'];
}

export function useRegisterTourStep<T extends TourEnumType>({
  focusedElement,
  step: rawStep,
  tourContext,
  position,
}: UseRegisterTourStepProps<T>): {
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

  const isActiveStep = tour?.currentStep?.id === step.id;

  // Return a callback that renders the element wrapped if the tour is active, registered and matches the step
  const element = isActiveStep ? (
    <TourElement step={step} tourContext={tourContext} position={position}>
      {focusedElement}
    </TourElement>
  ) : (
    focusedElement
  );
  return {element};
}
