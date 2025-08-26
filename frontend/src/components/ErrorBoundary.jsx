
"use client"

import React from "react"
import { FaExclamationTriangle } from "react-icons/fa"

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg mt-8 max-w-md mx-auto">
                    <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">문제가 발생했습니다</h3>
                    <p className="text-gray-600">잠시 후 다시 시도해주세요.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        새로고침
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
