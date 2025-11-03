import { useContext } from "react";
import { UIUtilsDispatchContext } from "../../context/UIFeedback";

const useConfirm = () => {
    const dispatch = useContext(UIUtilsDispatchContext);
  
    return (
        title, 
        message, 
        onConfirm, 
        onCancel, 
        okLabel, 
        cancelLabel) => {
        dispatch({
            type: 'SHOW_CONFIRM',
            payload: {            
                title,
                message,
                onConfirm: () => {
                    if(typeof onConfirm === "function")
                        onConfirm();
                    dispatch({
                        type: 'HIDE_CONFIRM'
                    });
                },
                onCancel,
                okLabel,
                cancelLabel
            }
        });
    };
};

export default useConfirm;