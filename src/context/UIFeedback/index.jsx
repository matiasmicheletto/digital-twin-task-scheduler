import React, { useReducer, createContext } from 'react';
import Preloader from '../../components/Preloader';
import Toast from '../../components/Toast';
import Confirm from '../../components/Confirm';
import Prompt from '../../components/Prompt';
import Hint from '../../components/Hint';
import Modal from '../../components/Modal';
import { reducer, initialState } from './reducer';

export const UIUtilsStateContext = createContext();
export const UIUtilsDispatchContext = createContext();

const UIUtilsProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const {loading, toast, confirm, prompt, hint, modal} = state;

    return (
        <UIUtilsStateContext.Provider value={state}>
            <UIUtilsDispatchContext.Provider value={dispatch}>
                {loading && <Preloader />}
                {toast && <Toast {...toast} />}
                {confirm && <Confirm {...confirm} />}
                {prompt && <Prompt {...prompt} />}
                {hint && <Hint {...hint} />}
                {modal && <Modal {...modal} />}
                {children}
            </UIUtilsDispatchContext.Provider>
        </UIUtilsStateContext.Provider>
    );
};

export default UIUtilsProvider;