import { useContext } from "react";
import { UIUtilsDispatchContext } from "../../context/UIFeedback";

const usePreloader = () => {
    const dispatch = useContext(UIUtilsDispatchContext);
  
    return (loading) => {
        dispatch({
            type: 'TOGGLE_PRELOADER',
            payload: loading
        });
    };
};

export default usePreloader;