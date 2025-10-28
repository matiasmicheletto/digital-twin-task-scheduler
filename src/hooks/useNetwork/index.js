import { useRef, useReducer, useCallback } from "react";
import Network from "../../model";

const network = new Network();

const useNetwork = () => {
    const networkRef = useRef(network);
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    return {
        network: networkRef.current,
    };
};

export default useNetwork;
