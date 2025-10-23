import { useState } from "react";
import useToast from "../useToast";
import usePreloader from "../usePreloader";

const useModel = () => {
    const preloader = usePreloader();
    const toast = useToast();

    const [model, setModel] = useState({});

    return { model, setModel };
}

export default useModel;