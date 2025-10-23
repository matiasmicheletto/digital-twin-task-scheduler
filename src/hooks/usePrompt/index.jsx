import { useContext } from "react";
import { UIUtilsDispatchContext } from "../../context/UIFeedback";

const usePrompt = () => {
    const dispatch = useContext(UIUtilsDispatchContext);
    return opts => {
        const {
            title, 
            message, 
            inputType,
            inputProps,
            defaultValue,
            onConfirm, 
            showCancelButton,
            onCancel
        } = opts;

        dispatch({
            type: 'SHOW_PROMPT',
            payload: {
                title,
                message,
                inputType,
                inputProps,
                defaultValue,
                onConfirm: val => {
                    if(onConfirm)
                        onConfirm(val);
                    dispatch({
                        type: 'HIDE_PROMPT'
                    });
                },
                showCancelButton,
                onCancel: () => {
                    if(onCancel) 
                        onCancel();
                    dispatch({
                        type: 'HIDE_PROMPT'
                    });
                }
            }
        });
    };
};

export default usePrompt;