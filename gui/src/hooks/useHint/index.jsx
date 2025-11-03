import { useContext } from "react";
import { UIUtilsDispatchContext } from "../../context/UIFeedback";

const useHint = () => {
    const dispatch = useContext(UIUtilsDispatchContext);
    return opts => {
        const {
            title, 
            message,
            onConfirm
        } = opts;

        dispatch({
            type: 'SHOW_HINT',
            payload: {
                title,
                message,
                onConfirm: () => {
                    dispatch({
                        type: 'HIDE_HINT'
                    });
                }
            }
        });
    };
};

export default useHint;