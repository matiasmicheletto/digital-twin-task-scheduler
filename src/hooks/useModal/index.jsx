import { useContext } from "react";
import { UIUtilsDispatchContext } from "../../context/UIFeedback";

const useModal = () => {
    const dispatch = useContext(UIUtilsDispatchContext);
    return (title, message, onCancel) => {
        
        dispatch({
            type: 'SHOW_MODAL',
            payload: {
                title,
                message,
                onCancel: () => {
                    if(onCancel) 
                        onCancel();
                    dispatch({
                        type: 'HIDE_MODAL'
                    });
                }
            }
        });
    };
};

export default useModal;