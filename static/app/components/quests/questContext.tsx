import {type Dispatch, type Reducer, useCallback} from 'react';
import {useReducer} from 'react';

type QuestEnumType = string | number;

export interface QuestStep<T extends QuestEnumType> {
  /**
   * Description of the quest step.
   */
  description: string;
  /**
   * Element to focus on when the quest step is active.
   */
  focusedElement: () => React.ReactNode;
  /**
   * Unique key for the quest step.
   */
  key: T;
  /**
   * Next quest step. If null, this will be the final step.
   */
  nextStep: QuestStep<T> | null;
  /**
   * Previous quest step. If null, this is the first step.
   */
  previousStep: QuestStep<T> | null;
  /**
   * Title of the quest step.
   */
  title: string;
}

type QuestStartQuestAction<T extends QuestEnumType> = {
  step: QuestStep<T>;
  type: 'START_QUEST';
};
type QuestNextStepAction = {
  type: 'NEXT_STEP';
};
type QuestPreviousStepAction = {
  type: 'PREVIOUS_STEP';
};
type QuestCompleteQuestAction = {
  type: 'COMPLETE_QUEST';
};

type QuestSetCurrentStepAction<T extends QuestEnumType> = {
  step: QuestStep<T>;
  type: 'SET_CURRENT_STEP';
};

export type QuestAction<T extends QuestEnumType> =
  | QuestStartQuestAction<T>
  | QuestNextStepAction
  | QuestPreviousStepAction
  | QuestCompleteQuestAction
  | QuestSetCurrentStepAction<T>;

export interface QuestState<T extends QuestEnumType> {
  /**
   * The current active quest step.
   */
  currentStep: QuestStep<T> | null;
  /**
   * Whether the quest is available to the user.
   */
  isAvailable: boolean;
  /**
   * Whether the quest has already been complete.
   */
  isComplete: boolean;
}

export function useQuestReducer<T extends QuestEnumType>(): QuestContextType<T> {
  const initialState: QuestState<T> = {
    currentStep: null,
    isAvailable: false,
    isComplete: false,
  };

  const reducer: Reducer<QuestState<T>, QuestAction<T>> = useCallback((state, action) => {
    switch (action.type) {
      case 'START_QUEST':
        return state.isAvailable ? {...state, currentStep: action.step} : state;
      case 'NEXT_STEP':
        return {...state, currentStep: state.currentStep?.nextStep ?? null};
      case 'PREVIOUS_STEP':
        return {...state, currentStep: state.currentStep?.previousStep ?? null};
      case 'COMPLETE_QUEST':
        return {...state, currentStep: null, isComplete: true};
      case 'SET_CURRENT_STEP':
        return {...state, currentStep: action.step};
      default:
        return state;
    }
  }, []);

  const [questState, dispatch] = useReducer(reducer, initialState);

  return {
    ...questState,
    dispatch,
  };
}

export interface QuestContextType<T extends QuestEnumType> extends QuestState<T> {
  dispatch: Dispatch<QuestAction<T>>;
}
