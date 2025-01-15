import { Loader2 } from 'lucide-react'
import React from 'react'

const Loading = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
    )
}

export default Loading