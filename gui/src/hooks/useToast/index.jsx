import { useContext } from "react";
import { UIUtilsDispatchContext } from "../../context/UIFeedback";

const useToast = () => {
    const dispatch = useContext(UIUtilsDispatchContext);
  
    return (message, severity = 'info', duration = 2000, onClose = () => {}) => {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message,
          severity,
          onClose
        },
      });
  
      setTimeout(() => {
        onClose();
        dispatch({
          type: 'HIDE_TOAST',
        });
      }, duration);
    };
};

export default useToast;