import React from "react";
import { useNavigate } from "react-router-dom";
import Error from "../../views/Error";

const ErrorBoundaryWithNavigate = (props) => {
    const navigate = useNavigate();
    return <ErrorBoundary {...props} navigate={navigate}/>;
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorInfo: null, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        const errorLog = {
            error: error.toString(),
            info: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem("errorLog", JSON.stringify(errorLog));
        this.setState({ errorInfo, error });
    }

    resetErrorBoundary = () => {
        this.setState({ hasError: false, errorInfo: null, error: null });
    }

    handleReport = () => {
        console.log("error reported");
    }

    handleReset = () => {
        this.resetErrorBoundary();
        this.props.navigate("/");
    }

    render() {
        if (this.state.hasError) {
            return (
                <Error 
                    errorMessage={`Error: ${this.state.error}, info: ${this.state.errorInfo?.componentStack}`}
                    onReport={this.handleReport}
                    onReset={this.handleReset} />
            );
        }
        return this.props.children;
    }
};

export default ErrorBoundaryWithNavigate;